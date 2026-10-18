"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sliders,
  Palette,
  Calendar,
  Layers,
  Shield,
  Save,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  Building2,
  Lock,
  MessageSquare,
  Trophy,
  Bot,
  GraduationCap,
  CreditCard,
  Bell,
  Eye,
  Plus,
  Trash2,
} from "lucide-react";
import "./system-config.css";
import "../dashboard.css";

const API = "http://localhost:3001";

function getAuthToken() {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken")
  );
}

function authHeaders() {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const PRESET_COLORS = [
  { label: "Scholar Indigo", hex: "#4f46e5" },
  { label: "Emerald Excellence", hex: "#059669" },
  { label: "Ocean Cyan", hex: "#0284c7" },
  { label: "Royal Violet", hex: "#7c3aed" },
  { label: "Crimson Rose", hex: "#e11d48" },
  { label: "Amber Sun", hex: "#d97706" },
  { label: "Slate Midnight", hex: "#0f172a" },
];

export default function SystemConfigPage() {
  const [activeTab, setActiveTab] = useState<"branding" | "academic" | "features" | "permissions">("branding");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Configuration State
  const [config, setConfig] = useState<any>(null);

  // Form States
  const [brandingForm, setBrandingForm] = useState({
    institutionName: "ScholarPulse University",
    tagline: "Empowering Next-Generation Leaders Through Data-Driven Learning",
    primaryColor: "#4f46e5",
    secondaryColor: "#06b6d4",
    logoUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=120&auto=format&fit=crop&q=80",
    headerBrandStyle: "pill",
  });

  const [academicForm, setAcademicForm] = useState({
    currentAcademicYear: "2026-2027",
    currentSemester: "Fall 2026",
    termStartDate: "2026-08-15",
    termEndDate: "2026-12-20",
    passingScoreThreshold: 50,
    gradingScale: [] as any[],
  });

  const [featuresForm, setFeaturesForm] = useState<any>({
    internalMessaging: true,
    gamification: true,
    aiCopilot: true,
    onlineAssessments: true,
    feeOnlinePayments: true,
    announcementReceipts: true,
    ferpaFirewall: true,
    auditTrailLogging: true,
  });

  const [permissionsForm, setPermissionsForm] = useState<any>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Current Configuration
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/system-config`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        if (data.branding) setBrandingForm(data.branding);
        if (data.academic) setAcademicForm(data.academic);
        if (data.features) setFeaturesForm(data.features);
        if (data.permissions) setPermissionsForm(data.permissions);
      }
    } catch (err) {
      console.error("Failed to load system config:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Save Platform Branding
  const handleSaveBranding = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/admin/system-config/branding`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(brandingForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
        showToast("🎨 Platform branding parameters updated successfully!");
      }
    } catch {
      showToast("Error updating branding.");
    } finally {
      setSaving(false);
    }
  };

  // Save Academic & Grading Scale
  const handleSaveAcademic = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/admin/system-config/academic`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(academicForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
        showToast("📅 Academic calendar & grading matrix saved successfully!");
      }
    } catch {
      showToast("Error updating academic configuration.");
    } finally {
      setSaving(false);
    }
  };

  // Toggle Feature Flag Instantly
  const handleToggleFeature = async (featureKey: string) => {
    const updatedFeatures = {
      ...featuresForm,
      [featureKey]: !featuresForm[featureKey],
    };
    setFeaturesForm(updatedFeatures);

    try {
      const res = await fetch(`${API}/admin/system-config/features`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ [featureKey]: updatedFeatures[featureKey] }),
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
        showToast(`⚡ Module "${featureKey}" is now ${updatedFeatures[featureKey] ? "ENABLED" : "DISABLED"} institution-wide.`);
      }
    } catch {
      showToast("Failed to toggle feature.");
    }
  };

  // Save Granular Role Permissions
  const handleSavePermissions = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/admin/system-config/permissions`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(permissionsForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
        showToast("🛡️ Custom role permissions matrix saved & enforced!");
      }
    } catch {
      showToast("Error saving role permissions.");
    } finally {
      setSaving(false);
    }
  };

  // Toggle Role Permission Checkbox
  const handleTogglePermission = (role: string, permKey: string) => {
    setPermissionsForm((prev: any) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permKey]: !prev[role]?.[permKey],
      },
    }));
  };

  // Reset to Defaults
  const handleReset = async (category: "branding" | "academic" | "features" | "permissions" | "all") => {
    if (!confirm(`Are you sure you want to reset ${category.toUpperCase()} to institutional default configuration?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/system-config/reset`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ category }),
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
        if (updated.branding) setBrandingForm(updated.branding);
        if (updated.academic) setAcademicForm(updated.academic);
        if (updated.features) setFeaturesForm(updated.features);
        if (updated.permissions) setPermissionsForm(updated.permissions);
        showToast(`Restored ${category} to institutional defaults!`);
      }
    } catch {
      showToast("Failed to reset defaults.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="system-config-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: "rgba(15, 23, 42, 0.95)",
            color: "#ffffff",
            padding: "14px 20px",
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            fontSize: "0.88rem",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderLeft: "4px solid #4f46e5",
          }}
        >
          <Sparkles size={18} color="#4f46e5" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="sys-header">
        <div className="sys-title-area">
          <h1>
            <Sliders size={28} />
            System Configuration & Governance
          </h1>
          <p className="sys-subtitle">
            Configure institutional platform branding, academic calendar boundaries, grading scale cutoffs, modular feature switches, and granular role permissions.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            className="tab-btn"
            style={{ border: "1px solid var(--border-primary)", background: "var(--bg-card)" }}
            onClick={() => handleReset("all")}
          >
            <RotateCcw size={16} /> Reset to Defaults
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="reports-tabs-nav">
        <button
          className={`tab-btn ${activeTab === "branding" ? "active" : ""}`}
          onClick={() => setActiveTab("branding")}
        >
          <Palette size={18} />
          Platform Branding
        </button>
        <button
          className={`tab-btn ${activeTab === "academic" ? "active" : ""}`}
          onClick={() => setActiveTab("academic")}
        >
          <Calendar size={18} />
          Academic Year & Grading Scale
        </button>
        <button
          className={`tab-btn ${activeTab === "features" ? "active" : ""}`}
          onClick={() => setActiveTab("features")}
        >
          <Layers size={18} />
          Feature Toggles (Modules)
        </button>
        <button
          className={`tab-btn ${activeTab === "permissions" ? "active" : ""}`}
          onClick={() => setActiveTab("permissions")}
        >
          <Shield size={18} />
          Role Permission Customization
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          TAB 1: PLATFORM BRANDING
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "branding" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Branding Settings Form */}
          <div className="inst-section">
            <div className="inst-section-title">
              <Palette size={20} color="#4f46e5" />
              Institutional Identity & Theme
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Institution Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={brandingForm.institutionName}
                  onChange={(e) => setBrandingForm({ ...brandingForm, institutionName: e.target.value })}
                  placeholder="e.g. ScholarPulse University"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Motto / Tagline</label>
                <input
                  type="text"
                  className="form-input"
                  value={brandingForm.tagline}
                  onChange={(e) => setBrandingForm({ ...brandingForm, tagline: e.target.value })}
                  placeholder="e.g. Empowering Global Innovators"
                />
              </div>

              {/* Primary Color & Swatches */}
              <div className="form-group">
                <label className="form-label">Primary Accent Color ({brandingForm.primaryColor})</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    type="color"
                    value={brandingForm.primaryColor}
                    onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
                    style={{ width: 44, height: 38, border: "none", borderRadius: 8, cursor: "pointer" }}
                  />
                  <div className="color-swatches">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        className={`color-swatch-btn ${brandingForm.primaryColor === c.hex ? "active" : ""}`}
                        style={{ background: c.hex }}
                        onClick={() => setBrandingForm({ ...brandingForm, primaryColor: c.hex })}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Secondary Color */}
              <div className="form-group">
                <label className="form-label">Secondary Gradient Accent ({brandingForm.secondaryColor})</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    type="color"
                    value={brandingForm.secondaryColor}
                    onChange={(e) => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })}
                    style={{ width: 44, height: 38, border: "none", borderRadius: 8, cursor: "pointer" }}
                  />
                  <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    Used for gradient titles, active navigation highlights, and badges.
                  </span>
                </div>
              </div>

              {/* Header Brand Style */}
              <div className="form-group">
                <label className="form-label">Header Badge Style</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {["pill", "expanded", "minimal"].map((style) => (
                    <button
                      key={style}
                      type="button"
                      className={`attendance-pill-btn ${brandingForm.headerBrandStyle === style ? "active" : ""}`}
                      onClick={() => setBrandingForm({ ...brandingForm, headerBrandStyle: style })}
                    >
                      {style.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button
                  className="export-btn"
                  onClick={handleSaveBranding}
                  disabled={saving}
                >
                  <Save size={16} />
                  {saving ? "Saving Changes..." : "Apply Branding"}
                </button>
              </div>
            </div>
          </div>

          {/* Live Branding Preview */}
          <div className="inst-section">
            <div className="inst-section-title">
              <Eye size={20} color="#059669" />
              Live Branding Preview
            </div>

            <div className="branding-preview-card">
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                Simulated Header Brand Bar:
              </span>

              <div className="preview-mock-header">
                <div
                  className="preview-brand-pill"
                  style={{
                    background: brandingForm.primaryColor,
                    borderRadius: brandingForm.headerBrandStyle === "pill" ? 20 : 6,
                  }}
                >
                  <Building2 size={16} />
                  {brandingForm.institutionName || "ScholarPulse"}
                </div>

                <div style={{ display: "flex", gap: 10, fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                  <span>Courses</span>
                  <span>Attendance</span>
                  <span>Reports</span>
                </div>
              </div>

              <div style={{ padding: 18, borderRadius: 12, border: `1px solid ${brandingForm.primaryColor}40`, background: `${brandingForm.primaryColor}08` }}>
                <h3 style={{ margin: "0 0 6px 0", color: brandingForm.primaryColor, fontSize: "1.2rem" }}>
                  {brandingForm.institutionName}
                </h3>
                <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                  {brandingForm.tagline}
                </p>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="tab-btn"
                  style={{
                    background: `linear-gradient(135deg, ${brandingForm.primaryColor} 0%, ${brandingForm.secondaryColor} 100%)`,
                    color: "#ffffff",
                    padding: "8px 16px",
                    border: "none",
                    fontWeight: 700
                  }}
                >
                  Primary CTA Button
                </button>
                <button
                  className="tab-btn"
                  style={{
                    border: `1px solid ${brandingForm.primaryColor}`,
                    color: brandingForm.primaryColor,
                    padding: "8px 16px",
                  }}
                >
                  Secondary Outline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 2: ACADEMIC YEAR & GRADING SCALE
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "academic" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Calendar Boundaries Card */}
          <div className="inst-section">
            <div className="inst-section-title">
              <Calendar size={20} color="#0284c7" />
              Academic Term & Calendar Boundaries
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Current Academic Year</label>
                <input
                  type="text"
                  className="form-input"
                  value={academicForm.currentAcademicYear}
                  onChange={(e) => setAcademicForm({ ...academicForm, currentAcademicYear: e.target.value })}
                  placeholder="e.g. 2026-2027"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Active Semester / Session</label>
                <select
                  className="form-select"
                  value={academicForm.currentSemester}
                  onChange={(e) => setAcademicForm({ ...academicForm, currentSemester: e.target.value })}
                >
                  <option value="Fall 2026">Fall 2026</option>
                  <option value="Spring 2027">Spring 2027</option>
                  <option value="Summer 2027">Summer 2027</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Term Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={academicForm.termStartDate}
                  onChange={(e) => setAcademicForm({ ...academicForm, termStartDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Term End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={academicForm.termEndDate}
                  onChange={(e) => setAcademicForm({ ...academicForm, termEndDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Statutory Passing Score Threshold (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  value={academicForm.passingScoreThreshold}
                  onChange={(e) => setAcademicForm({ ...academicForm, passingScoreThreshold: parseFloat(e.target.value) || 50 })}
                />
              </div>
            </div>
          </div>

          {/* Grading Scale Matrix Card */}
          <div className="inst-section">
            <div className="inst-section-header">
              <div>
                <div className="inst-section-title">
                  <GraduationCap size={20} color="#4f46e5" />
                  Institutional Letter Grading Scale Matrix (4.0 GPA)
                </div>
                <div className="inst-section-desc">
                  Define score boundaries, grade point values, and honor classifications automatically applied to exam transcripts.
                </div>
              </div>
              <button
                className="export-btn"
                onClick={handleSaveAcademic}
                disabled={saving}
              >
                <Save size={16} />
                {saving ? "Saving Matrix..." : "Save Academic Configuration"}
              </button>
            </div>

            {/* Visual Spectrum Bar */}
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                Visual Grade Cutoff Spectrum:
              </div>
              <div className="grade-spectrum-bar">
                {academicForm.gradingScale?.map((tier: any) => (
                  <div
                    key={tier.grade}
                    className="grade-spectrum-seg"
                    style={{ flex: 1, background: tier.color || "#4f46e5" }}
                    title={`${tier.grade}: ${tier.minScore}% - ${tier.maxScore}% (${tier.gpaPoint} GPA)`}
                  >
                    {tier.grade}
                  </div>
                ))}
              </div>
            </div>

            {/* Editable Tiers Table */}
            <div style={{ overflowX: "auto" }}>
              <table className="diag-table">
                <thead>
                  <tr>
                    <th>Grade</th>
                    <th>Min Score (%)</th>
                    <th>Max Score (%)</th>
                    <th>GPA Points</th>
                    <th>Honor Classification Description</th>
                    <th>Color</th>
                  </tr>
                </thead>
                <tbody>
                  {academicForm.gradingScale?.map((tier: any, idx: number) => (
                    <tr key={tier.grade || idx}>
                      <td>
                        <span style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontWeight: 800,
                          background: `${tier.color || "#4f46e5"}20`,
                          color: tier.color || "#4f46e5"
                        }}>
                          {tier.grade}
                        </span>
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.1"
                          style={{ width: 80 }}
                          className="form-input"
                          value={tier.minScore}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            const updated = [...academicForm.gradingScale];
                            updated[idx].minScore = val;
                            setAcademicForm({ ...academicForm, gradingScale: updated });
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.1"
                          style={{ width: 80 }}
                          className="form-input"
                          value={tier.maxScore}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            const updated = [...academicForm.gradingScale];
                            updated[idx].maxScore = val;
                            setAcademicForm({ ...academicForm, gradingScale: updated });
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.1"
                          style={{ width: 80 }}
                          className="form-input"
                          value={tier.gpaPoint}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            const updated = [...academicForm.gradingScale];
                            updated[idx].gpaPoint = val;
                            setAcademicForm({ ...academicForm, gradingScale: updated });
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-input"
                          style={{ width: "100%" }}
                          value={tier.description}
                          onChange={(e) => {
                            const updated = [...academicForm.gradingScale];
                            updated[idx].description = e.target.value;
                            setAcademicForm({ ...academicForm, gradingScale: updated });
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="color"
                          value={tier.color || "#4f46e5"}
                          onChange={(e) => {
                            const updated = [...academicForm.gradingScale];
                            updated[idx].color = e.target.value;
                            setAcademicForm({ ...academicForm, gradingScale: updated });
                          }}
                          style={{ width: 34, height: 32, border: "none", cursor: "pointer", borderRadius: 6 }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 3: FEATURE TOGGLES (MODULE MANAGER)
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "features" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="inst-section">
            <div className="inst-section-header">
              <div>
                <div className="inst-section-title">
                  <Layers size={20} color="#059669" />
                  Institutional Modular Feature Switches
                </div>
                <div className="inst-section-desc">
                  Toggle institutional capabilities on or off in real-time without restarting server processes.
                </div>
              </div>
            </div>

            <div className="toggle-grid">
              {/* 1. Internal Messaging */}
              <div className="toggle-card">
                <div className="toggle-top">
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(99, 102, 241, 0.12)", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <strong style={{ fontSize: "0.95rem" }}>Direct Messaging (FR-COMM-03)</strong>
                      <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>Student ↔ Faculty Communication</div>
                    </div>
                  </div>
                  <div
                    className={`toggle-switch ${featuresForm.internalMessaging ? "active" : ""}`}
                    onClick={() => handleToggleFeature("internalMessaging")}
                  >
                    <div className="toggle-knob" />
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Enables 1-on-1 direct conversations, attachments, content scanning, and moderation queues.
                </p>
              </div>

              {/* 2. Gamification */}
              <div className="toggle-card">
                <div className="toggle-top">
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Trophy size={20} />
                    </div>
                    <div>
                      <strong style={{ fontSize: "0.95rem" }}>Scholar Gamification</strong>
                      <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>Badges, Streaks & Leaderboards</div>
                    </div>
                  </div>
                  <div
                    className={`toggle-switch ${featuresForm.gamification ? "active" : ""}`}
                    onClick={() => handleToggleFeature("gamification")}
                  >
                    <div className="toggle-knob" />
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Displays achievement streak counters, peer leaderboard rankings, and merit milestone badges.
                </p>
              </div>

              {/* 3. AI Academic Copilot */}
              <div className="toggle-card">
                <div className="toggle-top">
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(6, 182, 212, 0.12)", color: "#06b6d4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Bot size={20} />
                    </div>
                    <div>
                      <strong style={{ fontSize: "0.95rem" }}>AI Academic Copilot</strong>
                      <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>LLM Autonomous Learning Assistant</div>
                    </div>
                  </div>
                  <div
                    className={`toggle-switch ${featuresForm.aiCopilot ? "active" : ""}`}
                    onClick={() => handleToggleFeature("aiCopilot")}
                  >
                    <div className="toggle-knob" />
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Powers 24/7 intelligent tutoring, assignment feedback, and code explanation queries.
                </p>
              </div>

              {/* 4. Online Assessments */}
              <div className="toggle-card">
                <div className="toggle-top">
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(16, 185, 129, 0.12)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <strong style={{ fontSize: "0.95rem" }}>Timed Online Assessment (FR-EXAM-02)</strong>
                      <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>Proctored Testing Engine</div>
                    </div>
                  </div>
                  <div
                    className={`toggle-switch ${featuresForm.onlineAssessments ? "active" : ""}`}
                    onClick={() => handleToggleFeature("onlineAssessments")}
                  >
                    <div className="toggle-knob" />
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Enables fullscreen timed test player, anti-cheating tab-switch detection, and auto-submit timers.
                </p>
              </div>

              {/* 5. Online Fee Payments */}
              <div className="toggle-card">
                <div className="toggle-top">
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(168, 85, 247, 0.12)", color: "#9333ea", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <strong style={{ fontSize: "0.95rem" }}>Digital Bursar Payments</strong>
                      <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>Stripe & Razorpay Checkout</div>
                    </div>
                  </div>
                  <div
                    className={`toggle-switch ${featuresForm.feeOnlinePayments ? "active" : ""}`}
                    onClick={() => handleToggleFeature("feeOnlinePayments")}
                  >
                    <div className="toggle-knob" />
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Permits students and parents to settle tuition invoices online via card and digital wallets.
                </p>
              </div>

              {/* 6. Announcement Read Receipts */}
              <div className="toggle-card">
                <div className="toggle-top">
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(236, 72, 153, 0.12)", color: "#ec4899", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Bell size={20} />
                    </div>
                    <div>
                      <strong style={{ fontSize: "0.95rem" }}>Read Receipts Tracking (FR-COMM-02)</strong>
                      <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>Audience Reach Analytics</div>
                    </div>
                  </div>
                  <div
                    className={`toggle-switch ${featuresForm.announcementReceipts ? "active" : ""}`}
                    onClick={() => handleToggleFeature("announcementReceipts")}
                  >
                    <div className="toggle-knob" />
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Logs student reading acknowledgements and displays reach percentages to notice authors.
                </p>
              </div>

              {/* 7. FERPA Data Isolation */}
              <div className="toggle-card">
                <div className="toggle-top">
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(99, 102, 241, 0.12)", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Lock size={20} />
                    </div>
                    <div>
                      <strong style={{ fontSize: "0.95rem" }}>FERPA Compliance Firewall (FR-SEC-02)</strong>
                      <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>Educational Record Isolation</div>
                    </div>
                  </div>
                  <div
                    className={`toggle-switch ${featuresForm.ferpaFirewall ? "active" : ""}`}
                    onClick={() => handleToggleFeature("ferpaFirewall")}
                  >
                    <div className="toggle-knob" />
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Strictly confines educational dossier access only to legally assigned advisors and instructors.
                </p>
              </div>

              {/* 8. Immutable Audit Trail */}
              <div className="toggle-card">
                <div className="toggle-top">
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(16, 185, 129, 0.12)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Shield size={20} />
                    </div>
                    <div>
                      <strong style={{ fontSize: "0.95rem" }}>Immutable Audit Trail (FR-SEC-01)</strong>
                      <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>Cryptographic SHA-256 Ledger</div>
                    </div>
                  </div>
                  <div
                    className={`toggle-switch ${featuresForm.auditTrailLogging ? "active" : ""}`}
                    onClick={() => handleToggleFeature("auditTrailLogging")}
                  >
                    <div className="toggle-knob" />
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Chains all sensitive CRUD transactions with parent hash sealing and prevents record deletions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 4: ROLE PERMISSION CUSTOMIZATION BEYOND DEFAULTS
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "permissions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="inst-section">
            <div className="inst-section-header">
              <div>
                <div className="inst-section-title">
                  <Shield size={20} color="#6366f1" />
                  Granular Role Permission Customization Matrix
                </div>
                <div className="inst-section-desc">
                  Elevate or restrict specific capabilities across academic roles beyond standard platform defaults.
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="tab-btn"
                  style={{ border: "1px solid var(--border-primary)", background: "var(--bg-card)" }}
                  onClick={() => handleReset("permissions")}
                >
                  <RotateCcw size={16} /> Reset Permissions
                </button>
                <button
                  className="export-btn"
                  onClick={handleSavePermissions}
                  disabled={saving}
                >
                  <Save size={16} />
                  {saving ? "Saving Matrix..." : "Save Custom Permissions"}
                </button>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="perm-table">
                <thead>
                  <tr>
                    <th>Capability & Permission Key</th>
                    <th>Administrator</th>
                    <th>Teacher / Faculty</th>
                    <th>Student</th>
                    <th>Parent / Guardian</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: "viewAllGrades", label: "View Campus-Wide Grade Books", category: "Academic" },
                    { key: "editGrades", label: "Grade Submissions & Upsert Marks", category: "Academic" },
                    { key: "curveGrades", label: "Apply Statistical Grade Curves", category: "Academic" },
                    { key: "publishResults", label: "Publish Official Examination Transcripts", category: "Academic" },
                    { key: "takeAttendance", label: "Mark Real-Time Session Attendance", category: "Classroom" },
                    { key: "editAttendanceHistory", label: "Retroactively Modify Attendance Records", category: "Classroom" },
                    { key: "sendDirectMessages", label: "Send Direct Messages (Student ↔ Teacher)", category: "Communication" },
                    { key: "postAnnouncements", label: "Post Announcements to Feed", category: "Communication" },
                    { key: "moderateMessages", label: "Redact Messages & Review Flag Queue", category: "Communication" },
                    { key: "manageCurriculum", label: "Create & Archive Courses", category: "Administration" },
                    { key: "enrollStudents", label: "Enroll / Drop Students from Courses", category: "Administration" },
                    { key: "manageInvoices", label: "Issue Fee Invoices & Payment Plans", category: "Finance" },
                    { key: "viewFinancials", label: "Inspect Institutional Revenue Summaries", category: "Finance" },
                    { key: "exportBulkData", label: "Export Full Database Archives (GDPR)", category: "System" },
                    { key: "systemSettings", label: "Modify Platform Branding & Features", category: "System" },
                  ].map((perm) => (
                    <tr key={perm.key}>
                      <td>
                        <strong>{perm.label}</strong>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                          <code>{perm.key}</code> · {perm.category}
                        </div>
                      </td>
                      {["admin", "teacher", "student", "parent"].map((role) => (
                        <td key={role}>
                          <input
                            type="checkbox"
                            className="perm-checkbox"
                            checked={!!permissionsForm[role]?.[perm.key]}
                            onChange={() => handleTogglePermission(role, perm.key)}
                            disabled={role === "admin" && perm.key === "systemSettings"} // Safety lock for admin
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
