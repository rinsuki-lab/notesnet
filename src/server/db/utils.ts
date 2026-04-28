import { DrizzleQueryError } from "drizzle-orm";

type ConstraintError = DrizzleQueryError & { cause: { constraint: string } };

export function isConstraintError(error: unknown): error is ConstraintError {
    if (!(error instanceof DrizzleQueryError)) return false
    if (error.cause == null) return false
    if (!("constraint" in error.cause)) return false
    return typeof error.cause.constraint === "string"
}