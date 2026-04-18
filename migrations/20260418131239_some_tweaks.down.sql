SET SESSION statement_timeout = 3000;
SET SESSION lock_timeout = 3000;
ALTER TABLE "access_tokens" RENAME COLUMN "hashed_token" TO "hashed_secret";

ALTER TABLE "note_revisions" DROP CONSTRAINT "note_revisions_writer_persona_id_fkey";

/*
  - DELETES_DATA: Deletes all values in the column
*/

ALTER TABLE "note_revisions" DROP COLUMN "writer_persona_id";

ALTER TABLE "notes" DROP CONSTRAINT "notes_author_persona_id_fkey";

/*
  - DELETES_DATA: Deletes all values in the column
*/

ALTER TABLE "notes" DROP COLUMN "author_persona_id";

ALTER TABLE "personas" DROP CONSTRAINT "personas_check";
