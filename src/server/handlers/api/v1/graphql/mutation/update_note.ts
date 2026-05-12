import { and, eq, isNull, sql } from "drizzle-orm"
import { v7 as uuidv7 } from "uuid"

import { db } from "../../../../../db/index.ts"
import { noteRevisionsTable } from "../../../../../db/schema.ts"
import { getPermission, makeNotesWhereQueryObjectFromAuthorizedResult } from "../../../../../extractors/access_token.ts"
import { builder } from "../builder.ts"
import { Note } from "../types/note.ts"
import { CreateNewNoteRevisionInput } from "./create_new_note.ts"

builder.mutationField("updateNote", t =>
    t.drizzleField({
        type: Note,
        args: {
            noteId: t.arg.id({ required: true }),
            previousRevisionId: t.arg.id({ required: true }),
            revision: t.arg({ type: CreateNewNoteRevisionInput, required: true }),
        },
        nullable: false,
        async resolve(query, root, args, ctx) {
            return await db.transaction(async tx => {
                const note = await tx.query.notesTable.findFirst({
                    where: {
                        AND: [{ id: args.noteId }, makeNotesWhereQueryObjectFromAuthorizedResult(ctx.authorized)],
                    },
                    columns: { id: true, scopeId: true },
                })
                if (note == null) throw new Error("Note not found or no permission")

                const permission = await getPermission(note.scopeId, ctx.authorized, tx)
                if (permission == null) throw new Error("Scope not found or no permission")
                if (!permission.canModifyNotes) throw new Error("No permission to modify notes in this scope")

                // CAS: previousRevisionId が当該 note の最新 revision (next_revision_id IS NULL) であることを確認
                const [previousRevision] = await tx
                    .select({ id: noteRevisionsTable.id })
                    .from(noteRevisionsTable)
                    .where(
                        and(
                            eq(noteRevisionsTable.noteId, note.id),
                            eq(noteRevisionsTable.id, args.previousRevisionId),
                            isNull(noteRevisionsTable.nextRevisionId)
                        )
                    )
                    .for("update")
                if (previousRevision == null) {
                    throw new Error(
                        "previousRevisionId does not match the latest revision of the note (concurrent update?)"
                    )
                }

                const newId = uuidv7()

                // note_revisions の partial unique index
                //   uq_note_revisions_latest (note_id WHERE next_revision_id IS NULL)
                //   uq_note_revisions_next   (note_id, next_revision_id WHERE next_revision_id IS NOT NULL)
                // を維持したまま append するには、UPDATE → INSERT の順にする必要がある。
                // ただしその UPDATE 時点では新 revision がまだ存在せず fkey 違反になるため、
                // fkey を本トランザクション内でのみ DEFERRED にして commit 時に検証する。
                await tx.execute(sql`SET CONSTRAINTS "note_revisions_next_revision_id_fkey" DEFERRED`)

                // CAS 意図を UPDATE 文にも明示する (FOR UPDATE で押さえているため理論上は id だけで十分だが、
                // 将来の変更耐性のため partial unique index と同条件で更新し、件数 1 を確認する)
                const updated = await tx
                    .update(noteRevisionsTable)
                    .set({ nextRevisionId: newId })
                    .where(
                        and(
                            eq(noteRevisionsTable.id, previousRevision.id),
                            eq(noteRevisionsTable.noteId, note.id),
                            isNull(noteRevisionsTable.nextRevisionId)
                        )
                    )
                    .returning({ id: noteRevisionsTable.id })
                if (updated.length !== 1) {
                    throw new Error("Failed to mark previous revision as superseded (unexpected state)")
                }

                await tx.insert(noteRevisionsTable).values({
                    id: newId,
                    authorPersonaId: ctx.authorized.personaId,
                    noteId: note.id,
                    contentType: args.revision.contentType,
                    content: args.revision.content,
                    attributes: args.revision.attributes,
                    textForSearch: args.revision.textForSearch,
                    summary: args.revision.summary?.length ? args.revision.summary : null,
                    startedAt: args.revision.startedAt ? new Date(args.revision.startedAt) : null,
                    writtenAt: args.revision.writtenAt ? new Date(args.revision.writtenAt) : new Date(),
                })

                return tx.query.notesTable
                    .findFirst(
                        query({
                            where: {
                                id: note.id,
                            },
                        })
                    )
                    .then(r => r!)
            })
        },
    })
)
