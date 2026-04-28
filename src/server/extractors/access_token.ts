import { createMiddleware } from "hono/factory";
import { db } from "../db/index.ts";
import { createHash } from "node:crypto";
import { eq, or, type TableFilter } from "drizzle-orm";
import { personasTable, scopePermissionsKeys, scopePermissionsObject, scopePersonasTable, scopesTable } from "../db/schema.ts";

export type AuthorizedResult = {
    accessTokenId: string,
    accountId: string,
    personaId: string,
    isDefaultPersona: boolean,
    anyPersonaAllowed: boolean,
    isSuperToken: boolean,
}

export function authorize<Required extends boolean>(required: Required) {
    return createMiddleware<{
        Variables: {
            authorized: AuthorizedResult | (Required extends true ? never : undefined),
        }
    }>(async (c, next) => {
        const authHeader = c.req.header("Authorization")
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            if (required) {
                return c.text("Unauthorized", 401)
            } else {
                return await next()
            }
        }
        const token = authHeader.slice("Bearer ".length)

        const tokenId = token.split(".").at(0)
        if (tokenId == null) {
            return c.text("Unauthorized", 401)
        }
        const tokenHash = createHash("sha256").update(token).digest()

        const accessToken = await db.query.accessTokensTable.findFirst({
            where: {
                id: { eq: tokenId },
                hashedToken: {
                    eq: tokenHash
                },
                revokedAt: { isNull: true },
            },
            columns: {
                id: true,
                accountId: true,
                personaId: true,
                isSuperToken: true,
            },
        })

        if (accessToken == null) {
            return c.text("Unauthorized", 401)
        }

        const specifiedPersonaId = c.req.header("X-NotesNet-Persona")

        const persona = await db.query.personasTable.findFirst({
            where: {
                AND: ([
                    { accountId: { eq: accessToken.accountId } },
                    (accessToken.personaId != null ? { id: accessToken.personaId } : null),
                    (specifiedPersonaId != null ? { id: specifiedPersonaId } : null),
                    (accessToken.personaId == null && specifiedPersonaId == null ? { name: { isNull: true } } : null),
                ] satisfies (null|TableFilter<typeof personasTable>)[]).filter(x => x != null),
            },
            columns: {
                id: true,
                name: true,
            },
        })
        if (persona == null) {
            return c.text("Unauthorized", 401)
        }

        const result: AuthorizedResult = {
            accessTokenId: accessToken.id,
            accountId: accessToken.accountId,
            personaId: persona.id,
            isDefaultPersona: persona.name == null,
            isSuperToken: accessToken.isSuperToken,
            anyPersonaAllowed: accessToken.personaId == null && specifiedPersonaId == null,
        }

        c.set("authorized", result)
        return await next()
    })
}

export function makeNotesWhereQueryObjectFromAuthorizedResult(auth: AuthorizedResult) {
    return {
        scope: {
            OR: [
                ...(auth.isDefaultPersona ? [{ ownerAccountId: auth.accountId }] : []),
                {
                    permissions: {
                        personaId: auth.personaId,
                    }
                }
            ]
        }
    }
}

export function makeNotesWhereQueryFromAuthorizedResult(auth: AuthorizedResult) {
    return or(
        ...(auth.isDefaultPersona ? [eq(scopesTable.ownerAccountId, auth.accountId)] : []),
        eq(scopePersonasTable.personaId, auth.personaId)
    )
}

export async function getPermission(scopeId: string, auth: AuthorizedResult, database: Parameters<Parameters<typeof db.transaction>[0]>[0]) {
    const scope = await database.query.scopesTable.findFirst({
        where: {
            id: scopeId,
        },
        with: {
            permissions: {
                columns: scopePermissionsObject,
                where: {
                    personaId: auth.personaId,
                },
                limit: 1,
            },
        }
    })

    if (scope == null) return null
    if (scope.ownerAccountId === auth.accountId && auth.isDefaultPersona) {
        return scopePermissionsObject
    }
    
    const perm = scope.permissions[0]
    if (perm == null) return null

    return perm
}