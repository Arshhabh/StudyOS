# Deploy StudyOS

## 1. Configure Supabase

Create a Supabase project, then run the three SQL migrations in filename order in its SQL Editor. With an authenticated Supabase CLI, the equivalent workflow is:

```sh
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The migrations create all 14 study-domain tables, indexes, Auth ownership constraints, row-level access policies, the private `study-files` bucket, and the record-write RPC. The second migration adds an assistant usage counter. The third adds indexed sequence numbers and the incremental sync feed.

Copy `.env.example` to `.env.local` for development. Set the project URL in `NEXT_PUBLIC_SUPABASE_URL` and the publishable key or legacy anon key in `NEXT_PUBLIC_SUPABASE_ANON_KEY`. These two values are public client configuration. Keep the service-role key, provider secrets, and database credentials on the server.

## 2. Enable Google and GitHub login

In Supabase Authentication, enable the desired providers and save their OAuth client credentials. Register the callback address displayed by Supabase in the corresponding Google or GitHub OAuth application.

Set the Supabase Site URL to your deployed StudyOS origin. Add the development and production origins to the redirect allow list. StudyOS returns to the app origin after sign-in and the browser client restores the session. [Google setup](https://supabase.com/docs/guides/auth/social-sign-in/auth-google) · [GitHub setup](https://supabase.com/docs/guides/auth/social-sign-in/auth-github) · [Redirect URL configuration](https://supabase.com/docs/guides/auth/redirect-urls)

The browser keeps guest and signed-in caches under separate owner keys. A fresh personal workspace starts empty. To transfer selected guest data, export a JSON backup before signing in and import it in Settings. Upload any device-local attachments again before using them from another device.

## 3. Enable the AI study assistant

Deploy the included function:

```sh
supabase functions deploy study-assistant
```

Set `STUDY_AI_KEY` in the Supabase Edge Function secrets dashboard. Optionally set `STUDY_AI_MODEL` to a chat-completions model available to your account. The default is `gpt-4o-mini`.

The function validates the session with Supabase Auth, checks a 30-request hourly account quota, and sends the student's question plus a bounded list of academic deadlines to the configured model. Provider failures leave the local planner available. The client labels each answer with its source. [Edge Function authorization](https://supabase.com/docs/guides/functions/auth-headers)

## 4. Deploy to Vercel

1. Place the StudyOS project source and lockfile in a Git repository and import it into your Vercel workspace.
2. Use the directory containing `package.json` as the project root. Select Node.js 24. Enable Corepack when necessary to honor the pinned pnpm version.
3. Add the two `NEXT_PUBLIC_SUPABASE_*` variables to the Vercel environments that need cloud access.
4. Deploy with the supplied `vercel.json`. The build command is `pnpm run build` and the output directory is `out`. The post-build step generates `sw.js` and its asset precache from the finished export.
5. Add the resulting HTTPS origin to Supabase's redirect allow list. Rebuild after changing the public environment variables.

Local guest mode also deploys without Supabase variables. A first successful online load and service-worker installation prepare the app for offline use. Signed-in record changes queue locally and upload after reconnection. File uploads, OAuth, and AI generation require connectivity.

## Backend contracts

| Endpoint                               | Purpose                                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `GET /rest/v1/{table}`                 | Read owned records in pages. The browser includes a Supabase user JWT and the public project key. |
| `POST /rest/v1/rpc/save_study_records` | Atomically insert or update a batch of typed entries supplied in the JSON field `items`.          |
| `POST /functions/v1/study-assistant`   | Accept `prompt` and `context` strings from a signed-in student and return an `answer`.            |
| Supabase Auth OAuth endpoints          | Exchange provider credentials and manage the browser session through the Supabase client.         |
| Supabase Storage API                   | Upload or download private files under `study-files/{user-id}/{file-id}`.                         |

Each domain table stores an immutable UUID, an authenticated owner, a typed JSONB record, a monotonic integer version, and a timestamp. Domain fields are defined in `lib/model.ts`. The database indexes owner/date, enforces one active profile per owner and one active habit log per habit/day, and uses Auth foreign keys for account deletion.

The browser retrieves changes through the authenticated read_study_changes RPC in pages of 500, ordered by a database sequence. Each request advances its cursor after merging the page. A new record sends version 0. An update supplies the last acknowledged version. The RPC checks ownership and version, locks the account's write transaction, and returns the committed versions. An exact retry returns the existing version. A stale edit rolls back the batch. Settings lets the user compare conflicting records and choose a copy. Deletion uses a tombstone so previously offline devices receive it.

Prisma maps these PostgreSQL tables for server-side use. Set `DATABASE_URL` only in the environment of a trusted Prisma process. Use the supplied SQL migrations for schema installation because they include Auth, storage policies, expression indexes, and database functions that Prisma’s model file cannot express.

## Production smoke check

- Sign in through each enabled provider. Create a record, upload an assignment file, and verify that a second browser session for the same student can read both.
- Use a separate student account to confirm that its workspace starts empty. Review the embedded database ownership test when changing the write API.
- Install the PWA, visit it online once, then reload offline. Complete a task offline and confirm cloud sync after reconnecting.
- Start a short custom focus session and verify the break transition, history entry, and daily study total.
- Submit a study-assistant question and check the answer source. Verify the print layout and CSV export with representative student data.
