const http = require('http');
const { URL } = require('url');
const fs = require('fs');

const path = require('path');

const fetchFn = global.fetch ? (...args) => global.fetch(...args) : null;

const DEFAULT_API_VERSION = '2024-01';
const PORT = process.env.PORT ? Number(process.env.PORT) : 4001;
const rawMaxPages = process.env.SHOPIFY_MAX_PAGES ? Number(process.env.SHOPIFY_MAX_PAGES) : undefined;
const MAX_PAGES = Number.isFinite(rawMaxPages) && rawMaxPages > 0 ? rawMaxPages : 15;

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }
  const contents = fs.readFileSync(envPath, 'utf8');
  contents.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }
    const [key, ...rest] = trimmed.split('=');
    if (!key) {
      return;
    }
    const value = rest.join('=').trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  });
}

loadEnvFile();

function normalizeDomain(input) {
  if (!input) {
    return '';
  }
  return input
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '')
    .trim();
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(body);
}

function parseDateValue(value, endOfDay = false) {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  if (endOfDay) {
    date.setUTCHours(23, 59, 59, 999);
  }
  return date.toISOString();
}

function extractNextPage(linkHeader) {
  if (!linkHeader) {
    return null;
  }
  const segments = linkHeader.split(',');
  for (const segment of segments) {
    const [rawUrl, relPart] = segment.split(';').map((part) => part && part.trim());
    if (!rawUrl || !relPart || relPart !== 'rel="next"') {
      continue;
    }
    const match = rawUrl.match(/<([^>]+)>/);
    if (!match) {
      continue;
    }
    try {
      const nextUrl = new URL(match[1]);
      return nextUrl.searchParams.get('page_info');
    } catch (error) {
      return null;
    }
  }
  return null;
}

async function fetchOrdersFromShopify({
  shopDomain,
  accessToken,
  apiVersion,
  startDate,
  endDate,
  financialStatus,
  fulfillmentStatus,
}) {
  const domain = normalizeDomain(shopDomain);
  if (!domain) {
    throw new Error('Invalid shop domain');
  }
  if (!accessToken) {
    throw new Error('Missing Admin API access token');
  }
  const version = apiVersion || DEFAULT_API_VERSION;
  const baseUrl = new URL(`https://${domain}/admin/api/${version}/orders.json`);
  baseUrl.searchParams.set('status', 'any');
  baseUrl.searchParams.set('limit', '250');
  baseUrl.searchParams.set(
    'fields',
    'id,name,created_at,customer,total_price,currency,financial_status,fulfillment_status,line_items'
  );
  const startIso = parseDateValue(startDate);
  const endIso = parseDateValue(endDate, true);
  if (startIso) {
    baseUrl.searchParams.set('created_at_min', startIso);
  }
  if (endIso) {
    baseUrl.searchParams.set('created_at_max', endIso);
  }
  if (financialStatus && financialStatus !== 'any') {
    baseUrl.searchParams.set('financial_status', financialStatus);
  }
  if (fulfillmentStatus && fulfillmentStatus !== 'any') {
    baseUrl.searchParams.set('fulfillment_status', fulfillmentStatus);
  }

  const orders = [];
  let pageInfo = null;
  let pagesFetched = 0;
  let nextPageAvailable = false;

  while (pagesFetched < MAX_PAGES) {
    const pageUrl = new URL(baseUrl.toString());
    if (pageInfo) {
      pageUrl.searchParams.set('page_info', pageInfo);
    }

    if (!fetchFn) {
      throw new Error('Fetch API is unavailable in this Node runtime.');
    }
    const response = await fetchFn(pageUrl, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Shopify API request failed with status ${response.status}`);
    }

    const payload = await response.json();
    orders.push(...(payload.orders || []));
    const linkHeader = response.headers.get('link');
    const next = extractNextPage(linkHeader);
    pagesFetched += 1;
    if (!next) {
      nextPageAvailable = false;
      break;
    }
    pageInfo = next;
    nextPageAvailable = true;
  }

  return { orders, hasMore: nextPageAvailable };
}

async function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 5 * 1024 * 1024) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        const json = JSON.parse(raw);
        resolve(json);
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', (error) => reject(error));
  });
}

function getEnvDefaults() {
  const defaults = {
    shopDomain: process.env.SHOPIFY_SHOP_DOMAIN || '',
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN || '',
    apiVersion: process.env.SHOPIFY_API_VERSION || DEFAULT_API_VERSION,
    sizeOptionIndex: process.env.SHOPIFY_SIZE_OPTION_INDEX
      ? Number(process.env.SHOPIFY_SIZE_OPTION_INDEX)
      : undefined,
  };
  if (Number.isNaN(defaults.sizeOptionIndex)) {
    defaults.sizeOptionIndex = undefined;
  }
  return defaults;
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  if (pathname === '/api/shopify/defaults' && req.method === 'GET') {
    const defaults = getEnvDefaults();
    sendJson(res, 200, defaults);
    return;
  }

  if (pathname === '/api/shopify/orders' && req.method === 'POST') {
    try {
      const body = await readRequestBody(req);
      const { orders, hasMore } = await fetchOrdersFromShopify({
        shopDomain: body.shopDomain || process.env.SHOPIFY_SHOP_DOMAIN,
        accessToken: body.accessToken || process.env.SHOPIFY_ACCESS_TOKEN,
        apiVersion: body.apiVersion || process.env.SHOPIFY_API_VERSION,
        startDate: body.startDate,
        endDate: body.endDate,
        financialStatus: body.financialStatus,
        fulfillmentStatus: body.fulfillmentStatus,
      });
      sendJson(res, 200, { orders, hasMore });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Shopify proxy listening on http://localhost:${PORT}`);
});
