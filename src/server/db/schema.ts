import { sql } from "drizzle-orm"
import {
    type AnyPgColumn,
    boolean,
    bytea,
    check,
    foreignKey,
    index,
    integer,
    jsonb,
    pgTable,
    text,
    timestamp,
    unique,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core"

export const accountsTable = pgTable("accounts", {
    id: uuid().primaryKey(),
    name: text().notNull().unique(),
    hashedPassword: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

export const personasTable = pgTable(
    "personas",
    {
        id: uuid().primaryKey(),
        accountId: uuid()
            .notNull()
            .references(() => accountsTable.id, { name: "personas_account_id_fkey", onDelete: "cascade" }),
        name: text(),
        createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    },
    t => [
        unique("personas_account_id_id_key").on(t.accountId, t.id),
        uniqueIndex("uq_personas_account_id_name").on(t.accountId, t.name),
        check("personas_check", sql`((name IS NOT NULL) OR ((name IS NULL) AND (id = account_id)))`),
    ]
)

export const scopesTable = pgTable("scopes", {
    id: uuid().primaryKey(),
    name: text().notNull(),
    ownerAccountId: uuid()
        .notNull()
        .references(() => accountsTable.id, { name: "scopes_owner_account_id_fkey" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

export const accessTokensTable = pgTable(
    "access_tokens",
    {
        id: uuid().primaryKey(),
        accountId: uuid()
            .notNull()
            .references(() => accountsTable.id, { name: "access_tokens_account_id_fkey" }),
        personaId: uuid().references(() => personasTable.id, { name: "access_tokens_persona_id_fkey" }),
        hashedToken: bytea().notNull(),
        description: text().notNull(),
        /**
         * Webインターフェース用のトークン (/api/internal/ が使える) かどうか
         */
        isSuperToken: boolean().default(false).notNull(),
        createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
        revokedAt: timestamp({ withTimezone: true }),
    },
    t => [
        foreignKey({
            columns: [t.accountId, t.personaId],
            foreignColumns: [personasTable.accountId, personasTable.id],
            name: "access_tokens_account_id_persona_id_fkey",
        }),
    ]
)

export const scopePersonasTable = pgTable(
    "scope_personas",
    {
        id: uuid().primaryKey(),
        scopeId: uuid()
            .notNull()
            .references(() => scopesTable.id, { name: "scope_personas_scope_id_fkey", onDelete: "cascade" }),
        personaId: uuid()
            .notNull()
            .references(() => personasTable.id, { name: "scope_personas_persona_id_fkey", onDelete: "cascade" }),

        canReadNoteRevisions: boolean().notNull().default(false),
        canModifyNotes: boolean().notNull().default(false),
        canAddTheirNotesToChild: boolean().notNull().default(false),
    },
    t => [unique("scope_personas_scope_id_persona_id_key").on(t.scopeId, t.personaId)]
)

export const scopePermissionsObject = {
    canReadNoteRevisions: true,
    canModifyNotes: true,
    canAddTheirNotesToChild: true,
} satisfies Record<keyof (Record<string, boolean> & typeof scopePersonasTable.$inferSelect), true>

export const scopePermissionsKeys = Object.keys(scopePermissionsObject) as (keyof typeof scopePermissionsObject)[]

// export const scopePermissionsObject = Object.freeze(Object.fromEntries(scopePermissionsKeys.map(k => [k, true] as const)) as Record<typeof scopePermissionsKeys[number], true>)

export const notesTable = pgTable(
    "notes",
    {
        id: uuid().primaryKey(),
        authorPersonaId: uuid()
            .notNull()
            .references(() => personasTable.id, { name: "notes_author_persona_id_fkey" }),
        scopeId: uuid()
            .notNull()
            .references(() => scopesTable.id, { name: "notes_scope_id_fkey" }),
        externalService: text(),
        externalId: text(),
    },
    t => [
        check(
            "notes_check",
            sql.raw(
                "(((external_id IS NULL) OR (external_service IS NOT NULL)) AND ((external_service IS NULL) OR (external_id IS NOT NULL)))"
            )
        ),
        uniqueIndex("uq_notes_external_service_and_id")
            .on(t.externalService, t.externalId)
            .where(sql.raw("(external_id IS NOT NULL)")),
    ]
)

export const noteRevisionsTable = pgTable(
    "note_revisions",
    {
        id: uuid().primaryKey(),
        noteId: uuid()
            .notNull()
            .references(() => notesTable.id, { name: "note_revisions_note_id_fkey", onDelete: "cascade" }),
        authorPersonaId: uuid()
            .notNull()
            .references(() => personasTable.id, { name: "note_revisions_author_persona_id_fkey" }),
        nextRevisionId: uuid().references((): AnyPgColumn => noteRevisionsTable.id, {
            name: "note_revisions_next_revision_id_fkey",
            onDelete: "set null",
        }),
        summary: text(),
        /**
         * 全文検索用のフィールド
         */
        textForSearch: text().notNull(),

        contentType: text().notNull(),
        attributes: jsonb().notNull(),
        content: jsonb().notNull(),

        startedAt: timestamp({ withTimezone: true }),
        writtenAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
        insertedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    },
    t => [
        uniqueIndex("uq_note_revisions_next")
            .on(t.noteId, t.nextRevisionId)
            .where(sql.raw("(next_revision_id IS NOT NULL)")),
        uniqueIndex("uq_note_revisions_latest").on(t.noteId).where(sql.raw("(next_revision_id IS NULL)")),
        index("idx_note_revisions_attributes").using(
            "gin",
            t.contentType,
            sql.raw("(next_revision_id IS NULL)"),
            t.attributes
        ),
    ]
)

export const noteRelationshipsTable = pgTable(
    "note_relationships",
    {
        id: uuid().primaryKey(),
        parentNoteId: uuid()
            .notNull()
            .references(() => notesTable.id, { name: "note_relationships_parent_note_id_fkey", onDelete: "cascade" }),
        childNoteId: uuid()
            .notNull()
            .references(() => notesTable.id, { name: "note_relationships_child_note_id_fkey", onDelete: "cascade" }),
        shouldListedAsChild: boolean().notNull().default(true),
        shouldListedAsParent: boolean().notNull().default(true),
        orderChild: integer(),
    },
    t => [
        unique("note_relationships_parent_note_id_child_note_id_key").on(t.parentNoteId, t.childNoteId),
        uniqueIndex("uq_note_relationships_undirected").on(
            sql.raw("LEAST(parent_note_id, child_note_id)"),
            sql.raw("GREATEST(parent_note_id, child_note_id)")
        ),
    ]
)
