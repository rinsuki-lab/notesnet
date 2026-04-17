SET SESSION statement_timeout = 3000;
SET SESSION lock_timeout = 3000;
CREATE EXTENSION "btree_gin";

CREATE TABLE "access_tokens" (
	"id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"persona_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"is_super_token" boolean DEFAULT false NOT NULL,
	"hashed_secret" bytea NOT NULL,
	"description" text NOT NULL
);

ALTER TABLE "access_tokens" ADD CONSTRAINT "access_tokens_pkey" PRIMARY KEY (id);

CREATE TABLE "accounts" (
	"id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"hashed_password" text NOT NULL
);

ALTER TABLE "accounts" ADD CONSTRAINT "accounts_name_key" UNIQUE (name);

ALTER TABLE "accounts" ADD CONSTRAINT "accounts_pkey" PRIMARY KEY (id);

ALTER TABLE "access_tokens" ADD CONSTRAINT "access_tokens_account_id_fkey" FOREIGN KEY (account_id) REFERENCES accounts(id);

CREATE TABLE "note_relationships" (
	"id" uuid NOT NULL,
	"parent_note_id" uuid NOT NULL,
	"child_note_id" uuid NOT NULL,
	"order_child" integer,
	"should_listed_as_child" boolean DEFAULT true NOT NULL,
	"should_listed_as_parent" boolean DEFAULT true NOT NULL
);

ALTER TABLE "note_relationships" ADD CONSTRAINT "note_relationships_parent_note_id_child_note_id_key" UNIQUE (parent_note_id, child_note_id);

ALTER TABLE "note_relationships" ADD CONSTRAINT "note_relationships_pkey" PRIMARY KEY (id);

CREATE UNIQUE INDEX uq_note_relationships_undirected ON note_relationships USING btree (LEAST(parent_note_id, child_note_id), GREATEST(parent_note_id, child_note_id));

CREATE TABLE "note_revisions" (
	"id" uuid NOT NULL,
	"note_id" uuid NOT NULL,
	"next_revision_id" uuid,
	"author_persona_id" uuid NOT NULL,
	"started_at" timestamp with time zone,
	"written_at" timestamp with time zone DEFAULT now() NOT NULL,
	"inserted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"summary" text,
	"text_for_search" text NOT NULL,
	"content_type" text NOT NULL,
	"attributes" jsonb NOT NULL,
	"content" jsonb NOT NULL
);

ALTER TABLE "note_revisions" ADD CONSTRAINT "note_revisions_pkey" PRIMARY KEY (id);

CREATE INDEX idx_note_revisions_attributes ON note_revisions USING gin (content_type, ((next_revision_id IS NULL)), attributes);

CREATE UNIQUE INDEX uq_note_revisions_latest ON note_revisions USING btree (note_id) WHERE (next_revision_id IS NULL);

CREATE UNIQUE INDEX uq_note_revisions_next ON note_revisions USING btree (note_id, next_revision_id) WHERE (next_revision_id IS NOT NULL);

ALTER TABLE "note_revisions" ADD CONSTRAINT "note_revisions_next_revision_id_fkey" FOREIGN KEY (next_revision_id) REFERENCES note_revisions(id) ON DELETE SET NULL;

CREATE TABLE "notes" (
	"id" uuid NOT NULL,
	"scope_id" uuid NOT NULL,
	"external_service" text,
	"external_id" text
);

ALTER TABLE "notes" ADD CONSTRAINT "notes_check" CHECK((((external_id IS NULL) OR (external_service IS NOT NULL)) AND ((external_service IS NULL) OR (external_id IS NOT NULL))));

ALTER TABLE "notes" ADD CONSTRAINT "notes_pkey" PRIMARY KEY (id);

CREATE UNIQUE INDEX uq_notes_external_service_and_id ON notes USING btree (external_service, external_id) WHERE (external_id IS NOT NULL);

ALTER TABLE "note_relationships" ADD CONSTRAINT "note_relationships_child_note_id_fkey" FOREIGN KEY (child_note_id) REFERENCES notes(id) ON DELETE CASCADE;

ALTER TABLE "note_relationships" ADD CONSTRAINT "note_relationships_parent_note_id_fkey" FOREIGN KEY (parent_note_id) REFERENCES notes(id) ON DELETE CASCADE;

ALTER TABLE "note_revisions" ADD CONSTRAINT "note_revisions_note_id_fkey" FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE;

CREATE TABLE "personas" (
	"id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text
);

ALTER TABLE "personas" ADD CONSTRAINT "personas_account_id_fkey" FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

ALTER TABLE "personas" ADD CONSTRAINT "personas_pkey" PRIMARY KEY (id);

CREATE UNIQUE INDEX uq_personas_account_id_name ON personas USING btree (account_id, name) NULLS NOT DISTINCT;

ALTER TABLE "access_tokens" ADD CONSTRAINT "access_tokens_persona_id_fkey" FOREIGN KEY (persona_id) REFERENCES personas(id);

ALTER TABLE "note_revisions" ADD CONSTRAINT "note_revisions_author_persona_id_fkey" FOREIGN KEY (author_persona_id) REFERENCES personas(id);

CREATE TABLE "scope_personas" (
	"id" uuid NOT NULL,
	"scope_id" uuid NOT NULL,
	"persona_id" uuid NOT NULL,
	"can_read_note_revisions" boolean DEFAULT false NOT NULL,
	"can_modify_notes" boolean DEFAULT false NOT NULL,
	"can_add_their_notes_to_child" boolean DEFAULT false NOT NULL
);

ALTER TABLE "scope_personas" ADD CONSTRAINT "scope_personas_persona_id_fkey" FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE;

ALTER TABLE "scope_personas" ADD CONSTRAINT "scope_personas_pkey" PRIMARY KEY (id);

ALTER TABLE "scope_personas" ADD CONSTRAINT "scope_personas_scope_id_persona_id_key" UNIQUE (scope_id, persona_id);

CREATE TABLE "scopes" (
	"id" uuid NOT NULL,
	"owner_account_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL
);

ALTER TABLE "scopes" ADD CONSTRAINT "scopes_owner_account_id_fkey" FOREIGN KEY (owner_account_id) REFERENCES accounts(id);

ALTER TABLE "scopes" ADD CONSTRAINT "scopes_pkey" PRIMARY KEY (id);

ALTER TABLE "scope_personas" ADD CONSTRAINT "scope_personas_scope_id_fkey" FOREIGN KEY (scope_id) REFERENCES scopes(id) ON DELETE CASCADE;
