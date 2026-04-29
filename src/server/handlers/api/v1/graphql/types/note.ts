import { sql } from "drizzle-orm"
import { makeNotesWhereQueryObjectFromAuthorizedResult } from "../../../../../extractors/access_token.ts"
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

export const NoteRelation = builder.drizzleObject("noteRelationshipsTable", {
    variant: "NoteRelation",
    fields: t => ({
        parent: t.relation("parentNote", {
            type: Note,
            query(args, ctx) {
                return {
                    where: makeNotesWhereQueryObjectFromAuthorizedResult(ctx.authorized),
                }
            },
        }),
        child: t.relation("childNote", {
            type: Note,
            query(args, ctx) {
                return {
                    where: makeNotesWhereQueryObjectFromAuthorizedResult(ctx.authorized),
                }
            },
        }),
    }),
})

builder.drizzleObjectFields(Note, t => ({
    parents: t.relation("parentRelationships", {
        type: NoteRelation,
        query(args, ctx) {
            return {
                where: {
                    shouldListedAsParent: true,
                    parentNote: makeNotesWhereQueryObjectFromAuthorizedResult(ctx.authorized),
                },
                orderBy: t => sql`${t.orderChild} ASC NULLS LAST`,
            }
        },
        nullable: false,
    }),
}))
