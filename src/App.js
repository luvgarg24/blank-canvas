import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

const DEFAULT_API_VERSION = '2024-01';
const FINANCIAL_STATUS_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'authorized', label: 'Authorized' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'partially_paid', label: 'Partially paid' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'partially_refunded', label: 'Partially refunded' },
  { value: 'voided', label: 'Voided' },
];

const FULFILLMENT_STATUS_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'unfulfilled', label: 'Unfulfilled' },
  { value: 'partial', label: 'Partially fulfilled' },
  { value: 'restocked', label: 'Restocked' },
];

function formatCurrency(amount, currency) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  } catch (error) {
    return `${amount.toFixed(2)} ${currency || ''}`.trim();
  }
}

function buildReport(orders, sizeOptionIndex) {
  const productMap = new Map();
  const orderIds = new Set();
  let totalRevenue = 0;
  let totalUnits = 0;

  orders.forEach((order) => {
    if (!order || !order.id) {
      return;
    }
    orderIds.add(order.id);
    const orderRevenue = parseFloat(order.total_price ?? '0');
    if (!Number.isNaN(orderRevenue)) {
      totalRevenue += orderRevenue;
    }

    (order.line_items || []).forEach((item) => {
      if (!item) {
        return;
      }
      const productKey = item.product_id || `manual-${item.title}`;
      const existingProduct = productMap.get(productKey) || {
        key: productKey,
        productId: item.product_id,
        title: item.title || 'Untitled product',
        vendor: item.vendor || '',
        totalQuantity: 0,
        totalRevenue: 0,
        orderIds: new Set(),
        variants: new Map(),
      };

      const itemPrice = parseFloat(item.price ?? '0');
      const lineRevenue = Number.isNaN(itemPrice) ? 0 : itemPrice * (item.quantity || 0);
      existingProduct.totalQuantity += item.quantity || 0;
      existingProduct.totalRevenue += lineRevenue;
      existingProduct.orderIds.add(order.id);
      totalUnits += item.quantity || 0;

      const variantKey = item.variant_id || `${item.title}-${item.variant_title || 'default'}`;
      const existingVariant = existingProduct.variants.get(variantKey) || {
        key: variantKey,
        variantId: item.variant_id,
        title: item.variant_title || 'Default variant',
        sku: item.sku || '',
        option1: item.option1 || '',
        option2: item.option2 || '',
        option3: item.option3 || '',
        totalQuantity: 0,
        totalRevenue: 0,
        orderIds: new Set(),
      };

      existingVariant.totalQuantity += item.quantity || 0;
      existingVariant.totalRevenue += lineRevenue;
      existingVariant.orderIds.add(order.id);
      existingProduct.variants.set(variantKey, existingVariant);
      productMap.set(productKey, existingProduct);
    });
  });

  const productSummaries = Array.from(productMap.values())
    .map((product) => ({
      ...product,
      orderCount: product.orderIds.size,
      variants: Array.from(product.variants.values()).map((variant) => ({
        ...variant,
        orderCount: variant.orderIds.size,
      })),
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  const sizeSummaries = [];
  if (sizeOptionIndex >= 1 && sizeOptionIndex <= 3) {
    const optionKey = `option${sizeOptionIndex}`;
    const sizeMap = new Map();

    orders.forEach((order) => {
      (order.line_items || []).forEach((item) => {
        const sizeValue = item?.[optionKey];
        if (!sizeValue) {
          return;
        }
        const normalizedValue = String(sizeValue).trim();
        if (!normalizedValue) {
          return;
        }
        const sizeEntry = sizeMap.get(normalizedValue) || {
          value: normalizedValue,
          totalQuantity: 0,
          totalRevenue: 0,
        };
        const itemPrice = parseFloat(item.price ?? '0');
        const lineRevenue = Number.isNaN(itemPrice) ? 0 : itemPrice * (item.quantity || 0);
        sizeEntry.totalQuantity += item.quantity || 0;
        sizeEntry.totalRevenue += lineRevenue;
        sizeMap.set(normalizedValue, sizeEntry);
      });
    });

    sizeMap.forEach((entry) => {
      sizeSummaries.push(entry);
    });
    sizeSummaries.sort((a, b) => b.totalQuantity - a.totalQuantity);
  }

  const currency = orders[0]?.currency || '';

  return {
    productSummaries,
    sizeSummaries,
    metrics: {
      totalOrders: orderIds.size,
      totalUnits,
      totalRevenue,
      averageOrderValue: orderIds.size ? totalRevenue / orderIds.size : 0,
      currency,
    },
  };
}

function downloadCsv(rows, headers, filename) {
  if (!rows.length) {
    return;
  }
  const csvContent = [
    headers.map((header) => header.label).join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const raw = row[header.key];
          if (raw === null || raw === undefined) {
            return '';
          }
          const safe = typeof raw === 'string' ? raw : String(raw);
          return `"${safe.replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function App() {
  const [shopDomain, setShopDomain] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [apiVersion, setApiVersion] = useState(DEFAULT_API_VERSION);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [financialStatus, setFinancialStatus] = useState('any');
  const [fulfillmentStatus, setFulfillmentStatus] = useState('any');
  const [sizeOptionIndex, setSizeOptionIndex] = useState(1);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [selectedProductKey, setSelectedProductKey] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [hasMoreResults, setHasMoreResults] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadDefaults() {
      try {
        const response = await fetch('/api/shopify/defaults');
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        if (cancelled) {
          return;
        }
        if (data.shopDomain) {
          setShopDomain(data.shopDomain);
        }
        if (data.accessToken) {
          setAccessToken(data.accessToken);
        }
        if (data.apiVersion) {
          setApiVersion(data.apiVersion);
        }
        if (typeof data.sizeOptionIndex === 'number' && !Number.isNaN(data.sizeOptionIndex)) {
          setSizeOptionIndex(data.sizeOptionIndex);
        }
      } catch (error) {
        // no-op: defaults are optional
      }
    }
    loadDefaults();
    return () => {
      cancelled = true;
    };
  }, []);

  const report = useMemo(() => buildReport(orders, sizeOptionIndex), [orders, sizeOptionIndex]);

  const handleFetchOrders = async (event) => {
    event.preventDefault();
    if (!shopDomain || !accessToken) {
      setError('Shop domain and Admin API access token are required.');
      return;
    }

    setLoading(true);
    setError('');
    setOrders([]);
    setSelectedProductKey(null);
    setHasFetched(false);
    setHasMoreResults(false);

    try {
      const response = await fetch('/api/shopify/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopDomain,
          accessToken,
          apiVersion,
          startDate,
          endDate,
          financialStatus,
          fulfillmentStatus,
        }),
      });

      if (!response.ok) {
        const raw = await response.text();
        let errorMessage = 'Failed to fetch orders from Shopify';
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed.error === 'string') {
              errorMessage = parsed.error;
            } else {
              errorMessage = raw;
            }
          } catch (parseError) {
            errorMessage = raw;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setOrders(data.orders || []);
      setHasMoreResults(Boolean(data.hasMore));
      setLastFetchedAt(new Date());
    } catch (fetchError) {
      setError(fetchError.message || 'Unexpected error fetching orders');
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  };

  const handleExportProducts = () => {
    const productRows = report.productSummaries.map((product) => ({
      title: product.title,
      vendor: product.vendor,
      totalQuantity: product.totalQuantity,
      totalRevenue: product.totalRevenue.toFixed(2),
      orderCount: product.orderCount,
    }));

    downloadCsv(
      productRows,
      [
        { key: 'title', label: 'Product' },
        { key: 'vendor', label: 'Vendor' },
        { key: 'totalQuantity', label: 'Units Sold' },
        { key: 'totalRevenue', label: 'Gross Sales' },
        { key: 'orderCount', label: 'Orders' },
      ],
      'shopify-product-summary.csv'
    );
  };

  const handleExportVariants = () => {
    const variantRows = report.productSummaries.flatMap((product) =>
      product.variants.map((variant) => ({
        product: product.title,
        variant: variant.title,
        sku: variant.sku,
        option1: variant.option1,
        option2: variant.option2,
        option3: variant.option3,
        totalQuantity: variant.totalQuantity,
        totalRevenue: variant.totalRevenue.toFixed(2),
        orderCount: variant.orderCount,
      }))
    );

    downloadCsv(
      variantRows,
      [
        { key: 'product', label: 'Product' },
        { key: 'variant', label: 'Variant' },
        { key: 'sku', label: 'SKU' },
        { key: 'option1', label: 'Option 1' },
        { key: 'option2', label: 'Option 2' },
        { key: 'option3', label: 'Option 3' },
        { key: 'totalQuantity', label: 'Units Sold' },
        { key: 'totalRevenue', label: 'Gross Sales' },
        { key: 'orderCount', label: 'Orders' },
      ],
      'shopify-variant-summary.csv'
    );
  };

  return (
    <div className="App">
      <header className="app-header">
        <div>
          <h1>Shopify Order Reporter</h1>
          <p>Generate per-product and per-variant insights from your Shopify orders without leaving your computer.</p>
        </div>
        {lastFetchedAt && (
          <div className="last-updated" title={lastFetchedAt.toLocaleString()}>
            Last sync: {lastFetchedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </header>

      <main className="app-content">
        <section className="panel">
          <h2>Connect to Shopify</h2>
          <p className="section-subtitle">
            Use an Admin API access token from a private app. Credentials stay in your browser and are only sent to your local server.
          </p>
          <form className="connection-form" onSubmit={handleFetchOrders}>
            <div className="form-grid">
              <label>
                Shop domain
                <input
                  type="text"
                  placeholder="example.myshopify.com"
                  value={shopDomain}
                  onChange={(event) => setShopDomain(event.target.value)}
                  required
                />
              </label>
              <label>
                Admin API access token
                <div className="token-input">
                  <input
                    type={showToken ? 'text' : 'password'}
                    placeholder="shpat_..."
                    value={accessToken}
                    onChange={(event) => setAccessToken(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => setShowToken((prev) => !prev)}
                  >
                    {showToken ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>
              <label>
                API version
                <input
                  type="text"
                  value={apiVersion}
                  onChange={(event) => setApiVersion(event.target.value)}
                />
              </label>
              <label>
                Start date
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </label>
              <label>
                End date
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </label>
              <label>
                Financial status
                <select value={financialStatus} onChange={(event) => setFinancialStatus(event.target.value)}>
                  {FINANCIAL_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Fulfillment status
                <select value={fulfillmentStatus} onChange={(event) => setFulfillmentStatus(event.target.value)}>
                  {FULFILLMENT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Size option position
                <select value={sizeOptionIndex} onChange={(event) => setSizeOptionIndex(Number(event.target.value))}>
                  <option value={1}>Option 1</option>
                  <option value={2}>Option 2</option>
                  <option value={3}>Option 3</option>
                </select>
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Fetching orders…' : 'Fetch orders'}
              </button>
            </div>
          </form>
          {error && <div className="error-banner">{error}</div>}
        </section>

        {!loading && hasFetched && !error && orders.length === 0 && (
          <section className="panel empty-state">
            <h2>No orders found</h2>
            <p className="section-subtitle">Adjust your filters or confirm that the store has orders for the selected range.</p>
          </section>
        )}

        {loading && <div className="loading">Loading Shopify orders…</div>}

        {!loading && orders.length > 0 && (
          <>
            <section className="panel metrics-panel">
              <div className="metric-card">
                <span className="metric-label">Orders</span>
                <span className="metric-value">{report.metrics.totalOrders}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Units sold</span>
                <span className="metric-value">{report.metrics.totalUnits}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Gross sales</span>
                <span className="metric-value">{formatCurrency(report.metrics.totalRevenue, report.metrics.currency)}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Avg. order value</span>
                <span className="metric-value">{formatCurrency(report.metrics.averageOrderValue, report.metrics.currency)}</span>
              </div>
            </section>

            {hasMoreResults && (
              <div className="warning-banner">
                Showing only the first {orders.length} orders. Increase `SHOPIFY_MAX_PAGES` on the proxy server to sync a wider history.
              </div>
            )}

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Product performance</h2>
                  <p className="section-subtitle">Click a product to view variant level and size-level sales.</p>
                </div>
                <div className="panel-actions">
                  <button type="button" onClick={handleExportProducts}>
                    Export products CSV
                  </button>
                  <button type="button" onClick={handleExportVariants}>
                    Export variants CSV
                  </button>
                </div>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Vendor</th>
                      <th className="numeric">Orders</th>
                      <th className="numeric">Units</th>
                      <th className="numeric">Gross sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.productSummaries.map((product) => {
                      const isSelected = selectedProductKey === product.key;
                      return (
                        <React.Fragment key={product.key}>
                          <tr
                            className={`clickable-row ${isSelected ? 'selected' : ''}`}
                            onClick={() => setSelectedProductKey(isSelected ? null : product.key)}
                          >
                            <td>
                              <div className="product-name">{product.title}</div>
                              <div className="product-meta">{product.variants.length} variants</div>
                            </td>
                            <td>{product.vendor || '—'}</td>
                            <td className="numeric">{product.orderCount}</td>
                            <td className="numeric">{product.totalQuantity}</td>
                            <td className="numeric">{formatCurrency(product.totalRevenue, report.metrics.currency)}</td>
                          </tr>
                          {isSelected && (
                            <tr className="variant-row">
                              <td colSpan={5}>
                                <div className="variant-section">
                                  <h3>Variant breakdown</h3>
                                  <div className="table-wrapper">
                                    <table className="inner-table">
                                      <thead>
                                        <tr>
                                          <th>Variant</th>
                                          <th>SKU</th>
                                          <th>Option 1</th>
                                          <th>Option 2</th>
                                          <th>Option 3</th>
                                          <th className="numeric">Orders</th>
                                          <th className="numeric">Units</th>
                                          <th className="numeric">Gross sales</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {product.variants.map((variant) => (
                                          <tr key={variant.key}>
                                            <td>{variant.title}</td>
                                            <td>{variant.sku || '—'}</td>
                                            <td>{variant.option1 || '—'}</td>
                                            <td>{variant.option2 || '—'}</td>
                                            <td>{variant.option3 || '—'}</td>
                                            <td className="numeric">{variant.orderCount}</td>
                                            <td className="numeric">{variant.totalQuantity}</td>
                                            <td className="numeric">{formatCurrency(variant.totalRevenue, report.metrics.currency)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  {report.sizeSummaries.length > 0 && (
                                    <div className="size-summary">
                                      <h3>Size summary across all products (Option {sizeOptionIndex})</h3>
                                      <div className="table-wrapper">
                                        <table className="inner-table">
                                          <thead>
                                            <tr>
                                              <th>Value</th>
                                              <th className="numeric">Units</th>
                                              <th className="numeric">Gross sales</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {report.sizeSummaries.map((size) => (
                                              <tr key={size.value}>
                                                <td>{size.value}</td>
                                                <td className="numeric">{size.totalQuantity}</td>
                                                <td className="numeric">{formatCurrency(size.totalRevenue, report.metrics.currency)}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {hasMoreResults && (
              <div className="warning-banner">
                Showing only the first {orders.length} orders. Increase `SHOPIFY_MAX_PAGES` on the proxy server to sync a wider history.
              </div>
            )}

            <section className="panel">
              <h2>Recent orders</h2>
              <p className="section-subtitle">Showing the first {Math.min(orders.length, 25)} of {orders.length} orders pulled from Shopify.</p>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Status</th>
                      <th className="numeric">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 25).map((order) => (
                      <tr key={order.id}>
                        <td>{order.name}</td>
                        <td>{order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}</td>
                        <td>
                          {order.customer
                            ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() || order.customer.email || '—'
                            : '—'}
                        </td>
                        <td>
                          {order.fulfillment_status || 'Unfulfilled'} · {order.financial_status || 'Unknown'}
                        </td>
                        <td className="numeric">{formatCurrency(parseFloat(order.total_price || '0'), order.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
