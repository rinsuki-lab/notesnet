CREATE EXTENSION IF NOT EXISTS btree_gin;

CREATE TABLE accounts (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE personas (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_personas_account_id_name ON personas (account_id, name) NULLS NOT DISTINCT;

CREATE TABLE access_tokens (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id),
    persona_id UUID REFERENCES personas(id),
    hashed_secret BYTEA NOT NULL,
    description TEXT NOT NULL,
    is_super_token BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);
COMMENT ON COLUMN access_tokens.is_super_token IS 'Webインターフェース用のトークン (/api/internal/ が使える) かどうか';

CREATE TABLE scopes (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    owner_account_id UUID NOT NULL REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE scope_personas (
    id UUID PRIMARY KEY,
    scope_id UUID NOT NULL REFERENCES scopes(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,

    can_read_note_revisions BOOLEAN NOT NULL DEFAULT FALSE,
    can_modify_notes BOOLEAN NOT NULL DEFAULT FALSE,
    can_add_their_notes_to_child BOOLEAN NOT NULL DEFAULT FALSE,

    UNIQUE(scope_id, persona_id)
);

CREATE TABLE notes (
    id UUID PRIMARY KEY,
    scope_id UUID NOT NULL,
    external_service TEXT,
    external_id TEXT,

    -- どっちかがあるならもう片方も必須
    CHECK ((external_id IS NULL OR external_service IS NOT NULL) AND (external_service IS NULL OR external_id IS NOT NULL))
);
CREATE UNIQUE INDEX uq_notes_external_service_and_id ON notes (external_service, external_id) WHERE external_id IS NOT NULL;

CREATE TABLE note_revisions (
    id UUID PRIMARY KEY,
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    next_revision_id UUID REFERENCES note_revisions(id) ON DELETE SET NULL,

    summary TEXT,
    text_for_search TEXT NOT NULL,

    content_type TEXT NOT NULL,
    attributes JSONB NOT NULL,
    content JSONB NOT NULL,

    started_at TIMESTAMPTZ,
    written_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    author_persona_id UUID NOT NULL REFERENCES personas(id)
);
COMMENT ON COLUMN note_revisions.text_for_search IS '全文検索用のテキスト';
COMMENT ON COLUMN note_revisions.attributes IS 'インデックスされてほしいデータ (クエリしたいデータ) を入れる。中身は content_type 依存';
COMMENT ON COLUMN note_revisions.content IS 'クエリされることを想定していないデータを入れる。中身は content_type 依存';
CREATE UNIQUE INDEX uq_note_revisions_next ON note_revisions (note_id, next_revision_id) WHERE next_revision_id IS NOT NULL;
CREATE UNIQUE INDEX uq_note_revisions_latest ON note_revisions (note_id) WHERE next_revision_id IS NULL;
CREATE INDEX idx_note_revisions_attributes ON note_revisions USING GIN (content_type, (next_revision_id IS NULL), attributes);

CREATE TABLE note_relationships (
    id UUID PRIMARY KEY,
    parent_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    child_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,

    should_listed_as_child BOOLEAN NOT NULL DEFAULT TRUE,
    should_listed_as_parent BOOLEAN NOT NULL DEFAULT TRUE,

    order_child INTEGER,

    UNIQUE(parent_note_id, child_note_id)
);
CREATE UNIQUE INDEX uq_note_relationships_undirected ON note_relationships (LEAST(parent_note_id, child_note_id), GREATEST(parent_note_id, child_note_id));