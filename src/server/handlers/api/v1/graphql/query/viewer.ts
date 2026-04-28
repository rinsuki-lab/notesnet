import { db } from "../../../../../db/index.ts"
import { builder } from "../builder.ts"
import { Viewer } from "../types/viewer.ts"

builder.queryField("viewer", t =>
    t.drizzleField({
        type: Viewer,
        resolve(query, root, args, ctx) {
            return db.query.accountsTable
                .findFirst(
                    query({
                        where: {
                            id: ctx.authorized.accountId,
                        },
                    })
                )
                .then(r => r!) // さっき認証したばっかりなのでほぼ必ずあるはず
        },
        nullable: false,
    })
)
