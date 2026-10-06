# WhatsApp bulk messaging: implementation direction

## Existing deployment

The clone is a React/Vite app served with a Node/Express API. The API already uses Railway PostgreSQL and Bunny storage, so contact lists, campaigns, media URLs, and message outcomes can share the existing backend and database. A sending process should eventually run as a separate Railway worker service using the same repository and database; keep the existing web/API service responsive while campaigns run.

## Provider choice and constraints

- **BBNSMS (`bbnsms.com`) is the number provider you specified.** Its public site lists dedicated US and Canadian lines that receive SMS/calls and says they can verify on WhatsApp. Published floor prices are US local $0.50/month and Canada local $0.65/month, with inbound SMS starting at $0.005/message. It also offers one-time WhatsApp OTP activations, currently listed from $0.56 in the cheapest country shown. Prices and stock are dynamic; confirm the checkout quote.
- These BBNSMS products provide phone numbers and inbound verification codes; they are not a WhatsApp campaign-sending API. Public pages describe buying numbers and reading the inbound SMS inbox in the BBNSMS dashboard. I did not find public API documentation for purchasing numbers or retrieving inbound codes, so assume number procurement and initial verification are manual until BBNSMS confirms an integration API.
- For persistent multi-number connections, use a dedicated monthly line rather than a one-time OTP activation. An activation is for one verification; it is not a durable sender line. Before purchasing multiple lines, confirm with BBNSMS that the selected dedicated number types support creating/maintaining WhatsApp accounts and linking companion devices, and check the inventory for the intended country.
- Baileys links a WhatsApp mobile-app account as a companion device; it is not a WhatsApp Business Platform API or a phone-number provider. The number must first be activated with WhatsApp and be able to receive the registration code. Virtual/SMS-only numbers are not guaranteed to work.
- Baileys is unofficial. Its maintainers explicitly discourage spam and bulk/automated messaging. It does not provide the same provider-confirmed delivery callbacks as a supported business messaging API; a successful send call must not be displayed as “delivered.” Number restrictions, account logout, and breaking protocol changes are operational risks.
- Railway's app filesystem is not suitable for ephemeral per-number session state. The current implementation stores each session's Signal auth data encrypted in PostgreSQL using AES-256-GCM and `BAILEYS_SESSION_ENCRYPTION_KEY`; keep that key stable or existing sessions cannot be decrypted. Baileys documentation recommends a production-grade auth-state store rather than its demo multi-file helper.

## Target architecture

1. **Web app/API:** authenticated users manage connected numbers, opted-in contacts, campaign drafts, and per-recipient results.
2. **PostgreSQL:** durable accounts/connections, encrypted Baileys auth state, consent records and opt-outs, campaign queue, individual attempts, provider message IDs, and reported statuses.
3. **Railway connection manager:** currently runs in the API process and owns the long-lived Baileys sessions. Keep this service at one replica to avoid duplicate WhatsApp connections. When moving to a dedicated worker or multiple replicas, add a database lease so only one process owns each session.
4. **Media:** use existing Bunny storage for publicly reachable image URLs; store the URL on the campaign and send it through the provider adapter.
5. **Provider adapter:** define common connect/status/send-text/send-image/disconnect methods. The Baileys adapter and any approved provider adapter remain separate implementations, so campaign/contact storage is not tied to one vendor.

## Status terminology

Keep “queued,” “submitted/sent,” “delivered,” “read,” and “failed” distinct. For a Baileys connection, only report an actual state when the linked-device protocol returns that signal; do not infer delivery from an accepted send call. Provider-backed routes can map their documented callbacks into the same per-recipient status fields.

## First implementation slice

The backend foundation adds per-user contacts with recorded consent source and opt-out suppression, plus campaign drafts linked only to active opted-in contacts. Baileys QR connection management creates per-user linked-device sessions and persists their encrypted auth state in PostgreSQL. Drafts are not sent yet; next, verify a real BBNSMS line with a one-recipient text/image test before enabling the campaign worker.

## Decisions needed before connecting numbers or enabling sends

1. Confirm whether you intend to buy BBNSMS **dedicated monthly US/Canada lines** (recommended for long-lived linked accounts) or one-time OTP activations.
2. Confirm the intended sender-number country. BBNSMS currently lists dedicated lines only for the US and Canada; its one-time activation inventory spans more countries.
3. Ask BBNSMS whether its dedicated lines support WhatsApp Business/mobile registration and companion-device linking, and whether they offer a private API for provisioning/inbound SMS. The public site does not document that API.
4. Confirm the initial product scope: one workspace (your own use) or campaigns available to all accounts in this clone.

All campaign recipients should have explicitly opted in, with consent source recorded; stop/opt-out requests must suppress future campaign sends.
