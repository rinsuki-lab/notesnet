import { sql } from "drizzle-orm"

import { db } from "../../../../../db/index.ts"
import { makeNotesWhereQueryObjectFromAuthorizedResult } from "../../../../../extractors/access_token.ts"
import { builder } from "../builder.ts"
import { Note } from "../types/note.ts"

builder.queryField("recentNotes", t =>
    t.drizzleField({
        type: [Note],
        args: {
            contentTypes: t.arg.stringList({ required: false }),
        },
        resolve(query, root, args, ctx) {
            return db.query.notesTable.findMany({
                ...query({
                    where: {
                        ...makeNotesWhereQueryObjectFromAuthorizedResult(ctx.authorized),
                        ...(args.contentTypes != null && {
                            latestRevision: {
                                contentType: { in: args.contentTypes },
                            },
                        }),
                    },
                    with: {
                        latestRevision: {
                            columns: {
                                writtenAt: true,
                                insertedAt: true,
                                id: true,
                            },
                        },
                    },
                }),
                // ULTRA HACK, remove after https://github.com/drizzle-team/drizzle-orm/issues/5047 implemented
                orderBy: t =>
                    sql`("latestRevision"."r"->>'writtenAt')::timestamptz DESC, ("latestRevision"."r"->>'insertedAt')::timestamptz DESC, ("latestRevision"."r"->>'id')::uuid DESC`,
            })
        },
        nullable: false,
    })
)
