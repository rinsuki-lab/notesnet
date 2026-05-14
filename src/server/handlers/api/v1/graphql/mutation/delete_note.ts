import { eq } from "drizzle-orm"

import { db } from "../../../../../db/index.ts"
import { noteRelationshipsTable, notesTable } from "../../../../../db/schema.ts"
import { makeNotesWhereQueryObjectFromAuthorizedResult } from "../../../../../extractors/access_token.ts"
import { builder } from "../builder.ts"

builder.mutationField("deleteNote", t =>
    t.id({
        args: {
            noteId: t.arg.id({ required: true }),
        },
        nullable: false,
        async resolve(root, args, ctx) {
            return await db.transaction(async tx => {
                const note = await tx.query.notesTable.findFirst({
                    where: {
                        AND: [{ id: args.noteId }, makeNotesWhereQueryObjectFromAuthorizedResult(ctx.authorized)],
                    },
                    columns: { id: true, authorPersonaId: true },
                })
                if (note == null) throw new Error("Note not found or no permission")

                // 権限: author 自身、または author の persona と同じ account に属する default persona であること
                let allowed = note.authorPersonaId === ctx.authorized.personaId
                if (!allowed && ctx.authorized.isDefaultPersona) {
                    const authorPersona = await tx.query.personasTable.findFirst({
                        where: { id: note.authorPersonaId },
                        columns: { accountId: true },
                    })
                    if (authorPersona != null && authorPersona.accountId === ctx.authorized.accountId) {
                        allowed = true
                    }
                }
                if (!allowed) throw new Error("No permission to delete this note")

                // このノートを parent とする relationship が1件でもあれば削除拒否
                const child = await tx
                    .select({ id: noteRelationshipsTable.id })
                    .from(noteRelationshipsTable)
                    .where(eq(noteRelationshipsTable.parentNoteId, note.id))
                    .limit(1)
                if (child.length > 0) {
                    throw new Error("Cannot delete note with children")
                }

                await tx.delete(notesTable).where(eq(notesTable.id, note.id))

                return note.id
            })
        },
    })
)
