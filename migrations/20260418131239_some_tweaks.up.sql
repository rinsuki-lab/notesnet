SET SESSION statement_timeout = 3000;
SET SESSION lock_timeout = 3000;
ALTER TABLE "access_tokens" RENAME COLUMN "hashed_secret" TO "hashed_token";

ALTER TABLE "note_revisions" ADD COLUMN "writer_persona_id" uuid NOT NULL;

ALTER TABLE "notes" ADD COLUMN "author_persona_id" uuid NOT NULL;

ALTER TABLE "personas" ADD CONSTRAINT "personas_check" CHECK(((name IS NOT NULL) OR ((name IS NULL) AND (id = account_id)))) NOT VALID;

ALTER TABLE "personas" VALIDATE CONSTRAINT "personas_check";

ALTER TABLE "note_revisions" ADD CONSTRAINT "note_revisions_writer_persona_id_fkey" FOREIGN KEY (writer_persona_id) REFERENCES personas(id) NOT VALID;

ALTER TABLE "note_revisions" VALIDATE CONSTRAINT "note_revisions_writer_persona_id_fkey";

ALTER TABLE "notes" ADD CONSTRAINT "notes_author_persona_id_fkey" FOREIGN KEY (author_persona_id) REFERENCES personas(id) NOT VALID;

ALTER TABLE "notes" VALIDATE CONSTRAINT "notes_author_persona_id_fkey";
