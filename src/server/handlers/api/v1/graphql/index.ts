import { createYoga } from "graphql-yoga"
import { Hono } from "hono"

import { authorize } from "../../../../extractors/access_token.ts"
import { type OurContext } from "./builder.ts"
import { schema } from "./schema.ts"

const yoga = createYoga<OurContext, {}>({
    schema,
})

const router = new Hono()
router.post("/", authorize(true), async c => {
    return await yoga({
        request: c.req.raw,
        authorized: c.var.authorized,
    })
})

export default router
