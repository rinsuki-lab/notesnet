## 認証

ユーザー認証はアクセストークンを `Authorization: Bearer アクセストークン` の形式でリクエストに入れることで実現する。

### アクセストークンの内部仕様

```
db.access_token.id = uuid_v4()
access_token = db.access_token.id + "." + hex(random_bytes(32))
db.access_token.hashed_secret = sha256(access_token)

authorization_header = "Bearer " + access_token
```
