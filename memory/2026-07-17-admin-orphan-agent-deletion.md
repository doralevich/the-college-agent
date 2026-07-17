# Debug report: admin orphan-agent deletion

- **Symptom:** Deleting an admin-listed agent that was already absent from Agent37 appeared to succeed or did nothing, leaving its Supabase row and keeping workspace deletion disabled.
- **Root cause:** `requireAgentAccess` authorized platform admins cross-tenant with the service-role client, but returned the user-scoped Supabase client. The DELETE route then used that RLS-scoped client against a workspace the operator did not belong to. The delete affected zero rows without an error, and the route ignored the result and returned success.
- **Fix:** Platform-admin deletes now use `createAdminClient()`; workspace-admin deletes remain RLS-scoped. Supabase delete errors are checked and returned as `db_error` instead of false success. Agent37 `not_found`/404 remains an idempotent cleanup path.
- **Evidence:** `tests/unit/agent-delete-route.test.ts` failed twice before the fix and passes after it. The missing-upstream case verifies the service client is used; the database-error case verifies a 500 response. Production `next build` passes.
- **Regression test:** `tests/unit/agent-delete-route.test.ts`
- **Related:** Commit `e60f8cb` added the correct upstream 404 handling but did not address the cross-tenant RLS client or unchecked delete result.
- **Status:** DONE_WITH_CONCERNS — the fix is verified, but the existing repository-wide suite still has two unrelated stale hosting-shape expectations and pre-existing lint failures in untouched files.
