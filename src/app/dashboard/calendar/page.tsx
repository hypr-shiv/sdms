"use client";

import { useState, useEffect, useMemo } from "react";
import { type Role } from "@/lib/mockData";
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, GraduationCap,
  PartyPopper, AlertCircle, Clock, BookOpen, MapPin, CheckCircle,
  Filter, Layers, User, ShieldAlert, Edit2, Trash2, X, Star,
  CalendarCheck, CalendarDays, DollarSign, UserCheck, ArrowRight
} from "lucide-react";
import "../dashboard.css";
import "./calendar.css";

const API = "http://localhost:3001";

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export type EventType = "exam" | "holiday" | "deadline" | "event" | "registration" | "fee_due" | "timetable";

const EVENT_TYPE_CONFIG: Record<string, { icon: any; color: string; label: string; bg: string }> = {
  exam: { icon: <GraduationCap size={13} />, color: "#ef4444", label: "Exam / Quiz", bg: "rgba(239, 68, 68, 0.12)" },
  holiday: { icon: <PartyPopper size={13} />, color: "#10b981", label: "Holiday", bg: "rgba(16, 185, 129, 0.12)" },
  deadline: { icon: <AlertCircle size={13} />, color: "#f59e0b", label: "Assignment Due", bg: "rgba(245, 158, 11, 0.12)" },
  timetable: { icon: <Clock size={13} />, color: "#8b5cf6", label: "Lecture / Lab", bg: "rgba(139, 92, 246, 0.12)" },
  event: { icon: <BookOpen size={13} />, color: "#6366f1", label: "Campus Event", bg: "rgba(99, 102, 241, 0.12)" },
  registration: { icon: <Clock size={13} />, color: "#3b82f6", label: "Registration", bg: "rgba(59, 130, 246, 0.12)" },
  fee_due: { icon: <DollarSign size={13} />, color: "#ec4899", label: "Fee Due", bg: "rgba(236, 72, 153, 0.12)" },
};

// ─── External Calendar Direct Sync Helpers ───
function getGoogleCalendarUrl(ev: CalendarEventItem) {
  const start = ev.allDay
    ? ev.startDate.replace(/-/g, "")
    : `${ev.startDate.replace(/-/g, "")}T${(ev.startTime || "09:00").replace(":", "")}00`;
  const end = ev.allDay
    ? (ev.endDate || ev.startDate).replace(/-/g, "")
    : `${(ev.endDate || ev.startDate).replace(/-/g, "")}T${(ev.endTime || "10:00").replace(":", "")}00`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates: `${start}/${end}`,
    details: `${ev.description || ""}\n\nSynced from ScholarPulse Academic Portal`,
    location: ev.location || "Campus",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function getOutlookCalendarUrl(ev: CalendarEventItem) {
  const start = `${ev.startDate}T${ev.startTime || "09:00"}:00`;
  const end = `${ev.endDate || ev.startDate}T${ev.endTime || "10:00"}:00`;
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: ev.title,
    startdt: start,
    enddt: end,
    body: `${ev.description || ""}\n\nSynced from ScholarPulse Academic Portal`,
    location: ev.location || "Campus",
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function downloadSingleIcs(ev: CalendarEventItem) {
  const cleanStart = ev.allDay
    ? `VALUE=DATE:${ev.startDate.replace(/-/g, "")}`
    : `${ev.startDate.replace(/-/g, "")}T${(ev.startTime || "09:00").replace(":", "")}00`;
  const cleanEnd = ev.allDay
    ? `VALUE=DATE:${(ev.endDate || ev.startDate).replace(/-/g, "")}`
    : `${(ev.endDate || ev.startDate).replace(/-/g, "")}T${(ev.endTime || "10:00").replace(":", "")}00`;

  const nowIso = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ScholarPulse//Single Event Export//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${ev.id}@scholarpulse.edu`,
    `DTSTAMP:${nowIso}`,
    ev.allDay ? `DTSTART;${cleanStart}` : `DTSTART:${cleanStart}`,
    ev.allDay ? `DTEND;${cleanEnd}` : `DTEND:${cleanEnd}`,
    `SUMMARY:${ev.title.replace(/,/g, "\\,")}`,
    `DESCRIPTION:${(ev.description || "").replace(/\n/g, "\\n")}`,
    `LOCATION:${(ev.location || "Campus").replace(/,/g, "\\,")}`,
    `CATEGORIES:${ev.type.toUpperCase()}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsLines], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ev.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface SemesterItem {
  id: string;
  code: string;
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  addDropDeadline?: string;
  withdrawalDeadline?: string;
  isCurrent: boolean;
  status: string;
  description?: string;
}

interface CalendarEventItem {
  id: string;
  title: string;
  description?: string;
  type: string;
  startDate: string;
  endDate?: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
  color: string;
  semesterId?: string;
  semesterCode?: string;
  roleVisibility: string;
  location?: string;
  isKeyDate: boolean;
  createdBy?: string;
  sourceType?: "timetable" | "assignment" | "exam" | "campus_event";
  courseCode?: string;
  totalMarks?: number;
  duration?: number;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function CalendarPage() {
  const [user, setUser] = useState<{ role: Role; userId?: string; email?: string } | null>(null);
  const [viewTab, setViewTab] = useState<"month" | "agenda" | "semesters">("month");
  const [loading, setLoading] = useState(true);

  // Core Data
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [semesters, setSemesters] = useState<SemesterItem[]>([]);
  const [currentSemester, setCurrentSemester] = useState<SemesterItem | null>(null);

  // External Calendar Subscription & Sync
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [copyFeedback, setCopyFeedback] = useState("");
  const [syncPrefs, setSyncPrefs] = useState({
    includeTimetables: true,
    includeAssignments: true,
    includeExams: true,
    includeMilestones: true,
  });

  // Calendar Date State
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1)); // Default to Sep 2026
  const [selectedDate, setSelectedDate] = useState<string | null>("2026-10-05");

  // Filtering State
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState<string>("all");
  const [keyDatesOnly, setKeyDatesOnly] = useState(false);

  // Modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventItem | null>(null);
  const [eventFormData, setEventFormData] = useState<Partial<CalendarEventItem>>({
    title: "", description: "", type: "event", startDate: "2026-10-15", endDate: "",
    allDay: true, startTime: "09:00", endTime: "10:00", color: "#6366f1",
    roleVisibility: "all", location: "", isKeyDate: false, semesterCode: "FA26"
  });

  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [editingSemester, setEditingSemester] = useState<SemesterItem | null>(null);
  const [semesterFormData, setSemesterFormData] = useState<Partial<SemesterItem>>({
    code: "", name: "", academicYear: "2026-2027", startDate: "2027-01-11", endDate: "2027-05-14",
    registrationStartDate: "2026-12-01", registrationEndDate: "2027-01-10",
    addDropDeadline: "2027-01-25", withdrawalDeadline: "2027-03-26", isCurrent: false, description: ""
  });

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) setUser(JSON.parse(userData));
    } catch {}
    loadCalendarData();
  }, []);

  async function loadCalendarData() {
    setLoading(true);
    try {
      const [eventsRes, semRes, currentSemRes, subRes] = await Promise.all([
        fetch(`${API}/calendar/aggregated?userId=std_alice&semesterCode=FA26`, { headers: authHeaders() }).catch(() => null),
        fetch(`${API}/calendar/semesters`, { headers: authHeaders() }).catch(() => null),
        fetch(`${API}/calendar/semesters/current`, { headers: authHeaders() }).catch(() => null),
        fetch(`${API}/calendar/subscription?userId=std_alice`, { headers: authHeaders() }).catch(() => null),
      ]);

      if (eventsRes && eventsRes.ok) {
        const evData = await eventsRes.json();
        setEvents(evData);
      }
      if (semRes && semRes.ok) {
        const sData = await semRes.json();
        setSemesters(sData);
      }
      if (currentSemRes && currentSemRes.ok) {
        const curData = await currentSemRes.json();
        setCurrentSemester(curData);
      }
      if (subRes && subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData);
        setSyncPrefs({
          includeTimetables: subData.includeTimetables,
          includeAssignments: subData.includeAssignments,
          includeExams: subData.includeExams,
          includeMilestones: subData.includeMilestones,
        });
      }
    } catch (err) {
      console.error("Failed to load calendar data", err);
    } finally {
      setLoading(false);
    }
  }

  // Month navigation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split("T")[0];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now.toISOString().split("T")[0]);
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      // Role filtering (handled on backend, but reinforced on frontend)
      if (user?.role && user.role !== "admin") {
        const vis = e.roleVisibility || "all";
        if (vis !== "all" && !vis.includes(user.role)) return false;
      }

      if (selectedType !== "all" && e.type !== selectedType) return false;
      if (selectedSemesterFilter !== "all" && e.semesterCode !== selectedSemesterFilter) return false;
      if (keyDatesOnly && !e.isKeyDate) return false;

      return true;
    });
  }, [events, selectedType, selectedSemesterFilter, keyDatesOnly, user]);

  const getEventsForDate = (dateStr: string) => {
    return filteredEvents.filter(e => {
      if (e.startDate === dateStr) return true;
      if (e.endDate && e.startDate <= dateStr && e.endDate >= dateStr) return true;
      return false;
    });
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  // Calendar cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Agenda items sorted chronologically
  const agendaEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [filteredEvents]);

  // Event Handlers
  async function handleSaveEvent(e: React.FormEvent) {
    e.preventDefault();
    try {
      const isEdit = Boolean(editingEvent);
      const url = isEdit ? `${API}/calendar/${editingEvent!.id}` : `${API}/calendar`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(eventFormData),
      });

      if (!res.ok) throw new Error("Failed to save event");
      setShowEventModal(false);
      setEditingEvent(null);
      loadCalendarData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  async function handleDeleteEvent(id: string) {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      const res = await fetch(`${API}/calendar/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete event");
      loadCalendarData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  // Semester Handlers
  async function handleSaveSemester(e: React.FormEvent) {
    e.preventDefault();
    try {
      const isEdit = Boolean(editingSemester);
      const url = isEdit ? `${API}/calendar/semesters/${editingSemester!.id}` : `${API}/calendar/semesters`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(semesterFormData),
      });

      if (!res.ok) throw new Error("Failed to save semester");
      setShowSemesterModal(false);
      setEditingSemester(null);
      loadCalendarData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  async function handleSetCurrentSemester(id: string) {
    try {
      const res = await fetch(`${API}/calendar/semesters/${id}/set-current`, {
        method: "PUT",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to set current semester");
      loadCalendarData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  return (
    <div className="calendar-page-wrap">
      {/* ─── Page Hero ─── */}
      <div className="page-hero" style={{ marginBottom: 0 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{
              background: "rgba(99, 102, 241, 0.12)", color: "var(--accent-primary)",
              padding: "4px 10px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: 0.5
            }}>
              Academic Timetable & Term Lifecycle
            </span>
          </div>
          <h1 className="page-title" style={{ marginBottom: 6 }}>Academic Calendar & Semesters</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Institutional schedule of examinations, registration deadlines, fee due dates, and campus holidays.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            className="sync-btn"
            onClick={() => setShowSyncModal(true)}
            style={{
              padding: "9px 18px",
              borderRadius: 10,
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CalendarCheck size={16} /> Sync External Calendar (.ics)
          </button>
          {user?.role === "admin" && (
            <>
              <button
                onClick={() => {
                  setEditingSemester(null);
                  setSemesterFormData({
                    code: "", name: "", academicYear: "2026-2027",
                    startDate: "2027-01-11", endDate: "2027-05-14",
                    registrationStartDate: "2026-12-01", registrationEndDate: "2027-01-10",
                    addDropDeadline: "2027-01-25", withdrawalDeadline: "2027-03-26",
                    isCurrent: false, description: ""
                  });
                  setShowSemesterModal(true);
                }}
                style={{
                  background: "var(--bg-secondary)", color: "var(--text-primary)",
                  border: "1px solid var(--border-primary)", padding: "9px 16px",
                  borderRadius: 10, fontSize: "0.85rem", fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <Layers size={15} /> Create Semester
              </button>

              <button
                onClick={() => {
                  setEditingEvent(null);
                  setEventFormData({
                    title: "", description: "", type: "event", startDate: "2026-10-15",
                    endDate: "", allDay: true, startTime: "09:00", endTime: "10:00",
                    color: "#6366f1", roleVisibility: "all", location: "Main Campus",
                    isKeyDate: false, semesterCode: currentSemester?.code || "FA26"
                  });
                  setShowEventModal(true);
                }}
                style={{
                  background: "var(--accent-primary)", color: "#fff",
                  border: "none", padding: "9px 18px", borderRadius: 10,
                  fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                  boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)"
                }}
              >
                <Plus size={16} /> Add Calendar Event
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── Active Term Banner ─── */}
      {currentSemester && (
        <div className="term-banner-card">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.1rem", fontWeight: 800
            }}>
              {currentSemester.code}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <span className="term-pill-active">
                  <CheckCircle size={12} /> Active Term
                </span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
                  Academic Year {currentSemester.academicYear}
                </span>
              </div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                {currentSemester.name}
              </h2>
            </div>
          </div>

          <div style={{
            display: "flex", gap: 24, alignItems: "center",
            padding: "8px 16px", background: "var(--bg-secondary)", borderRadius: 12
          }}>
            <div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", fontWeight: 600 }}>Term Dates</div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {currentSemester.startDate} to {currentSemester.endDate}
              </div>
            </div>
            {currentSemester.addDropDeadline && (
              <div>
                <div style={{ fontSize: "0.72rem", color: "#f59e0b", fontWeight: 600 }}>Add/Drop Deadline</div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {currentSemester.addDropDeadline}
                </div>
              </div>
            )}
            {currentSemester.withdrawalDeadline && (
              <div>
                <div style={{ fontSize: "0.72rem", color: "#ef4444", fontWeight: 600 }}>Withdrawal Deadline</div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {currentSemester.withdrawalDeadline}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Navigation Tabs ─── */}
      <div className="calendar-view-tabs">
        <button
          className={`calendar-tab-btn ${viewTab === "month" ? "active" : ""}`}
          onClick={() => setViewTab("month")}
        >
          <CalendarIcon size={16} /> Month Calendar Grid
        </button>
        <button
          className={`calendar-tab-btn ${viewTab === "agenda" ? "active" : ""}`}
          onClick={() => setViewTab("agenda")}
        >
          <CalendarDays size={16} /> Academic Key Dates & Agenda ({filteredEvents.length})
        </button>
        {user?.role === "admin" && (
          <button
            className={`calendar-tab-btn ${viewTab === "semesters" ? "active" : ""}`}
            onClick={() => setViewTab("semesters")}
            style={{ borderLeft: "2px solid var(--border-primary)", paddingLeft: 14 }}
          >
            <Layers size={16} style={{ color: "var(--accent-primary)" }} />
            <span style={{ fontWeight: 600 }}>Admin: Semesters & Terms Hub</span>
          </button>
        )}
      </div>

      {/* ─── Category & Role Filter Bar ─── */}
      <div className="calendar-filters-bar">
        <div className="event-category-chips">
          <button
            className={`event-category-chip ${selectedType === "all" ? "active" : ""}`}
            onClick={() => setSelectedType("all")}
          >
            All Events
          </button>
          {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              className={`event-category-chip ${selectedType === key ? "active" : ""}`}
              onClick={() => setSelectedType(key)}
            >
              <span style={{ color: selectedType === key ? "#fff" : cfg.color }}>{cfg.icon}</span>
              {cfg.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "var(--text-secondary)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={keyDatesOnly}
              onChange={e => setKeyDatesOnly(e.target.checked)}
            />
            <Star size={13} style={{ color: "#f59e0b" }} /> Key Dates Only
          </label>

          <select
            value={selectedSemesterFilter}
            onChange={e => setSelectedSemesterFilter(e.target.value)}
            style={{
              background: "var(--bg-secondary)", border: "1px solid var(--border-primary)",
              borderRadius: 8, padding: "6px 12px", fontSize: "0.8rem", color: "var(--text-primary)"
            }}
          >
            <option value="all">All Semesters</option>
            {semesters.map(s => (
              <option key={s.id} value={s.code}>{s.name} ({s.code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          TAB 1: MONTH CALENDAR GRID
          ════════════════════════════════════════════════════════════ */}
      {viewTab === "month" && (
        <div style={{ display: "grid", gridTemplateColumns: selectedDate ? "1fr 340px" : "1fr", gap: 20 }}>
          <div className="calendar-grid-card">
            {/* Month Header */}
            <div className="month-nav-header">
              <div className="month-nav-title">
                {MONTHS[month]} {year}
                <button
                  onClick={goToday}
                  style={{
                    background: "var(--bg-secondary)", border: "1px solid var(--border-primary)",
                    borderRadius: 6, padding: "4px 10px", fontSize: "0.75rem",
                    fontWeight: 600, cursor: "pointer", color: "var(--text-secondary)"
                  }}
                >
                  Today
                </button>
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                <button className="month-arrow-btn" onClick={prevMonth} title="Previous Month">
                  <ChevronLeft size={18} />
                </button>
                <button className="month-arrow-btn" onClick={nextMonth} title="Next Month">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Days of Week */}
            <div className="calendar-days-grid" style={{ gap: 4 }}>
              {DAYS.map(day => (
                <div key={day} className="calendar-day-label">{day}</div>
              ))}

              {/* Day Cells */}
              {cells.map((dayNum, idx) => {
                if (dayNum === null) {
                  return <div key={`empty-${idx}`} className="calendar-day-cell empty" />;
                }

                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const dayEvents = getEventsForDate(dateStr);

                return (
                  <div
                    key={dateStr}
                    className={`calendar-day-cell ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedDate(dateStr)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="cell-date-num" style={{ color: isToday ? "#6366f1" : undefined }}>
                        {dayNum}
                      </span>
                      {dayEvents.some(e => e.isKeyDate) && (
                        <Star size={10} style={{ color: "#f59e0b", fill: "#f59e0b" }} />
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 2 }}>
                      {dayEvents.slice(0, 3).map(ev => {
                        const typeCfg = EVENT_TYPE_CONFIG[ev.type] || EVENT_TYPE_CONFIG.event;
                        return (
                          <div
                            key={ev.id}
                            className="cell-event-chip"
                            style={{
                              background: typeCfg.bg,
                              color: typeCfg.color,
                              borderLeft: `2px solid ${typeCfg.color}`
                            }}
                            title={`${ev.title} (${ev.type})`}
                          >
                            <span>{typeCfg.icon}</span>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</span>
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <span style={{ fontSize: "0.65rem", color: "var(--text-tertiary)", fontWeight: 700, paddingLeft: 4 }}>
                          +{dayEvents.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Date Events Side Drawer */}
          {selectedDate && (
            <div className="date-events-drawer">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--accent-primary)", fontWeight: 700, textTransform: "uppercase" }}>
                    Selected Date
                  </span>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, {
                      weekday: "short", month: "short", day: "numeric", year: "numeric"
                    })}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}
                >
                  <X size={16} />
                </button>
              </div>

              {selectedDateEvents.length === 0 ? (
                <div style={{ padding: "30px 10px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.85rem" }}>
                  No academic events or deadlines scheduled for this date.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {selectedDateEvents.map(ev => {
                    const cfg = EVENT_TYPE_CONFIG[ev.type] || EVENT_TYPE_CONFIG.event;
                    return (
                      <div key={ev.id} style={{
                        background: "var(--bg-secondary)", borderRadius: 10, padding: 14,
                        borderLeft: `4px solid ${cfg.color}`, display: "flex", flexDirection: "column", gap: 6
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{
                            fontSize: "0.7rem", fontWeight: 700, color: cfg.color,
                            background: cfg.bg, padding: "2px 8px", borderRadius: 4, display: "flex", alignItems: "center", gap: 4
                          }}>
                            {cfg.icon} {cfg.label}
                          </span>
                          {ev.isKeyDate && (
                            <span style={{ fontSize: "0.7rem", color: "#f59e0b", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                              <Star size={11} fill="#f59e0b" /> Key Date
                            </span>
                          )}
                        </div>

                        <h4 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                          {ev.title}
                        </h4>

                        {ev.description && (
                          <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                            {ev.description}
                          </p>
                        )}

                        <div style={{ display: "flex", gap: 12, fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: 4 }}>
                          {ev.startTime && (
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <Clock size={12} /> {ev.startTime} {ev.endTime ? `- ${ev.endTime}` : ""}
                            </span>
                          )}
                          {ev.location && (
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <MapPin size={12} /> {ev.location}
                            </span>
                          )}
                        </div>

                        <div className="external-sync-pills-row" style={{ marginTop: 6, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8 }}>
                          <a
                            href={getGoogleCalendarUrl(ev)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="external-sync-action-btn"
                            title="Add to Google Calendar"
                          >
                            <CalendarIcon size={12} color="#4285F4" /> Google
                          </a>
                          <a
                            href={getOutlookCalendarUrl(ev)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="external-sync-action-btn"
                            title="Add to Microsoft Outlook"
                          >
                            <CalendarDays size={12} color="#0078D4" /> Outlook
                          </a>
                          <button
                            onClick={() => downloadSingleIcs(ev)}
                            className="external-sync-action-btn"
                            title="Download .ICS file"
                          >
                            <CalendarCheck size={12} color="#10B981" /> .ICS
                          </button>
                        </div>

                        {user?.role === "admin" && (
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
                            <button
                              onClick={() => {
                                setEditingEvent(ev);
                                setEventFormData(ev);
                                setShowEventModal(true);
                              }}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.72rem" }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(ev.id)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "0.72rem" }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 2: ACADEMIC KEY DATES & AGENDAS
          ════════════════════════════════════════════════════════════ */}
      {viewTab === "agenda" && (
        <div className="agenda-list-wrap">
          {agendaEvents.map(ev => {
            const cfg = EVENT_TYPE_CONFIG[ev.type] || EVENT_TYPE_CONFIG.event;
            const eventDate = new Date(ev.startDate + "T00:00:00");
            const monthShort = eventDate.toLocaleDateString(undefined, { month: "short" });
            const dayNum = eventDate.getDate();

            return (
              <div key={ev.id} className="agenda-item-card">
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <div className="agenda-date-box">
                    <div className="agenda-date-month">{monthShort}</div>
                    <div className="agenda-date-day">{dayNum}</div>
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontSize: "0.72rem", fontWeight: 700, color: cfg.color,
                        background: cfg.bg, padding: "2px 8px", borderRadius: 4, display: "flex", alignItems: "center", gap: 4
                      }}>
                        {cfg.icon} {cfg.label}
                      </span>
                      {ev.semesterCode && (
                        <span style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", fontWeight: 600 }}>
                          • {ev.semesterCode}
                        </span>
                      )}
                      {ev.isKeyDate && (
                        <span style={{
                          fontSize: "0.68rem", fontWeight: 700, color: "#f59e0b",
                          background: "rgba(245, 158, 11, 0.12)", padding: "1px 6px", borderRadius: 4, display: "flex", alignItems: "center", gap: 3
                        }}>
                          <Star size={10} fill="#f59e0b" /> Milestone
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                      {ev.title}
                    </h3>

                    {ev.description && (
                      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "4px 0 0", lineHeight: 1.4 }}>
                        {ev.description}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                    {ev.startTime ? (
                      <span><Clock size={12} style={{ display: "inline", marginRight: 3 }} /> {ev.startTime} {ev.endTime ? `- ${ev.endTime}` : ""}</span>
                    ) : (
                      <span>All Day</span>
                    )}
                  </div>
                  {ev.location && (
                    <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={12} /> {ev.location}
                    </div>
                  )}

                  <div className="external-sync-pills-row" style={{ marginTop: 2 }}>
                    <a
                      href={getGoogleCalendarUrl(ev)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="external-sync-action-btn"
                      title="Add to Google Calendar"
                    >
                      <CalendarIcon size={12} color="#4285F4" /> Google
                    </a>
                    <a
                      href={getOutlookCalendarUrl(ev)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="external-sync-action-btn"
                      title="Add to Microsoft Outlook"
                    >
                      <CalendarDays size={12} color="#0078D4" /> Outlook
                    </a>
                    <button
                      onClick={() => downloadSingleIcs(ev)}
                      className="external-sync-action-btn"
                      title="Download .ICS file"
                    >
                      <CalendarCheck size={12} color="#10B981" /> .ICS
                    </button>
                  </div>

                  {user?.role === "admin" && (
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <button
                        onClick={() => {
                          setEditingEvent(ev);
                          setEventFormData(ev);
                          setShowEventModal(true);
                        }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: "0.75rem" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "0.75rem" }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB 3: SEMESTERS & TERMS HUB (ADMIN ONLY)
          ════════════════════════════════════════════════════════════ */}
      {viewTab === "semesters" && user?.role === "admin" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08))",
            border: "1px solid rgba(99, 102, 241, 0.2)", borderRadius: 12, padding: "14px 18px",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ShieldAlert size={22} style={{ color: "var(--accent-primary)" }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-primary)" }}>
                  Institutional Semester Lifecycle Command Center
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Create and manage academic terms, course registration dates, add/drop windows, and set the current active semester for ScholarPulse.
                </div>
              </div>
            </div>
            <span style={{
              background: "var(--accent-primary)", color: "#fff",
              padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700
            }}>
              Admin Privileges
            </span>
          </div>

          <div className="semesters-grid">
            {semesters.map(sem => (
              <div key={sem.id} className={`semester-card ${sem.isCurrent ? "active-term" : ""}`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{
                      fontWeight: 800, fontSize: "0.85rem", color: sem.isCurrent ? "#10b981" : "var(--accent-primary)",
                      background: sem.isCurrent ? "rgba(16, 185, 129, 0.12)" : "rgba(99, 102, 241, 0.12)",
                      padding: "3px 8px", borderRadius: 4
                    }}>
                      {sem.code}
                    </span>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginTop: 6, margin: "6px 0 2px" }}>
                      {sem.name}
                    </h3>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-tertiary)" }}>
                      Academic Year {sem.academicYear}
                    </div>
                  </div>

                  {sem.isCurrent ? (
                    <span className="term-pill-active">
                      <CheckCircle size={12} /> Active Term
                    </span>
                  ) : (
                    <span style={{
                      fontSize: "0.72rem", color: "var(--text-tertiary)",
                      background: "var(--bg-secondary)", padding: "3px 8px", borderRadius: 4, fontWeight: 600
                    }}>
                      {sem.status}
                    </span>
                  )}
                </div>

                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.4, margin: 0 }}>
                  {sem.description || "Standard university academic instruction term."}
                </p>

                <div style={{
                  background: "var(--bg-secondary)", borderRadius: 10, padding: 12,
                  display: "flex", flexDirection: "column", gap: 6, fontSize: "0.78rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-tertiary)" }}>Instruction:</span>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{sem.startDate} to {sem.endDate}</span>
                  </div>
                  {sem.registrationStartDate && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-tertiary)" }}>Registration:</span>
                      <span style={{ fontWeight: 600, color: "#3b82f6" }}>{sem.registrationStartDate} to {sem.registrationEndDate}</span>
                    </div>
                  )}
                  {sem.addDropDeadline && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-tertiary)" }}>Add/Drop Deadline:</span>
                      <span style={{ fontWeight: 600, color: "#f59e0b" }}>{sem.addDropDeadline}</span>
                    </div>
                  )}
                  {sem.withdrawalDeadline && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-tertiary)" }}>Withdrawal Deadline:</span>
                      <span style={{ fontWeight: 600, color: "#ef4444" }}>{sem.withdrawalDeadline}</span>
                    </div>
                  )}
                </div>

                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  paddingTop: 10, borderTop: "1px solid var(--border-primary)", marginTop: "auto"
                }}>
                  {!sem.isCurrent ? (
                    <button
                      onClick={() => handleSetCurrentSemester(sem.id)}
                      style={{
                        background: "var(--accent-primary)", color: "#fff", border: "none",
                        borderRadius: 6, padding: "5px 12px", fontSize: "0.75rem", fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      Set as Active Term
                    </button>
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 700 }}>
                      Current Term Live
                    </span>
                  )}

                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => {
                        setEditingSemester(sem);
                        setSemesterFormData(sem);
                        setShowSemesterModal(true);
                      }}
                      style={{
                        background: "var(--bg-secondary)", border: "1px solid var(--border-primary)",
                        borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: "var(--text-secondary)"
                      }}
                      title="Edit Semester"
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          MODAL: ADD / EDIT CALENDAR EVENT
          ════════════════════════════════════════════════════════════ */}
      {showEventModal && (
        <div className="modal-overlay">
          <div className="modal-content-card">
            <div className="modal-header">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                {editingEvent ? "Edit Calendar Event" : "Create Academic Calendar Event"}
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent}>
              <div className="modal-body">
                <div className="form-group-custom">
                  <label>Event Title *</label>
                  <input
                    className="form-control-custom"
                    placeholder="e.g. Midterm Examination Week"
                    value={eventFormData.title || ""}
                    onChange={e => setEventFormData({ ...eventFormData, title: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group-custom">
                    <label>Event Type</label>
                    <select
                      className="form-control-custom"
                      value={eventFormData.type || "event"}
                      onChange={e => setEventFormData({ ...eventFormData, type: e.target.value })}
                    >
                      <option value="exam">Examination</option>
                      <option value="holiday">Holiday / Recess</option>
                      <option value="deadline">Academic Deadline</option>
                      <option value="registration">Registration Window</option>
                      <option value="fee_due">Tuition / Fee Due Date</option>
                      <option value="event">Campus Event</option>
                    </select>
                  </div>

                  <div className="form-group-custom">
                    <label>Associated Semester</label>
                    <select
                      className="form-control-custom"
                      value={eventFormData.semesterCode || "FA26"}
                      onChange={e => setEventFormData({ ...eventFormData, semesterCode: e.target.value })}
                    >
                      {semesters.map(s => (
                        <option key={s.id} value={s.code}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group-custom">
                    <label>Start Date *</label>
                    <input
                      className="form-control-custom"
                      type="date"
                      value={eventFormData.startDate || ""}
                      onChange={e => setEventFormData({ ...eventFormData, startDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group-custom">
                    <label>End Date (Optional)</label>
                    <input
                      className="form-control-custom"
                      type="date"
                      value={eventFormData.endDate || ""}
                      onChange={e => setEventFormData({ ...eventFormData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group-custom">
                    <label>Start Time (e.g. 09:00)</label>
                    <input
                      className="form-control-custom"
                      type="time"
                      value={eventFormData.startTime || ""}
                      onChange={e => setEventFormData({ ...eventFormData, startTime: e.target.value, allDay: false })}
                    />
                  </div>

                  <div className="form-group-custom">
                    <label>End Time</label>
                    <input
                      className="form-control-custom"
                      type="time"
                      value={eventFormData.endTime || ""}
                      onChange={e => setEventFormData({ ...eventFormData, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group-custom">
                    <label>Location / Venue</label>
                    <input
                      className="form-control-custom"
                      placeholder="e.g. Hall 204 or Online"
                      value={eventFormData.location || ""}
                      onChange={e => setEventFormData({ ...eventFormData, location: e.target.value })}
                    />
                  </div>

                  <div className="form-group-custom">
                    <label>Role Visibility Target</label>
                    <select
                      className="form-control-custom"
                      value={eventFormData.roleVisibility || "all"}
                      onChange={e => setEventFormData({ ...eventFormData, roleVisibility: e.target.value })}
                    >
                      <option value="all">All Roles (Students, Faculty, Admins)</option>
                      <option value="student">Students & Parents Only</option>
                      <option value="teacher">Faculty & Teachers Only</option>
                      <option value="admin">Administrators Only</option>
                    </select>
                  </div>
                </div>

                <div className="form-group-custom">
                  <label>Description / Notes</label>
                  <textarea
                    className="form-control-custom"
                    rows={2}
                    placeholder="Instructions, syllabus coverage, or details..."
                    value={eventFormData.description || ""}
                    onChange={e => setEventFormData({ ...eventFormData, description: e.target.value })}
                  />
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "var(--text-secondary)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={Boolean(eventFormData.isKeyDate)}
                    onChange={e => setEventFormData({ ...eventFormData, isKeyDate: e.target.checked })}
                  />
                  Highlight as Major Academic Milestone (Key Date)
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  style={{
                    background: "var(--bg-card)", border: "1px solid var(--border-primary)",
                    padding: "8px 16px", borderRadius: 8, fontSize: "0.85rem", cursor: "pointer",
                    color: "var(--text-secondary)"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: "var(--accent-primary)", color: "#fff", border: "none",
                    padding: "8px 18px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {editingEvent ? "Update Event" : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          MODAL: ADD / EDIT SEMESTER
          ════════════════════════════════════════════════════════════ */}
      {showSemesterModal && (
        <div className="modal-overlay">
          <div className="modal-content-card">
            <div className="modal-header">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                {editingSemester ? "Edit Semester" : "Create Academic Term"}
              </h3>
              <button
                onClick={() => setShowSemesterModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSemester}>
              <div className="modal-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                  <div className="form-group-custom">
                    <label>Term Code *</label>
                    <input
                      className="form-control-custom"
                      placeholder="e.g. SP27"
                      value={semesterFormData.code || ""}
                      onChange={e => setSemesterFormData({ ...semesterFormData, code: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>

                  <div className="form-group-custom">
                    <label>Semester Name *</label>
                    <input
                      className="form-control-custom"
                      placeholder="e.g. Spring Semester 2027"
                      value={semesterFormData.name || ""}
                      onChange={e => setSemesterFormData({ ...semesterFormData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group-custom">
                  <label>Academic Year</label>
                  <input
                    className="form-control-custom"
                    placeholder="e.g. 2026-2027"
                    value={semesterFormData.academicYear || "2026-2027"}
                    onChange={e => setSemesterFormData({ ...semesterFormData, academicYear: e.target.value })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group-custom">
                    <label>Start Date *</label>
                    <input
                      className="form-control-custom"
                      type="date"
                      value={semesterFormData.startDate || ""}
                      onChange={e => setSemesterFormData({ ...semesterFormData, startDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group-custom">
                    <label>End Date *</label>
                    <input
                      className="form-control-custom"
                      type="date"
                      value={semesterFormData.endDate || ""}
                      onChange={e => setSemesterFormData({ ...semesterFormData, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group-custom">
                    <label>Registration Start</label>
                    <input
                      className="form-control-custom"
                      type="date"
                      value={semesterFormData.registrationStartDate || ""}
                      onChange={e => setSemesterFormData({ ...semesterFormData, registrationStartDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group-custom">
                    <label>Registration End</label>
                    <input
                      className="form-control-custom"
                      type="date"
                      value={semesterFormData.registrationEndDate || ""}
                      onChange={e => setSemesterFormData({ ...semesterFormData, registrationEndDate: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="form-group-custom">
                    <label>Add/Drop Deadline</label>
                    <input
                      className="form-control-custom"
                      type="date"
                      value={semesterFormData.addDropDeadline || ""}
                      onChange={e => setSemesterFormData({ ...semesterFormData, addDropDeadline: e.target.value })}
                    />
                  </div>

                  <div className="form-group-custom">
                    <label>Withdrawal Deadline</label>
                    <input
                      className="form-control-custom"
                      type="date"
                      value={semesterFormData.withdrawalDeadline || ""}
                      onChange={e => setSemesterFormData({ ...semesterFormData, withdrawalDeadline: e.target.value })}
                    />
                  </div>
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "var(--text-secondary)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={Boolean(semesterFormData.isCurrent)}
                    onChange={e => setSemesterFormData({ ...semesterFormData, isCurrent: e.target.checked })}
                  />
                  Set as Active Current Semester
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowSemesterModal(false)}
                  style={{
                    background: "var(--bg-card)", border: "1px solid var(--border-primary)",
                    padding: "8px 16px", borderRadius: 8, fontSize: "0.85rem", cursor: "pointer",
                    color: "var(--text-secondary)"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: "var(--accent-primary)", color: "#fff", border: "none",
                    padding: "8px 18px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {editingSemester ? "Update Term" : "Save Semester"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── External Calendar Subscription & Sync Modal ─── */}
      {showSyncModal && (
        <div className="sync-modal-backdrop" onClick={() => setShowSyncModal(false)}>
          <div className="sync-modal-card" onClick={e => e.stopPropagation()}>
            <div className="sync-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))",
                  border: "1px solid rgba(99, 102, 241, 0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <CalendarCheck size={22} color="#818cf8" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#fff" }}>
                    External Calendar Subscription (iCal / Webcal)
                  </h3>
                  <p style={{ margin: "3px 0 0", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    Subscribe to live academic events in Google Calendar, Apple Calendar, or Outlook.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSyncModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="sync-modal-body">
              {/* Feed URL box */}
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#cbd5e1", display: "block", marginBottom: 6 }}>
                  Your Private iCal Feed URL
                </label>
                <div className="sync-url-container">
                  <div className="sync-url-text">
                    {subscription?.feedUrl || "http://localhost:3001/calendar/feed/cal_sec_demo.ics"}
                  </div>
                  <button
                    className="sync-copy-btn"
                    onClick={async () => {
                      if (subscription?.feedUrl) {
                        await navigator.clipboard.writeText(subscription.feedUrl);
                        setCopyFeedback("Copied URL to Clipboard!");
                        setTimeout(() => setCopyFeedback(""), 3000);
                      }
                    }}
                  >
                    Copy URL
                  </button>
                </div>
                {copyFeedback && (
                  <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 600, marginTop: 4, display: "block" }}>
                    ✓ {copyFeedback}
                  </span>
                )}
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <a
                    href={subscription?.webcalUrl || "#"}
                    className="sync-copy-btn"
                    style={{ background: "linear-gradient(135deg, #10b981, #059669)", textDecoration: "none" }}
                  >
                    ⚡ Subscribe Directly via Webcal
                  </a>
                  <button
                    onClick={async () => {
                      if (confirm("Regenerating will invalidate your existing calendar subscription link in all external apps. Proceed?")) {
                        const res = await fetch(`${API}/calendar/subscription/regenerate`, {
                          method: "POST",
                          headers: authHeaders(),
                          body: JSON.stringify({ userId: "std_alice" }),
                        });
                        if (res.ok) {
                          const updated = await res.json();
                          setSubscription(updated);
                          setCopyFeedback("Generated new secure token!");
                          setTimeout(() => setCopyFeedback(""), 3000);
                        }
                      }
                    }}
                    style={{
                      background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)",
                      color: "#f87171", padding: "8px 12px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer"
                    }}
                  >
                    Regenerate URL
                  </button>
                </div>
              </div>

              {/* Preferences Checklist */}
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#cbd5e1", display: "block", marginBottom: 8 }}>
                  Include in External Feed
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "#e2e8f0", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={syncPrefs.includeTimetables}
                      onChange={async e => {
                        const val = e.target.checked;
                        setSyncPrefs({ ...syncPrefs, includeTimetables: val });
                        await fetch(`${API}/calendar/subscription/preferences`, {
                          method: "PATCH",
                          headers: authHeaders(),
                          body: JSON.stringify({ userId: "std_alice", includeTimetables: val }),
                        });
                      }}
                    />
                    <span>Class Timetables & Lectures</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "#e2e8f0", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={syncPrefs.includeAssignments}
                      onChange={async e => {
                        const val = e.target.checked;
                        setSyncPrefs({ ...syncPrefs, includeAssignments: val });
                        await fetch(`${API}/calendar/subscription/preferences`, {
                          method: "PATCH",
                          headers: authHeaders(),
                          body: JSON.stringify({ userId: "std_alice", includeAssignments: val }),
                        });
                      }}
                    />
                    <span>Assignment Deadlines</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "#e2e8f0", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={syncPrefs.includeExams}
                      onChange={async e => {
                        const val = e.target.checked;
                        setSyncPrefs({ ...syncPrefs, includeExams: val });
                        await fetch(`${API}/calendar/subscription/preferences`, {
                          method: "PATCH",
                          headers: authHeaders(),
                          body: JSON.stringify({ userId: "std_alice", includeExams: val }),
                        });
                      }}
                    />
                    <span>Exams & Assessments</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "#e2e8f0", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={syncPrefs.includeMilestones}
                      onChange={async e => {
                        const val = e.target.checked;
                        setSyncPrefs({ ...syncPrefs, includeMilestones: val });
                        await fetch(`${API}/calendar/subscription/preferences`, {
                          method: "PATCH",
                          headers: authHeaders(),
                          body: JSON.stringify({ userId: "std_alice", includeMilestones: val }),
                        });
                      }}
                    />
                    <span>Academic Milestones & Holidays</span>
                  </label>
                </div>
              </div>

              {/* Instructions Guides */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px" }}>
                <h4 style={{ margin: "0 0 10px", fontSize: "0.88rem", fontWeight: 700, color: "#fff" }}>
                  How to Subscribe in your Favorite App
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "0.8rem", color: "#94a3b8" }}>
                  <div>
                    <strong style={{ color: "#60a5fa" }}>🌐 Google Calendar:</strong>
                    <div style={{ marginTop: 2 }}>
                      Open Google Calendar web $\rightarrow$ in left sidebar click <strong>"+"</strong> next to &quot;Other calendars&quot; $\rightarrow$ select <strong>&quot;From URL&quot;</strong> $\rightarrow$ paste feed URL $\rightarrow$ click <strong>Add calendar</strong>.
                    </div>
                  </div>
                  <div>
                    <strong style={{ color: "#a78bfa" }}>🍎 Apple Calendar (iOS / macOS):</strong>
                    <div style={{ marginTop: 2 }}>
                      Click <strong>&quot;Subscribe Directly via Webcal&quot;</strong> above, or in Apple Calendar choose <strong>File $\rightarrow$ New Calendar Subscription</strong> $\rightarrow$ paste feed URL.
                    </div>
                  </div>
                  <div>
                    <strong style={{ color: "#38bdf8" }}>📧 Microsoft Outlook (Desktop / 365):</strong>
                    <div style={{ marginTop: 2 }}>
                      In Outlook Calendar, click <strong>Add Calendar $\rightarrow$ Subscribe from web</strong> $\rightarrow$ paste URL $\rightarrow$ name it &quot;ScholarPulse&quot; and save.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
