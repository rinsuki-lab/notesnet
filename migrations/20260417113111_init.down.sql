SET SESSION statement_timeout = 3000;
SET SESSION lock_timeout = 3000;
ALTER TABLE "access_tokens" DROP CONSTRAINT "access_tokens_account_id_fkey";

ALTER TABLE "access_tokens" DROP CONSTRAINT "access_tokens_persona_id_fkey";

ALTER TABLE "note_relationships" DROP CONSTRAINT "note_relationships_child_note_id_fkey";

ALTER TABLE "note_relationships" DROP CONSTRAINT "note_relationships_parent_note_id_fkey";

ALTER TABLE "note_revisions" DROP CONSTRAINT "note_revisions_author_persona_id_fkey";

ALTER TABLE "note_revisions" DROP CONSTRAINT "note_revisions_next_revision_id_fkey";

ALTER TABLE "note_revisions" DROP CONSTRAINT "note_revisions_note_id_fkey";

ALTER TABLE "personas" DROP CONSTRAINT "personas_account_id_fkey";

ALTER TABLE "scope_personas" DROP CONSTRAINT "scope_personas_persona_id_fkey";

ALTER TABLE "scope_personas" DROP CONSTRAINT "scope_personas_scope_id_fkey";

ALTER TABLE "scopes" DROP CONSTRAINT "scopes_owner_account_id_fkey";

/*
  - DELETES_DATA: Deletes all rows in the table (and the table itself)
*/
SET SESSION statement_timeout = 1200000;

DROP TABLE "access_tokens";

/*
  - DELETES_DATA: Deletes all rows in the table (and the table itself)
*/

DROP TABLE "accounts";

/*
  - DELETES_DATA: Deletes all rows in the table (and the table itself)
*/

DROP TABLE "note_relationships";

/*
  - DELETES_DATA: Deletes all rows in the table (and the table itself)
*/

DROP TABLE "note_revisions";

/*
  - DELETES_DATA: Deletes all rows in the table (and the table itself)
*/

DROP TABLE "notes";

/*
  - DELETES_DATA: Deletes all rows in the table (and the table itself)
*/

DROP TABLE "personas";

/*
  - DELETES_DATA: Deletes all rows in the table (and the table itself)
*/

DROP TABLE "scope_personas";

/*
  - DELETES_DATA: Deletes all rows in the table (and the table itself)
*/

DROP TABLE "scopes";

/*
  - HAS_UNTRACKABLE_DEPENDENCIES: This extension may be in use by tables, indexes, functions, triggers, etc. This statement will be ran last, so this may be OK.
*/
SET SESSION statement_timeout = 3000;

DROP EXTENSION "btree_gin";
