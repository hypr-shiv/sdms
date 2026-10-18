"use client";

import { useState, useEffect, useCallback } from "react";
import { type Role } from "@/lib/mockData";
import {
  Shield, ShieldCheck, Lock, Download, Trash2, CheckCircle2,
  AlertTriangle, RefreshCw, Eye, Sparkles, UserCheck, FileText,
  Clock, Database, Check, X, ArrowRight, UserX, AlertOctagon, HelpCircle
} from "lucide-react";
import "../dashboard.css";
import "./compliance.css";

interface ComplianceStats {
  status: string;
  policyVersion: string;
  totalProtectedStudents: number;
  unauthorizedAttemptsBlocked: number;
}

interface RetentionPolicy {
  id: string;
  category: string;
  retentionDays: number;
  action: "PURGE" | "ANONYMIZE" | "ARCHIVE";
  isActive: boolean;
  description: string;
  lastExecutedAt?: string;
  recordsProcessedLastRun?: number;
}

interface ErasureRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  status: "PENDING" | "APPROVED" | "COMPLETED" | "REJECTED";
  reason: string;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  erasureLog?: string;
}

interface UserConsent {
  id: string;
  purpose: string;
  version: string;
  granted: boolean;
  grantedAt?: string;
  revokedAt?: string;
  description?: string;
}

interface ConsentSummary {
  purpose: string;
  grantedCount: number;
  totalCount: number;
  optInRate: number;
}

const PURPOSE_METADATA: Record<string, { label: string; desc: string; legalBasis: string }> = {
  ACADEMIC_ANALYTICS: {
    label: "Academic Analytics & Risk Prediction",
    desc: "Processes course engagement, assignment submissions, and attendance patterns for early academic intervention.",
    legalBasis: "GDPR Art. 6(1)(e) - Public Interest & Educational Mission",
  },
  PLAGIARISM_SCANNING: {
    label: "Automated Plagiarism & AI Integrity Scanning",
    desc: "Cross-checks submitted coursework against academic databases and similarity detection models.",
    legalBasis: "GDPR Art. 6(1)(f) - Legitimate Institutional Interest",
  },
  COMMUNICATIONS_ALERTS: {
    label: "Emergency & Real-Time Academic Alerts",
    desc: "Sends real-time SMS, email, and web push notifications for critical course updates, fees, and safety notices.",
    legalBasis: "GDPR Art. 6(1)(a) - Data Subject Consent",
  },
  ANONYMIZED_RESEARCH: {
    label: "Anonymized Pedagogical Research & Accreditation",
    desc: "Aggregates anonymized statistical distributions for institutional curriculum benchmarking and accreditation.",
    legalBasis: "GDPR Art. 89(1) - Scientific & Statistical Research",
  },
  SYSTEM_TELEMETRY: {
    label: "Platform Performance & Diagnostic Telemetry",
    desc: "Collects anonymous client session telemetry, error stacks, and latency metrics to maintain system reliability.",
    legalBasis: "GDPR Art. 6(1)(f) - System Integrity",
  },
};

export default function CompliancePage() {
  const [user, setUser] = useState<{ id?: string; role: Role; name?: string; email?: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ferpa" | "gdpr" | "retention" | "consent">("ferpa");

  // State: Data
  const [ferpaStats, setFerpaStats] = useState<ComplianceStats | null>(null);
  const [retentionPolicies, setRetentionPolicies] = useState<RetentionPolicy[]>([]);
  const [erasureRequests, setErasureRequests] = useState<ErasureRequest[]>([]);
  const [userConsents, setUserConsents] = useState<UserConsent[]>([]);
  const [consentSummary, setConsentSummary] = useState<ConsentSummary[]>([]);
  const [retentionPreview, setRetentionPreview] = useState<any[]>([]);

  // State: UI & Actions
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // State: FERPA Simulator
  const [simRole, setSimRole] = useState<string>("STUDENT_SELF");
  const [simTargetStudent, setSimTargetStudent] = useState<string>("same-student");
  const [simResourceType, setSimResourceType] = useState<string>("EDUCATIONAL_RECORDS");
  const [simResult, setSimResult] = useState<any | null>(null);
  const [simulating, setSimulating] = useState(false);

  // State: Erasure Submission & Review Modals
  const [isErasureModalOpen, setIsErasureModalOpen] = useState(false);
  const [erasureReason, setErasureReason] = useState("");
  const [selectedErasure, setSelectedErasure] = useState<ErasureRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Initial Load & Auth
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("accessToken");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {}
    }
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      // 1. FERPA Overview
      const ferpaRes = await fetch("http://localhost:3001/compliance/ferpa/overview", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (ferpaRes.ok) setFerpaStats(await ferpaRes.json());

      // 2. Retention Policies
      const retentionRes = await fetch("http://localhost:3001/compliance/retention/policies", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (retentionRes.ok) setRetentionPolicies(await retentionRes.json());

      // 3. User Consents
      const consentRes = await fetch("http://localhost:3001/compliance/consents", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (consentRes.ok) setUserConsents(await consentRes.json());

      // 4. Erasure Requests (Admins see all, Users see their own)
      const erasureRes = await fetch("http://localhost:3001/compliance/erasure/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (erasureRes.ok) setErasureRequests(await erasureRes.json());

      // 5. Admin Institutional Consent Summary
      if (user?.role === "admin") {
        const sumRes = await fetch("http://localhost:3001/compliance/consents/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (sumRes.ok) setConsentSummary(await sumRes.json());

        const prevRes = await fetch("http://localhost:3001/compliance/retention/preview", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (prevRes.ok) setRetentionPreview(await prevRes.json());
      }
    } catch (err) {
      console.error("Failed to load compliance data:", err);
    } finally {
      setLoading(false);
    }
  }, [token, user?.role]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, fetchData]);

  // Handler: FERPA Access Verification Simulator
  const handleRunSimulator = async () => {
    setSimulating(true);
    setSimResult(null);
    try {
      const myId = user?.id || "f6298136-d0df-498e-9b53-bf4f451a152d";
      const targetId = simTargetStudent === "same-student" ? myId : "00000000-0000-0000-0000-000000000000";

      const res = await fetch("http://localhost:3001/compliance/ferpa/verify-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: targetId,
          resourceType: simResourceType,
          simulatedRole: simRole !== "STUDENT_SELF" ? simRole : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSimResult({
          status: "ALLOWED",
          httpCode: 200,
          data,
          timestamp: new Date().toLocaleTimeString(),
        });
      } else {
        setSimResult({
          status: "DENIED",
          httpCode: res.status,
          message: data.message || "FERPA Isolation Access Barrier Blocked Unauthorized Query",
          timestamp: new Date().toLocaleTimeString(),
        });
      }
      // Refresh stats to reflect blocked attempt count
      const ferpaRes = await fetch("http://localhost:3001/compliance/ferpa/overview", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (ferpaRes.ok) setFerpaStats(await ferpaRes.json());
    } catch (err: any) {
      setSimResult({
        status: "DENIED",
        httpCode: 403,
        message: err.message,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setSimulating(false);
    }
  };

  // Handler: GDPR Article 15/20 Personal Data Export
  const handleExportDataDossier = async () => {
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await fetch("http://localhost:3001/compliance/gdpr/export", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const dossier = await res.json();

      // Download as JSON file
      const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gdpr-data-dossier-${user?.name?.replace(/\s+/g, "-") || "user"}-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast("Personal Data Dossier generated and downloaded successfully!", "success");
    } catch (err: any) {
      showToast("Failed to generate data dossier: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Submit Right to Erasure Request
  const handleSubmitErasure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!erasureReason.trim()) {
      showToast("Please provide a reason or legal justification for erasure.", "error");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("http://localhost:3001/compliance/erasure/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: erasureReason }),
      });
      if (!res.ok) throw new Error("Submission failed");
      const created = await res.json();
      setErasureRequests((prev) => [created, ...prev]);
      setIsErasureModalOpen(false);
      setErasureReason("");
      showToast("Right to Erasure request logged with compliance registry!", "success");
    } catch (err: any) {
      showToast("Error filing erasure request: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Admin Process Erasure Request
  const handleProcessErasure = async (decision: "APPROVED" | "REJECTED") => {
    if (!selectedErasure) return;
    if (decision === "REJECTED" && !rejectionReason.trim()) {
      showToast("Rejection requires a documented statutory justification.", "error");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/compliance/erasure/requests/${selectedErasure.id}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          decision,
          rejectionReason: decision === "REJECTED" ? rejectionReason : undefined,
        }),
      });
      if (!res.ok) throw new Error("Processing failed");
      const updated = await res.json();
      setErasureRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSelectedErasure(null);
      setRejectionReason("");
      showToast(
        decision === "APPROVED"
          ? "Subject record successfully pseudonymized and scrubbed under GDPR Art. 17."
          : "Erasure request formally rejected with statutory justification.",
        "success"
      );
      fetchData();
    } catch (err: any) {
      showToast("Error processing request: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Update Consent Toggle
  const handleToggleConsent = async (purpose: string, currentlyGranted: boolean) => {
    const nextGranted = !currentlyGranted;
    // Optimistic update
    setUserConsents((prev) =>
      prev.map((c) => (c.purpose === purpose ? { ...c, granted: nextGranted, updatedAt: new Date().toISOString() } : c))
    );
    try {
      const res = await fetch("http://localhost:3001/compliance/consents", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ purpose, granted: nextGranted }),
      });
      if (!res.ok) throw new Error("Failed to save consent");
      const saved = await res.json();
      setUserConsents((prev) => prev.map((c) => (c.purpose === purpose ? saved : c)));
      showToast(`Consent preferences updated for ${PURPOSE_METADATA[purpose]?.label || purpose}.`, "success");
      if (user?.role === "admin") {
        const sumRes = await fetch("http://localhost:3001/compliance/consents/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (sumRes.ok) setConsentSummary(await sumRes.json());
      }
    } catch (err: any) {
      // Revert optimistic update
      setUserConsents((prev) =>
        prev.map((c) => (c.purpose === purpose ? { ...c, granted: currentlyGranted } : c))
      );
      showToast("Failed to persist consent: " + err.message, "error");
    }
  };

  // Handler: Update Retention Policy
  const handleSaveRetentionPolicy = async (policy: RetentionPolicy) => {
    try {
      const res = await fetch("http://localhost:3001/compliance/retention/policies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(policy),
      });
      if (!res.ok) throw new Error("Failed to update retention policy");
      const updated = await res.json();
      setRetentionPolicies((prev) => prev.map((p) => (p.category === updated.category ? updated : p)));
      showToast(`Retention policy for ${policy.category} successfully saved.`, "success");
      // Refresh preview
      const prevRes = await fetch("http://localhost:3001/compliance/retention/preview", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (prevRes.ok) setRetentionPreview(await prevRes.json());
    } catch (err: any) {
      showToast("Error updating policy: " + err.message, "error");
    }
  };

  // Handler: Run Retention Enforcement
  const handleRunRetention = async () => {
    if (!confirm("Are you sure you want to trigger automated retention enforcement across all active policies? Qualifying data will be archived, anonymized, or purged.")) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("http://localhost:3001/compliance/retention/run", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Retention run failed");
      const result = await res.json();
      const totalProcessed = result.results.reduce((acc: number, r: any) => acc + (r.recordsProcessed || 0), 0);
      showToast(`Enforcement completed! ${totalProcessed} records processed across ${result.results.length} categories.`, "success");
      fetchData();
    } catch (err: any) {
      showToast("Retention enforcement error: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <div className="compliance-container">
      {/* Toast Alert Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: 10,
            background: toast.type === "success" ? "#065f46" : toast.type === "error" ? "#7f1d1d" : "#1e1b4b",
            color: "#fff",
            border: `1px solid ${toast.type === "success" ? "#10b981" : toast.type === "error" ? "#ef4444" : "#6366f1"}`,
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          {toast.type === "success" && <CheckCircle2 size={16} />}
          {toast.type === "error" && <AlertTriangle size={16} />}
          {toast.type === "info" && <ShieldCheck size={16} />}
          {toast.message}
        </div>
      )}

      {/* Hero Header */}
      <section className="compliance-hero">
        <div>
          <div className="compliance-hero-title">
            <ShieldCheck size={28} color="#818cf8" />
            Data Privacy & Compliance Governance
          </div>
          <div style={{ color: "var(--text-secondary, #94a3b8)", fontSize: "0.88rem", maxWidth: 640 }}>
            Unified regulatory framework enforcing strict FERPA educational record isolation, GDPR data subject rights, admin-configurable data retention lifecycles, and consent management.
          </div>
          <div className="compliance-hero-badges">
            <span className="compliance-badge compliance-badge-success">
              <CheckCircle2 size={12} /> FERPA 34 CFR Part 99 Enforced
            </span>
            <span className="compliance-badge compliance-badge-info">
              <Shield size={12} /> GDPR Articles 15, 17, 20 Compliant
            </span>
            <span className="compliance-badge">
              <Lock size={12} /> Append-Only Compliance Ledger
            </span>
            <span className="compliance-badge compliance-badge-warning">
              <Clock size={12} /> Automated Data Lifecycle Manager
            </span>
          </div>
        </div>

        <div className="compliance-hero-actions">
          <button
            className="compliance-btn compliance-btn-outline"
            onClick={fetchData}
            title="Refresh compliance registers"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            className="compliance-btn compliance-btn-primary"
            onClick={handleExportDataDossier}
            disabled={actionLoading}
            title="Export personal data package under GDPR Article 15 & 20"
          >
            <Download size={14} /> Export Personal Data Dossier (JSON)
          </button>
        </div>
      </section>

      {/* Top Level Compliance KPIs */}
      <div className="compliance-stats-grid">
        <div className="compliance-stat-card">
          <div className="compliance-stat-card-header">
            <span className="compliance-stat-label">FERPA Protected Records</span>
            <div className="compliance-stat-icon" style={{ background: "rgba(99, 102, 241, 0.12)", color: "#818cf8" }}>
              <UserCheck size={18} />
            </div>
          </div>
          <div className="compliance-stat-value">
            {ferpaStats ? ferpaStats.totalProtectedStudents : "—"}
          </div>
          <div className="compliance-stat-meta">
            <span style={{ color: "#10b981", fontWeight: 700 }}>● Active Isolation</span>
            <span>Across student cohort</span>
          </div>
        </div>

        <div className="compliance-stat-card">
          <div className="compliance-stat-card-header">
            <span className="compliance-stat-label">Unauthorized Access Blocked</span>
            <div className="compliance-stat-icon" style={{ background: "rgba(239, 68, 68, 0.12)", color: "#ef4444" }}>
              <AlertOctagon size={18} />
            </div>
          </div>
          <div className="compliance-stat-value" style={{ color: "#ef4444" }}>
            {ferpaStats ? ferpaStats.unauthorizedAttemptsBlocked : 0}
          </div>
          <div className="compliance-stat-meta">
            <span>Violations automatically thwarted</span>
          </div>
        </div>

        <div className="compliance-stat-card">
          <div className="compliance-stat-card-header">
            <span className="compliance-stat-label">Retention Policies</span>
            <div className="compliance-stat-icon" style={{ background: "rgba(56, 189, 248, 0.12)", color: "#38bdf8" }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="compliance-stat-value">
            {retentionPolicies.filter((p) => p.isActive).length} / {retentionPolicies.length}
          </div>
          <div className="compliance-stat-meta">
            <span>Configured data retention rules</span>
          </div>
        </div>

        <div className="compliance-stat-card">
          <div className="compliance-stat-card-header">
            <span className="compliance-stat-label">Consent Purviews</span>
            <div className="compliance-stat-icon" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
              <FileText size={18} />
            </div>
          </div>
          <div className="compliance-stat-value">
            {userConsents.filter((c) => c.granted).length} / {userConsents.length || 5}
          </div>
          <div className="compliance-stat-meta">
            <span>Granular processing opt-ins</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="compliance-tabs">
        <button
          className={`compliance-tab-btn ${activeTab === "ferpa" ? "active" : ""}`}
          onClick={() => setActiveTab("ferpa")}
        >
          <Shield size={16} /> FERPA Data Isolation & Access Barriers
        </button>
        <button
          className={`compliance-tab-btn ${activeTab === "gdpr" ? "active" : ""}`}
          onClick={() => setActiveTab("gdpr")}
        >
          <FileText size={16} /> GDPR Subject Rights (Access & Erasure)
        </button>
        <button
          className={`compliance-tab-btn ${activeTab === "retention" ? "active" : ""}`}
          onClick={() => setActiveTab("retention")}
        >
          <Database size={16} /> Data Retention Policies {isAdmin && "(Admin)"}
        </button>
        <button
          className={`compliance-tab-btn ${activeTab === "consent" ? "active" : ""}`}
          onClick={() => setActiveTab("consent")}
        >
          <CheckCircle2 size={16} /> Consent Management Matrix
        </button>
      </div>

      {/* TAB 1: FERPA Data Isolation */}
      {activeTab === "ferpa" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Policy Boundaries Matrix */}
          <div className="compliance-section-card">
            <div className="compliance-section-header">
              <div>
                <div className="compliance-section-title">
                  <Lock size={18} color="#818cf8" /> FERPA Statutory Access Boundaries (34 CFR Part 99)
                </div>
                <div className="compliance-section-desc">
                  Strict role-based isolation barriers ensure educational records are shielded from unauthorized discovery, preventing horizontal privilege escalation between students.
                </div>
              </div>
            </div>

            <div className="ferpa-roles-grid">
              <div className="ferpa-role-card">
                <div className="ferpa-role-header">
                  <div className="ferpa-role-title">
                    <UserCheck size={16} color="#6366f1" /> Students
                  </div>
                  <span className="compliance-badge">SELF-ONLY</span>
                </div>
                <div className="ferpa-role-boundary">
                  Students can only access their own personally identifiable records, grades, transcripts, and financial invoices.
                </div>
                <ul className="ferpa-role-items">
                  <li className="ferpa-role-item"><Check size={13} color="#10b981" /> Own Course Enrollments</li>
                  <li className="ferpa-role-item"><Check size={13} color="#10b981" /> Own Attendance & Submissions</li>
                  <li className="ferpa-role-item"><X size={13} color="#ef4444" /> Peer Records (Strictly 403 Forbidden)</li>
                </ul>
              </div>

              <div className="ferpa-role-card">
                <div className="ferpa-role-header">
                  <div className="ferpa-role-title">
                    <UserCheck size={16} color="#38bdf8" /> Faculty & Instructors
                  </div>
                  <span className="compliance-badge compliance-badge-info">ENROLLED ROSTER</span>
                </div>
                <div className="ferpa-role-boundary">
                  Faculty may only view records of students actively enrolled in courses or sections assigned to them.
                </div>
                <ul className="ferpa-role-items">
                  <li className="ferpa-role-item"><Check size={13} color="#10b981" /> Enrolled Course Section Rosters</li>
                  <li className="ferpa-role-item"><Check size={13} color="#10b981" /> Gradebook & Submission Assessment</li>
                  <li className="ferpa-role-item"><X size={13} color="#ef4444" /> Non-enrolled students (Blocked)</li>
                </ul>
              </div>

              <div className="ferpa-role-card">
                <div className="ferpa-role-header">
                  <div className="ferpa-role-title">
                    <ShieldCheck size={16} color="#10b981" /> Administrators
                  </div>
                  <span className="compliance-badge compliance-badge-success">AUDITED OVERSIGHT</span>
                </div>
                <div className="ferpa-role-boundary">
                  Authorized officials with legitimate educational interests. Every query is logged into the immutable audit trail.
                </div>
                <ul className="ferpa-role-items">
                  <li className="ferpa-role-item"><Check size={13} color="#10b981" /> Institutional Roster Supervision</li>
                  <li className="ferpa-role-item"><Check size={13} color="#10b981" /> Policy Configuration & Erasure Review</li>
                  <li className="ferpa-role-item"><Check size={13} color="#10b981" /> 100% Cryptographically Logged</li>
                </ul>
              </div>

              <div className="ferpa-role-card">
                <div className="ferpa-role-header">
                  <div className="ferpa-role-title">
                    <UserCheck size={16} color="#f59e0b" /> Parents / Guardians
                  </div>
                  <span className="compliance-badge compliance-badge-warning">DELEGATED PROXY</span>
                </div>
                <div className="ferpa-role-boundary">
                  Read-only view limited strictly to dependent student profiles following verified parental consent delegation.
                </div>
                <ul className="ferpa-role-items">
                  <li className="ferpa-role-item"><Check size={13} color="#10b981" /> Dependent Attendance & Progress</li>
                  <li className="ferpa-role-item"><Check size={13} color="#10b981" /> Tuition & Fee Invoices</li>
                  <li className="ferpa-role-item"><X size={13} color="#ef4444" /> No Grade Modification Rights</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Interactive FERPA Access Validator / Sandbox */}
          <div className="compliance-section-card">
            <div className="compliance-section-header">
              <div>
                <div className="compliance-section-title">
                  <Sparkles size={18} color="#a855f7" /> Interactive FERPA Access Barrier Simulator
                </div>
                <div className="compliance-section-desc">
                  Simulate live authorization decisions against our zero-trust compliance engine. Unauthorized cross-student record access triggers immediate 403 Forbidden violations with audit warnings.
                </div>
              </div>
            </div>

            <div className="ferpa-simulator-box">
              <div className="simulator-form-grid">
                <div className="simulator-field">
                  <label className="simulator-label">Simulated Actor Persona</label>
                  <select
                    className="simulator-select"
                    value={simRole}
                    onChange={(e) => setSimRole(e.target.value)}
                  >
                    <option value="STUDENT_SELF">Student (Self-Record Request)</option>
                    <option value="STUDENT_CROSS">Student (Cross-Record Access Attempt)</option>
                    <option value="FACULTY">Faculty (Course Section Instructor)</option>
                    <option value="ADMIN">Administrator (Institutional Official)</option>
                    <option value="PARENT">Parent / Legal Guardian Proxy</option>
                  </select>
                </div>

                <div className="simulator-field">
                  <label className="simulator-label">Target Student Record</label>
                  <select
                    className="simulator-select"
                    value={simTargetStudent}
                    onChange={(e) => setSimTargetStudent(e.target.value)}
                  >
                    <option value="same-student">Authenticated Student Record (Self)</option>
                    <option value="other-student">Unauthorized Peer Record (External Student ID)</option>
                  </select>
                </div>

                <div className="simulator-field">
                  <label className="simulator-label">Resource Type Scope</label>
                  <select
                    className="simulator-select"
                    value={simResourceType}
                    onChange={(e) => setSimResourceType(e.target.value)}
                  >
                    <option value="EDUCATIONAL_RECORDS">Educational Records & Grades</option>
                    <option value="ATTENDANCE_LOGS">Attendance Records</option>
                    <option value="FINANCIAL_LEDGER">Financial & Fee Invoices</option>
                    <option value="COURSEWORK_SUBMISSIONS">Coursework Submissions</option>
                  </select>
                </div>

                <div>
                  <button
                    className="compliance-btn compliance-btn-primary"
                    style={{ width: "100%" }}
                    onClick={handleRunSimulator}
                    disabled={simulating}
                  >
                    <Shield size={14} /> {simulating ? "Evaluating Barrier..." : "Test Access Barrier"}
                  </button>
                </div>
              </div>

              {/* Simulation Result Output */}
              {simResult && (
                <div
                  className={`simulator-result-box ${simResult.status === "ALLOWED" ? "allow" : "deny"}`}
                >
                  {simResult.status === "ALLOWED" ? (
                    <CheckCircle2 size={24} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                  ) : (
                    <AlertOctagon size={24} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                  )}

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: 700,
                          color: simResult.status === "ALLOWED" ? "#10b981" : "#ef4444",
                        }}
                      >
                        {simResult.status === "ALLOWED"
                          ? "HTTP 200 OK — ACCESS AUTHORIZED UNDER FERPA"
                          : `HTTP ${simResult.httpCode} FORBIDDEN — FERPA VIOLATION INTERCEPTED`}
                      </div>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-tertiary, #94a3b8)" }}>
                        Evaluated at {simResult.timestamp}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.82rem", color: "var(--text-secondary, #cbd5e1)", lineHeight: 1.45 }}>
                      {simResult.status === "ALLOWED" ? (
                        <>
                          Authorization verified: The requested role matches statutory boundaries. Access level:{" "}
                          <strong>{simResult.data?.level}</strong>. Security audit record created with reference{" "}
                          <code>{simResult.data?.auditReference || "REF-COMPLIANCE-OK"}</code>.
                        </>
                      ) : (
                        <>
                          <strong>Security Block Triggered:</strong> {simResult.message}. The incident has been recorded in the append-only audit trail and flagged as a potential FERPA isolation breach.
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GDPR Subject Rights */}
      {activeTab === "gdpr" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Article 15 & 20: Right of Access & Data Portability */}
          <div className="compliance-section-card">
            <div className="compliance-section-header">
              <div>
                <div className="compliance-section-title">
                  <Download size={18} color="#38bdf8" /> GDPR Article 15 & 20: Right to Access & Data Portability
                </div>
                <div className="compliance-section-desc">
                  Data subjects have the statutory right to obtain a copy of their personal data in a structured, commonly used, and machine-readable format.
                </div>
              </div>
              <button
                className="compliance-btn compliance-btn-primary"
                onClick={handleExportDataDossier}
                disabled={actionLoading}
              >
                <Download size={14} /> Download Personal Data Dossier (JSON)
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-primary, rgba(255,255,255,0.08))", borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#fff", marginBottom: 6 }}>
                  📦 Comprehensive Subject Dossier
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary, #94a3b8)", lineHeight: 1.45 }}>
                  The exported package bundles your complete digital footprint across our platform:
                  <ul style={{ margin: "8px 0 0 16px", padding: 0 }}>
                    <li>Personal Profile & Identity Attributes</li>
                    <li>Course Enrollments & Historical Schedules</li>
                    <li>Attendance & Exam Attempt Logs</li>
                    <li>Coursework Submissions & Evaluation Feedback</li>
                    <li>Fee Ledger & Financial Transactions</li>
                    <li>Consent Matrix History & Security Audit Logs</li>
                  </ul>
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-primary, rgba(255,255,255,0.08))", borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#fff", marginBottom: 6 }}>
                  🔒 Cryptographic Integrity Seal
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary, #94a3b8)", lineHeight: 1.45 }}>
                  Each export is stamped with an SHA-256 HMAC cryptographic signature and compliance metadata header, certifying authenticity and compliance with GDPR Article 20 data portability standards.
                </div>
                <div style={{ marginTop: 12, background: "rgba(15,23,42,0.8)", padding: "8px 12px", borderRadius: 8, fontSize: "0.72rem", color: "#a5b4fc", fontFamily: "monospace" }}>
                  Seal: SHA256-HMAC-{new Date().toISOString().slice(0, 10).replace(/-/g, "")}-COMPLIANCE-CERTIFIED
                </div>
              </div>
            </div>
          </div>

          {/* Article 17: Right to Erasure ("Right to be Forgotten") */}
          <div className="compliance-section-card">
            <div className="compliance-section-header">
              <div>
                <div className="compliance-section-title">
                  <Trash2 size={18} color="#ef4444" /> GDPR Article 17: Right to Erasure ("Right to be Forgotten")
                </div>
                <div className="compliance-section-desc">
                  Data subjects may request complete erasure and pseudonymization of their personal data where retention is no longer necessary or consent is withdrawn.
                </div>
              </div>
              <button
                className="compliance-btn compliance-btn-danger"
                onClick={() => setIsErasureModalOpen(true)}
              >
                <UserX size={14} /> Request Right to Erasure
              </button>
            </div>

            {/* Erasure Requests Table */}
            <div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#fff", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Erasure Request Registry {isAdmin ? "(Institutional Review Queue)" : "(Your Active Requests)"}</span>
                <span className="compliance-badge">{erasureRequests.length} Requests Logged</span>
              </div>

              {erasureRequests.length === 0 ? (
                <div style={{ textAlign: "center", padding: "36px 20px", color: "var(--text-tertiary, #94a3b8)", fontSize: "0.85rem" }}>
                  No erasure requests filed. All subject records are currently compliant and active.
                </div>
              ) : (
                <div className="compliance-table-container">
                  <table className="compliance-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Role</th>
                        <th>Submitted</th>
                        <th>Reason / Justification</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {erasureRequests.map((req) => (
                        <tr key={req.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: "#fff" }}>{req.userName}</div>
                            <div style={{ fontSize: "0.74rem", color: "var(--text-tertiary, #94a3b8)" }}>{req.userEmail}</div>
                          </td>
                          <td>
                            <span className="compliance-badge">{req.userRole}</span>
                          </td>
                          <td style={{ fontSize: "0.78rem" }}>
                            {new Date(req.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ maxWidth: 280 }}>
                            <div style={{ fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {req.reason}
                            </div>
                            {req.rejectionReason && (
                              <div style={{ fontSize: "0.72rem", color: "#f87171", marginTop: 2 }}>
                                Rejection: {req.rejectionReason}
                              </div>
                            )}
                          </td>
                          <td>
                            {req.status === "COMPLETED" && (
                              <span className="compliance-badge compliance-badge-success">
                                <CheckCircle2 size={10} /> PSEUDONYMIZED
                              </span>
                            )}
                            {req.status === "PENDING" && (
                              <span className="compliance-badge compliance-badge-warning">
                                <Clock size={10} /> PENDING REVIEW
                              </span>
                            )}
                            {req.status === "REJECTED" && (
                              <span className="compliance-badge" style={{ borderColor: "#ef4444", color: "#ef4444" }}>
                                <X size={10} /> REJECTED
                              </span>
                            )}
                          </td>
                          <td>
                            {isAdmin && req.status === "PENDING" ? (
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  className="compliance-btn compliance-btn-success"
                                  style={{ padding: "5px 10px", fontSize: "0.74rem" }}
                                  onClick={() => setSelectedErasure(req)}
                                >
                                  Review & Approve
                                </button>
                              </div>
                            ) : req.status === "COMPLETED" ? (
                              <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 600 }}>
                                Scrubbed & Certified
                              </span>
                            ) : (
                              <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary, #94a3b8)" }}>
                                Under Gating
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Data Retention Policies */}
      {activeTab === "retention" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="compliance-section-card">
            <div className="compliance-section-header">
              <div>
                <div className="compliance-section-title">
                  <Database size={18} color="#818cf8" /> Configurable Data Retention Policies
                </div>
                <div className="compliance-section-desc">
                  Define automated lifecycle schedules across key institutional databases. System automatically identifies records beyond statutory retention thresholds and executes designated actions.
                </div>
              </div>

              {isAdmin && (
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    className="compliance-btn compliance-btn-primary"
                    onClick={handleRunRetention}
                    disabled={actionLoading}
                    title="Enforce active retention rules across database"
                  >
                    <Sparkles size={14} /> ⚡ Run Retention Enforcement
                  </button>
                </div>
              )}
            </div>

            {/* Retention Preview Banner */}
            {isAdmin && retentionPreview.length > 0 && (
              <div style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.25)", borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Clock size={18} color="#818cf8" />
                  <div style={{ fontSize: "0.84rem", color: "#fff" }}>
                    <strong>Automated Lifecycle Evaluation:</strong> {retentionPreview.reduce((acc, c) => acc + c.eligibleCount, 0)} records eligible for cleanup across {retentionPreview.length} domains.
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {retentionPreview.map((prev) => (
                    <span key={prev.category} style={{ fontSize: "0.72rem", background: "rgba(15,23,42,0.6)", padding: "3px 8px", borderRadius: 6, color: "#cbd5e1" }}>
                      {prev.category.split("_")[0]}: {prev.eligibleCount}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Policies Cards Grid */}
            <div className="retention-grid">
              {retentionPolicies.map((policy) => (
                <div key={policy.category} className="retention-card">
                  <div className="retention-card-header">
                    <div>
                      <div className="retention-category-title">{policy.category.replace(/_/g, " ")}</div>
                      <div className="retention-category-desc">{policy.description}</div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={policy.isActive}
                        disabled={!isAdmin}
                        onChange={(e) => {
                          const updated = { ...policy, isActive: e.target.checked };
                          handleSaveRetentionPolicy(updated);
                        }}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="retention-controls-row">
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-tertiary, #94a3b8)", fontWeight: 600 }}>
                        RETENTION DURATION
                      </span>
                      <div className="retention-days-input-wrap">
                        <input
                          type="number"
                          className="retention-days-input"
                          value={policy.retentionDays}
                          disabled={!isAdmin}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setRetentionPolicies((prev) =>
                              prev.map((p) => (p.category === policy.category ? { ...p, retentionDays: val } : p))
                            );
                          }}
                        />
                        <span className="retention-days-suffix">days</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-tertiary, #94a3b8)", fontWeight: 600 }}>
                        ENFORCEMENT ACTION
                      </span>
                      <select
                        className="simulator-select"
                        style={{ padding: "7px 10px", fontSize: "0.8rem" }}
                        value={policy.action}
                        disabled={!isAdmin}
                        onChange={(e) => {
                          const updated = { ...policy, action: e.target.value as any };
                          handleSaveRetentionPolicy(updated);
                        }}
                      >
                        <option value="ANONYMIZE">ANONYMIZE (Pseudonymize)</option>
                        <option value="ARCHIVE">ARCHIVE (Cold Storage)</option>
                        <option value="PURGE">PURGE (Permanent Delete)</option>
                      </select>
                    </div>

                    {isAdmin && (
                      <div style={{ alignSelf: "flex-end", marginTop: 4 }}>
                        <button
                          className="compliance-btn compliance-btn-outline"
                          style={{ padding: "7px 12px", fontSize: "0.76rem" }}
                          onClick={() => handleSaveRetentionPolicy(policy)}
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary, #94a3b8)", display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-primary, rgba(255,255,255,0.06))", paddingTop: 10 }}>
                    <span>Last run: {policy.lastExecutedAt ? new Date(policy.lastExecutedAt).toLocaleDateString() : "Pending"}</span>
                    <span>Processed: {policy.recordsProcessedLastRun || 0} records</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Consent Management Matrix */}
      {activeTab === "consent" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Admin Institutional Summary */}
          {isAdmin && consentSummary.length > 0 && (
            <div className="compliance-section-card">
              <div className="compliance-section-header">
                <div>
                  <div className="compliance-section-title">
                    <UserCheck size={18} color="#10b981" /> Institutional Consent Compliance Rates
                  </div>
                  <div className="compliance-section-desc">
                    Aggregated opt-in participation metrics across all active students and faculty accounts.
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                {consentSummary.map((sum) => (
                  <div key={sum.purpose} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-primary, rgba(255,255,255,0.08))", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-secondary, #94a3b8)", textTransform: "uppercase" }}>
                      {PURPOSE_METADATA[sum.purpose]?.label || sum.purpose}
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "8px 0 4px" }}>
                      <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff" }}>{sum.optInRate}%</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary, #94a3b8)" }}>
                        ({sum.grantedCount}/{sum.totalCount} users)
                      </span>
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${sum.optInRate}%`, background: sum.optInRate > 70 ? "#10b981" : "#6366f1" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Granular User Consents Matrix */}
          <div className="compliance-section-card">
            <div className="compliance-section-header">
              <div>
                <div className="compliance-section-title">
                  <CheckCircle2 size={18} color="#818cf8" /> Your Data Processing Consent Matrix
                </div>
                <div className="compliance-section-desc">
                  Manage your personal privacy preferences under GDPR Article 6 & 7. Toggle processing scopes at any time. Revocation takes effect immediately without retroactive penalty.
                </div>
              </div>
              <span className="compliance-badge">Framework Version 2026.1</span>
            </div>

            <div className="consent-grid">
              {Object.keys(PURPOSE_METADATA).map((purposeKey) => {
                const meta = PURPOSE_METADATA[purposeKey];
                const consentItem = userConsents.find((c) => c.purpose === purposeKey);
                const isGranted = !!consentItem?.granted;

                return (
                  <div key={purposeKey} className="consent-card">
                    <div>
                      <div className="consent-card-top">
                        <div className="consent-title">{meta.label}</div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={isGranted}
                            onChange={() => handleToggleConsent(purposeKey, isGranted)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                      <div className="consent-desc">{meta.desc}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.74rem", color: "#a5b4fc", margin: "8px 0" }}>
                        <strong>Legal Basis:</strong> {meta.legalBasis}
                      </div>

                      <div className="consent-meta-row">
                        <span>
                          Status:{" "}
                          <strong style={{ color: isGranted ? "#10b981" : "#94a3b8" }}>
                            {isGranted ? "CONSENT GRANTED" : "REVOKED / OPTED-OUT"}
                          </strong>
                        </span>
                        <span>
                          {consentItem?.grantedAt
                            ? `Updated: ${new Date(consentItem.grantedAt).toLocaleDateString()}`
                            : "Standard Default"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Request Right to Erasure */}
      {isErasureModalOpen && (
        <div className="compliance-modal-overlay">
          <div className="compliance-modal">
            <div className="compliance-modal-header">
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
                <UserX size={20} color="#ef4444" /> GDPR Article 17: Request Erasure
              </div>
              <button
                onClick={() => setIsErasureModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitErasure}>
              <div className="compliance-modal-body">
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 10, padding: "12px 16px", fontSize: "0.82rem", color: "#fca5a5", lineHeight: 1.45 }}>
                  <strong>Important Notice:</strong> Filing an erasure request initiates institutional review. Upon approval, your direct identifiers (name, email, phone) will be permanently pseudonymized. Academic gradebook distributions are preserved for cohort statistical metrics under GDPR Article 89 without exposing your identity.
                </div>

                <div className="simulator-field">
                  <label className="simulator-label">Statutory Reason / Justification *</label>
                  <textarea
                    rows={4}
                    className="simulator-input"
                    placeholder="e.g. Withdrawal of consent, completion of study program, or objection to automated processing under GDPR Article 17(1)(b)..."
                    value={erasureReason}
                    onChange={(e) => setErasureReason(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="compliance-modal-footer">
                <button
                  type="button"
                  className="compliance-btn compliance-btn-outline"
                  onClick={() => setIsErasureModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="compliance-btn compliance-btn-danger"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Submitting Request..." : "Confirm & Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Admin Erasure Request Review */}
      {selectedErasure && (
        <div className="compliance-modal-overlay">
          <div className="compliance-modal">
            <div className="compliance-modal-header">
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
                <ShieldCheck size={20} color="#818cf8" /> Admin Erasure Decision Review
              </div>
              <button
                onClick={() => setSelectedErasure(null)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="compliance-modal-body">
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-primary, rgba(255,255,255,0.08))", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: "0.78rem", color: "var(--text-tertiary, #94a3b8)" }}>Subject Details</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff", marginTop: 2 }}>{selectedErasure.userName}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary, #cbd5e1)" }}>{selectedErasure.userEmail} ({selectedErasure.userRole})</div>
                <div style={{ marginTop: 10, fontSize: "0.8rem", color: "#cbd5e1" }}>
                  <strong>Applicant Reason:</strong> {selectedErasure.reason}
                </div>
              </div>

              <div className="simulator-field">
                <label className="simulator-label">Rejection Justification (Only required if rejecting request)</label>
                <input
                  type="text"
                  className="simulator-input"
                  placeholder="e.g. Overriding legal obligation for tax & degree verification under GDPR Art. 17(3)(b)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            </div>

            <div className="compliance-modal-footer">
              <button
                type="button"
                className="compliance-btn compliance-btn-outline"
                onClick={() => setSelectedErasure(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="compliance-btn compliance-btn-danger"
                onClick={() => handleProcessErasure("REJECTED")}
                disabled={actionLoading}
              >
                Reject Request
              </button>
              <button
                type="button"
                className="compliance-btn compliance-btn-success"
                onClick={() => handleProcessErasure("APPROVED")}
                disabled={actionLoading}
              >
                {actionLoading ? "Executing Pseudonymization..." : "Approve & Pseudonymize"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
