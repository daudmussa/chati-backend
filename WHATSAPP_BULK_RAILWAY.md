# Standalone WhatsApp Bulk Railway project

This branch is meant to deploy independently of the existing Chati production project.

## Railway layout

- Create a new Railway project, for example **WhatsApp Bulk**.
- Connect the GitHub repository `daudmussa/chati-backend` on the `whatsapp-bulk` branch. Do not connect this project to `main`.
- Add a PostgreSQL service inside this new project and reference its `DATABASE_URL` from the app service.
- Add one app service from the same branch. Its Dockerfile builds the React UI and runs `server.js`; it serves the UI and API on one domain.
- Keep one app replica while Baileys sessions are owned by this process. Do not attach or reuse the existing Chati PostgreSQL service.

## Required app variables

Set these in the new project's app service before inviting users:

- `DATABASE_URL`: reference the PostgreSQL service created in this project.
- `JWT_SECRET`: a unique random secret of at least 32 characters.
- `ENCRYPTION_KEY`: a unique random secret of at least 32 characters.
- `BAILEYS_SESSION_ENCRYPTION_KEY`: a unique random secret of at least 32 characters. Keep it unchanged after connections are linked.
- `INITIAL_ADMIN_EMAIL`: the email that will receive the first administrator role when it signs up.
- `BAILEYS_MAX_CONNECTIONS_PER_USER=5` (optional; five is the default).

Generate a random value with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Generate separate values for each secret. Do not reuse the existing production project's JWT, database, or Baileys encryption keys.

## First login and number connection

1. Deploy the new project's app service and wait for `/health` to report `{"status":"ok"}`.
2. Open the Railway app domain. The app serves the UI from that same domain.
3. Sign up with the email configured in `INITIAL_ADMIN_EMAIL`; that account becomes the first admin.
4. Open **Bulk WhatsApp**, enter a dedicated BBNSMS number, register it in WhatsApp using its verification code, and scan the Baileys QR from **Linked Devices**.

The existing production service/database remain separate. Campaign drafts are not sent until a connected number is tested with an opted-in recipient.
