SET SESSION statement_timeout = 3000;
SET SESSION lock_timeout = 3000;
/*
  - ACQUIRES_SHARE_LOCK: Non-concurrent index creates will lock out writes to the table during the duration of the index build.
*/

CREATE UNIQUE INDEX personas_account_id_id_key ON personas USING btree (account_id, id);

ALTER TABLE "personas" ADD CONSTRAINT "personas_account_id_id_key" UNIQUE USING INDEX "personas_account_id_id_key";

ALTER TABLE "access_tokens" ADD CONSTRAINT "access_tokens_account_id_persona_id_fkey" FOREIGN KEY (account_id, persona_id) REFERENCES personas(account_id, id) NOT VALID;

ALTER TABLE "access_tokens" VALIDATE CONSTRAINT "access_tokens_account_id_persona_id_fkey";
