import { builder } from "../builder.ts"

const FORCE_NOT_NULLABLE = { nullable: false } as any

export const NoteRevision = builder.drizzleObject("noteRevisionsTable", {
    variant: "NoteRevision",
    fields: t => ({
        id: t.exposeID("id", { nullable: false }),
        summary: t.exposeString("summary"),
        textForSearch: t.exposeString("textForSearch", { nullable: false }),
        contentType: t.exposeString("contentType", { nullable: false }),
        content: t.expose("content", { type: "JSON", ...FORCE_NOT_NULLABLE }),
        attributes: t.expose("attributes", { type: "JSON", ...FORCE_NOT_NULLABLE }),
        startedAt: t.expose("startedAt", { type: "DateTime" }),
        writtenAt: t.expose("writtenAt", { type: "DateTime", nullable: false }),
        insertedAt: t.expose("insertedAt", { type: "DateTime", nullable: false }),
    }),
})
