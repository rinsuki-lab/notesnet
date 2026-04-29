import { db } from "../../../../../db/index.ts"
import { scopePermissionsObject } from "../../../../../db/schema.ts"
import { builder } from "../builder.ts"
import { ScopePermission } from "./scope_permission.ts"

export const Scope = builder.drizzleObject("scopesTable", {
    variant: "Scope",
    fields: t => ({
        id: t.exposeID("id", { nullable: false }),
        name: t.exposeString("name", { nullable: false }),
        permissions: t.field({
            type: ScopePermission,
            select: {
                columns: {
                    id: true,
                    ownerAccountId: true,
                },
            },
            async resolve(parent, args, ctx) {
                // オーナーアカウントのデフォルトペルソナは全権を持つ
                if (parent.ownerAccountId === ctx.authorized.accountId && ctx.authorized.isDefaultPersona) {
                    return scopePermissionsObject
                }
                return await db.query.scopePersonasTable.findFirst({
                    where: {
                        scopeId: parent.id,
                        personaId: ctx.authorized.personaId,
                    },
                    columns: scopePermissionsObject,
                })
            },
        }),
    }),
})
