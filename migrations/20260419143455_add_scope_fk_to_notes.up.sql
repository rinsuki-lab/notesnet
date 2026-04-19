SET SESSION statement_timeout = 3000;
SET SESSION lock_timeout = 3000;
ALTER TABLE "notes" ADD CONSTRAINT "notes_scope_id_fkey" FOREIGN KEY (scope_id) REFERENCES scopes(id) NOT VALID;

ALTER TABLE "notes" VALIDATE CONSTRAINT "notes_scope_id_fkey";
