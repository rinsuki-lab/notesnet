SET SESSION statement_timeout = 3000;
SET SESSION lock_timeout = 3000;
ALTER TABLE "access_tokens" DROP CONSTRAINT "access_tokens_account_id_persona_id_fkey";

/*
  - ACQUIRES_ACCESS_EXCLUSIVE_LOCK: Index drops will lock out all accesses to the table. They should be fast.
  - INDEX_DROPPED: Dropping this index means queries that use this index might perform worse because they will no longer will be able to leverage it.
*/

ALTER TABLE "personas" DROP CONSTRAINT "personas_account_id_id_key";
