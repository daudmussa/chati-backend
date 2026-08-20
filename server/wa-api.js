// WhatsApp Business Cloud API (Meta) adapter
// Replaces Twilio webhook + send with direct Graph API calls

export const GRAPH_API_VERSION = 'v25.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Parse a Meta webhook POST body into the normalized format the rest of the
 * system expects: { from, to, body, type(optional) }
 * Returns null if the payload doesn't look like a WhatsApp webhook.
 */
export function parseMetaWebhook(body) {
  if (!body || body.object !== 'whatsapp_business_account') return null;

  const entry = body.entry?.[0];
  if (!entry) return null;

  const change = entry.changes?.[0];
  if (!change) return null;

  const value = change.value;
  if (!value || value.messaging_product !== 'whatsapp') return null;

  const messages = value.messages;
  if (!messages?.[0]) return null;

  const msg = messages[0];
  const from = msg.from;
  const to = value.metadata?.display_phone_number || value.metadata?.phone_number_id;
  let bodyText = '';

  if (msg.type === 'text') {
    bodyText = msg.text?.body || '';
  } else if (msg.type === 'interactive') {
    const interactive = msg.interactive;
    if (interactive?.button_reply) {
      bodyText = interactive.button_reply.id || '';
    } else if (interactive?.list_reply) {
      bodyText = interactive.list_reply.id || '';
    }
  } else if (msg.type === 'button') {
    bodyText = msg.button?.text || '';
  } else if (msg.type === 'image') {
    bodyText = msg.image?.caption || '[image]';
  } else if (msg.type === 'document') {
    bodyText = msg.document?.caption || '[document]';
  } else if (msg.type === 'location') {
    const loc = msg.location;
    bodyText = `[location: ${loc?.latitude},${loc?.longitude}]`;
  } else {
    bodyText = `[${msg.type}]`;
  }

  const result = {
    from: `whatsapp:${from}`,
    to: to ? `whatsapp:${to}` : '',
    body: bodyText,
    type: msg.type,
    metaPhoneNumberId: value.metadata?.phone_number_id,
    metaBusinessAccountId: entry.id,
    metaMessageId: msg.id,
  };

  console.log('[wa-api] Parsed webhook:', {
    from: result.from,
    to: result.to,
    body: result.body?.substring(0, 100),
    type: result.type,
  });

  return result;
}

/**
 * Handle the GET webhook verification challenge from Meta.
 * Validates hub.mode=subscribe and hub.verify_token against the configured token.
 * Returns an object with the challenge string if valid, null otherwise.
 */
export function verifyWebhook(query, expectedToken) {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = query;

  if (mode === 'subscribe' && token && challenge) {
    console.log('[wa-api] Webhook verification: mode=%s token=%s...', mode, token?.substring(0, 10));

    if (expectedToken && token !== expectedToken) {
      console.error('[wa-api] VERIFY_TOKEN mismatch. Received="%s" Expected="%s..."', token, expectedToken?.substring(0, 10));
      return null;
    }

    console.log('[wa-api] Webhook verified, returning challenge');
    return { challenge };
  }

  console.log('[wa-api] Invalid webhook verification request:', { mode, hasToken: !!token, hasChallenge: !!challenge });
  return null;
}

/**
 * Send a text message via WhatsApp Cloud API.
 */
export async function sendTextMessage({ accessToken, phoneNumberId, to, body }) {
  const url = `${GRAPH_API_BASE}/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body, preview_url: false },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (!response.ok) {
    console.error('[wa-api] Send failed:', {
      status: response.status,
      error: json.error?.message || json.error,
      code: json.error?.code,
    });
    throw new Error(json.error?.message || `HTTP ${response.status}`);
  }

  console.log('[wa-api] Message sent, wa_id:', json.messages?.[0]?.id);
  return json;
}

/**
 * Send a media (image) message via WhatsApp Cloud API.
 */
export async function sendMediaMessage({ accessToken, phoneNumberId, to, type = 'image', link, caption, filename }) {
  const url = `${GRAPH_API_BASE}/${phoneNumberId}/messages`;

  const mediaType = type === 'image' ? 'image' : 'document';

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: mediaType,
    [mediaType]: {
      link,
    },
  };

  if (caption) {
    payload[mediaType].caption = caption;
  }
  if (filename) {
    payload[mediaType].filename = filename;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (!response.ok) {
    console.error('[wa-api] Media send failed:', {
      status: response.status,
      error: json.error?.message || json.error,
      code: json.error?.code,
    });
    throw new Error(json.error?.message || `HTTP ${response.status}`);
  }

  console.log('[wa-api] Media sent, wa_id:', json.messages?.[0]?.id);
  return json;
}

/**
 * Strip whatsapp: prefix from a number for use with Meta's API.
 * Meta expects bare phone numbers without the prefix.
 */
export function normalizeNumber(number) {
  return String(number).replace(/^whatsapp:/, '');
}

/**
 * Exchange an authorization code (returned by Meta's OAuth / Embedded Signup
 * flow) for a customer-scoped Business Integration System User (BISU) access
 * token. Must be called server-side using your app secret.
 */
export async function exchangeCodeForToken({ appId, appSecret, code, redirectUri }) {
  const url = `${GRAPH_API_BASE}/oauth/access_token`;
  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    code,
  });
  if (redirectUri) {
    params.set('redirect_uri', redirectUri);
  }

  const response = await fetch(`${url}?${params.toString()}`, { method: 'GET' });
  const json = await response.json();

  if (!response.ok || !json.access_token) {
    console.error('[wa-api] Token exchange failed:', {
      status: response.status,
      error: json.error?.message || json,
    });
    throw new Error(json.error?.message || `Token exchange failed (HTTP ${response.status})`);
  }

  console.log('[wa-api] Token exchanged successfully');
  return {
    accessToken: json.access_token,
    tokenType: json.token_type,
    expiresIn: json.expires_in,
    dataAccessExpirationTime: json.data_access_expiration_time,
  };
}

/**
 * Inspect a token to find which WABAs / assets it has access to.
 * Reads the `granular_scopes[].target_ids` as ground truth for the WABA IDs.
 */
export async function debugToken({ accessToken, appAccessToken }) {
  const url = `${GRAPH_API_BASE}/debug_token?input_token=${encodeURIComponent(accessToken)}`;
  const headers = appAccessToken ? { 'Authorization': `Bearer ${appAccessToken}` } : {};

  const response = await fetch(url, { method: 'GET', headers });
  const json = await response.json();

  if (!response.ok || !json.data) {
    console.error('[wa-api] debug_token failed:', {
      status: response.status,
      error: json.error?.message || json,
    });
    throw new Error(json.error?.message || `debug_token failed (HTTP ${response.status})`);
  }

  const granularScopes = (json.data.granular_scopes || []).map(s => ({
    scope: s.scope,
    targetIds: s.target_ids || [],
  }));
  const wabaIds = [
    ...new Set(
      granularScopes
        .filter(s => s.scope === 'whatsapp_business_management' || s.scope === 'whatsapp_business_messaging')
        .flatMap(s => s.targetIds)
    ),
  ];

  console.log('[wa-api] debug_token scopes:', granularScopes.map(s => `${s.scope}:${s.targetIds.join(',')}`).join(' | '));
  return { ...json.data, granularScopes, wabaIds };
}

/**
 * Subscribe your app to a customer's WABA so it receives webhooks for it.
 */
export async function subscribeAppToWaba({ wabaId, accessToken }) {
  const url = `${GRAPH_API_BASE}/${wabaId}/subscribed_apps`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  const json = await response.json();

  if (!response.ok) {
    console.error('[wa-api] Subscribe to WABA failed:', {
      status: response.status,
      error: json.error?.message || json,
    });
    throw new Error(json.error?.message || `Subscribe to WABA failed (HTTP ${response.status})`);
  }

  console.log('[wa-api] Subscribed to WABA', wabaId);
  return json;
}

/**
 * Register a customer's business phone number for use with the Cloud API.
 * The `pin` is the two-step verification PIN for the number.
 */
export async function registerPhoneNumber({ phoneNumberId, pin, accessToken }) {
  const url = `${GRAPH_API_BASE}/${phoneNumberId}/register`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messaging_product: 'whatsapp', pin }),
  });
  const json = await response.json();

  if (!response.ok) {
    console.error('[wa-api] Register phone number failed:', {
      status: response.status,
      error: json.error?.message || json,
    });
    throw new Error(json.error?.message || `Register phone number failed (HTTP ${response.status})`);
  }

  console.log('[wa-api] Phone number registered:', phoneNumberId);
  return json;
}

/**
 * List the business phone numbers under a customer's WABA. Used as a fallback
 * to discover the phone_number_id when the signup postMessage omits it.
 */
export async function getPhoneNumbersByWaba({ wabaId, accessToken }) {
  const url = `${GRAPH_API_BASE}/${wabaId}/phone_numbers`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  const json = await response.json();

  if (!response.ok) {
    console.error('[wa-api] Get phone numbers failed:', {
      status: response.status,
      error: json.error?.message || json,
    });
    throw new Error(json.error?.message || `Get phone numbers failed (HTTP ${response.status})`);
  }

  console.log('[wa-api] Found phone numbers for WABA', wabaId, ':', (json.data || []).length);
  return (json.data || []).map(p => ({
    id: p.id,
    displayPhoneNumber: p.display_phone_number,
    verifiedName: p.verified_name,
    qualityRating: p.quality_rating,
    codeVerificationStatus: p.code_verification_status,
  }));
}
