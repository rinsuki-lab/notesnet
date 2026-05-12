SET SESSION statement_timeout = 3000;
SET SESSION lock_timeout = 3000;
ALTER TABLE "note_revisions" ALTER CONSTRAINT "note_revisions_next_revision_id_fkey" DEFERRABLE INITIALLY IMMEDIATE;
