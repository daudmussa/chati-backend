# WhatsApp Bulk: current status and next steps

## Where the new app lives

- **Railway project:** `whatsapp-bulk` (separate from the existing Chati project)
- **App service:** `whatsapp-bulk`
- **Database:** the `Postgres` service in this project only
- **App URL:** <https://whatsapp-bulk-production-82a5.up.railway.app>
- **Git branch:** `whatsapp-bulk` in `daudmussa/chati-backend`; `main` has been restored to the existing app

The app service builds and serves the React dashboard and API from the same domain. Its UI contains signup/sign-in, Dashboard, Bulk WhatsApp, and Admin/User Management. Health check: <https://whatsapp-bulk-production-82a5.up.railway.app/health>.

## Before using the app

The Railway variables `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, and `BAILEYS_SESSION_ENCRYPTION_KEY` are set for the new service. **The first admin email still needs to be provided and configured.** Send the email address you want to use, then set it in Railway as `INITIAL_ADMIN_EMAIL` on the `whatsapp-bulk` service. If that account has already signed up, the service promotes it on restart; otherwise, sign up with that email after setting the variable. Keep the encryption keys unchanged.

Keep the app service at one replica while Baileys sessions run in that process. The new project has its own Postgres service and must not be pointed at the Chati database.

## Railway variables

These are the app's settings. The Railway project has already been provisioned; only `INITIAL_ADMIN_EMAIL` is pending:

- `DATABASE_URL`: reference the `Postgres` service in this project.
- `JWT_SECRET`: a unique random secret; already set.
- `ENCRYPTION_KEY`: a unique random secret; already set.
- `BAILEYS_SESSION_ENCRYPTION_KEY`: a unique random secret; already set. Keep it unchanged after connections are linked.
- `INITIAL_ADMIN_EMAIL`: the email that receives the first administrator role; **still to be set**.
- `BAILEYS_MAX_CONNECTIONS_PER_USER=5` (optional; five is the default).

If you ever need to replace a key, generate a random value with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Generate separate values for each secret. Do not reuse the existing production project's JWT, database, or Baileys encryption keys.

## First login and number connection

1. Configure `INITIAL_ADMIN_EMAIL` in Railway. Do not sign up with a different address expecting admin access.
2. Open the app URL and create the account using that email. It becomes the first admin.
3. In BBNSMS, use a dedicated monthly US/Canada line for a persistent account—not a one-time OTP activation.
4. Register the number in WhatsApp or WhatsApp Business using the verification SMS shown in BBNSMS.
5. In the app, open **Bulk WhatsApp**, enter the number in international format, and select **Connect number**.
6. In the WhatsApp app registered to that number, open **Linked Devices → Link a Device** and scan the QR shown on the page.
7. Import only recipients who opted in, record where they consented, and save a campaign draft.

## What is ready and what comes next

- Ready: login/signup, role-protected admin user list, dashboard, contact imports, opt-out suppression, Baileys QR connection/status/disconnect, and text/image campaign drafts.
- Not ready: campaign sending. Drafts do **not** send messages.
- Next development step: add a one-recipient text/image test send to an opted-in contact, verify the connected line and status handling, then build the paced campaign queue with pause/stop and per-recipient results.

The existing Chati Railway project and database remain separate and have been restored; this app deploys from the `whatsapp-bulk` branch into the new project.
