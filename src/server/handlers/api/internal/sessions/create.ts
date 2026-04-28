import { createHash } from "node:crypto"

import { verify } from "argon2"
import { Hono } from "hono"
import { describeRoute, resolver, validator } from "hono-openapi"
import * as v from "valibot"

import { db } from "../../../../db/index.ts"
import { accessTokensTable } from "../../../../db/schema.ts"

const router = new Hono()

router.post(
    "/",
    describeRoute({
        operationId: "create_session",
        responses: {
            200: {
                description: "ログイン成功",
                content: {
                    "application/json": {
                        schema: resolver(
                            v.object({
                                accessToken: v.string(),
                            })
                        ),
                    },
                },
            },
        },
    }),
    validator(
        "json",
        v.object({
            username: v.string(),
            password: v.pipe(v.string(), v.maxLength(128)),
        })
    ),
    async c => {
        const body = c.req.valid("json")

        const account = await db.query.accountsTable.findFirst({
            columns: {
                id: true,
                hashedPassword: true,
            },
            where: {
                name: body.username,
            },
        })

        if (account == null) {
            return c.text("Invalid username or password", 401)
        }

        const isPasswordValid = await verify(account.hashedPassword, body.password)

        if (!isPasswordValid) {
            return c.text("Invalid username or password", 401)
        }

        const tokenId = crypto.randomUUID()
        const randomBytes = crypto.getRandomValues(new Uint8Array(64))

        const accessToken = `${tokenId}.${randomBytes.toHex()}`
        const hashedToken = createHash("sha256").update(accessToken).digest()

        await db.insert(accessTokensTable).values({
            id: tokenId,
            accountId: account.id,
            description: c.req.header("User-Agent") ?? "Unknown",
            hashedToken,
            isSuperToken: true,
        })

        return c.json({
            accessToken,
        })
    }
)

export default router
