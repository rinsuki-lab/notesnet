import { Hono } from "hono";

import graphqlRouter from "./graphql/index.ts";

const router = new Hono()

router.route("/graphql", graphqlRouter)

export default router