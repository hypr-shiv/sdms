"use client";

import { useState, useEffect } from "react";
import { type Role, MOCK_SCHEDULE_TODAY } from "@/lib/mockData";
import { Clock, MapPin, User, ChevronLeft, ChevronRight } from "lucide-react";
import "../dashboard.css";
import EmptyState from "@/components/UI/EmptyState";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const WEEKLY_SCHEDULE: Record<string, typeof MOCK_SCHEDULE_TODAY> = {
  Monday: [
    { id: "w1", courseCode: "CS301", courseName: "Data Structures & Algorithms", time: "09:00", endTime: "10:30", room: "Room 204", instructor: "Dr. Sarah Mitchell", type: "lecture", color: "#6366f1" },
    { id: "w2", courseCode: "MTH201", courseName: "Linear Algebra", time: "11:00", endTime: "12:00", room: "Room 108", instructor: "Prof. James Chen", type: "lecture", color: "#8b5cf6" },
    { id: "w3", courseCode: "ENG101", courseName: "Technical Writing", time: "14:00", endTime: "15:00", room: "Room 105", instructor: "Dr. Maria Lopez", type: "lecture", color: "#10b981" },
  ],
  Tuesday: [
    { id: "w4", courseCode: "PHY102", courseName: "Physics II", time: "09:00", endTime: "10:30", room: "Room 312", instructor: "Dr. Emily Parker", type: "lecture", color: "#f59e0b" },
    { id: "w5", courseCode: "CS401", courseName: "Machine Learning", time: "13:00", endTime: "14:30", room: "Room 301", instructor: "Dr. Raj Patel", type: "lecture", color: "#ec4899" },
  ],
  Wednesday: MOCK_SCHEDULE_TODAY,
  Thursday: [
    { id: "w6", courseCode: "MTH201", courseName: "Linear Algebra", time: "11:00", endTime: "12:30", room: "Room 108", instructor: "Prof. James Chen", type: "tutorial", color: "#8b5cf6" },
    { id: "w7", courseCode: "PHY102", courseName: "Physics II", time: "14:00", endTime: "15:30", room: "Lab 5", instructor: "Dr. Emily Parker", type: "lab", color: "#f59e0b" },
    { id: "w8", courseCode: "CS401", courseName: "Machine Learning", time: "16:00", endTime: "17:30", room: "Room 301", instructor: "Dr. Raj Patel", type: "lecture", color: "#ec4899" },
  ],
  Friday: [
    { id: "w9", courseCode: "CS301", courseName: "Data Structures & Algorithms", time: "09:00", endTime: "10:30", room: "Room 204", instructor: "Dr. Sarah Mitchell", type: "lecture", color: "#6366f1" },
    { id: "w10", courseCode: "ENG101", courseName: "Technical Writing", time: "11:00", endTime: "12:00", room: "Room 105", instructor: "Dr. Maria Lopez", type: "lecture", color: "#10b981" },
  ],
  Saturday: [],
};

const TYPE_STYLES: Record<string, { bg: string; label: string }> = {
  lecture: { bg: "rgba(99, 102, 241, 0.1)", label: "Lecture" },
  lab: { bg: "rgba(6, 182, 212, 0.1)", label: "Lab" },
  tutorial: { bg: "rgba(245, 158, 11, 0.1)", label: "Tutorial" },
  exam: { bg: "rgba(239, 68, 68, 0.1)", label: "Exam" },
};

export default function SchedulePage() {
  const [user, setUser] = useState<{ role: Role } | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("Wednesday");

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) setUser(JSON.parse(userData));
    } catch {}

    // Auto-select today
    const todayIndex = new Date().getDay();
    const dayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    if (DAYS_OF_WEEK.includes(dayMap[todayIndex])) {
      setSelectedDay(dayMap[todayIndex]);
    }
  }, []);

  if (!user) return null;

  const schedule = WEEKLY_SCHEDULE[selectedDay] || [];
  const totalHours = schedule.reduce((acc, s) => {
    const [sh, sm] = s.time.split(":").map(Number);
    const [eh, em] = s.endTime.split(":").map(Number);
    return acc + (eh - sh) + (em - sm) / 60;
  }, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Hero */}
      <div className="page-hero" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 8 }}>Weekly Schedule</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            {schedule.length} class{schedule.length !== 1 ? "es" : ""} · {totalHours.toFixed(1)} hours on {selectedDay}
          </p>
        </div>
      </div>

      {/* Day Tabs */}
      <div style={{
        display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4,
      }}>
        {DAYS_OF_WEEK.map(day => {
          const daySchedule = WEEKLY_SCHEDULE[day] || [];
          const isActive = selectedDay === day;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              style={{
                padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer",
                background: isActive ? "var(--text-primary)" : "var(--bg-secondary)",
                color: isActive ? "#fff" : "var(--text-secondary)",
                fontWeight: isActive ? 600 : 400, fontSize: "0.85rem",
                transition: "all 0.2s", whiteSpace: "nowrap",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                minWidth: 90,
              }}
            >
              <span>{day.slice(0, 3)}</span>
              <span style={{
                fontSize: "0.68rem", opacity: 0.7,
              }}>
                {daySchedule.length} class{daySchedule.length !== 1 ? "es" : ""}
              </span>
            </button>
          );
        })}
      </div>

      {/* Schedule Timeline */}
      {schedule.length === 0 ? (
        <EmptyState
          variant="attendance"
          title={`No Classes on ${selectedDay}`}
          description="Enjoy your free day! No lectures, labs, or seminars scheduled for today."
          action={{
            label: "View Weekly Calendar",
            href: "/dashboard/calendar",
          }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
          {/* Timeline line */}
          <div style={{
            position: "absolute", left: 23, top: 24, bottom: 24,
            width: 2, background: "var(--border-primary)", zIndex: 0,
          }} />

          {schedule.map((entry, i) => {
            const typeStyle = TYPE_STYLES[entry.type] || TYPE_STYLES.lecture;

            return (
              <div key={entry.id} style={{
                display: "flex", gap: 20, position: "relative", zIndex: 1,
                paddingBottom: i < schedule.length - 1 ? 16 : 0,
              }}>
                {/* Time + dot */}
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  minWidth: 48,
                }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: "50%", background: entry.color,
                    border: "3px solid var(--bg-primary)", boxShadow: `0 0 0 2px ${entry.color}`,
                    zIndex: 2,
                  }} />
                  <div style={{
                    fontSize: "0.72rem", color: "var(--text-tertiary)", marginTop: 6,
                    fontWeight: 500, whiteSpace: "nowrap",
                  }}>
                    {entry.time}
                  </div>
                </div>

                {/* Card */}
                <div className="card" style={{
                  flex: 1, padding: "16px 20px",
                  borderLeft: `3px solid ${entry.color}`,
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                        <span style={{
                          fontSize: "0.72rem", fontWeight: 600, color: entry.color,
                          background: `${entry.color}12`, padding: "2px 8px", borderRadius: 4,
                        }}>
                          {entry.courseCode}
                        </span>
                        <span style={{
                          fontSize: "0.68rem", fontWeight: 500, padding: "2px 8px", borderRadius: 4,
                          background: typeStyle.bg, color: "var(--text-secondary)",
                          textTransform: "uppercase", letterSpacing: "0.5px",
                        }}>
                          {typeStyle.label}
                        </span>
                      </div>
                      <h3 style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        {entry.courseName}
                      </h3>
                    </div>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                      {entry.time} – {entry.endTime}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      <MapPin size={13} /> {entry.room}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      <User size={13} /> {entry.instructor}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
