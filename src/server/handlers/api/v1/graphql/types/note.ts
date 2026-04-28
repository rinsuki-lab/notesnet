import { builder } from "../builder.ts"
import { NoteRevision } from "./note_revision.ts"

export const NoteExternal = builder.simpleObject("NoteExternal", {
    fields: t => ({
        service: t.string({ nullable: false }),
        id: t.string({ nullable: false }),
    }),
})

export const Note = builder.drizzleObject("notesTable", {
    variant: "Note",
    fields: t => ({
        id: t.exposeID("id", { nullable: false }),
        latestRevision: t.relation("latestRevision", {
            type: NoteRevision,
        }),
        external: t.field({
            type: NoteExternal,
            select: {
                columns: {
                    externalId: true,
                    externalService: true,
                },
            },
            resolve(note) {
                if (note.externalId == null || note.externalService == null) {
                    return null
                }
                return {
                    id: note.externalId,
                    service: note.externalService,
                }
            },
        }),
    }),
})
