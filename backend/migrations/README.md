# Supabase migration runbook

The numbered SQL files in this directory are the schema source of truth. They are intentionally verified locally before they are applied, but the verification script does **not** connect to Supabase, read credentials, or change a remote project.

## Before applying

1. Confirm the correct Supabase project and take any required backup according to the institution's data policy.
2. From `backend`, run `npm run verify:migrations`. It checks that files are consecutively numbered, non-empty, and safe to apply in filename order.
3. Review the SQL diff and ensure all team members agree on the deployment window. Do not use the mobile client to provision privileged profile membership.

## Apply in Supabase

In the Supabase SQL editor, apply each `.sql` file once, in ascending numeric order, starting at `0000_initial_audits.sql` and ending with the newest file. Stop if a statement fails; resolve the mismatch before running a later migration. Record the project, operator, time, and last successful filename in the team's deployment notes.

## Read-only verification after applying

Run these queries in the SQL editor to confirm the expected database objects exist. They do not modify data:

```sql
select tablename
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles', 'institutions', 'departments', 'subjects', 'teachers', 'predictions', 'reports', 'push_tokens')
order by tablename;

select policyname, tablename
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'departments', 'subjects', 'teachers', 'chat_sessions', 'chat_messages', 'reports')
order by tablename, policyname;

select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'import_roster_rows';
```

Then run the authenticated dashboard, roster-preview, roster-confirmation, and report-download checks against a dedicated demo institution. The optional cross-institution RLS Jest test should be enabled in CI only with dedicated test-user credentials; never commit or print those values.
