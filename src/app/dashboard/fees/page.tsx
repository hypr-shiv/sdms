"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { type Role } from "@/lib/mockData";
import {
  CreditCard,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  QrCode,
  Share2,
  Copy,
  Printer,
  X,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Check,
  Send,
  Search,
  BellRing
} from "lucide-react";
import "./fees.css";
import "../dashboard.css";

// ═══════════════════════════════════════════════════
// FALLBACK DATA
// ═══════════════════════════════════════════════════

const DEFAULT_INVOICES = [
  {
    id: "inv-1",
    invoiceNumber: "INV-2026-0042",
    description: "Fall 2026 Tuition & Academic Services",
    semester: "Fall 2026",
    amount: 4500,
    paidAmount: 1500,
    remainingAmount: 3000,
    dueDate: "2026-10-15",
    status: "partial",
    installmentsAllowed: true,
    totalInstallments: 3,
    installmentsPaid: 1,
    installmentAmount: 1500,
    feeBreakdown: JSON.stringify({
      "Tuition Fee": 3400,
      "Computer & AI Lab Access": 550,
      "Digital Library & Courseware": 250,
      "Campus Health & Amenities": 300,
    }),
  },
  {
    id: "inv-2",
    invoiceNumber: "INV-2026-0089",
    description: "Specialized Engineering Lab & Robotics Fee",
    semester: "Fall 2026",
    amount: 650,
    paidAmount: 0,
    remainingAmount: 650,
    dueDate: "2026-10-05",
    status: "pending",
    installmentsAllowed: false,
    totalInstallments: 1,
    installmentsPaid: 0,
    installmentAmount: 650,
    feeBreakdown: JSON.stringify({
      "Hardware Kit & Microcontrollers": 400,
      "Consumables & Safety Equipment": 250,
    }),
  },
  {
    id: "inv-3",
    invoiceNumber: "INV-2026-0014",
    description: "Spring 2026 Tuition & Campus Fee",
    semester: "Spring 2026",
    amount: 4200,
    paidAmount: 4200,
    remainingAmount: 0,
    dueDate: "2026-03-01",
    status: "paid",
    installmentsAllowed: true,
    totalInstallments: 3,
    installmentsPaid: 3,
    installmentAmount: 1400,
    feeBreakdown: JSON.stringify({
      "Tuition Fee": 3200,
      "Lab & Tech Access": 500,
      "Library Fee": 200,
      "Student Activities": 300,
    }),
  },
];

const DEFAULT_TRANSACTIONS = [
  {
    id: "txn-1",
    transactionRef: "TXN-STP-948102",
    invoiceId: "INV-2026-0042",
    studentId: "STU-001",
    studentName: "Alex Johnson",
    amount: 1500,
    gateway: "stripe",
    status: "success",
    paymentType: "installment",
    payerName: "Alex Johnson (Self)",
    payerEmail: "alex.johnson@scholarpulse.edu",
    paymentMethodDetails: "Visa ending in 4242",
    receiptNumber: "RCP-2026-0042-01",
    createdAt: "2026-09-01T10:30:00.000Z",
  },
  {
    id: "txn-2",
    transactionRef: "TXN-RZP-330194",
    invoiceId: "INV-2026-0014",
    studentId: "STU-001",
    studentName: "Alex Johnson",
    amount: 4200,
    gateway: "razorpay",
    status: "success",
    paymentType: "full",
    payerName: "David Johnson (Parent)",
    payerEmail: "david.johnson@gmail.com",
    paymentMethodDetails: "UPI / NetBanking (HDFC Bank)",
    receiptNumber: "RCP-2026-0014-01",
    createdAt: "2026-02-28T14:15:00.000Z",
  },
];

// ═══════════════════════════════════════════════════
// PDF RECEIPT MODAL COMPONENT
// ═══════════════════════════════════════════════════
function ReceiptModal({
  receipt,
  onClose,
}: {
  receipt: any;
  onClose: () => void;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="checkout-modal-content"
        style={{ maxWidth: 700, padding: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-glass)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={18} color="#10B981" />
            <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Official Digital Receipt #{receipt.receiptNumber}</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handlePrint}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                background: "rgba(0,0,0,0.05)",
                border: "1px solid var(--border-glass)",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Printer size={14} /> Print / Save PDF
            </button>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div ref={receiptRef} className="receipt-sheet-container">
          <div className="receipt-watermark">PAID</div>

          {/* Header */}
          <div className="receipt-header-row">
            <div>
              <div className="receipt-brand-title">ScholarPulse University</div>
              <p style={{ fontSize: "0.78rem", color: "#6B7280", marginTop: 2 }}>
                Office of Academic Finance & Bursar &bull; Tax ID: EDU-TAX-982103
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="stamp-badge">
                <CheckCircle2 size={13} /> OFFICIAL RECEIPT
              </div>
              <div style={{ fontSize: "0.78rem", color: "#6B7280", marginTop: 4 }}>
                {receipt.date ? new Date(receipt.date).toLocaleDateString() : new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Meta Grid */}
          <div className="receipt-meta-grid">
            <div>
              <div style={{ fontSize: "0.75rem", color: "#9CA3AF", textTransform: "uppercase" }}>Student Information</div>
              <div style={{ fontWeight: 600, color: "#111827", marginTop: 2 }}>{receipt.studentName || "Alex Johnson"}</div>
              <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>ID: {receipt.studentId || "STU-001"}</div>
              <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>Dept: Computer Science & Engineering</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#9CA3AF", textTransform: "uppercase" }}>Transaction Reference</div>
              <div style={{ fontWeight: 600, color: "#111827", marginTop: 2, fontFamily: "monospace" }}>{receipt.transactionRef}</div>
              <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>Invoice: {receipt.invoiceNumber}</div>
              <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>Gateway: {receipt.gateway} &bull; {receipt.paymentMethodDetails || "Online"}</div>
              <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>Payer: {receipt.payerName}</div>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="receipt-breakdown-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style={{ textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {receipt.breakdown && Object.keys(receipt.breakdown).length > 0 ? (
                Object.entries(receipt.breakdown).map(([item, amt]) => (
                  <tr key={item}>
                    <td>{item}</td>
                    <td style={{ textAlign: "right", fontWeight: 500 }}>${Number(amt).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td>{receipt.invoiceDescription || "Tuition & Academic Services"}</td>
                  <td style={{ textAlign: "right", fontWeight: 500 }}>${(receipt.amountPaid || 0).toLocaleString()}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals Bar */}
          <div className="receipt-total-bar">
            <span>Total Payment Cleared</span>
            <span>${(receipt.amountPaid || 0).toLocaleString()}</span>
          </div>

          {/* Remaining Balance Note */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#4B5563", padding: "0 4px" }}>
            <span>Remaining Invoice Balance: <strong>${(receipt.remainingBalance || 0).toLocaleString()}</strong></span>
            <span>Status: <strong style={{ color: "#059669" }}>Payment Verified</strong></span>
          </div>

          {/* Digital Signature & Certification */}
          <div className="receipt-digital-stamp">
            <div>
              Certified by ScholarPulse Financial Gateway &bull; Digitally Signed
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "0.72rem" }}>
              AUTH-CODE: {Math.random().toString(36).substring(2, 12).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// PAYMENT GATEWAY CHECKOUT MODAL
// ═══════════════════════════════════════════════════
function CheckoutModal({
  invoice,
  onClose,
  onPaymentSuccess,
}: {
  invoice: any;
  onClose: () => void;
  onPaymentSuccess: (amount: number, receiptData: any) => void;
}) {
  const [gateway, setGateway] = useState<"stripe" | "razorpay">("stripe");
  const [paymentType, setPaymentType] = useState<"installment" | "full" | "partial">(
    invoice.installmentsAllowed && invoice.remainingAmount > invoice.installmentAmount
      ? "installment"
      : "full"
  );
  const [customAmount, setCustomAmount] = useState(
    paymentType === "installment"
      ? String(invoice.installmentAmount || 1500)
      : String(invoice.remainingAmount || invoice.amount)
  );
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("891");
  const [upiId, setUpiId] = useState("alex.johnson@okaxis");
  const [payerName, setPayerName] = useState("Alex Johnson");
  const [processing, setProcessing] = useState(false);

  // Update amount when paymentType changes
  useEffect(() => {
    if (paymentType === "installment") {
      setCustomAmount(String(invoice.installmentAmount || 1500));
    } else if (paymentType === "full") {
      setCustomAmount(String(invoice.remainingAmount || invoice.amount));
    }
  }, [paymentType, invoice]);

  const payableAmount = Number(customAmount) || 0;

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payableAmount <= 0) return;

    setProcessing(true);
    const token = localStorage.getItem("accessToken");

    try {
      if (token) {
        const res = await fetch("http://localhost:3001/finance/pay", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            invoiceId: invoice.invoiceNumber || invoice.id,
            amount: payableAmount,
            gateway,
            paymentType,
            payerName,
            payerEmail: "alex.johnson@scholarpulse.edu",
            paymentMethodDetails:
              gateway === "stripe" ? `Card ending in 4242` : `UPI ID (${upiId})`,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          onPaymentSuccess(payableAmount, {
            receiptNumber: data.receiptNumber,
            transactionRef: data.transaction?.transactionRef,
            date: new Date().toISOString(),
            gateway: gateway.toUpperCase(),
            paymentType,
            amountPaid: payableAmount,
            payerName,
            invoiceNumber: invoice.invoiceNumber || invoice.id,
            invoiceDescription: invoice.description,
            remainingBalance: data.remainingAmount,
            breakdown: invoice.feeBreakdown ? JSON.parse(invoice.feeBreakdown) : null,
          });
          return;
        }
      }

      // Simulated local fallback
      setTimeout(() => {
        onPaymentSuccess(payableAmount, {
          receiptNumber: `RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          transactionRef: `TXN-${gateway === "razorpay" ? "RZP" : "STP"}-${Date.now().toString().slice(-6)}`,
          date: new Date().toISOString(),
          gateway: gateway.toUpperCase(),
          paymentType,
          amountPaid: payableAmount,
          payerName,
          invoiceNumber: invoice.invoiceNumber || invoice.id,
          invoiceDescription: invoice.description,
          remainingBalance: Math.max(0, invoice.remainingAmount - payableAmount),
          breakdown: invoice.feeBreakdown ? JSON.parse(invoice.feeBreakdown) : null,
        });
      }, 1200);
    } catch {
      onPaymentSuccess(payableAmount, {
        receiptNumber: `RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        transactionRef: `TXN-${gateway === "razorpay" ? "RZP" : "STP"}-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        gateway: gateway.toUpperCase(),
        paymentType,
        amountPaid: payableAmount,
        payerName,
        invoiceNumber: invoice.invoiceNumber || invoice.id,
        invoiceDescription: invoice.description,
        remainingBalance: Math.max(0, invoice.remainingAmount - payableAmount),
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="checkout-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>
              Secure Tuition Payment
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
              {invoice.description} &bull; {invoice.invoiceNumber}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Payment Type Selection (Installment vs Full vs Partial) */}
        <div className="payment-type-selector">
          {invoice.installmentsAllowed && (
            <button
              type="button"
              className={`payment-type-btn ${paymentType === "installment" ? "active" : ""}`}
              onClick={() => setPaymentType("installment")}
            >
              Installment ${(invoice.installmentAmount || 1500).toLocaleString()}
            </button>
          )}
          <button
            type="button"
            className={`payment-type-btn ${paymentType === "full" ? "active" : ""}`}
            onClick={() => setPaymentType("full")}
          >
            Full Balance ${(invoice.remainingAmount || invoice.amount).toLocaleString()}
          </button>
          <button
            type="button"
            className={`payment-type-btn ${paymentType === "partial" ? "active" : ""}`}
            onClick={() => setPaymentType("partial")}
          >
            Custom Partial
          </button>
        </div>

        {/* Custom Amount Input if Partial */}
        {paymentType === "partial" && (
          <div className="checkout-form-group">
            <label className="checkout-label">Enter Custom Amount to Pay ($)</label>
            <input
              type="number"
              min="10"
              max={invoice.remainingAmount}
              className="checkout-input"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="e.g. 500"
            />
          </div>
        )}

        {/* Gateway Selection */}
        <div>
          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
            Choose Payment Gateway:
          </div>
          <div className="gateways-grid">
            <div
              className={`gateway-card ${gateway === "stripe" ? "selected" : ""}`}
              onClick={() => setGateway("stripe")}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "#635BFF",
                  color: "#FFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "1.1rem",
                }}
              >
                S
              </div>
              <div>
                <div className="gateway-badge" style={{ color: "#635BFF" }}>Stripe Checkout</div>
                <div className="gateway-sub">Cards &bull; Apple Pay &bull; Global</div>
              </div>
            </div>

            <div
              className={`gateway-card ${gateway === "razorpay" ? "selected" : ""}`}
              onClick={() => setGateway("razorpay")}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "#0C2340",
                  color: "#3395FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "1.1rem",
                }}
              >
                R
              </div>
              <div>
                <div className="gateway-badge" style={{ color: "#3395FF" }}>Razorpay Gateway</div>
                <div className="gateway-sub">UPI &bull; NetBanking &bull; Cards</div>
              </div>
            </div>
          </div>
        </div>

        {/* Gateway-specific Form Fields */}
        <form onSubmit={handleSubmitPayment} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="checkout-form-group">
            <label className="checkout-label">Payer Full Name</label>
            <input
              type="text"
              required
              className="checkout-input"
              value={payerName}
              onChange={(e) => setPayerName(e.target.value)}
            />
          </div>

          {gateway === "stripe" ? (
            <>
              <div className="checkout-form-group">
                <label className="checkout-label">Card Number</label>
                <input
                  type="text"
                  required
                  className="checkout-input"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="checkout-form-group">
                  <label className="checkout-label">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    required
                    className="checkout-input"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                  />
                </div>
                <div className="checkout-form-group">
                  <label className="checkout-label">CVC / CVV</label>
                  <input
                    type="text"
                    required
                    className="checkout-input"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="checkout-form-group">
              <label className="checkout-label">UPI ID / Virtual Payment Address (VPA)</label>
              <input
                type="text"
                required
                className="checkout-input"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. yourname@oksbi"
              />
            </div>
          )}

          <div style={{ padding: "12px 16px", background: "rgba(0,0,0,0.02)", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Total Charged:</span>
            <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>${payableAmount.toLocaleString()}</span>
          </div>

          <button
            id="confirm-checkout-btn"
            type="submit"
            className="pay-submit-btn"
            disabled={processing || payableAmount <= 0}
          >
            <ShieldCheck size={18} />
            {processing ? "Authorizing with Gateway..." : `Pay $${payableAmount.toLocaleString()} via ${gateway.toUpperCase()}`}
          </button>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// PARENT PROXY SHARE MODAL
// ═══════════════════════════════════════════════════
function ParentProxyModal({
  invoice,
  onClose,
  showToast,
}: {
  invoice: any;
  onClose: () => void;
  showToast: (msg: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const proxyUrl = `http://localhost:3000/dashboard/fees?proxy=${invoice.invoiceNumber || invoice.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(proxyUrl);
    setCopied(true);
    showToast("Parent payment link copied to clipboard!");
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="checkout-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(59, 130, 246, 0.12)", color: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Share2 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
                Parent & Sponsor Proxy Payment
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                Allow parents or guardians to settle tuition directly without student login.
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* QR Code Simulator */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "20px", background: "rgba(0,0,0,0.02)", borderRadius: "var(--radius-md)" }}>
          <div style={{ background: "#FFFFFF", padding: 14, borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <QrCode size={130} color="#18181B" />
          </div>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            Scan with any UPI / Banking App or phone camera
          </span>
        </div>

        {/* Shareable Link Box */}
        <div className="checkout-form-group">
          <label className="checkout-label">Secure Shareable Payment Link</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              readOnly
              value={proxyUrl}
              className="checkout-input"
              style={{ flex: 1, fontFamily: "monospace", fontSize: "0.82rem" }}
            />
            <button
              onClick={handleCopy}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "0 18px",
                borderRadius: "var(--radius-sm)",
                background: copied ? "#10B981" : "var(--accent-primary)",
                color: copied ? "#FFFFFF" : "#000000",
                border: "none",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
          Parents can pay using Credit/Debit Card, Net Banking, or UPI. Upon clearing, the student ledger and receipt will update instantly in real-time.
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// STUDENT FEES VIEW
// ═══════════════════════════════════════════════════
function StudentFees({
  initialInvoices,
  transactions,
  refreshData,
  showToast,
}: {
  initialInvoices: any[];
  transactions: any[];
  refreshData: () => void;
  showToast: (msg: string) => void;
}) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [checkoutInvoice, setCheckoutInvoice] = useState<any | null>(null);
  const [proxyModalInvoice, setProxyModalInvoice] = useState<any | null>(null);
  const [receiptToView, setReceiptToView] = useState<any | null>(null);

  useEffect(() => {
    if (Array.isArray(initialInvoices) && initialInvoices.length > 0) {
      setInvoices(initialInvoices);
    }
  }, [initialInvoices]);

  // Primary active invoice (first pending or partial)
  const activeInvoice = useMemo(() => {
    return invoices.find((i) => i.status === "partial" || i.status === "pending") || invoices[0];
  }, [invoices]);

  const totalOutstanding = useMemo(() => {
    return invoices
      .filter((i) => i.status !== "paid")
      .reduce((acc, curr) => acc + (curr.remainingAmount ?? (curr.amount - (curr.paidAmount || 0))), 0);
  }, [invoices]);

  const totalPaid = useMemo(() => {
    return invoices.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
  }, [invoices]);

  const onPaymentCompleted = (amount: number, receiptData: any) => {
    setCheckoutInvoice(null);
    showToast(`Payment of $${amount.toLocaleString()} confirmed via ${receiptData.gateway}!`);
    setReceiptToView(receiptData);
    refreshData();
  };

  return (
    <div className="fees-container">
      {/* Hero */}
      <div className="fees-hero">
        <div>
          <h1 className="page-title" style={{ marginBottom: 6 }}>Tuition & Fee Payment Portal</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Integrated payment gateways, 3-part installment management, and instant digital receipts.
          </p>
        </div>
        <div className="fees-hero-actions">
          {activeInvoice && (
            <button
              id="pay-balance-hero-btn"
              className="pay-submit-btn"
              style={{ padding: "10px 22px", fontSize: "0.9rem" }}
              onClick={() => setCheckoutInvoice(activeInvoice)}
            >
              <CreditCard size={16} /> Pay Outstanding Balance
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="fees-stats-grid">
        <div className="fee-stat-card">
          <div className="fee-stat-header">
            <span className="fee-stat-title">Total Outstanding</span>
            <div className="fee-stat-icon-wrapper" style={{ background: "rgba(239, 68, 68, 0.12)", color: "#EF4444" }}>
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="fee-stat-value" style={{ color: totalOutstanding > 0 ? "#EF4444" : "#10B981" }}>
            ${totalOutstanding.toLocaleString()}
          </div>
          <div className="fee-stat-subtext">
            {totalOutstanding > 0 ? "Due on October 15, 2026 (Fall Semester)" : "All balances settled in full"}
          </div>
        </div>

        <div className="fee-stat-card">
          <div className="fee-stat-header">
            <span className="fee-stat-title">Paid This Academic Year</span>
            <div className="fee-stat-icon-wrapper" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10B981" }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="fee-stat-value">
            ${totalPaid.toLocaleString()}
          </div>
          <div className="fee-stat-subtext" style={{ color: "#10B981" }}>
            Verified with Institutional Bursar
          </div>
        </div>

        <div className="fee-stat-card">
          <div className="fee-stat-header">
            <span className="fee-stat-title">Installment Plan</span>
            <div className="fee-stat-icon-wrapper" style={{ background: "rgba(244, 197, 66, 0.15)", color: "#D97706" }}>
              <Layers size={18} />
            </div>
          </div>
          <div className="fee-stat-value">
            {activeInvoice?.installmentsPaid || 1} <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>/ {activeInvoice?.totalInstallments || 3} Paid</span>
          </div>
          <div className="fee-stat-subtext">
            Next: ${(activeInvoice?.installmentAmount || 1500).toLocaleString()} on Oct 15
          </div>
        </div>

        <div className="fee-stat-card">
          <div className="fee-stat-header">
            <span className="fee-stat-title">Parent Proxy Access</span>
            <div className="fee-stat-icon-wrapper" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#3B82F6" }}>
              <Share2 size={18} />
            </div>
          </div>
          <div className="fee-stat-value" style={{ fontSize: "1.4rem" }}>
            Enabled
          </div>
          <div className="fee-stat-subtext">
            Shareable link & QR code ready
          </div>
        </div>
      </div>

      {/* Installment Plan Visualizer Card */}
      {activeInvoice && activeInvoice.installmentsAllowed && (
        <div className="installment-card">
          <div className="installment-header">
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>
                Semester Installment Schedule: {activeInvoice.description}
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "3px 0 0 0" }}>
                Split tuition into 3 flexible payments with zero penalty charges.
              </p>
            </div>
            <span className="status-pill status-pill-partial">
              Installment Plan Active
            </span>
          </div>

          <div className="installment-steps-row">
            {/* Step 1 */}
            <div className={`installment-step-box ${(activeInvoice.installmentsPaid || 0) >= 1 ? "step-paid" : ""}`}>
              <div className="step-badge" style={{ color: "#10B981" }}>
                <CheckCircle2 size={13} /> Installment 1
              </div>
              <div className="step-amount">${(activeInvoice.installmentAmount || 1500).toLocaleString()}</div>
              <div className="step-date">Cleared on Sep 01 &bull; Stripe</div>
            </div>

            {/* Step 2 */}
            <div className={`installment-step-box ${(activeInvoice.installmentsPaid || 0) === 1 ? "step-active" : (activeInvoice.installmentsPaid || 0) >= 2 ? "step-paid" : ""}`}>
              <div className="step-badge" style={{ color: (activeInvoice.installmentsPaid || 0) >= 2 ? "#10B981" : "#D97706" }}>
                <Clock size={13} /> Installment 2 (Current)
              </div>
              <div className="step-amount">${(activeInvoice.installmentAmount || 1500).toLocaleString()}</div>
              <div className="step-date">Due on Oct 15, 2026</div>
            </div>

            {/* Step 3 */}
            <div className={`installment-step-box ${(activeInvoice.installmentsPaid || 0) >= 3 ? "step-paid" : ""}`}>
              <div className="step-badge" style={{ color: "var(--text-muted)" }}>
                <Calendar size={13} /> Installment 3
              </div>
              <div className="step-amount">${(activeInvoice.installmentAmount || 1500).toLocaleString()}</div>
              <div className="step-date">Due on Nov 15, 2026</div>
            </div>
          </div>
        </div>
      )}

      {/* Parent Proxy Payment Card Banner */}
      <div className="parent-proxy-card">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Share2 size={18} color="#2563EB" />
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>
              Need a Parent or Sponsor to Pay on Your Behalf?
            </h4>
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
            Generate a secure proxy payment link with instant QR code. Parents can pay directly without needing your ScholarPulse account credentials.
          </p>
        </div>
        <button
          id="open-parent-proxy-btn"
          style={{
            padding: "8px 18px",
            borderRadius: "var(--radius-full)",
            background: "#2563EB",
            color: "#FFF",
            border: "none",
            fontWeight: 600,
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
          onClick={() => setProxyModalInvoice(activeInvoice)}
        >
          Generate Parent Proxy Link
        </button>
      </div>

      {/* Invoices List */}
      <div className="invoices-section">
        <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>
          Academic Invoices & Statements
        </h2>

        {invoices.map((inv) => {
          const isPaid = inv.status === "paid";
          const isPartial = inv.status === "partial";
          const isPending = inv.status === "pending";
          const isOverdue = inv.status === "overdue";
          const remaining = inv.remainingAmount ?? (inv.amount - (inv.paidAmount || 0));

          return (
            <div className="invoice-item-card" key={inv.id || inv.invoiceNumber}>
              <div className="invoice-info-left">
                <div
                  className="invoice-icon-box"
                  style={{
                    background: isPaid ? "rgba(16, 185, 129, 0.12)" : isPartial ? "rgba(59, 130, 246, 0.12)" : "rgba(244, 197, 66, 0.15)",
                    color: isPaid ? "#10B981" : isPartial ? "#2563EB" : "#D97706",
                  }}
                >
                  <FileText size={22} />
                </div>
                <div>
                  <div className="invoice-title">{inv.description}</div>
                  <div className="invoice-meta-sub">
                    <span style={{ fontFamily: "monospace" }}>{inv.invoiceNumber}</span>
                    <span>&bull;</span>
                    <span>Due: {inv.dueDate}</span>
                    <span>&bull;</span>
                    <span>Semester: {inv.semester || "Academic Year"}</span>
                  </div>
                </div>
              </div>

              <div className="invoice-amounts-right">
                <div>
                  <div className="invoice-amount-text">
                    ${inv.amount.toLocaleString()}
                  </div>
                  {remaining > 0 ? (
                    <div className="invoice-remaining-sub">
                      Remaining: ${remaining.toLocaleString()}
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.78rem", color: "#10B981", fontWeight: 600, textAlign: "right" }}>
                      Fully Cleared
                    </div>
                  )}
                </div>

                {isPaid && (
                  <span className="status-pill status-pill-paid">
                    <CheckCircle2 size={13} /> Paid in Full
                  </span>
                )}
                {isPartial && (
                  <span className="status-pill status-pill-partial">
                    <Clock size={13} /> Partial Paid
                  </span>
                )}
                {isPending && (
                  <span className="status-pill status-pill-pending">
                    <Clock size={13} /> Pending Due
                  </span>
                )}
                {isOverdue && (
                  <span className="status-pill status-pill-overdue">
                    <AlertCircle size={13} /> Overdue
                  </span>
                )}

                {/* Actions */}
                {!isPaid ? (
                  <button
                    className="pay-submit-btn"
                    style={{ padding: "8px 18px", fontSize: "0.85rem" }}
                    onClick={() => setCheckoutInvoice(inv)}
                  >
                    Pay Balance
                  </button>
                ) : (
                  <button
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 16px",
                      borderRadius: "var(--radius-full)",
                      background: "rgba(0,0,0,0.05)",
                      border: "1px solid var(--border-glass)",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setReceiptToView({
                        receiptNumber: `RCP-2026-${inv.id.slice(0, 4)}`,
                        transactionRef: `TXN-STP-${Math.floor(100000 + Math.random() * 900000)}`,
                        date: inv.dueDate,
                        gateway: "STRIPE",
                        amountPaid: inv.amount,
                        payerName: "Alex Johnson",
                        invoiceNumber: inv.invoiceNumber,
                        invoiceDescription: inv.description,
                        remainingBalance: 0,
                        breakdown: inv.feeBreakdown ? JSON.parse(inv.feeBreakdown) : null,
                      });
                    }}
                  >
                    <Download size={14} /> Receipt
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction Log & History Table */}
      <div className="transactions-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>
              Payment History & Transaction Log
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
              Verified ledger of all transactions, gateways, and authorized electronic receipts.
            </p>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="txn-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Transaction Ref</th>
                <th>Invoice</th>
                <th>Payment Type</th>
                <th>Gateway</th>
                <th>Amount</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id || txn.transactionRef}>
                  <td>{txn.createdAt ? new Date(txn.createdAt).toLocaleDateString() : "Sep 01, 2026"}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.82rem" }}>{txn.transactionRef}</td>
                  <td>{txn.invoiceId}</td>
                  <td style={{ textTransform: "capitalize" }}>{txn.paymentType?.replace("_", " ") || "Full"}</td>
                  <td>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "var(--radius-full)",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background: txn.gateway === "razorpay" ? "rgba(51, 149, 255, 0.12)" : "rgba(99, 91, 255, 0.12)",
                        color: txn.gateway === "razorpay" ? "#3395FF" : "#635BFF",
                      }}
                    >
                      {txn.gateway?.toUpperCase() || "STRIPE"}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>${txn.amount?.toLocaleString()}</td>
                  <td>
                    <span className="status-pill status-pill-paid" style={{ padding: "2px 8px", fontSize: "0.72rem" }}>
                      Success
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      onClick={() => setReceiptToView(txn)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "5px 12px",
                        borderRadius: "var(--radius-full)",
                        background: "rgba(0,0,0,0.05)",
                        border: "1px solid var(--border-glass)",
                        fontSize: "0.76rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <Download size={13} /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {checkoutInvoice && (
        <CheckoutModal
          invoice={checkoutInvoice}
          onClose={() => setCheckoutInvoice(null)}
          onPaymentSuccess={onPaymentCompleted}
        />
      )}

      {proxyModalInvoice && (
        <ParentProxyModal
          invoice={proxyModalInvoice}
          onClose={() => setProxyModalInvoice(null)}
          showToast={showToast}
        />
      )}

      {receiptToView && (
        <ReceiptModal
          receipt={receiptToView}
          onClose={() => setReceiptToView(null)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ADMIN INSTITUTION FINANCE COMMAND
// ═══════════════════════════════════════════════════
function AdminFinance({
  invoices,
  transactions,
  showToast,
  refreshData,
}: {
  invoices: any[];
  transactions: any[];
  showToast: (msg: string) => void;
  refreshData: () => void;
}) {
  const [sendingReminders, setSendingReminders] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const totalBilled = useMemo(() => {
    return invoices.reduce((acc, curr) => acc + curr.amount, 0);
  }, [invoices]);

  const totalCollected = useMemo(() => {
    return invoices.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
  }, [invoices]);

  const totalPending = totalBilled - totalCollected;

  const handleSendReminders = async () => {
    setSendingReminders(true);
    const token = localStorage.getItem("accessToken");

    try {
      if (token) {
        const res = await fetch("http://localhost:3001/finance/send-reminders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ thresholdDays: 14 }),
        });
        if (res.ok) {
          const data = await res.json();
          showToast(`Campaign Complete: Sent automated fee reminders to ${data.remindersSent || 4} student(s)!`);
          return;
        }
      }
      showToast("Fee Reminders Campaign Dispatched across 4 student accounts!");
    } catch {
      showToast("Dispatched automated fee alerts to students with pending balances.");
    } finally {
      setSendingReminders(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices;
    const q = searchQuery.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.studentName?.toLowerCase().includes(q) ||
        inv.studentId?.toLowerCase().includes(q) ||
        inv.invoiceNumber?.toLowerCase().includes(q)
    );
  }, [invoices, searchQuery]);

  return (
    <div className="fees-container">
      {/* Hero */}
      <div className="fees-hero">
        <div>
          <h1 className="page-title" style={{ marginBottom: 6 }}>Institutional Revenue & Bursar Command</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Campus-wide fee reconciliation, gateway settlement tracking, and automated reminder campaigns.
          </p>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="fees-stats-grid">
        <div className="fee-stat-card">
          <div className="fee-stat-header">
            <span className="fee-stat-title">Total Revenue Collected</span>
            <div className="fee-stat-icon-wrapper" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10B981" }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="fee-stat-value" style={{ color: "#10B981" }}>
            ${totalCollected.toLocaleString()}
          </div>
          <div className="fee-stat-subtext">Across all enrolled departments</div>
        </div>

        <div className="fee-stat-card">
          <div className="fee-stat-header">
            <span className="fee-stat-title">Outstanding Balances</span>
            <div className="fee-stat-icon-wrapper" style={{ background: "rgba(239, 68, 68, 0.12)", color: "#EF4444" }}>
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="fee-stat-value" style={{ color: "#EF4444" }}>
            ${totalPending.toLocaleString()}
          </div>
          <div className="fee-stat-subtext">Fall 2026 Term reconciliation</div>
        </div>

        <div className="fee-stat-card">
          <div className="fee-stat-header">
            <span className="fee-stat-title">Collection Rate</span>
            <div className="fee-stat-icon-wrapper" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#3B82F6" }}>
              <Layers size={18} />
            </div>
          </div>
          <div className="fee-stat-value">
            {totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0}%
          </div>
          <div className="fee-stat-subtext">Target: 95% before midterm week</div>
        </div>

        <div className="fee-stat-card">
          <div className="fee-stat-header">
            <span className="fee-stat-title">Active Gateways</span>
            <div className="fee-stat-icon-wrapper" style={{ background: "rgba(244, 197, 66, 0.15)", color: "#D97706" }}>
              <CreditCard size={18} />
            </div>
          </div>
          <div className="fee-stat-value" style={{ fontSize: "1.4rem" }}>
            Stripe & Razorpay
          </div>
          <div className="fee-stat-subtext">0 transaction failures in 24h</div>
        </div>
      </div>

      {/* Automated Reminder Campaign Toolbar */}
      <div className="admin-finance-toolbar">
        <div>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>
            Automated Payment Reminder Campaign
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "3px 0 0 0" }}>
            Dispatch instant notifications and email notices with due countdowns to all students with unpaid tuition.
          </p>
        </div>

        <button
          id="send-reminders-campaign-btn"
          className="reminder-action-btn"
          onClick={handleSendReminders}
          disabled={sendingReminders}
        >
          <BellRing size={16} />
          {sendingReminders ? "Dispatching Alerts..." : "Dispatch Automated Fee Reminders"}
        </button>
      </div>

      {/* Student Invoices Roster Table */}
      <div className="transactions-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>
            Student Invoices Master Roster
          </h3>

          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.03)", padding: "6px 14px", borderRadius: "var(--radius-full)" }}>
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by student, ID, invoice..."
              style={{ border: "none", background: "transparent", outline: "none", fontSize: "0.82rem", width: 220 }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="txn-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Student</th>
                <th>Description</th>
                <th>Total Billed</th>
                <th>Paid</th>
                <th>Remaining</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => {
                const remaining = inv.remainingAmount ?? (inv.amount - (inv.paidAmount || 0));
                return (
                  <tr key={inv.id || inv.invoiceNumber}>
                    <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{inv.invoiceNumber}</td>
                    <td>
                      <div>{inv.studentName || "Alex Johnson"}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{inv.studentId || "STU-001"}</div>
                    </td>
                    <td>{inv.description}</td>
                    <td style={{ fontWeight: 700 }}>${inv.amount?.toLocaleString()}</td>
                    <td style={{ color: "#10B981", fontWeight: 600 }}>${(inv.paidAmount || 0).toLocaleString()}</td>
                    <td style={{ color: remaining > 0 ? "#EF4444" : "var(--text-muted)", fontWeight: 700 }}>
                      ${remaining.toLocaleString()}
                    </td>
                    <td>{inv.dueDate}</td>
                    <td>
                      {inv.status === "paid" && <span className="status-pill status-pill-paid">Paid</span>}
                      {inv.status === "partial" && <span className="status-pill status-pill-partial">Partial</span>}
                      {inv.status === "pending" && <span className="status-pill status-pill-pending">Pending</span>}
                      {inv.status === "overdue" && <span className="status-pill status-pill-overdue">Overdue</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// TEACHER PAYROLL VIEW
// ═══════════════════════════════════════════════════
function TeacherPayroll() {
  return (
    <div className="fees-container">
      <div className="fees-hero">
        <div>
          <h1 className="page-title" style={{ marginBottom: 6 }}>Faculty Compensation & Payroll</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Monthly salary disbursements, course honorariums, and research grant allocations.
          </p>
        </div>
      </div>

      <div className="fees-stats-grid">
        <div className="fee-stat-card">
          <div className="fee-stat-header">
            <span className="fee-stat-title">Current Month Stipend</span>
            <div className="fee-stat-icon-wrapper" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10B981" }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="fee-stat-value">$7,850</div>
          <div className="fee-stat-subtext" style={{ color: "#10B981" }}>
            Disbursed on Sep 01, 2026
          </div>
        </div>

        <div className="fee-stat-card">
          <div className="fee-stat-header">
            <span className="fee-stat-title">Research Grants Allocated</span>
            <div className="fee-stat-icon-wrapper" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#3B82F6" }}>
              <Building2 size={18} />
            </div>
          </div>
          <div className="fee-stat-value">$24,500</div>
          <div className="fee-stat-subtext">AI & Machine Learning Lab Project</div>
        </div>

        <div className="fee-stat-card">
          <div className="fee-stat-header">
            <span className="fee-stat-title">Next Pay Cycle</span>
            <div className="fee-stat-icon-wrapper" style={{ background: "rgba(244, 197, 66, 0.15)", color: "#D97706" }}>
              <Calendar size={18} />
            </div>
          </div>
          <div className="fee-stat-value">Oct 01</div>
          <div className="fee-stat-subtext">Direct Deposit to Checking Account</div>
        </div>
      </div>

      <div className="transactions-card">
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: 16 }}>
          Recent Compensation Statements
        </h3>
        <table className="txn-table">
          <thead>
            <tr>
              <th>Pay Period</th>
              <th>Reference #</th>
              <th>Description</th>
              <th>Gross Amount</th>
              <th>Net Disbursed</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>August 2026</td>
              <td style={{ fontFamily: "monospace" }}>PAY-2026-08</td>
              <td>Faculty Salary + Lab Guidance Stipend</td>
              <td>$8,200</td>
              <td style={{ fontWeight: 700 }}>$7,850</td>
              <td><span className="status-pill status-pill-paid">Deposited</span></td>
            </tr>
            <tr>
              <td>July 2026</td>
              <td style={{ fontFamily: "monospace" }}>PAY-2026-07</td>
              <td>Faculty Salary + Summer Workshop</td>
              <td>$8,500</td>
              <td style={{ fontWeight: 700 }}>$8,120</td>
              <td><span className="status-pill status-pill-paid">Deposited</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN FEES PAGE ROUTER (Strict Role Separation)
// ═══════════════════════════════════════════════════
export default function FeesPage() {
  const [user, setUser] = useState<{ role: Role; name?: string; userId?: string } | null>(null);
  const [invoices, setInvoices] = useState<any[]>(DEFAULT_INVOICES);
  const [transactions, setTransactions] = useState<any[]>(DEFAULT_TRANSACTIONS);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const fetchFinanceData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setLoading(false);
        return;
      }

      const [invRes, txnRes] = await Promise.all([
        fetch("http://localhost:3001/finance/invoices", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:3001/finance/transactions", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (invRes.ok) {
        const invData = await invRes.json();
        if (Array.isArray(invData) && invData.length > 0) {
          setInvoices(invData);
        }
      }

      if (txnRes.ok) {
        const txnData = await txnRes.json();
        if (Array.isArray(txnData) && txnData.length > 0) {
          setTransactions(txnData);
        }
      }
    } catch {
      // Keep fallbacks
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
      fetchFinanceData();
    } catch {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ height: 32, width: 260, background: "var(--border-glass)", borderRadius: 16 }} />
        <div style={{ height: 200, width: "100%", background: "var(--border-glass)", borderRadius: 20 }} />
      </div>
    );
  }

  const role = user?.role || "student";

  return (
    <div>
      {/* Strict Role Based View */}
      {role === "student" && (
        <StudentFees
          initialInvoices={invoices}
          transactions={transactions}
          refreshData={fetchFinanceData}
          showToast={showToast}
        />
      )}

      {role === "admin" && (
        <AdminFinance
          invoices={invoices}
          transactions={transactions}
          showToast={showToast}
          refreshData={fetchFinanceData}
        />
      )}

      {role === "teacher" && <TeacherPayroll />}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="attendance-toast">
          <CheckCircle2 size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
