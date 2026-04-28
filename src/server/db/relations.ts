import { defineRelations } from "drizzle-orm";
import * as schema from "./schema.ts"

export const relations = defineRelations(schema, r => ({
    scopesTable: {
        permissions: r.many.scopePersonasTable({
            from: r.scopesTable.id,
            to: r.scopePersonasTable.scopeId,
        })
    },
    notesTable: {
        authorPersona: r.one.personasTable({
            from: r.notesTable.authorPersonaId,
            to: r.personasTable.id,
        }),
        scope: r.one.scopesTable({
            from: r.notesTable.scopeId,
            to: r.scopesTable.id,
        }),
        latestRevision: r.one.noteRevisionsTable({
            from: r.notesTable.id,
            to: r.noteRevisionsTable.noteId,
            where: {
                nextRevisionId: { isNull: true }
            }
        }),
    },
    noteRevisionsTable: {
        note: r.one.notesTable({
            from: r.noteRevisionsTable.noteId,
            to: r.notesTable.id,
        })
    }
}))