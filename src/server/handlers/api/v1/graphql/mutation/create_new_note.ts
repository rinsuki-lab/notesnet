import { db } from "../../../../../db/index.ts"
import { noteRevisionsTable, notesTable } from "../../../../../db/schema.ts"
import { getPermission } from "../../../../../extractors/access_token.ts"
import { builder } from "../builder.ts"
import { Note } from "../types/note.ts"

const CreateNewNoteInput = builder.inputType("CreateNewNoteInput", {
    fields: t => ({
        scopeId: t.id({ required: true }),
        summary: t.string(),
        textForSearch: t.string({ required: true }),
        contentType: t.string({ required: true }),
        content: t.field({ type: "JSON", required: true }),
        attributes: t.field({ type: "JSON", required: true }),
        startedAt: t.field({ type: "DateTime" }),
        writtenAt: t.field({ type: "DateTime" }),
    }),
})

builder.mutationField("createNewNote", t =>
    t.drizzleField({
        type: Note,
        args: {
            input: t.arg({ type: CreateNewNoteInput, required: true }),
        },
        nullable: false,
        async resolve(query, root, args, ctx) {
            return await db.transaction(async tx => {
                const permission = await getPermission(args.input.scopeId, ctx.authorized, tx)
                if (permission == null) throw new Error("Scope not found or no permission")
                if (!permission.canModifyNotes) throw new Error("No permission to modify notes in this scope")

                const [note] = await tx
                    .insert(notesTable)
                    .values({
                        authorPersonaId: ctx.authorized.personaId,
                        scopeId: args.input.scopeId,
                        id: crypto.randomUUID(),
                    })
                    .returning({ id: notesTable.id })
                if (note == null) {
                    throw new Error("Failed to create a new note")
                }
                await tx.insert(noteRevisionsTable).values({
                    id: crypto.randomUUID(),
                    authorPersonaId: ctx.authorized.personaId,
                    noteId: note.id,
                    contentType: args.input.contentType,
                    content: args.input.content,
                    attributes: args.input.attributes,
                    textForSearch: args.input.textForSearch,
                    summary: args.input.summary?.length ? args.input.summary : null,
                    startedAt: args.input.startedAt ? new Date(args.input.startedAt) : null,
                    writtenAt: args.input.writtenAt ? new Date(args.input.writtenAt) : new Date(),
                })
                return tx.query.notesTable
                    .findFirst(
                        query({
                            where: {
                                id: note.id,
                            },
                        })
                    )
                    .then(r => r!) // トランザクション内なので必ずある
            })
        },
    })
)
