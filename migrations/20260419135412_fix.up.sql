SET SESSION statement_timeout = 3000;
SET SESSION lock_timeout = 3000;
ALTER TABLE "note_revisions" DROP CONSTRAINT "note_revisions_writer_persona_id_fkey";

/*
  - DELETES_DATA: Deletes all values in the column
*/

ALTER TABLE "note_revisions" DROP COLUMN "writer_persona_id";
