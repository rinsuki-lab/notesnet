import argon2 from "argon2"
import { Hono } from "hono"
import { describeRoute, validator } from "hono-openapi"
import * as v from "valibot"

import { db } from "../../../../db/index.ts"
import { accountsTable, personasTable, scopesTable } from "../../../../db/schema.ts"
import { isConstraintError } from "../../../../db/utils.ts"

const router = new Hono()

router.post(
    "/",
    describeRoute({
        operationId: "create_account",
        responses: {
            201: {
                description: "作成成功",
            },
        },
    }),
    validator(
        "json",
        v.object({
            username: v.pipe(v.string(), v.minLength(4), v.maxLength(20), v.regex(/^[a-z0-9]{4,20}$/)),
            password: v.pipe(v.string(), v.minLength(16), v.maxLength(128)),
        })
    ),
    async c => {
        const body = c.req.valid("json")
        const hashedPassword = await argon2.hash(body.password.toString(), {
            parallelism: 1,
            memoryCost: 19 * 1024,
            timeCost: 2,
        })

        try {
            await db.transaction(async tx => {
                const [account] = await tx
                    .insert(accountsTable)
                    .values({
                        id: crypto.randomUUID(),
                        name: body.username,
                        hashedPassword,
                    })
                    .returning({ id: accountsTable.id })
                if (account == null) {
                    throw new Error("Failed to create account")
                }
                await tx.insert(personasTable).values({
                    id: account.id,
                    accountId: account.id,
                    name: null,
                })
                await tx.insert(scopesTable).values({
                    id: account.id,
                    name: "Only for me",
                    ownerAccountId: account.id,
                })
            })
        } catch (e) {
            if (isConstraintError(e)) {
                if (e.cause.constraint === "accounts_name_key") {
                    return c.text("This username is already in use", 409)
                }
            }
            throw e
        }

        return c.text("", 201)
    }
)

export default router
