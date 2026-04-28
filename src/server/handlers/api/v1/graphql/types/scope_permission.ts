import { scopePermissionsKeys } from "../../../../../db/schema.ts";
import { builder } from "../builder.ts";

export const ScopePermission = builder.simpleObject("ScopePermission", {
    fields: t => {
        const entries = 
        scopePermissionsKeys.map(k => [k, t.boolean({ nullable: false })] as const)
        return Object.fromEntries(entries) as Record<typeof entries[number][0], typeof entries[number][1]>
    }
})
