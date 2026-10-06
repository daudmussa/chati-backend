# WhatsApp bulk messaging: implementation direction

## Isolated deployment

The `whatsapp-bulk` branch is a standalone WhatsApp Bulk app. Deploy it into its own Railway project with its own PostgreSQL service; it must not share the Chati project/database. One Node service builds and serves the React dashboard and its API. The UI is limited to signup/sign-in, a WhatsApp campaign dashboard, Bulk WhatsApp, and admin user management.

## Provider choice and constraints

- **BBNSMS (`bbnsms.com`) is the number provider you specified.** Its public site lists dedicated US and Canadian lines that receive SMS/calls and says they can verify on WhatsApp. Published floor prices are US local $0.50/month and Canada local $0.65/month, with inbound SMS starting at $0.005/message. It also offers one-time WhatsApp OTP activations, currently listed from $0.56 in the cheapest country shown. Prices and stock are dynamic; confirm the checkout quote.
- These BBNSMS products provide phone numbers and inbound verification codes; they are not a WhatsApp campaign-sending API. Public pages describe buying numbers and reading the inbound SMS inbox in the BBNSMS dashboard. I did not find public API documentation for purchasing numbers or retrieving inbound codes, so assume number procurement and initial verification are manual until BBNSMS confirms an integration API.
- For persistent multi-number connections, use a dedicated monthly line rather than a one-time OTP activation. An activation is for one verification; it is not a durable sender line. Before purchasing multiple lines, confirm with BBNSMS that the selected dedicated number types support creating/maintaining WhatsApp accounts and linking companion devices, and check the inventory for the intended country.
- Baileys links a WhatsApp mobile-app account as a companion device; it is not a WhatsApp Business Platform API or a phone-number provider. The number must first be activated with WhatsApp and be able to receive the registration code. Virtual/SMS-only numbers are not guaranteed to work.
- Baileys is unofficial. Its maintainers explicitly discourage spam and bulk/automated messaging. It does not provide the same provider-confirmed delivery callbacks as a supported business messaging API; a successful send call must not be displayed as “delivered.” Number restrictions, account logout, and breaking protocol changes are operational risks.
- Railway's app filesystem is not suitable for ephemeral per-number session state. The current implementation stores each session's Signal auth data encrypted in PostgreSQL using AES-256-GCM and `BAILEYS_SESSION_ENCRYPTION_KEY`; keep that key stable or existing sessions cannot be decrypted. Baileys documentation recommends a production-grade auth-state store rather than its demo multi-file helper.

## Target architecture

1. **Railway project:** contains this app's Node service and its own PostgreSQL service. The app never uses the original project's `DATABASE_URL`.
2. **Node service:** serves the standalone dashboard/API and owns the long-lived Baileys sessions. Keep it at one replica to avoid duplicate WhatsApp connections. If campaign load later warrants a worker service, add a database lease before running multiple processes.
3. **PostgreSQL:** durable accounts/connections, encrypted Baileys auth state, consent records and opt-outs, campaign drafts/queue, individual attempts, provider message IDs, and reported statuses.
4. **Media:** use existing Bunny storage for publicly reachable image URLs; store the URL on the campaign and send it through the provider adapter.
5. **Provider adapter:** define common connect/status/send-text/send-image/disconnect methods. The Baileys adapter and any approved provider adapter remain separate implementations, so campaign/contact storage is not tied to one vendor.

## Status terminology

Keep “queued,” “submitted/sent,” “delivered,” “read,” and “failed” distinct. For a Baileys connection, only report an actual state when the linked-device protocol returns that signal; do not infer delivery from an accepted send call. Provider-backed routes can map their documented callbacks into the same per-recipient status fields.

## First implementation slice

The standalone UI has login/signup, the WhatsApp dashboard, Bulk WhatsApp, and admin/user management. Contacts require an explicit opt-in confirmation and recorded consent source; opt-outs are suppressed. Baileys QR connection management persists encrypted linked-device sessions in the new project's PostgreSQL. Campaigns remain drafts until the one-recipient text/image test is verified.

## Initial setup

Create the first admin with `INITIAL_ADMIN_EMAIL` set before signup. Store separate stable `JWT_SECRET`, `ENCRYPTION_KEY`, and `BAILEYS_SESSION_ENCRYPTION_KEY` values in the new Railway project's variables. Do not copy the old project's database URL or secrets. All campaign recipients should have explicitly opted in, with consent source recorded; stop/opt-out requests must suppress future sends.
