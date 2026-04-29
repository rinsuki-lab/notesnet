CREATE EXTENSION IF NOT EXISTS btree_gin;

-- Workaround of https://github.com/stripe/pg-schema-diff/issues/161
CREATE TABLE "_sqlx_migrations" (
	"version" bigint NOT NULL PRIMARY KEY,
	"installed_on" timestamp with time zone DEFAULT now() NOT NULL,
	"execution_time" bigint NOT NULL,
	"success" boolean NOT NULL,
	"description" text NOT NULL,
	"checksum" bytea NOT NULL
);


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
    UNIQUE (account_id, id), -- アクセストークンの外部キー用
    CHECK (name IS NOT NULL OR (name IS NULL AND id = account_id)) -- デフォルトペルソナはアカウントIDと同じID (確定ではないので参照時はこれを前提としてはならない、デフォルトペルソナを探したい時は (account_id = ? AND name IS NULL) で探すべき)
);
COMMENT ON COLUMN personas.name IS 'ペルソナの名前。accounts.nameとドットで結合し、persona_name.account_name のようになる。NULLの場合はデフォルトペルソナで、accounts.name のみが表示される。';
CREATE UNIQUE INDEX uq_personas_account_id_name ON personas (account_id, name) NULLS NOT DISTINCT;

CREATE TABLE access_tokens (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id),
    persona_id UUID REFERENCES personas(id),
    hashed_token BYTEA NOT NULL,
    description TEXT NOT NULL,
    is_super_token BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    FOREIGN KEY (account_id, persona_id) REFERENCES personas(account_id, id)
);
COMMENT ON COLUMN access_tokens.is_super_token IS 'Webインターフェース用のトークン (/api/internal/ が使える) かどうか';

CREATE TABLE scopes (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    owner_account_id UUID NOT NULL REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON COLUMN scopes.owner_account_id IS 'スコープの所持者。scope_personas 内の行の有無・内容にかかわらず、このアカウントのデフォルトペルソナはこのスコープが付いた投稿について全ての権限を持つ。';

CREATE TABLE scope_personas (
    id UUID PRIMARY KEY,
    scope_id UUID NOT NULL REFERENCES scopes(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,

    can_read_note_revisions BOOLEAN NOT NULL DEFAULT FALSE,
    can_modify_notes BOOLEAN NOT NULL DEFAULT FALSE,
    can_add_their_notes_to_child BOOLEAN NOT NULL DEFAULT FALSE,

    UNIQUE(scope_id, persona_id)
);
COMMENT ON COLUMN scope_personas.can_read_note_revisions IS 'ノートの過去リビジョンを読むことができるか (行が存在する時点で最新リビジョンは読める)';
COMMENT ON COLUMN scope_personas.can_modify_notes IS 'ノートの新リビジョンを作成できるか';
COMMENT ON COLUMN scope_personas.can_add_their_notes_to_child IS 'persona_id のアカウントが作成したノートを「子」としてスコープが付いたノートに追加できるか';

CREATE TABLE notes (
    id UUID PRIMARY KEY,
    author_persona_id UUID NOT NULL REFERENCES personas(id),
    scope_id UUID NOT NULL REFERENCES scopes(id),
    external_service TEXT,
    external_id TEXT,

    -- どっちかがあるならもう片方も必須
    CHECK ((external_id IS NULL OR external_service IS NOT NULL) AND (external_service IS NULL OR external_id IS NOT NULL))
);
CREATE UNIQUE INDEX uq_notes_external_service_and_id ON notes (external_service, external_id) WHERE external_id IS NOT NULL;
COMMENT ON TABLE notes IS 'ID管理・権限管理用のテーブル。実際の内容は (note_revisions.note_id = notes.id AND note_revisions.next_revision_id IS NULL) で取得できる。';

CREATE TABLE note_revisions (
    id UUID PRIMARY KEY,
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    author_persona_id UUID NOT NULL REFERENCES personas(id),
    next_revision_id UUID REFERENCES note_revisions(id) ON DELETE SET NULL,

    summary TEXT,
    text_for_search TEXT NOT NULL,

    content_type TEXT NOT NULL,
    attributes JSONB NOT NULL,
    content JSONB NOT NULL,

    started_at TIMESTAMPTZ,
    written_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);
COMMENT ON COLUMN note_revisions.text_for_search IS '全文検索用のテキスト';
COMMENT ON COLUMN note_revisions.attributes IS 'インデックスされてほしいデータ (クエリしたいデータ) を入れる。中身は content_type 依存';
COMMENT ON COLUMN note_revisions.content IS 'クエリされることを想定していないデータを入れる。中身は content_type 依存';
COMMENT ON COLUMN note_revisions.started_at IS 'ノートの内容が「開始された」日時。コンテンツ鑑賞なら鑑賞開始日時、GPSデータなら最初のデータを受信した日時。';
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