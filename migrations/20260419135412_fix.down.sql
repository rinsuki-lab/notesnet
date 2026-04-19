SET SESSION statement_timeout = 3000;
SET SESSION lock_timeout = 3000;
ALTER TABLE "note_revisions" ADD COLUMN "writer_persona_id" uuid NOT NULL;

ALTER TABLE "note_revisions" ADD CONSTRAINT "note_revisions_writer_persona_id_fkey" FOREIGN KEY (writer_persona_id) REFERENCES personas(id) NOT VALID;

ALTER TABLE "note_revisions" VALIDATE CONSTRAINT "note_revisions_writer_persona_id_fkey";
