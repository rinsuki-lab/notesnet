#!/usr/bin/env python3
import subprocess
import os
import datetime
import sys
import re

PG_SCHEMA_DIFF_OPTIONS = [
    "--include-schema", "public",
    "--no-concurrent-index-ops", # sqlxはトランザクション内でマイグレーションを実行するので、CREATE INDEX CONCURRENTLY cannot run inside a transaction block になる
]

RETEMP_LINES = r"(?:\n|SET SESSION [a-z_]+ = [0-9]+;)+"

RE_INDEX_AND_CONSTRAINT = re.compile("".join([
    r'\nCREATE UNIQUE INDEX ([a-z_]+?)(_pkey|_[a-z_]+_key) ON \1 USING btree (\([^)]+\));',
    RETEMP_LINES,
    r'ALTER TABLE "\1" ADD CONSTRAINT "\1\2" (UNIQUE|PRIMARY KEY) USING INDEX "\1\2";',
]))

RE_ADD_CONSTRAINT_AND_VALIDATE = re.compile("".join([
    r'\nALTER TABLE "([a-z_]+)" ADD CONSTRAINT "([a-z_]+)" ([^\n]+?) NOT VALID;',
    RETEMP_LINES,
    r'ALTER TABLE "\1" VALIDATE CONSTRAINT "\2";',
]))

def clean_sql(sql: str) -> str:
    old_sql = sql
    # schema 名を指定しない
    sql = sql.replace("\"public\".", "")
    sql = sql.replace("public.", "")
    # デフォルト COLLATE なら省略する
    sql = sql.replace(' COLLATE "pg_catalog"."default"', '')
    # /*
    # Statement 1
    # */
    # を消す (DELETES_DATA とか書いてある時はそこだけ残す、Statement N はどちらにせよ消す)
    sql = re.sub(r"^/\*\nStatement [0-9]+\n", "/*\n", sql, flags=re.MULTILINE)
    sql = sql.replace("/*\n*/\n", "")
    # テーブル作成を見つける
    new_tables = [m.group(1) for m in re.finditer(r"^CREATE TABLE \"([a-z_]+)\" \($", sql, flags=re.MULTILINE)]
    # さっき作ったばっかりのテーブルの場合、index作ってconstriant貼るのを纏める
    sql = RE_INDEX_AND_CONSTRAINT.sub(lambda m: '\nALTER TABLE "' + m.group(1) + '" ADD CONSTRAINT "' + m.group(1) + m.group(2) + '" ' + m.group(4) + ' ' + m.group(3) + ';' if m.group(1) in new_tables else m.group(0), sql)
    # さっき作ったばっかりのテーブルの場合、constraint貼るのとvalidateするのを纏める
    sql = RE_ADD_CONSTRAINT_AND_VALIDATE.sub(lambda m: '\nALTER TABLE "' + m.group(1) + '" ADD CONSTRAINT "' + m.group(2) + '" ' + m.group(3) + ';' if m.group(1) in new_tables else m.group(0), sql)
    # 毎statementで SET SESSION 〜 をするので、同じ値をセットするものは省略する
    keys: dict[str, str] = {}
    def kd(m: re.Match[str]) -> str:
        k = m.group(1)
        if keys.get(k) == m.group(2):
            return ""
        keys[k] = m.group(2)
        return m.group(0)
    sql = re.sub(r"^SET SESSION ([a-z_]+) = ([0-9]+);$", kd, sql, flags=re.MULTILINE)
    # 改行しすぎているところを削る
    sql = re.sub(r"\n{3,}", "\n\n", sql)
    if old_sql != sql:
        return clean_sql(sql)
    return sql

if __name__ == '__main__':
    db_url = os.environ['DATABASE_URL']

    prefix_str = datetime.datetime.now().strftime("%Y%m%d%H%M%S_") + sys.argv[1]

    p = subprocess.run([
        "pg-schema-diff", "plan",
        "--from-dsn", db_url,
        "--to-dir", "./schema.sql",
        *PG_SCHEMA_DIFF_OPTIONS,
    ], stdout=subprocess.PIPE, check=True)
    p = clean_sql(p.stdout.decode())
    if p.strip() == "":
        print("No changes")
        exit(0)
    with open(f"migrations/{prefix_str}.up.sql", "w") as f:
        f.write(p)

    p = subprocess.run([
        "pg-schema-diff", "plan",
        "--from-dir", "./schema.sql",
        "--to-dsn", db_url,
        *PG_SCHEMA_DIFF_OPTIONS,
    ], stdout=subprocess.PIPE, check=True)
    p = clean_sql(p.stdout.decode())
    assert p.strip() != ""
    with open(f"migrations/{prefix_str}.down.sql", "w") as f:
        f.write(p)