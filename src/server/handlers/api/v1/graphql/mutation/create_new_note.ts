import * as v from "valibot"

import { db } from "../../../../../db/index.ts"
import { noteRelationshipsTable, noteRevisionsTable, notesTable } from "../../../../../db/schema.ts"
import { getPermission, makeNotesWhereQueryObjectFromAuthorizedResult } from "../../../../../extractors/access_token.ts"
import { builder } from "../builder.ts"
import { Note } from "../types/note.ts"

const CreateNewNoteParentInput = builder.inputType("CreateNewNoteParentInput", {
    fields: t => ({
        noteId: t.id({ required: true }),
        shouldListedAsParent: t.boolean({ required: true, defaultValue: true }),
        shouldListedAsChild: t.boolean({ required: true, defaultValue: true }),
        order: t.int(),
    }),
})

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
        parents: t.field({
            type: [CreateNewNoteParentInput],
            validate: v.optional(v.pipe(v.array(v.unknown()), v.maxLength(10))),
        }),
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

                if (args.input.parents?.length) {
                    const seenNoteIds = new Set<string>()
                    for (const parent of args.input.parents) {
                        if (seenNoteIds.has(parent.noteId)) {
                            throw new Error(`Duplicate parent noteId: ${parent.noteId}`)
                        }
                        seenNoteIds.add(parent.noteId)

                        const parentNote = await tx.query.notesTable.findFirst({
                            where: {
                                AND: [
                                    { id: parent.noteId },
                                    makeNotesWhereQueryObjectFromAuthorizedResult(ctx.authorized),
                                ],
                            },
                            columns: { scopeId: true },
                        })
                        if (parentNote == null)
                            throw new Error(`Parent note not found or no permission: ${parent.noteId}`)

                        const parentPermission = await getPermission(parentNote.scopeId, ctx.authorized, tx)
                        if (parentPermission == null || !parentPermission.canAddTheirNotesToChild) {
                            throw new Error(`No permission to add notes to the scope of parent note: ${parent.noteId}`)
                        }

                        await tx.insert(noteRelationshipsTable).values({
                            id: crypto.randomUUID(),
                            parentNoteId: parent.noteId,
                            childNoteId: note.id,
                            shouldListedAsParent: parent.shouldListedAsParent,
                            shouldListedAsChild: parent.shouldListedAsChild,
                            orderChild: parent.order ?? null,
                        })
                    }
                }

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
