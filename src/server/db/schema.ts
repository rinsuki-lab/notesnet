import { sql } from "drizzle-orm";
import { boolean, check, pgTable, text, timestamp, uuid, bytea, jsonb } from "drizzle-orm/pg-core";

export const accountsTable = pgTable("accounts", {
    id: uuid().primaryKey(),
    name: text().notNull().unique(),
    hashedPassword: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

export const personasTable = pgTable("personas", {
    id: uuid().primaryKey(),
    accountId: uuid().notNull().references(() => accountsTable.id),
    name: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, table => [
    check("CHK_personas_account_id", sql`${table.name} IS NULL OR ${table.id} = ${table.accountId}`),
])

export const scopesTable = pgTable("scopes", {
    id: uuid().primaryKey(),
    name: text().notNull(),
    ownerAccountId: uuid().notNull().references(() => accountsTable.id),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

export const accessTokensTable = pgTable("access_tokens", {
    id: uuid().primaryKey(),
    accountId: uuid().notNull().references(() => accountsTable.id),
    personaId: uuid().references(() => personasTable.id),
    hashedToken: bytea().notNull(),
    description: text().notNull(),
    /**
     * Webインターフェース用のトークン (/api/internal/ が使える) かどうか
     */
    isSuperToken: boolean().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp({ withTimezone: true }),
})

export const scopePersonasTable = pgTable("scope_personas", {
    id: uuid().primaryKey(),
    scopeId: uuid().notNull().references(() => scopesTable.id),
    personaId: uuid().notNull().references(() => personasTable.id),

    canReadNoteRevisions: boolean().notNull().default(false),
    canModifyNotes: boolean().notNull().default(false),
    canAddTheirNotesToChild: boolean().notNull().default(false),
})

export const scopePermissionsObject = {
    canReadNoteRevisions: true,
    canModifyNotes: true,
    canAddTheirNotesToChild: true,
} satisfies Record<keyof (Record<string, boolean> & typeof scopePersonasTable.$inferSelect), true>

export const scopePermissionsKeys = Object.keys(scopePermissionsObject) as (keyof typeof scopePermissionsObject)[]

// export const scopePermissionsObject = Object.freeze(Object.fromEntries(scopePermissionsKeys.map(k => [k, true] as const)) as Record<typeof scopePermissionsKeys[number], true>)

export const notesTable = pgTable("notes", {
    id: uuid().primaryKey(),
    authorPersonaId: uuid().notNull().references(() => personasTable.id),
    scopeId: uuid().notNull().references(() => scopesTable.id),
    externalService: text(),
    externalId: text(),
})

export const noteRevisionsTable = pgTable("note_revisions", {
    id: uuid().primaryKey(),
    noteId: uuid().notNull().references(() => notesTable.id),
    authorPersonaId: uuid().notNull().references(() => personasTable.id),
    nextRevisionId: uuid(),
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
})