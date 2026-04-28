import { sql } from "drizzle-orm"

import { db } from "../../../../../db/index.ts"
import { builder } from "../builder.ts"
import { Scope } from "./scope.ts"

export const Viewer = builder.drizzleObject("accountsTable", {
    variant: "Viewer",
    fields: t => ({
        id: t.exposeID("id", { nullable: false }),
        name: t.exposeString("name", { nullable: false }),
        scopes: t.drizzleField({
            type: [Scope],
            select: {
                columns: {
                    id: true,
                },
            },
            resolve(query, root, args, ctx) {
                return db.query.scopesTable.findMany({
                    ...query({
                        where: {
                            OR: [
                                ...(ctx.authorized.isDefaultPersona
                                    ? [
                                          {
                                              ownerAccountId: root.id,
                                          },
                                      ]
                                    : []),
                                {
                                    permissions: {
                                        personaId: ctx.authorized.personaId,
                                    },
                                },
                            ],
                        },
                    }),
                    orderBy: t => sql`${t.createdAt} ASC`,
                })
            },
            nullable: false,
        }),
    }),
})
