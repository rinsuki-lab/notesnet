import { builder } from "./builder.ts"
import "./mutation/index.ts"
import "./query/index.ts"

export const schema = builder.toSchema()
