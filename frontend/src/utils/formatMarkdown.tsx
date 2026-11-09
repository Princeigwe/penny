import { ReactNode, useEffect, useRef, useState } from "react"

export type ParsedProduct = {
  index?: string
  title: string
  price?: string
  retailer?: string
  inStock?: boolean
  rating?: string
  extra?: string
  imageUrl?: string
  imageAlt?: string
}

/**
 * Modern product card component for Penny chat
 */
export function ProductCard({ product }: { product: ParsedProduct }) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className="penny-product-card">
      <div className="penny-product-thumb">
        {product.imageUrl && !imgError ? (
          <img
            alt={product.imageAlt || product.title}
            loading="lazy"
            onError={() => setImgError(true)}
            src={product.imageUrl}
          />
        ) : (
          <div className="penny-product-thumb-placeholder">
            <svg fill="none" height="22" stroke="currentColor" viewBox="0 0 24 24" width="22">
              <rect height="18" rx="2" strokeWidth="1.5" width="18" x="3" y="3" />
              <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="1.5" />
              <path d="m21 15-5-5L5 21" strokeWidth="1.5" />
            </svg>
            <span>Product</span>
          </div>
        )}
      </div>

      <div className="penny-product-info">
        <div>
          <div className="penny-product-top">
            {product.index && (
              <span className="penny-product-index">#{product.index}</span>
            )}
            {product.inStock && (
              <span className="penny-product-stock">IN STOCK</span>
            )}
            {product.rating && (
              <span className="penny-product-rating">
                ★ {product.rating}
              </span>
            )}
          </div>

          <h4 className="penny-product-title" title={product.title}>
            {product.title}
          </h4>
        </div>

        <div>
          <div className="penny-product-meta">
            {product.price && (
              <span className="penny-product-price">{product.price}</span>
            )}
            {product.retailer && (
              <span className="penny-product-retailer">
                at <strong>{product.retailer}</strong>
              </span>
            )}
          </div>

          {product.extra && (
            <p className="penny-product-extra">{product.extra}</p>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Horizontal scrolling carousel for Penny search results with smooth nav arrows
 */
export function ProductCarousel({ products }: { products: ParsedProduct[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 8)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }

  useEffect(() => {
    updateScrollState()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener("scroll", updateScrollState, { passive: true })
    window.addEventListener("resize", updateScrollState)
    return () => {
      el.removeEventListener("scroll", updateScrollState)
      window.removeEventListener("resize", updateScrollState)
    }
  }, [products])

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return
    const offset = direction === "left" ? -240 : 240
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" })
  }

  return (
    <div className="penny-carousel-wrapper">
      {products.length > 1 && canScrollLeft && (
        <button
          aria-label="Previous products"
          className="penny-carousel-arrow penny-carousel-prev"
          onClick={() => scroll("left")}
          type="button"
        >
          <svg fill="none" height="14" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" width="14">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      <div className="penny-products-container" ref={scrollRef}>
        {products.map((p, idx) => (
          <ProductCard key={`${p.title}-${idx}`} product={p} />
        ))}
      </div>

      {products.length > 1 && canScrollRight && (
        <button
          aria-label="Next products"
          className="penny-carousel-arrow penny-carousel-next"
          onClick={() => scroll("right")}
          type="button"
        >
          <svg fill="none" height="14" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" width="14">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
    </div>
  )
}

export type ParsedReceipt = {
  kind?: "invoice" | "receipt"
  headline?: string
  status?: string
  totalAmount?: string
  items: Array<{
    name: string
    quantity?: string | number
    unitPrice?: string
    total?: string
  }>
  paymentDetails: {
    amountCaptured?: string
    fee?: string
    netAmount?: string
    status?: string
    protection?: string
  }
  shipping?: {
    recipient?: string
    address?: string
  }
  notes?: string
}

function escapeReceiptHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function generateReceiptHtml(receipt: ParsedReceipt): string {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  const receiptId = `PNY-${Math.random().toString(36).substring(2, 9).toUpperCase()}`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Penny Official Receipt - ${escapeReceiptHtml(receipt.totalAmount || "Settlement")}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #f4f7f5;
      color: #172a20;
      padding: 40px 16px;
      display: flex;
      justify-content: center;
      -webkit-font-smoothing: antialiased;
    }
    .receipt-container {
      background: #ffffff;
      width: 100%;
      max-width: 480px;
      border-radius: 16px;
      border: 1px solid #dce4dd;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }
    .top-accent {
      height: 6px;
      background: linear-gradient(90deg, #1b5338, #2e7a52, #52b885);
    }
    .receipt-body {
      padding: 32px 28px;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .brand-logo {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.01em;
      color: #1b5338;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .status-pill {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      background: #e3f6ea;
      color: #126337;
      border: 1px solid #b7e8c6;
      padding: 4px 10px;
      border-radius: 999px;
      text-transform: uppercase;
    }
    .hero-box {
      text-align: center;
      padding: 20px 0;
      background: #f9fbf9;
      border-radius: 12px;
      border: 1px solid #edf2ee;
      margin-bottom: 24px;
    }
    .hero-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #6b7c73;
      margin-bottom: 6px;
    }
    .hero-amount {
      font-size: 34px;
      font-weight: 800;
      color: #1b5338;
      letter-spacing: -0.03em;
    }
    .hero-sub {
      font-size: 12px;
      color: #728279;
      margin-top: 4px;
    }
    .perforated-line {
      border-top: 2px dashed #dce4dd;
      margin: 22px 0;
    }
    .section-title {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #829288;
      margin-bottom: 10px;
    }
    .item-card {
      background: #ffffff;
      border: 1px solid #e5ebe6;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }
    .item-title {
      font-size: 13.5px;
      font-weight: 700;
      color: #16261d;
      line-height: 1.35;
    }
    .item-sub {
      font-size: 11.5px;
      color: #687970;
      margin-top: 3px;
    }
    .item-val {
      font-size: 14px;
      font-weight: 800;
      color: #16261d;
      white-space: nowrap;
    }
    .ledger {
      margin-top: 14px;
    }
    .ledger-row {
      display: flex;
      justify-content: space-between;
      font-size: 12.5px;
      padding: 6px 0;
      color: #55665d;
    }
    .ledger-row.total-row {
      font-size: 14px;
      font-weight: 800;
      color: #1b5338;
      border-top: 1.5px solid #e2e8e3;
      padding-top: 10px;
      margin-top: 6px;
    }
    .shipping-box {
      background: #f9fbf9;
      border: 1px solid #e7ede8;
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 12px;
      line-height: 1.5;
      color: #384940;
      margin-top: 8px;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      color: #8c9b93;
      margin-top: 26px;
      padding-top: 18px;
      border-top: 1px solid #edf2ee;
      line-height: 1.6;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .receipt-container { border: none; box-shadow: none; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="top-accent"></div>
    <div class="receipt-body">
      <div class="header-row">
        <div class="brand-logo">
          <span>PENNY OFFICIAL RECEIPT</span>
        </div>
        <div class="status-pill">&#10003; ${escapeReceiptHtml(receipt.status || "Completed")}</div>
      </div>

      <div class="hero-box">
        <div class="hero-label">Total Amount Settled</div>
        <div class="hero-amount">${escapeReceiptHtml(receipt.totalAmount || "$0.00")}</div>
        <div class="hero-sub">Paid via PayPal Vault &bull; ${escapeReceiptHtml(dateStr)}</div>
      </div>

      ${receipt.items.length > 0 ? `
        <div class="section-title">Items Ordered</div>
        ${receipt.items.map(it => `
          <div class="item-card">
            <div>
              <div class="item-title">${escapeReceiptHtml(it.name)}</div>
              <div class="item-sub">Qty: ${escapeReceiptHtml(String(it.quantity || 1))}${it.unitPrice ? ` &bull; Unit: ${escapeReceiptHtml(it.unitPrice)}` : ""}</div>
            </div>
            <div class="item-val">${escapeReceiptHtml(it.total || it.unitPrice || "")}</div>
          </div>
        `).join("")}
      ` : ""}

      <div class="perforated-line"></div>

      <div class="section-title">Payment Breakdown</div>
      <div class="ledger">
        <div class="ledger-row">
          <span>Payment Status</span>
          <span style="font-weight: 600; color: #166534;">${escapeReceiptHtml(receipt.paymentDetails.status || "Completed")}</span>
        </div>
        ${receipt.paymentDetails.amountCaptured ? `
          <div class="ledger-row">
            <span>Amount Captured</span>
            <span style="font-weight: 600;">${escapeReceiptHtml(receipt.paymentDetails.amountCaptured)}</span>
          </div>
        ` : ""}
        ${receipt.paymentDetails.fee ? `
          <div class="ledger-row">
            <span>PayPal Processing Fee</span>
            <span>${escapeReceiptHtml(receipt.paymentDetails.fee)}</span>
          </div>
        ` : ""}
        ${receipt.paymentDetails.netAmount ? `
          <div class="ledger-row">
            <span>Net Amount Received</span>
            <span>${escapeReceiptHtml(receipt.paymentDetails.netAmount)}</span>
          </div>
        ` : ""}
        <div class="ledger-row total-row">
          <span>Total Settled</span>
          <span>${escapeReceiptHtml(receipt.totalAmount || "$0.00")}</span>
        </div>
      </div>

      ${receipt.shipping?.address ? `
        <div class="perforated-line"></div>
        <div class="section-title">Shipping & Delivery</div>
        <div class="shipping-box">
          ${receipt.shipping.recipient ? `<div style="font-weight: 700; margin-bottom: 2px;">${escapeReceiptHtml(receipt.shipping.recipient)}</div>` : ""}
          <div>${escapeReceiptHtml(receipt.shipping.address)}</div>
          ${receipt.paymentDetails.protection ? `<div style="margin-top: 6px; font-size: 11px; color: #166534;">&#10003; ${escapeReceiptHtml(receipt.paymentDetails.protection)}</div>` : ""}
        </div>
      ` : ""}

      <div class="footer">
        Penny Autonomous Agent &bull; Non-Custodial Vault Payment<br>
        Reference ID: <strong>${escapeReceiptHtml(receiptId)}</strong><br>
        Thank you for shopping with Penny.
      </div>
    </div>
  </div>
</body>
</html>`
}

export function downloadReceiptHtml(receipt: ParsedReceipt) {
  const html = generateReceiptHtml(receipt)
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `penny-receipt-${Date.now()}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function printReceipt(receipt: ParsedReceipt) {
  const html = generateReceiptHtml(receipt)
  const win = window.open("", "_blank", "width=600,height=750")
  if (win) {
    win.document.open()
    win.document.write(html)
    win.document.close()
    setTimeout(() => {
      win.focus()
      win.print()
    }, 250)
  }
}

export function PennyReceiptCard({ receipt }: { receipt: ParsedReceipt }) {
  const [downloaded, setDownloaded] = useState(false)
  const isInvoice = receipt.kind === "invoice"

  const handleDownload = () => {
    downloadReceiptHtml(receipt)
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2500)
  }

  const handlePrint = () => {
    printReceipt(receipt)
  }

  return (
    <div className={isInvoice ? "penny-invoice-card" : "penny-receipt-card"}>
      <div className={isInvoice ? "penny-invoice-top-stripe" : "penny-receipt-top-stripe"} />

      {/* Header */}
      <div className="penny-receipt-header">
        <div className={isInvoice ? "penny-invoice-badge" : "penny-receipt-badge"}>
          <svg fill="none" height="12" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="12">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" x2="8" y1="13" y2="13" />
            <line x1="16" x2="8" y1="17" y2="17" />
          </svg>
          {isInvoice ? "ORDER INVOICE" : "OFFICIAL RECEIPT"}
        </div>
        <div className={isInvoice ? "penny-invoice-status-pill" : "penny-receipt-status-pill"}>
          {isInvoice ? (
            <>
              <svg fill="none" height="11" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="11">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Pending Payment
            </>
          ) : (
            <>
              <svg fill="currentColor" height="10" viewBox="0 0 20 20" width="10">
                <path
                  clipRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  fillRule="evenodd"
                />
              </svg>
              {receipt.status || "Completed"}
            </>
          )}
        </div>
      </div>

      {/* Hero total */}
      <div className="penny-receipt-hero">
        <div className="penny-receipt-hero-label">
          {isInvoice ? "Total Amount Due" : "Total Amount Settled"}
        </div>
        <div className="penny-receipt-hero-amount">{receipt.totalAmount || "$0.00"}</div>
        <div className="penny-receipt-hero-sub">
          {isInvoice
            ? "Review order items below before proceeding to checkout"
            : "Payment captured via PayPal Vault • Non-custodial settlement"}
        </div>
      </div>

      <div className="penny-receipt-separator" />

      {/* Items */}
      {receipt.items.length > 0 && (
        <div>
          <div className="penny-receipt-section-title">Items Ordered</div>
          {receipt.items.map((item, idx) => (
            <div className="penny-receipt-item" key={idx}>
              <div>
                <div className="penny-receipt-item-title">{item.name}</div>
                <div className="penny-receipt-item-meta">
                  Qty: {item.quantity || 1}
                  {item.unitPrice ? ` • Unit price: ${item.unitPrice}` : ""}
                </div>
              </div>
              <div className="penny-receipt-item-price">
                {item.total || item.unitPrice || ""}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Financial breakdown */}
      <div className="penny-receipt-section-title">
        {isInvoice ? "Invoice Summary" : "Payment Breakdown"}
      </div>
      <div className="penny-receipt-breakdown">
        {isInvoice ? (
          <>
            <div className="penny-receipt-row">
              <span>Payment Status</span>
              <span style={{ fontWeight: 600, color: "#b45309" }}>Payment Required</span>
            </div>
            <div className="penny-receipt-row total-row">
              <span>Total to Pay</span>
              <span>{receipt.totalAmount || "$0.00"}</span>
            </div>
          </>
        ) : (
          <>
            {receipt.paymentDetails?.amountCaptured && (
              <div className="penny-receipt-row">
                <span>Amount Captured</span>
                <span style={{ fontWeight: 600 }}>{receipt.paymentDetails.amountCaptured}</span>
              </div>
            )}
            {receipt.paymentDetails?.fee && (
              <div className="penny-receipt-row">
                <span>PayPal Fee</span>
                <span>{receipt.paymentDetails.fee}</span>
              </div>
            )}
            {receipt.paymentDetails?.netAmount && (
              <div className="penny-receipt-row">
                <span>Net Received</span>
                <span>{receipt.paymentDetails.netAmount}</span>
              </div>
            )}
            <div className="penny-receipt-row total-row">
              <span>Settled Total</span>
              <span>{receipt.totalAmount || "$0.00"}</span>
            </div>
          </>
        )}
      </div>

      {/* Shipping details (only on receipt if available) */}
      {!isInvoice && receipt.shipping?.address && (
        <>
          <div className="penny-receipt-separator" />
          <div className="penny-receipt-section-title">Shipping & Delivery</div>
          <div className="penny-receipt-shipping">
            {receipt.shipping.recipient && (
              <div style={{ fontWeight: 700, marginBottom: 2, color: "#16261d" }}>
                {receipt.shipping.recipient}
              </div>
            )}
            <div>{receipt.shipping.address}</div>
            {receipt.paymentDetails?.protection && (
              <div style={{ marginTop: 6, fontSize: 10.5, color: "#166534", fontWeight: 600 }}>
                ✓ {receipt.paymentDetails.protection}
              </div>
            )}
          </div>
        </>
      )}

      {/* Downloadable / Print Action Buttons - ONLY on confirmed Receipt! */}
      {!isInvoice && (
        <div className="penny-receipt-actions">
          <button
            className="penny-receipt-btn-primary"
            onClick={handleDownload}
            type="button"
          >
            <svg fill="none" height="13" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" width="13">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {downloaded ? "Receipt Downloaded!" : "Download Receipt"}
          </button>

          <button
            className="penny-receipt-btn-secondary"
            onClick={handlePrint}
            type="button"
          >
            <svg fill="none" height="13" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" width="13">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect height="8" width="12" x="6" y="14" />
            </svg>
            Print / PDF
          </button>
        </div>
      )}
    </div>
  )
}

export function parseReceiptFromText(text: string): ParsedReceipt | null {
  const contentLower = text.toLowerCase()

  const hasOrderSummary = /(?:\*\*|#|\b)(?:order\s+summary|order\s+details|items?\s+ordered)/i.test(text)
  const hasItems =
    /(?:item|product):\s*/i.test(text) ||
    /[-*•]\s*[^*\n]+?\s*[—–]\s*\d+\s*[×x]/i.test(text) ||
    /[-*•]\s*[^*\n]+?\s+-\s+\d+\s*[×x]/i.test(text)
  const hasUnitPrice = /unit\s+price:/i.test(text) || /[×x]\s*\$[\d,]+/i.test(text)
  const hasOrderTotal = /(?:order\s+total|total\s+amount|total\s+charged|\bTotal):\s*\$[\d,]+/i.test(text)
  const hasPaymentDetails = /payment\s+details|amount\s+captured/i.test(text)
  const hasPaymentSuccess = /payment\s+(?:has\s+been\s+)?captured\s+successfully/i.test(text)

  if (!((hasOrderSummary && (hasItems || hasUnitPrice || hasOrderTotal || hasPaymentDetails)) || hasPaymentSuccess)) {
    return null
  }

  // Determine if this is an already-paid Receipt vs an unpaid Invoice
  const hasCheckoutUrl =
    text.includes("sandbox.paypal.com") ||
    contentLower.includes("paypal.com/checkoutnow") ||
    contentLower.includes("paypal.com/checkout")

  const hasExplicitCapture =
    contentLower.includes("captured successfully") ||
    contentLower.includes("payment has been captured") ||
    contentLower.includes("successfully paid") ||
    contentLower.includes("purchase complete") ||
    contentLower.includes("was collected") ||
    (contentLower.includes("amount captured") && !hasCheckoutUrl)

  // STRICT RULE:
  // It is ONLY a receipt if payment has been confirmed/captured AND has NO pending checkout link!
  // Otherwise, it is an unpaid Invoice!
  const isReceipt = hasExplicitCapture && !hasCheckoutUrl
  const kind: "invoice" | "receipt" = isReceipt ? "receipt" : "invoice"

  // 1. Headline
  let headline = ""
  if (isReceipt) {
    const headlineMatch = text.match(/^(?:.*?(?:payment\s+(?:has\s+been\s+)?captured\s+successfully|order\s+confirmed|payment\s+complete)[^\n]*)/im)
    if (headlineMatch) {
      headline = headlineMatch[0].replace(/[#*_]/g, "").trim()
    }
  } else {
    const headlineMatch = text.match(/^(?:.*?(?:here\s+are\s+your\s+order\s+details|order\s+summary|order\s+prepared)[^\n]*)/im)
    if (headlineMatch) {
      headline = headlineMatch[0].replace(/[#*_]/g, "").trim()
    }
  }

  // 2. Items
  const items: ParsedReceipt["items"] = []

  // Pattern A: Bullet with quantity and unit price / total
  // e.g. "- Sony WH-CH730N Wireless Noise Cancelling Headphones — 1 × $129.99"
  const bulletQtyPriceRegex = /^[-*•]\s*(?:\*\*)?([^*\n]+?)(?:\*\*)?\s*(?:[—–]|\s+-\s+)\s*(\d+)\s*[×x]\s*(\$[\d,]+(?:\.\d{2})?)/gim
  let bpm: RegExpExecArray | null
  while ((bpm = bulletQtyPriceRegex.exec(text)) !== null) {
    const name = bpm[1].trim()
    if (name && !/^(?:total|order total|subtotal|total charged)/i.test(name)) {
      items.push({
        name,
        quantity: bpm[2],
        unitPrice: bpm[3],
        total: bpm[3],
      })
    }
  }

  // Pattern B: Bullet with labeled Quantity & Unit price
  // e.g. "- **Sony WH-CH730N Wireless Noise Cancelling Headphones** — Quantity: 1 — Unit price: $129.99"
  if (items.length === 0) {
    const bulletLabeledRegex = /^[-*•]\s*(?:\*\*)?([^*\n]+?)(?:\*\*)?\s*(?:[—–]|\s+-\s+)\s*Quantity:\s*(\d+)\s*(?:[—–]|\s+-\s+)\s*Unit\s+price:\s*(\$[\d,]+(?:\.\d{2})?)/gim
    let blm: RegExpExecArray | null
    while ((blm = bulletLabeledRegex.exec(text)) !== null) {
      const name = blm[1].trim()
      if (name) {
        items.push({
          name,
          quantity: blm[2],
          unitPrice: blm[3],
          total: blm[3],
        })
      }
    }
  }

  // Pattern C: Key-Value block
  // e.g. "Item: Endorphin Pro 4 Running Shoe - Men's (Saucony)\nQuantity: 1\nUnit price: $123.55"
  if (items.length === 0) {
    const itemRegex = /(?:[-*•]\s*)?(?:Item|Product):\s*(?:[*_]{2})?([^*\n]+?)(?:[*_]{2})?(?=\s*(?:\n|$))/gi
    let im: RegExpExecArray | null
    while ((im = itemRegex.exec(text)) !== null) {
      const name = im[1].trim()
      if (name) {
        items.push({ name })
      }
    }

    const qtyMatch = text.match(/Quantity:\s*(\d+)/i)
    const unitPriceMatch = text.match(/Unit\s+price:\s*(\$[\d,]+(?:\.\d{2})?)/i)
    const itemTotalMatch = text.match(/(?:Order\s+total|Total\s+charged|Total):\s*(\$[\d,]+(?:\.\d{2})?)/i)

    if (items.length > 0) {
      if (qtyMatch) items[0].quantity = qtyMatch[1]
      if (unitPriceMatch) items[0].unitPrice = unitPriceMatch[1]
      if (itemTotalMatch) items[0].total = itemTotalMatch[1]
    }
  }

  // Pattern D: Fallback bullet inside Order summary section
  if (items.length === 0) {
    const summarySectionMatch = text.match(/(?:\*\*|#|\b)order\s+summary[:*\s]*\n+([\s\S]+?)(?=\n+\s*(?:\*\*|#|\b)payment\s+details|\n+\s*Complete\s+your\s+purchase|\n+\s*The\s+payment|\n\n|$)/i)
    if (summarySectionMatch) {
      const lines = summarySectionMatch[1].split("\n").map((l) => l.trim()).filter(Boolean)
      for (const line of lines) {
        if (/^[-*•]\s*(?:Total|Order\s+total|Subtotal|Total\s+charged):/i.test(line)) continue
        const cleanLine = line.replace(/^[-*•]\s*/, "").replace(/[#*_]/g, "").trim()
        const priceInLine = cleanLine.match(/(\$[\d,]+(?:\.\d{2})?)/)
        const namePart = cleanLine.split(/\s+[—–]\s+|\s+-\s+/)[0].trim()
        if (namePart && !/^(?:quantity|unit\s+price|order\s+total|subtotal):/i.test(namePart)) {
          items.push({
            name: namePart,
            quantity: 1,
            unitPrice: priceInLine ? priceInLine[1] : undefined,
            total: priceInLine ? priceInLine[1] : undefined,
          })
          break
        }
      }
    }
  }

  // 3. Total Amount
  const totalRegex =
    /(?:Total\s+charged|Order\s+total|Total\s+amount|Total|Amount\s+captured|Captured\s+amount|Amount\s+collected):\s*(\$[\d,]+(?:\.\d{2})?(?:\s*[A-Z]{3})?)/i
  const fullCollectedRegex = /(?:The\s+full|Full)\s+(\$[\d,]+(?:\.\d{2})?)\s+was\s+collected/i

  const totalMatch = text.match(totalRegex)
  const fullCollectedMatch = text.match(fullCollectedRegex)

  const totalAmount =
    totalMatch?.[1]?.replace(/\s*USD$/i, "").trim() ||
    fullCollectedMatch?.[1] ||
    items[0]?.total ||
    items[0]?.unitPrice ||
    "$0.00"

  // 4. Payment Details (ONLY for Receipt!)
  let paymentDetails: ParsedReceipt["paymentDetails"] = { status: isReceipt ? "Completed" : "Payment Required" }
  if (isReceipt) {
    const statusMatch = text.match(/Status:\s*([A-Za-z]+)/i)
    const capMatch = text.match(/Amount\s+captured:\s*(\$[\d,]+(?:\.\d{2})?(?:\s*[A-Z]{3})?)/i)
    const feeMatch =
      text.match(/(?:PayPal\s+(?:processing\s+)?fee|Fee):\s*(\$[\d,]+(?:\.\d{2})?(?:\s*[-—]\s*[A-Z]{3})?)/i) ||
      text.match(/PayPal\s+fee\s+is\s+(\$[\d,]+(?:\.\d{2})?)/i)

    const netMatch =
      text.match(/Net\s+amount(?:\s+received)?:\s*(\$[\d,]+(?:\.\d{2})?(?:\s*[-—]\s*[A-Z]{3})?)/i) ||
      text.match(/amount\s+you'?ll\s+receive(?:\s+after\s+the\s+PayPal\s+processing\s+fee)?\s+is\s+(\$[\d,]+(?:\.\d{2})?)/i)

    const protMatch = text.match(/Seller\s+protection:\s*([^•\n]+)/i)

    let fee = feeMatch ? feeMatch[1].replace(/\s*[-—]\s*USD$/i, "").trim() : undefined
    const netAmount = netMatch ? netMatch[1].replace(/\s*[-—]\s*USD$/i, "").trim() : undefined

    // If fee not explicitly given, but net amount and total are known, compute fee!
    if (!fee && netAmount && totalAmount && totalAmount !== "$0.00") {
      const totNum = parseFloat(totalAmount.replace(/[^0-9.]/g, ""))
      const netNum = parseFloat(netAmount.replace(/[^0-9.]/g, ""))
      if (!isNaN(totNum) && !isNaN(netNum) && totNum >= netNum) {
        fee = `$${(totNum - netNum).toFixed(2)}`
      }
    }

    paymentDetails = {
      amountCaptured: capMatch ? capMatch[1].replace(/\s*USD$/i, "").trim() : totalAmount,
      fee,
      netAmount,
      status: statusMatch ? statusMatch[1] : "Completed",
      protection: protMatch ? protMatch[1].trim() : undefined,
    }
  }

  // 5. Shipping
  let shipping: ParsedReceipt["shipping"] = undefined
  const shipMatch =
    text.match(/(?:\*?Shipping\s+to\*?[:\s*]*)([^•\n]+(?:•\s*[^•\n]+)*)/i) ||
    text.match(/Shipping\s+to:\s*([^\n]+)/i)

  const paidViaMatch = text.match(/Paid\s+via\s+PayPal\s*\(([^)]+)\)/i)

  if (shipMatch) {
    const rawSegments = shipMatch[1]
      .split("•")
      .map((s) => s.replace(/[*_]/g, "").trim())
      .filter((s) => s.length > 0 && !s.toLowerCase().includes("payment was made") && !s.toLowerCase().includes("no further action") && !s.toLowerCase().includes("questions"))

    if (rawSegments.length >= 2) {
      shipping = {
        recipient: rawSegments[0],
        address: rawSegments.slice(1).join(", "),
      }
    } else if (rawSegments.length === 1) {
      shipping = {
        recipient: paidViaMatch ? paidViaMatch[1].trim() : undefined,
        address: rawSegments[0],
      }
    }
  } else if (paidViaMatch) {
    shipping = {
      recipient: paidViaMatch[1].trim(),
    }
  }

  // 6. Notes
  let notes = ""
  const noteMatch = text.match(/(?:The payment was made through PayPal[^\n]*|No further action is needed[^\n]*|If you have questions[^\n]*|The payment was processed as a final capture[^\n]*)/i)
  if (noteMatch) {
    notes = noteMatch[0].replace(/^[•\s*-]+/, "").trim()
  }

  return {
    kind,
    headline: headline || (isReceipt ? "Your payment has been captured successfully." : "Order summary"),
    status: isReceipt ? paymentDetails.status : "Pending Payment",
    totalAmount,
    items,
    paymentDetails,
    shipping,
    notes,
  }
}

/**
 * Formats Markdown text into clean, modern React elements with product cards,
 * tables, lists, and inline media.
 */
export function formatPennyMessage(text: string): ReactNode {
  if (!text) return null

  // 0. Order / Payment Receipt Check
  const receipt = parseReceiptFromText(text)
  if (receipt) {
    return (
      <div className="formatted-penny-content">
        {receipt.headline && (
          <p style={{ margin: "4px 0 10px", fontSize: 13, fontWeight: 600, color: "#1a2922" }}>
            {receipt.headline}
          </p>
        )}
        <PennyReceiptCard receipt={receipt} />
        {receipt.notes && (
          <p style={{ margin: "12px 0 4px", fontSize: 11.5, color: "#64756d", lineHeight: 1.5 }}>
            {receipt.notes}
          </p>
        )}
      </div>
    )
  }

  const rawLines = text.split("\n")
  const elements: ReactNode[] = []

  let inTable = false
  let tableRows: string[][] = []

  let inBulletList = false
  let bulletItems: ReactNode[] = []

  let currentProduct: ParsedProduct | null = null
  let pendingProducts: ParsedProduct[] = []

  function commitCurrentProduct() {
    if (currentProduct) {
      pendingProducts.push(currentProduct)
      currentProduct = null
    }
  }

  function flushProducts() {
    commitCurrentProduct()
    if (pendingProducts.length > 0) {
      // Safety check: ensure at least one item has an image or a verified retailer or brand!
      // If none have an image and none have a retailer, they are ledger/receipt items or standard bullets!
      const hasRealProduct =
        pendingProducts.length > 0 &&
        pendingProducts.every((p) => !NON_PRODUCT_REGEX.test(p.title.trim())) &&
        pendingProducts.some(
          (p) => Boolean(p.imageUrl || (p.retailer && /\.[a-z]{2,}/i.test(p.retailer))),
        )

      if (!hasRealProduct) {
        // Fallback to standard bullet list
        elements.push(
          <ul
            key={`list-${elements.length}`}
            style={{
              margin: "8px 0 12px 18px",
              paddingLeft: 0,
              display: "grid",
              gap: 6,
            }}
          >
            {pendingProducts.map((p, idx) => (
              <li key={`np-${idx}`} style={{ lineHeight: 1.55 }}>
                <strong>{p.title}</strong>
                {p.price && <span>: {p.price}</span>}
                {p.retailer && <span> at {p.retailer}</span>}
                {p.extra && <span> — {p.extra}</span>}
              </li>
            ))}
          </ul>,
        )
        pendingProducts = []
        return
      }

      elements.push(
        <ProductCarousel
          key={`products-${elements.length}`}
          products={pendingProducts}
        />,
      )
      pendingProducts = []
    }
  }

  function flushList() {
    if (inBulletList && bulletItems.length > 0) {
      elements.push(
        <ul
          key={`list-${elements.length}`}
          style={{
            margin: "8px 0 12px 18px",
            paddingLeft: 0,
            display: "grid",
            gap: 6,
          }}
        >
          {bulletItems}
        </ul>,
      )
      bulletItems = []
      inBulletList = false
    }
  }

  function flushTable() {
    if (inTable && tableRows.length > 0) {
      const headerRow = tableRows[0]
      const bodyRows = tableRows.slice(1).filter((r) => !r.every((c) => /^:?-+:?$/.test(c.trim())))

      elements.push(
        <div
          key={`table-${elements.length}`}
          style={{
            margin: "10px 0 14px",
            overflowX: "auto",
            borderRadius: 6,
            border: "1px solid #d8dfd9",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 11,
              textAlign: "left",
            }}
          >
            {headerRow && (
              <thead style={{ background: "#edf2ee", borderBottom: "1px solid #d8dfd9" }}>
                <tr>
                  {headerRow.map((col, idx) => (
                    <th key={idx} style={{ padding: "8px 10px", fontWeight: 700 }}>
                      {renderInline(col.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {bodyRows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  style={{
                    borderBottom: rIdx < bodyRows.length - 1 ? "1px solid #e7ece8" : "none",
                    background: rIdx % 2 === 0 ? "#ffffff" : "#fbfdfc",
                  }}
                >
                  {row.map((col, cIdx) => (
                    <td key={cIdx} style={{ padding: "8px 10px" }}>
                      {renderInline(col.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      tableRows = []
      inTable = false
    }
  }

  function extractProductMetadata(text: string, product: ParsedProduct) {
    // 1. Image
    const imgMatch = text.match(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/)
    if (imgMatch) {
      if (!product.imageUrl) {
        product.imageAlt = imgMatch[1]
        product.imageUrl = imgMatch[2]
      }
      text = text.replace(imgMatch[0], "").trim()
    }

    // 2. Price
    const priceMatch = text.match(/(\$[\d,]+(?:\.\d{2})?)/)
    if (priceMatch && !product.price) {
      product.price = priceMatch[1]
    }

    // 3. In stock
    if (/\b(instock|in\s+stock)\b/i.test(text)) {
      product.inStock = true
    }

    // 4. Rating
    const ratingMatch = text.match(/(?:rated\s+|★\s*|\b)([\d.]+(?:\s*(?:from|out of|\/)\s*[\w\d\s]+)?(?:\s*★|\s*stars)?)/i)
    if (ratingMatch && !product.rating && (text.includes("★") || text.toLowerCase().includes("rated") || text.toLowerCase().includes("star"))) {
      product.rating = ratingMatch[1].trim()
    }

    // 5. Retailer (e.g. at snipesusa.com, jdsports.com or from fleetfeet.com)
    const retailerMatch = text.match(/(?:\b(?:at|available at|store|from)\b:?)\s+([A-Z0-9][\w\s&'.-]{1,35}?)(?=\s*,|\s+and\b|\s*\([iI]n\s*[sS]tock|\s*;|\s*$|\s*rated|\s*—|\s*–)/i)
    if (retailerMatch && !product.retailer) {
      product.retailer = retailerMatch[1].trim().replace(/\.$/, "")
    }

    // 6. Brand (e.g. (Nike) or (New Balance))
    const brandMatch = text.match(/^\s*\(([^)]+)\)/)
    let brand = ""
    if (brandMatch) {
      brand = brandMatch[1].trim()
      text = text.replace(brandMatch[0], "").trim()
    }

    // 7. Remaining descriptive text
    let extra = text
      .replace(/^[-*•]\s*/, "")
      .replace(/^(?:price|store|retailer|rating|features?|details?):\s*/i, "")
      .replace(/^[—–-]\s*/, "")
      .trim()

    if (product.price) extra = extra.replace(product.price, "").trim()
    if (product.retailer) {
      extra = extra.replace(new RegExp(`(?:at|available at|store:?|from:?)\\s+${product.retailer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i"), "").trim()
    }
    extra = extra.replace(/\(?in\s*stock\)?/gi, "").replace(/;?\s*rated[^;.]*[;.]?/gi, "").replace(/^[,\s;—–-]+|[,\s;—–-]+$/g, "").trim()

    if (brand) {
      extra = extra ? `${brand} • ${extra}` : brand
    }

    if (extra.length > 2) {
      product.extra = product.extra ? `${product.extra} • ${extra}` : extra
    }
  }

  const NON_PRODUCT_REGEX =
    /^(?:unit\s+price|order\s+total|amount(?:\s+captured|\s+paid|\s+due|\s+refunded)?|captured\s+amount|subtotal|total(?:\s+amount|\s+charged)?|grand\s+total|tax(?:es)?|sales\s+tax|shipping(?:(?:\s+and|\s*&)?\s*handling)?|discount|fees?|paypal\s+fee|service\s+fee|net\s+amount(?:\s+received)?|seller\s+protection|shipping\s+to|paid\s+via(?:\s+paypal)?|payment(?:\s+details|\s+method|\s+status|\s+capture|\s+summary)?|status|order\s+(?:id|number|reference|summary|status|details)|capture\s+(?:id|status)|balance|transaction(?:\s+id)?|refund|authorized(?:\s+amount)?|price|cost|estimate|summary|details|note|notes|tip|warning|disclaimer|item\s+total|quantity):?$/i

  function parseProductHeader(trimmed: string, nextLine?: string): { index?: string; title: string; remaining: string } | null {
    if (
      trimmed.startsWith("#") ||
      trimmed.startsWith(">") ||
      trimmed.startsWith("|") ||
      trimmed.startsWith("```") ||
      /^[-*_]{3,}$/.test(trimmed)
    ) {
      return null
    }

    // Pattern A: Bold title (with optional leading number or bullet)
    // e.g. "1. **Nike Vomero** (Nike) — $240.00 at ..." or "**Nike Vomero** - $240"
    const boldMatch = trimmed.match(/^(?:(?:(\d+)[\.\)]|[-*•])\s+)?\*\*([^*]+)\*\*(.*)$/)
    if (boldMatch) {
      const rawIndex = boldMatch[1]
      const rawTitle = boldMatch[2].trim()
      const remaining = (boldMatch[3] || "").trim()

      if (NON_PRODUCT_REGEX.test(rawTitle)) {
        return null
      }

      const isKeyword = /^(?:note|summary|details|features|disclaimer|important|warning|recommendation|tips?):?$/i.test(rawTitle)
      if (!isKeyword) {
        const hasPrice = /\$[\d,]+/.test(remaining)
        const hasStore = /(?:at|from|store|retailer)\s+[A-Za-z0-9]/i.test(remaining)
        const nextIsImage = nextLine && /^!\[[^\]]*\]\(https?:\/\/[^\s)]+\)/.test(nextLine.trim())
        if (rawIndex || hasPrice || hasStore || nextIsImage || remaining.includes("—") || remaining.includes("–") || remaining.includes("- $")) {
          return { index: rawIndex, title: rawTitle, remaining }
        }
      }
    }

    // Pattern B: Plain or unbolded title with brand and price separator
    // e.g. "Nike Vomero Premium NYC Marathon 2026 (Nike) — $240.00 at snipesusa.com..."
    // or "FuelCell Supercomp Elite v3 (New Balance) — $245.00 at fleetfeet.com..."
    const unboldMatch = trimmed.match(
      /^(?:(?:(\d+)[\.\)]|[-*•])\s+)?([A-Z0-9][\w\s\-\.\'\&]{2,70}?)(?:\s*\(([^)]+)\))?\s*(?:[-–—:]\s*|\s+)(\$[\d,]+(?:\.\d{2})?.*)$/,
    )
    if (unboldMatch) {
      const rawIndex = unboldMatch[1]
      const rawTitle = unboldMatch[2].trim()

      if (NON_PRODUCT_REGEX.test(rawTitle)) {
        return null
      }

      const brand = unboldMatch[3] ? unboldMatch[3].trim() : ""
      const remainingWithPrice = (unboldMatch[4] || "").trim()
      const remaining = brand ? `(${brand}) ${remainingWithPrice}` : remainingWithPrice

      return { index: rawIndex, title: rawTitle, remaining }
    }

    // Pattern C: Title followed by price in parentheses
    // e.g. "Sony WH-1000XM5 ($349 at Amazon)" or "1. Nike Pegasus ($130)"
    const parenPriceMatch = trimmed.match(
      /^(?:(?:(\d+)[\.\)]|[-*•])\s+)?([A-Z0-9][\w\s\-\.\'\&]{2,70}?)\s*\(\s*(\$[\d,]+(?:[^\)]*))\)(.*)$/,
    )
    if (parenPriceMatch) {
      const rawIndex = parenPriceMatch[1]
      const rawTitle = parenPriceMatch[2].trim()

      if (NON_PRODUCT_REGEX.test(rawTitle)) {
        return null
      }

      const pricePart = parenPriceMatch[3].trim()
      const extraPart = (parenPriceMatch[4] || "").trim()
      return { index: rawIndex, title: rawTitle, remaining: `${pricePart} ${extraPart}`.trim() }
    }

    // Pattern D: Line has price ($XX) and next line is an image, starting with capital letter
    if (nextLine && /^!\[[^\]]*\]\(https?:\/\/[^\s)]+\)/.test(nextLine.trim())) {
      const dollarIdx = trimmed.indexOf("$")
      if (dollarIdx > 3 && !trimmed.startsWith("http")) {
        const beforeDollar = trimmed.slice(0, dollarIdx).replace(/[-–—:]\s*$/, "").trim()
        const afterDollar = trimmed.slice(dollarIdx).trim()
        const titleMatch = beforeDollar.match(/^(?:(?:(\d+)[\.\)]|[-*•])\s+)?(.+)$/)
        if (titleMatch && titleMatch[2].length >= 3 && titleMatch[2].length <= 80) {
          const rawTitle = titleMatch[2].replace(/\*\*([^*]+)\*\*/g, "$1").trim()
          if (!NON_PRODUCT_REGEX.test(rawTitle)) {
            return {
              index: titleMatch[1],
              title: rawTitle,
              remaining: afterDollar,
            }
          }
        }
      }
    }

    return null
  }

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i]
    const trimmed = line.trim()
    const nextLine = rawLines[i + 1]?.trim()

    // 1. Table Detection
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushProducts()
      flushList()
      inTable = true
      const cells = trimmed.slice(1, -1).split("|")
      tableRows.push(cells)
      continue
    } else if (inTable) {
      flushTable()
    }

    // 2. Product Header Detection
    const productHeaderMatch = parseProductHeader(trimmed, nextLine)

    if (productHeaderMatch) {
      flushList()
      commitCurrentProduct() // push previous product to pendingProducts

      const index = productHeaderMatch.index || `${pendingProducts.length + 1}`
      const title = productHeaderMatch.title.trim()
      const remaining = productHeaderMatch.remaining.trim()

      const newProduct: ParsedProduct = {
        index,
        title,
      }
      extractProductMetadata(remaining, newProduct)
      currentProduct = newProduct
      continue
    }

    // 3. If currently accumulating a product, check continuation lines
    if (currentProduct) {
      // Empty line between product content or between products -> keep in product mode!
      if (!trimmed) {
        continue
      }

      // Standalone image for the current product
      const standaloneImg = trimmed.match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)$/)
      if (standaloneImg) {
        if (!currentProduct.imageUrl) {
          currentProduct.imageAlt = standaloneImg[1]
          currentProduct.imageUrl = standaloneImg[2]
          continue
        }
      }

      // Check if this line is an exit line from the product list:
      // Headings, tables, or conclusive prompts
      const isExitLine =
        /^#{1,6}\s+/.test(trimmed) ||
        /^[-*_]{3,}$/.test(trimmed) ||
        /^(?:which\s+(?:one|of\s+these)|would\s+you\s+like|let\s+me\s+know|shall\s+i|to\s+proceed|to\s+purchase|you\s+can\s+approve|click\s+below|here\s+is\s+the\s+link|payment\s+details|payment\s+capture|order\s+details|order\s+summary|status:)/i.test(trimmed)

      if (isExitLine) {
        commitCurrentProduct()
        flushProducts()
        // and fall through to render heading/paragraph
      } else {
        // Line is part of the current product! (Description, bullet attribute, price, etc.)
        extractProductMetadata(trimmed, currentProduct)
        continue
      }
    }

    // 4. Standalone Image (when not in a product)
    const standaloneImg = trimmed.match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)$/)
    if (standaloneImg) {
      // Check if pendingProducts has a product without an image
      if (pendingProducts.length > 0 && !pendingProducts[pendingProducts.length - 1].imageUrl) {
        pendingProducts[pendingProducts.length - 1].imageAlt = standaloneImg[1]
        pendingProducts[pendingProducts.length - 1].imageUrl = standaloneImg[2]
        continue
      }

      // Check if there are other images nearby or pending products: group them horizontally into products!
      const hasAdjacentImg = (nextLine && /^!\[[^\]]*\]\(https?:\/\/[^\s)]+\)/.test(nextLine)) ||
                            (i > 0 && /^!\[[^\]]*\]\(https?:\/\/[^\s)]+\)/.test(rawLines[i - 1].trim()))

      const imgCaption = (standaloneImg[1] || "").trim()
      if ((pendingProducts.length > 0 || hasAdjacentImg) && !NON_PRODUCT_REGEX.test(imgCaption)) {
        currentProduct = {
          index: `${pendingProducts.length + 1}`,
          title: imgCaption || `Product ${pendingProducts.length + 1}`,
          imageUrl: standaloneImg[2],
          imageAlt: standaloneImg[1],
        }
        continue
      }

      flushProducts()
      flushList()
      elements.push(
        <div className="penny-standalone-image-wrap" key={`img-${elements.length}`}>
          <img
            alt={standaloneImg[1] || "Penny product view"}
            loading="lazy"
            src={standaloneImg[2]}
          />
          {standaloneImg[1] && (
            <div className="penny-standalone-image-caption">{standaloneImg[1]}</div>
          )}
        </div>,
      )
      continue
    }

    // If we have pending products and reached non-product lines, flush
    flushProducts()

    // 5. Empty line
    if (!trimmed) {
      continue
    }

    // 6. Bullet list
    if (/^[-*•]\s+/.test(trimmed)) {
      inBulletList = true
      const content = trimmed.replace(/^[-*•]\s+/, "")
      bulletItems.push(
        <li key={`li-${i}`} style={{ lineHeight: 1.55 }}>
          {renderInline(content)}
        </li>,
      )
      continue
    } else if (inBulletList) {
      flushList()
    }

    // 7. Headings
    if (/^###\s+/.test(trimmed)) {
      elements.push(
        <h4
          key={`h4-${i}`}
          style={{ margin: "14px 0 6px", fontSize: 13, fontWeight: 700, color: "inherit" }}
        >
          {renderInline(trimmed.replace(/^###\s+/, ""))}
        </h4>,
      )
      continue
    }
    if (/^##\s+/.test(trimmed)) {
      elements.push(
        <h3
          key={`h3-${i}`}
          style={{ margin: "16px 0 8px", fontSize: 14, fontWeight: 700, color: "inherit" }}
        >
          {renderInline(trimmed.replace(/^##\s+/, ""))}
        </h3>,
      )
      continue
    }

    // 8. Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(
        <hr
          key={`hr-${i}`}
          style={{
            margin: "12px 0",
            border: "none",
            borderTop: "1px solid rgba(0,0,0,0.1)",
          }}
        />,
      )
      continue
    }

    // 9. Standard paragraph
    elements.push(
      <p key={`p-${i}`} style={{ margin: "6px 0", lineHeight: 1.55 }}>
        {renderInline(trimmed)}
      </p>,
    )
  }

  flushProducts()
  flushList()
  flushTable()

  return <div className="formatted-penny-content">{elements}</div>
}

/**
 * Parses inline formatting: images, **bold**, *italic*, `code`, and [label](url).
 */
function renderInline(text: string): ReactNode {
  const parts: ReactNode[] = []
  let remaining = text
  let keyIndex = 0

  while (remaining.length > 0) {
    // Images ![alt](url) - match images BEFORE links to prevent ! from dangling
    const imgMatch = remaining.match(/!\[([^\]]*)\]\(([^)]+)\)/)
    // Links [text](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/)
    // Bold **text**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/)
    // Code `code`
    const codeMatch = remaining.match(/`([^`]+)`/)
    // Strike ~~text~~
    const strikeMatch = remaining.match(/~~([^~]+)~~/)

    const matches = [
      imgMatch ? { type: "image", match: imgMatch, index: imgMatch.index! } : null,
      linkMatch ? { type: "link", match: linkMatch, index: linkMatch.index! } : null,
      boldMatch ? { type: "bold", match: boldMatch, index: boldMatch.index! } : null,
      codeMatch ? { type: "code", match: codeMatch, index: codeMatch.index! } : null,
      strikeMatch ? { type: "strike", match: strikeMatch, index: strikeMatch.index! } : null,
    ].filter(Boolean) as { type: string; match: RegExpMatchArray; index: number }[]

    if (matches.length === 0) {
      parts.push(remaining)
      break
    }

    matches.sort((a, b) => a.index - b.index)
    const first = matches[0]

    // Push preceding text
    if (first.index > 0) {
      parts.push(remaining.substring(0, first.index))
    }

    if (first.type === "image") {
      const alt = first.match[1]
      const url = first.match[2]
      parts.push(
        <img
          alt={alt || "Product view"}
          key={`inline-img-${keyIndex++}`}
          loading="lazy"
          src={url}
          style={{
            maxWidth: "100%",
            maxHeight: 180,
            borderRadius: 6,
            border: "1px solid #dbe2dc",
            margin: "4px 0",
            display: "block",
            objectFit: "contain",
          }}
        />,
      )
      remaining = remaining.substring(first.index + first.match[0].length)
    } else if (first.type === "link") {
      const label = first.match[1]
      const url = first.match[2]
      parts.push(
        <a
          href={url}
          key={`inline-${keyIndex++}`}
          rel="noopener noreferrer"
          style={{ color: "var(--penny-green, #1b5338)", textDecoration: "underline" }}
          target="_blank"
        >
          {label}
        </a>,
      )
      remaining = remaining.substring(first.index + first.match[0].length)
    } else if (first.type === "bold") {
      parts.push(
        <strong key={`inline-${keyIndex++}`} style={{ fontWeight: 700 }}>
          {first.match[1]}
        </strong>,
      )
      remaining = remaining.substring(first.index + first.match[0].length)
    } else if (first.type === "code") {
      parts.push(
        <code
          key={`inline-${keyIndex++}`}
          style={{
            background: "rgba(0,0,0,0.06)",
            padding: "2px 4px",
            borderRadius: 3,
            fontSize: "0.9em",
            fontFamily: "monospace",
          }}
        >
          {first.match[1]}
        </code>,
      )
      remaining = remaining.substring(first.index + first.match[0].length)
    } else if (first.type === "strike") {
      parts.push(
        <del key={`inline-${keyIndex++}`} style={{ opacity: 0.65 }}>
          {first.match[1]}
        </del>,
      )
      remaining = remaining.substring(first.index + first.match[0].length)
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>
}
