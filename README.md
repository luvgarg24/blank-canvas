# Shopify Order Reporter

A lightweight local dashboard for analysing Shopify orders by product, variant, and size. Enter your shop credentials, select a date range, and download CSV summaries for deeper analysis.

## Features

- Pull Shopify orders directly with your Admin API access token.
- View headline metrics such as orders, gross sales, and average order value.
- Inspect product performance with drill-downs into variant sales, SKU totals, and configurable size summaries.
- Export product and variant reports to CSV for spreadsheets or further reporting.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the local API proxy (runs on port 4001 by default):

   ```bash
   npm run api
   ```

3. In a separate terminal, start the React application:

   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) and provide:
   - **Shop domain** (e.g. `your-store.myshopify.com`)
   - **Admin API access token** generated from a private/custom app with read access to Orders and Products
   - Optional filters for date range, financial status, and fulfilment status

### Environment variables

The proxy server only forwards requests to Shopify and does not store credentials. If you prefer to avoid typing your access token each time, you can create a local `.env` file at the project root:

```
SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxx
SHOPIFY_API_VERSION=2024-01
SHOPIFY_SIZE_OPTION_INDEX=1
SHOPIFY_MAX_PAGES=15
```

When these variables are present they act as defaults for the UI (you can still override them per session). Increase `SHOPIFY_MAX_PAGES` if you need to download more than ~3,750 orders (250 orders × number of pages).

### Production build

Create an optimised production bundle with:

```bash
npm run build
```

The built assets will be emitted into the `build` directory.

## Security notes

- Keep your Admin API access token private. Treat it like a password.
- The local proxy is designed for development use on your machine. Do not deploy it without adding authentication and HTTPS.
