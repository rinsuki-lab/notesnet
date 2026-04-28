import { db } from "../../../../../db/index.ts"
import { makeNotesWhereQueryObjectFromAuthorizedResult } from "../../../../../extractors/access_token.ts"
import { builder } from "../builder.ts"
import { Note } from "../types/note.ts"

builder.queryField("note", t =>
    t.drizzleField({
        type: Note,
        args: {
            id: t.arg.id({ required: true }),
        },
        resolve(query, root, args, ctx) {
            return db.query.notesTable.findFirst(
                query({
                    where: {
                        AND: [{ id: args.id }, makeNotesWhereQueryObjectFromAuthorizedResult(ctx.authorized)],
                    },
                })
            )
        },
    })
)
