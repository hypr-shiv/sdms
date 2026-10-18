"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Search,
  FileText,
  Award,
  Calendar,
  MessageSquare,
  Bell,
  Shield,
  BookOpen,
  Inbox,
  Filter,
  Plus,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import EmptyState, {
  EmptyStateTableRow,
  EmptyStateVariant,
} from "@/components/UI/EmptyState";
import "../dashboard.css";

export default function EmptyStatesShowcasePage() {
  const [selectedVariant, setSelectedVariant] = useState<EmptyStateVariant>("assignments");
  const [isCompact, setIsCompact] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customDesc, setCustomDesc] = useState("");

  const VARIANTS: { id: EmptyStateVariant; label: string; icon: any }[] = [
    { id: "assignments", label: "Assignments", icon: <FileText size={16} /> },
    { id: "grades", label: "Grades", icon: <Award size={16} /> },
    { id: "attendance", label: "Attendance", icon: <Calendar size={16} /> },
    { id: "messages", label: "Messages", icon: <MessageSquare size={16} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
    { id: "audit", label: "Audit Ledger", icon: <Shield size={16} /> },
    { id: "courses", label: "Course Catalog", icon: <BookOpen size={16} /> },
    { id: "search", label: "Search & Filter", icon: <Search size={16} /> },
    { id: "general", label: "General Fallback", icon: <Inbox size={16} /> },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
      {/* ─── Page Header ─── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              background: "rgba(99, 102, 241, 0.15)",
              color: "#a5b4fc",
              border: "1px solid rgba(99, 102, 241, 0.3)",
            }}
          >
            <Sparkles size={12} /> Design System Component
          </span>
        </div>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, margin: "0 0 6px", color: "var(--text-primary)" }}>
          Empty State Component System
        </h1>
        <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.92rem", maxWidth: 640 }}>
          Consistent, accessible, and high-impact empty states with variant-tailored ambient backglows, Lucide icon boxes, and call-to-action triggers across ScholarPulse.
        </p>
      </div>

      {/* ─── Interactive Playground Controls ─── */}
      <div
        className="card"
        style={{
          padding: "20px 24px",
          marginBottom: 32,
          background: "var(--bg-card)",
          borderRadius: 16,
          border: "1px solid var(--border-primary)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 4px" }}>Preset Variant Switcher</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
              Select a domain preset to see its dedicated theme, copy, and icons.
            </p>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={isCompact}
              onChange={(e) => setIsCompact(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "var(--accent-primary)" }}
            />
            Compact Mode (Widget / Drawer)
          </label>
        </div>

        {/* Variant chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVariant(v.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 10,
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: selectedVariant === v.id ? "var(--accent-primary, #6366f1)" : "rgba(255,255,255,0.05)",
                color: selectedVariant === v.id ? "#ffffff" : "var(--text-secondary)",
                border: selectedVariant === v.id ? "1px solid var(--accent-primary, #6366f1)" : "1px solid var(--border-primary)",
              }}
            >
              {v.icon}
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Live Preview Container ─── */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 12, color: "var(--text-primary)" }}>
          Live Preview: <span style={{ textTransform: "capitalize", color: "var(--accent-primary)" }}>{selectedVariant}</span>
        </h2>

        <div style={{ background: "var(--bg-secondary, rgba(0,0,0,0.2))", padding: 24, borderRadius: 16, border: "1px solid var(--border-primary)" }}>
          <EmptyState
            variant={selectedVariant}
            compact={isCompact}
            title={customTitle || undefined}
            description={customDesc || undefined}
            action={{
              label: selectedVariant === "assignments" ? "Create Assignment" : selectedVariant === "search" ? "Clear Filters" : "Take Action",
              onClick: () => alert(`Action clicked for ${selectedVariant} empty state!`),
              icon: selectedVariant === "assignments" ? <Plus size={14} /> : selectedVariant === "search" ? <RotateCcw size={14} /> : <ArrowRight size={14} />,
            }}
            secondaryAction={{
              label: "Documentation",
              href: "/dashboard",
            }}
          />
        </div>
      </div>

      {/* ─── Table Integration Example ─── */}
      <div>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 12, color: "var(--text-primary)" }}>
          Table Row Integration (<code style={{ color: "#a5b4fc" }}>&lt;EmptyStateTableRow colSpan=&#123;5&#125; /&gt;</code>)
        </h2>

        <div className="card" style={{ padding: 0, overflow: "hidden", borderRadius: 16, border: "1px solid var(--border-primary)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid var(--border-primary)" }}>
                <th style={{ padding: "12px 18px", color: "var(--text-secondary)" }}>Record ID</th>
                <th style={{ padding: "12px 18px", color: "var(--text-secondary)" }}>Student / Entity</th>
                <th style={{ padding: "12px 18px", color: "var(--text-secondary)" }}>Status</th>
                <th style={{ padding: "12px 18px", color: "var(--text-secondary)" }}>Timestamp</th>
                <th style={{ padding: "12px 18px", color: "var(--text-secondary)", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <EmptyStateTableRow
                colSpan={5}
                variant="search"
                title="No Matching Records in Gradebook / Ledger"
                description="Zero rows matched your active query. Broaden your search filters or click reset."
                action={{
                  label: "Reset Search Filters",
                  onClick: () => alert("Search filters reset!"),
                  icon: <RotateCcw size={13} />,
                }}
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
