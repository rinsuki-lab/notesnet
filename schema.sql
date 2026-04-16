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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(account_id, name) WHERE name IS NOT NULL
    UNIQUE(account_id) WHERE name IS NULL
);

CREATE TABLE access_tokens (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id),
    persona_id UUID REFERENCES personas(id),
    hashed_secret BYTEA NOT NULL,
    description TEXT NOT NULL,
    is_super_token BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'for web interface',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    revoked_at TIMESTAMPTZ
);

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
    CHECK ((external_id IS NULL OR external_service IS NOT NULL) AND (external_service IS NULL OR external_id IS NOT NULL)),
    UNIQUE (external_service, external_id) WHERE external_id IS NOT NULL
);

CREATE TABLE note_revisions (
    id UUID PRIMARY KEY,
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    next_revision_id UUID REFERENCES note_revisions(id) ON DELETE SET NULL,

    summary TEXT,
    text_for_search TEXT NOT NULL, -- 全文検索用

    content_type TEXT NOT NULL,
    attributes JSONB NOT NULL, -- 検索用
    content JSONB NOT NULL, -- クエリでひっかけないようなデータをここに入れる

    started_at TIMESTAMPTZ,
    written_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(note_id, next_revision_id) WHERE next_revision_id IS NOT NULL
    UNIQUE(note_id) WHERE next_revision_id IS NULL
);
CREATE INDEX idx_note_revisions_attributes ON note_revisions USING GIN (content_type, next_revision_id IS NULL, attributes);

CREATE TABLE note_relationships (
    id UUID PRIMARY KEY,
    parent_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    child_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    should_listed_as_child BOOLEAN NOT NULL DEFAULT TRUE,
    should_listed_as_parent BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(parent_note_id, child_note_id),
    UNIQUE(min(parent_note_id, child_note_id), max(parent_note_id, child_note_id))
);