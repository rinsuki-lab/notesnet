SET SESSION statement_timeout = 3000;
SET SESSION lock_timeout = 3000;
ALTER TABLE "notes" DROP CONSTRAINT "notes_scope_id_fkey";
