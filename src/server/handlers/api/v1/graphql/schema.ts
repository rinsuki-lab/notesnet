import { db } from "../../../../db/index.ts"
import { makeNotesWhereQueryObjectFromAuthorizedResult } from "../../../../extractors/access_token.ts"
import { builder } from "./builder.ts"
import { Note } from "./types/note.ts"
import { Viewer } from "./types/viewer.ts"

import "./mutation/index.ts"
import "./query/index.ts"

export const schema = builder.toSchema()