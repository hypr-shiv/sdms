"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Database,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Users,
  GraduationCap,
  BookOpen,
  Award,
  CalendarCheck,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Check,
  X,
  Lock,
  Layers,
  FileCode,
  FileCheck2,
  Clock,
} from "lucide-react";
import "./bulk-data.css";
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

export default function BulkDataPage() {
  const [activeTab, setActiveTab] = useState<"import" | "templates" | "backup" | "audit">("import");
  const [selectedEntity, setSelectedEntity] = useState<"students" | "faculty" | "courses" | "grades" | "attendance">("students");

  // Input states
  const [inputMode, setInputMode] = useState<"file" | "paste">("file");
  const [pasteContent, setPasteContent] = useState<string>("");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");

  // Validation & Import states
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Statistics
  const [dbStats, setDbStats] = useState<any>({
    students: 0,
    faculty: 0,
    courses: 0,
    grades: 0,
    attendance: 0,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Database Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/bulk-data/stats`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setDbStats(data);
      }
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
      setValidationResult(null);
    };
    reader.readAsText(file);
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
      setValidationResult(null);
    };
    reader.readAsText(file);
  };

  // Load Sample Data for Testing
  const handleLoadSampleData = () => {
    if (selectedEntity === "students") {
      const sample = `firstName,lastName,email,department,studentId,enrollmentYear\n` +
        `Sophia,Martinez,s.martinez@scholarpulse.edu,Computer Science,SP-2026-901,2026\n` +
        `Ethan,Kim,e.kim@scholarpulse.edu,Electrical Engineering,SP-2026-902,2026\n` +
        `Amara,Okonkwo,a.okonkwo@scholarpulse.edu,Business Administration,SP-2026-903,2026\n` +
        `,MissingLastName,invalid-email,Computer Science,SP-2026-904,2026`; // Intentional test error
      setPasteContent(sample);
      setInputMode("paste");
      showToast("Loaded sample students CSV (includes 1 intentional error for diagnostics demonstration)");
    } else if (selectedEntity === "courses") {
      const sample = `code,name,department,credits,semester,capacity\n` +
        `CS410,Advanced Cloud Systems,Computer Science,4,Fall 2026,45\n` +
        `EE340,Embedded Microcontrollers,Electrical Engineering,3,Fall 2026,50\n` +
        `BUS310,Strategic Venture Capital,Business Administration,3,Fall 2026,40`;
      setPasteContent(sample);
      setInputMode("paste");
      showToast("Loaded sample curriculum courses dataset");
    } else if (selectedEntity === "grades") {
      const sample = `studentId,courseCode,examTitle,marksObtained,totalMarks,semester\n` +
        `SP-2026-001,CS301,Midterm Examination,89.5,100,Fall 2026\n` +
        `SP-2026-002,CS301,Midterm Examination,94.0,100,Fall 2026\n` +
        `SP-2026-003,EE201,Practical Lab Assessment,46.0,50,Fall 2026`;
      setPasteContent(sample);
      setInputMode("paste");
      showToast("Loaded sample assessment grades dataset");
    } else if (selectedEntity === "attendance") {
      const sample = `studentId,courseCode,date,status,notes\n` +
        `SP-2026-001,CS301,2026-09-22,present,Regular laboratory session\n` +
        `SP-2026-002,CS301,2026-09-22,late,Arrived 8 mins late\n` +
        `SP-2026-003,CS301,2026-09-22,absent,Unexcused absence`;
      setPasteContent(sample);
      setInputMode("paste");
      showToast("Loaded sample attendance session records");
    } else {
      const sample = `firstName,lastName,email,department,title,specialization\n` +
        `Grace,Hopper,g.hopper@scholarpulse.edu,Computer Science,Distinguished Professor,Compilers\n` +
        `Claude,Shannon,c.shannon@scholarpulse.edu,Electrical Engineering,Senior Lecturer,Information Theory`;
      setPasteContent(sample);
      setInputMode("paste");
      showToast("Loaded sample faculty records");
    }
  };

  // Run Dry-Run Validation
  const handleValidate = async () => {
    const rawData = inputMode === "file" ? fileContent : pasteContent;
    if (!rawData.trim()) {
      showToast("Please provide CSV content or upload a file first.");
      return;
    }

    setIsValidating(true);
    try {
      const res = await fetch(`${API}/admin/bulk-data/validate`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          entity: selectedEntity,
          data: rawData,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setValidationResult(data);
        if (data.errorCount === 0) {
          showToast(`✅ Validation Clean! All ${data.validCount} rows are ready for import.`);
        } else {
          showToast(`⚠️ Validation finished with ${data.errorCount} error(s) flagged.`);
        }
      } else {
        showToast("Validation failed. Check file format.");
      }
    } catch {
      showToast("Server error during validation.");
    } finally {
      setIsValidating(false);
    }
  };

  // Commit Import Transaction
  const handleCommitImport = async () => {
    const rawData = inputMode === "file" ? fileContent : pasteContent;
    if (!rawData.trim()) return;

    setIsImporting(true);
    try {
      const res = await fetch(`${API}/admin/bulk-data/import`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          entity: selectedEntity,
          data: rawData,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`🎉 Successfully imported ${data.importedCount} ${selectedEntity} into database!`);
        setValidationResult(null);
        setPasteContent("");
        setFileContent("");
        setSelectedFileName(null);
        fetchStats();
      } else {
        const err = await res.json();
        showToast(`Import rejected: ${err.message || "Validation failed"}`);
      }
    } catch {
      showToast("Network error during import.");
    } finally {
      setIsImporting(false);
    }
  };

  // Download Templates
  const handleDownloadTemplate = (entity: string, format: "csv" | "excel") => {
    const token = getAuthToken();
    const url = `${API}/admin/bulk-data/templates/${format}?entity=${entity}&token=${token || ""}`;
    window.open(url, "_blank");
    showToast(`Downloading official ${format.toUpperCase()} template for ${entity}...`);
  };

  // Full Backup Export
  const handleExportFullBackup = async (format: "json" | "csv") => {
    setIsExporting(true);
    try {
      const res = await fetch(`${API}/admin/bulk-data/export/full-backup?format=${format}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `scholarpulse_full_backup_${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      showToast(`📦 Downloaded full institutional ${format.toUpperCase()} backup archive!`);
    } catch {
      showToast("Failed to generate backup export.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bulk-data-container">
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
            borderLeft: "4px solid #6366f1",
          }}
        >
          <Sparkles size={18} color="#6366f1" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="bulk-header">
        <div className="bulk-title-area">
          <h1>
            <Database size={28} />
            Data Hub & Bulk Import / Export
          </h1>
          <p className="bulk-subtitle">
            Enterprise bulk data ingestion, row-by-row syntax diagnostics, downloadable schemas, and full GDPR compliance backups.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className="export-btn"
            style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" }}
            onClick={() => handleExportFullBackup("json")}
            disabled={isExporting}
          >
            <Download size={16} />
            {isExporting ? "Compiling Archive..." : "Full Database Backup (JSON)"}
          </button>
        </div>
      </div>

      {/* KPI Stats Scorecard */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Enrolled Students</span>
            <div className="kpi-icon-wrap" style={{ background: "rgba(99, 102, 241, 0.12)", color: "#4f46e5" }}>
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-value">{dbStats.students}</div>
          <div className="kpi-subtext">Active student accounts</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Faculty Instructors</span>
            <div className="kpi-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
              <GraduationCap size={18} />
            </div>
          </div>
          <div className="kpi-value">{dbStats.faculty}</div>
          <div className="kpi-subtext">Teaching faculty & chairs</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Curriculum Courses</span>
            <div className="kpi-icon-wrap" style={{ background: "rgba(6, 182, 212, 0.12)", color: "#06b6d4" }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div className="kpi-value">{dbStats.courses}</div>
          <div className="kpi-subtext">Active semester courses</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Grades & Assessments</span>
            <div className="kpi-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
              <Award size={18} />
            </div>
          </div>
          <div className="kpi-value">{dbStats.grades}</div>
          <div className="kpi-subtext">Published exam results</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Attendance Records</span>
            <div className="kpi-icon-wrap" style={{ background: "rgba(168, 85, 247, 0.12)", color: "#9333ea" }}>
              <CalendarCheck size={18} />
            </div>
          </div>
          <div className="kpi-value">{dbStats.attendance}</div>
          <div className="kpi-subtext">Recorded class sessions</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="reports-tabs-nav">
        <button
          className={`tab-btn ${activeTab === "import" ? "active" : ""}`}
          onClick={() => setActiveTab("import")}
        >
          <Upload size={18} />
          Bulk Data Import Studio
        </button>
        <button
          className={`tab-btn ${activeTab === "templates" ? "active" : ""}`}
          onClick={() => setActiveTab("templates")}
        >
          <FileSpreadsheet size={18} />
          Downloadable Templates
        </button>
        <button
          className={`tab-btn ${activeTab === "backup" ? "active" : ""}`}
          onClick={() => setActiveTab("backup")}
        >
          <ShieldCheck size={18} />
          Full Backup & GDPR Portability
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          TAB 1: BULK DATA IMPORT STUDIO
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "import" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Step 1: Entity Selector */}
          <div className="inst-section">
            <div className="inst-section-title">
              <Layers size={20} color="#4f46e5" />
              Step 1: Select Target Entity to Ingest
            </div>
            <div className="entity-selector-grid">
              <div
                className={`entity-card ${selectedEntity === "students" ? "selected" : ""}`}
                onClick={() => { setSelectedEntity("students"); setValidationResult(null); }}
              >
                <div className="entity-icon-wrap" style={{ background: "rgba(99, 102, 241, 0.12)", color: "#4f46e5" }}>
                  <Users size={22} />
                </div>
                <strong style={{ fontSize: "0.92rem" }}>Students</strong>
                <span style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                  Profiles, IDs & Cohorts
                </span>
              </div>

              <div
                className={`entity-card ${selectedEntity === "faculty" ? "selected" : ""}`}
                onClick={() => { setSelectedEntity("faculty"); setValidationResult(null); }}
              >
                <div className="entity-icon-wrap" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
                  <GraduationCap size={22} />
                </div>
                <strong style={{ fontSize: "0.92rem" }}>Faculty</strong>
                <span style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                  Instructors & Chairs
                </span>
              </div>

              <div
                className={`entity-card ${selectedEntity === "courses" ? "selected" : ""}`}
                onClick={() => { setSelectedEntity("courses"); setValidationResult(null); }}
              >
                <div className="entity-icon-wrap" style={{ background: "rgba(6, 182, 212, 0.12)", color: "#06b6d4" }}>
                  <BookOpen size={22} />
                </div>
                <strong style={{ fontSize: "0.92rem" }}>Courses</strong>
                <span style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                  Curriculum & Credits
                </span>
              </div>

              <div
                className={`entity-card ${selectedEntity === "grades" ? "selected" : ""}`}
                onClick={() => { setSelectedEntity("grades"); setValidationResult(null); }}
              >
                <div className="entity-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
                  <Award size={22} />
                </div>
                <strong style={{ fontSize: "0.92rem" }}>Grades</strong>
                <span style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                  Exam Marks & Results
                </span>
              </div>

              <div
                className={`entity-card ${selectedEntity === "attendance" ? "selected" : ""}`}
                onClick={() => { setSelectedEntity("attendance"); setValidationResult(null); }}
              >
                <div className="entity-icon-wrap" style={{ background: "rgba(168, 85, 247, 0.12)", color: "#9333ea" }}>
                  <CalendarCheck size={22} />
                </div>
                <strong style={{ fontSize: "0.92rem" }}>Attendance</strong>
                <span style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                  Daily & Lab Presences
                </span>
              </div>
            </div>
          </div>

          {/* Step 2: Upload or Paste Content */}
          <div className="inst-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div className="inst-section-title">
                <Upload size={20} color="#059669" />
                Step 2: Upload CSV/Excel File or Paste Raw Text
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className={`attendance-pill-btn ${inputMode === "file" ? "active" : ""}`}
                  onClick={() => setInputMode("file")}
                >
                  File Upload
                </button>
                <button
                  className={`attendance-pill-btn ${inputMode === "paste" ? "active" : ""}`}
                  onClick={() => setInputMode("paste")}
                >
                  Paste Raw Data
                </button>
                <button
                  className="tab-btn"
                  style={{ padding: "4px 12px", fontSize: "0.78rem" }}
                  onClick={handleLoadSampleData}
                >
                  <Sparkles size={14} /> Load Demo Sample
                </button>
              </div>
            </div>

            {inputMode === "file" ? (
              <div
                className="upload-dropzone"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById("bulk-file-input")?.click()}
              >
                <input
                  id="bulk-file-input"
                  type="file"
                  accept=".csv,.txt"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <div className="upload-icon-circle">
                  <Upload size={26} />
                </div>
                <strong style={{ fontSize: "1rem" }}>
                  {selectedFileName ? selectedFileName : `Click or Drag & Drop ${selectedEntity.toUpperCase()} CSV File`}
                </strong>
                <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  Supports UTF-8 formatted CSV datasets up to 25 MB
                </span>
              </div>
            ) : (
              <div>
                <textarea
                  className="form-input"
                  style={{ width: "100%", height: 160, fontFamily: "monospace", fontSize: "0.82rem" }}
                  placeholder={`Paste comma-separated ${selectedEntity} records here...\nExample:\nfirstName,lastName,email,department...\nJohn,Doe,j.doe@scholarpulse.edu,Computer Science...`}
                  value={pasteContent}
                  onChange={(e) => {
                    setPasteContent(e.target.value);
                    setValidationResult(null);
                  }}
                />
              </div>
            )}

            {/* Action Bar */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 10 }}>
              <button
                className="tab-btn"
                style={{ padding: "10px 20px" }}
                onClick={handleValidate}
                disabled={isValidating}
              >
                <RefreshCw size={16} className={isValidating ? "animate-spin" : ""} />
                {isValidating ? "Scanning Dataset..." : "Run Validation Diagnostics (Dry Run)"}
              </button>

              <button
                className="export-btn"
                onClick={handleCommitImport}
                disabled={isImporting || !validationResult || validationResult.validCount === 0}
              >
                <CheckCircle2 size={16} />
                {isImporting ? "Importing Records..." : `Commit Bulk Import (${validationResult?.validCount || 0} Ready)`}
              </button>
            </div>
          </div>

          {/* Step 3: Detailed Diagnostics & Error Reporting */}
          {validationResult && (
            <div className="inst-section">
              <div className="diagnostics-banner">
                <div className="diagnostics-stat-group">
                  <div className="diag-stat">
                    <span className="val">{validationResult.totalRows}</span>
                    <span className="lbl">Total Rows Submitted</span>
                  </div>
                  <div className="diag-stat">
                    <span className="val" style={{ color: "#059669" }}>{validationResult.validCount}</span>
                    <span className="lbl">Valid & Sanitized</span>
                  </div>
                  <div className="diag-stat">
                    <span className="val" style={{ color: validationResult.errorCount > 0 ? "#dc2626" : "inherit" }}>
                      {validationResult.errorCount}
                    </span>
                    <span className="lbl">Errors / Violations</span>
                  </div>
                </div>

                <div>
                  <span
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      background:
                        validationResult.status === "VALID"
                          ? "rgba(16, 185, 129, 0.15)"
                          : validationResult.status === "WARNINGS"
                          ? "rgba(245, 158, 11, 0.15)"
                          : "rgba(239, 68, 68, 0.15)",
                      color:
                        validationResult.status === "VALID"
                          ? "#059669"
                          : validationResult.status === "WARNINGS"
                          ? "#b45309"
                          : "#b91c1c",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {validationResult.status === "VALID" ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <AlertTriangle size={16} />
                    )}
                    {validationResult.status === "VALID"
                      ? "CLEAN: READY TO COMMIT"
                      : validationResult.status === "WARNINGS"
                      ? "WARNINGS: PARTIAL ROWS VALID"
                      : "CRITICAL ERRORS: MUST RESOLVE"}
                  </span>
                </div>
              </div>

              {/* Error Details Table (if any) */}
              {validationResult.errors?.length > 0 && (
                <div>
                  <h4 style={{ margin: "0 0 10px 0", color: "#dc2626", display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertTriangle size={18} />
                    Itemized Validation Violations ({validationResult.errors.length} caught)
                  </h4>
                  <div style={{ overflowX: "auto" }}>
                    <table className="diag-table">
                      <thead>
                        <tr>
                          <th>Row #</th>
                          <th>Column Target</th>
                          <th>Input Value</th>
                          <th>Violation Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validationResult.errors.map((err: any, idx: number) => (
                          <tr key={idx}>
                            <td><strong>#{err.rowNumber}</strong></td>
                            <td><code>{err.column}</code></td>
                            <td>
                              <span style={{ fontFamily: "monospace", color: "#64748b" }}>
                                {err.value === "" ? "<EMPTY>" : String(err.value)}
                              </span>
                            </td>
                            <td style={{ color: "#dc2626", fontWeight: 600 }}>{err.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Data Preview Table */}
              <div>
                <h4 style={{ margin: "14px 0 10px 0", fontSize: "0.92rem", fontWeight: 700 }}>
                  Parsed Dataset Preview (First {validationResult.preview?.length || 0} Rows)
                </h4>
                <div style={{ overflowX: "auto" }}>
                  <table className="diag-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Row #</th>
                        <th>Payload Summary</th>
                        <th>Diagnostics</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationResult.preview?.map((p: any) => (
                        <tr key={p.rowNumber}>
                          <td>
                            {p.status === "VALID" ? (
                              <span style={{ color: "#059669", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
                                <Check size={16} /> VALID
                              </span>
                            ) : (
                              <span style={{ color: "#dc2626", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
                                <X size={16} /> REJECTED
                              </span>
                            )}
                          </td>
                          <td><strong>#{p.rowNumber}</strong></td>
                          <td>
                            <code style={{ fontSize: "0.78rem" }}>
                              {JSON.stringify(p.data)}
                            </code>
                          </td>
                          <td>
                            {p.errors?.length > 0 ? (
                              <span style={{ color: "#dc2626", fontSize: "0.78rem" }}>{p.errors.join(", ")}</span>
                            ) : (
                              <span style={{ color: "#059669", fontSize: "0.78rem" }}>Passed all schema constraints</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 2: DOWNLOADABLE TEMPLATES
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "templates" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20 }}>
          {/* Students Template Card */}
          <div className="template-card">
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className="template-badge" style={{ background: "rgba(99, 102, 241, 0.12)", color: "#4f46e5" }}>
                  Students Schema
                </span>
                <Users size={20} color="#4f46e5" />
              </div>
              <h3 style={{ margin: "12px 0 6px 0", fontSize: "1.15rem" }}>Student Enrollment Template</h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
                Includes first & last names, email validation, academic department, unique matriculation ID, and intake year.
              </p>
              <div style={{ marginTop: 14, background: "var(--bg-hover, #f8fafc)", padding: "10px 14px", borderRadius: 8, fontSize: "0.76rem", fontFamily: "monospace" }}>
                firstName*, lastName*, email*, department*, studentId*, enrollmentYear*
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="tab-btn"
                style={{ flex: 1, padding: "8px 12px", fontSize: "0.8rem", border: "1px solid var(--border-primary)" }}
                onClick={() => handleDownloadTemplate("students", "csv")}
              >
                <Download size={14} /> Download CSV
              </button>
              <button
                className="tab-btn"
                style={{ flex: 1, padding: "8px 12px", fontSize: "0.8rem", border: "1px solid var(--border-primary)" }}
                onClick={() => handleDownloadTemplate("students", "excel")}
              >
                <FileSpreadsheet size={14} /> Download Excel
              </button>
            </div>
          </div>

          {/* Faculty Template Card */}
          <div className="template-card">
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className="template-badge" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
                  Faculty Schema
                </span>
                <GraduationCap size={20} color="#10b981" />
              </div>
              <h3 style={{ margin: "12px 0 6px 0", fontSize: "1.15rem" }}>Faculty Directory Template</h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
                Instructors, lecturers, professors, and department chairs with academic titles and field specializations.
              </p>
              <div style={{ marginTop: 14, background: "var(--bg-hover, #f8fafc)", padding: "10px 14px", borderRadius: 8, fontSize: "0.76rem", fontFamily: "monospace" }}>
                firstName*, lastName*, email*, department*, title*, specialization*
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="tab-btn"
                style={{ flex: 1, padding: "8px 12px", fontSize: "0.8rem", border: "1px solid var(--border-primary)" }}
                onClick={() => handleDownloadTemplate("faculty", "csv")}
              >
                <Download size={14} /> Download CSV
              </button>
              <button
                className="tab-btn"
                style={{ flex: 1, padding: "8px 12px", fontSize: "0.8rem", border: "1px solid var(--border-primary)" }}
                onClick={() => handleDownloadTemplate("faculty", "excel")}
              >
                <FileSpreadsheet size={14} /> Download Excel
              </button>
            </div>
          </div>

          {/* Courses Template Card */}
          <div className="template-card">
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className="template-badge" style={{ background: "rgba(6, 182, 212, 0.12)", color: "#06b6d4" }}>
                  Curriculum Schema
                </span>
                <BookOpen size={20} color="#06b6d4" />
              </div>
              <h3 style={{ margin: "12px 0 6px 0", fontSize: "1.15rem" }}>Courses & Modules Template</h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
                Curriculum courses with unique course codes (e.g. CS301), academic credits (1-10), semester, and capacity limits.
              </p>
              <div style={{ marginTop: 14, background: "var(--bg-hover, #f8fafc)", padding: "10px 14px", borderRadius: 8, fontSize: "0.76rem", fontFamily: "monospace" }}>
                code*, name*, department*, credits*, semester*, capacity*
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="tab-btn"
                style={{ flex: 1, padding: "8px 12px", fontSize: "0.8rem", border: "1px solid var(--border-primary)" }}
                onClick={() => handleDownloadTemplate("courses", "csv")}
              >
                <Download size={14} /> Download CSV
              </button>
              <button
                className="tab-btn"
                style={{ flex: 1, padding: "8px 12px", fontSize: "0.8rem", border: "1px solid var(--border-primary)" }}
                onClick={() => handleDownloadTemplate("courses", "excel")}
              >
                <FileSpreadsheet size={14} /> Download Excel
              </button>
            </div>
          </div>

          {/* Grades Template Card */}
          <div className="template-card">
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className="template-badge" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
                  Grades Schema
                </span>
                <Award size={20} color="#f59e0b" />
              </div>
              <h3 style={{ margin: "12px 0 6px 0", fontSize: "1.15rem" }}>Exam & Assessment Grades</h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
                Course evaluation results, marks obtained, total scale, with automatic percentage and letter grade computation.
              </p>
              <div style={{ marginTop: 14, background: "var(--bg-hover, #f8fafc)", padding: "10px 14px", borderRadius: 8, fontSize: "0.76rem", fontFamily: "monospace" }}>
                studentId*, courseCode*, examTitle*, marksObtained*, totalMarks*, semester*
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="tab-btn"
                style={{ flex: 1, padding: "8px 12px", fontSize: "0.8rem", border: "1px solid var(--border-primary)" }}
                onClick={() => handleDownloadTemplate("grades", "csv")}
              >
                <Download size={14} /> Download CSV
              </button>
              <button
                className="tab-btn"
                style={{ flex: 1, padding: "8px 12px", fontSize: "0.8rem", border: "1px solid var(--border-primary)" }}
                onClick={() => handleDownloadTemplate("grades", "excel")}
              >
                <FileSpreadsheet size={14} /> Download Excel
              </button>
            </div>
          </div>

          {/* Attendance Template Card */}
          <div className="template-card">
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className="template-badge" style={{ background: "rgba(168, 85, 247, 0.12)", color: "#9333ea" }}>
                  Attendance Schema
                </span>
                <CalendarCheck size={20} color="#9333ea" />
              </div>
              <h3 style={{ margin: "12px 0 6px 0", fontSize: "1.15rem" }}>Attendance Sessions Template</h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
                Daily and laboratory attendance logs with mandatory date format (YYYY-MM-DD) and statuses (present, absent, late, excused).
              </p>
              <div style={{ marginTop: 14, background: "var(--bg-hover, #f8fafc)", padding: "10px 14px", borderRadius: 8, fontSize: "0.76rem", fontFamily: "monospace" }}>
                studentId*, courseCode*, date*, status*, notes
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="tab-btn"
                style={{ flex: 1, padding: "8px 12px", fontSize: "0.8rem", border: "1px solid var(--border-primary)" }}
                onClick={() => handleDownloadTemplate("attendance", "csv")}
              >
                <Download size={14} /> Download CSV
              </button>
              <button
                className="tab-btn"
                style={{ flex: 1, padding: "8px 12px", fontSize: "0.8rem", border: "1px solid var(--border-primary)" }}
                onClick={() => handleDownloadTemplate("attendance", "excel")}
              >
                <FileSpreadsheet size={14} /> Download Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 3: FULL BACKUP & GDPR DATA PORTABILITY EXPORT
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "backup" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="backup-hero-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <span className="term-badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#059669", marginBottom: 8 }}>
                  <ShieldCheck size={14} /> GDPR Data Portability & FERPA Archival Certified
                </span>
                <h2 style={{ margin: "8px 0 4px 0", fontSize: "1.45rem", fontWeight: 800 }}>
                  Full Institutional Database Archive
                </h2>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)" }}>
                  Aggregates comprehensive relational snapshots of all scholars, faculty, curriculum, examination grades, attendance logs, and invoices.
                </p>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="export-btn"
                  onClick={() => handleExportFullBackup("json")}
                  disabled={isExporting}
                >
                  <Download size={16} />
                  {isExporting ? "Compiling..." : "Export Full JSON Archive"}
                </button>
                <button
                  className="tab-btn"
                  style={{ background: "#ffffff", padding: "9px 16px", border: "1px solid var(--border-primary)" }}
                  onClick={() => handleExportFullBackup("csv")}
                  disabled={isExporting}
                >
                  <FileText size={16} />
                  Export Summary CSV
                </button>
              </div>
            </div>

            {/* Specifications & Compliance Specs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              <div style={{ padding: "16px", borderRadius: 12, background: "rgba(255, 255, 255, 0.7)", border: "1px solid var(--border-primary)" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 4 }}>Cryptographic Seal</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 8 }}>
                  Every backup generates a deterministic SHA-256 integrity checksum appended to the manifest.
                </div>
                <span className="checksum-pill">
                  <Lock size={12} color="#059669" /> SHA-256 Tamper-Proof Seal
                </span>
              </div>

              <div style={{ padding: "16px", borderRadius: 12, background: "rgba(255, 255, 255, 0.7)", border: "1px solid var(--border-primary)" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 4 }}>Credentials Redaction</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 8 }}>
                  Password hashes and cryptographic session secrets are permanently redacted in compliance with FERPA regulations.
                </div>
                <span className="term-badge" style={{ background: "rgba(99, 102, 241, 0.1)", color: "#4f46e5" }}>
                  <ShieldCheck size={12} /> Privacy Firewall Enforced
                </span>
              </div>

              <div style={{ padding: "16px", borderRadius: 12, background: "rgba(255, 255, 255, 0.7)", border: "1px solid var(--border-primary)" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 4 }}>Immutable Audit Logging</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 8 }}>
                  All bulk export actions are permanently logged in the append-only cryptographic ledger with IP and device identity.
                </div>
                <span className="term-badge" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#d97706" }}>
                  <Clock size={12} /> Audit Trail Registered
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
