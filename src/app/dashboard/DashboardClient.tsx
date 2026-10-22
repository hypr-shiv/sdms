"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, AlertCircle, BookOpen, TrendingUp, Clock, GraduationCap, Bell as BellIcon, FileText, ClipboardList, HeartHandshake, Sparkles, ShieldCheck, CreditCard } from "lucide-react";
import { type Role } from "@/lib/mockData";
import Modal from "@/components/Modal";

// ─── Utilities ───

/** Animated count-up hook */
function useCountUp(target: number, duration: number = 1200, decimals: number = 2) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]);

  return value.toFixed(decimals);
}

/** Calculate time remaining as a human string */
function getCountdown(dueDate: string): string {
  const now = new Date().getTime();
  const due = new Date(dueDate).getTime();
  const diff = due - now;
  if (diff <= 0) return "Overdue";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m`;
}

/** Relative time string */
function getRelativeTime(dateStr: string): string {
  const now = new Date().getTime();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** GPA Sparkline SVG */
function GpaSparkline({ data }: { data: { semester: string; gpa: number }[] }) {
  const width = 200;
  const height = 48;
  const padding = 8;
  const maxGpa = 4.0;
  const minGpa = Math.min(...data.map(d => d.gpa)) - 0.2;

  const points = data.map((d, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: height - padding - ((d.gpa - minGpa) / (maxGpa - minGpa)) * (height - padding * 2),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div className="sparkline-container">
      <svg className="sparkline-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="sparkline-area" d={areaPath} />
        <path className="sparkline-line" d={linePath} />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            className={i === points.length - 1 ? 'sparkline-dot-last' : 'sparkline-dot'}
            r={i === points.length - 1 ? 4 : 2.5}
          />
        ))}
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// STUDENT DASHBOARD (Enhanced Bento Layout)
// ═══════════════════════════════════════════════════
function StudentDashboard({
  name,
  stats,
  studentWellness,
  assignments = [],
  notifications = [],
  schedule = [],
}: {
  name: string;
  stats?: any;
  studentWellness?: any;
  assignments?: any[];
  notifications?: any[];
  schedule?: any[];
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const studentStats = {
    gpa: 3.8,
    gpaTrend: 0.1,
    attendancePercent: 92,
    attendanceTrend: 1,
    assignmentsCompleted: 0,
    assignmentsTotal: 0,
    upcomingDeadlines: 0,
    streak: 0,
    totalCredits: 0,
    rank: 1,
    totalStudents: 1,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    ...stats,
  };
  const circumference = 2 * Math.PI * 70;
  const dashOffset = circumference * (1 - (studentStats.attendancePercent || 85) / 100);

  const gpaDisplay = useCountUp(studentStats.gpa || 3.8, 1400, 2);
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});

  const upcomingDeadlines = assignments && assignments.length > 0
    ? assignments.filter((a: any) => a.workflowState === 'published').slice(0, 4)
    : [];

  // Live countdown timer
  useEffect(() => {
    const update = () => {
      const newCountdowns: Record<string, string> = {};
      upcomingDeadlines.forEach((d: any) => {
        newCountdowns[d.id] = getCountdown(d.due || d.dueDate || new Date().toISOString());
      });
      setCountdowns(newCountdowns);
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [assignments]);

  const gpaVal = studentStats.gpa || 3.8;
  const gpaHistory = [
    { semester: 'Fall 25', gpa: Math.max(2.0, Number((gpaVal - 0.2).toFixed(2))) },
    { semester: 'Spring 26', gpa: Math.max(2.0, Number((gpaVal - 0.1).toFixed(2))) },
    { semester: 'Fall 26', gpa: Number(gpaVal.toFixed(2)) },
  ];

  // Attendance ring color
  const attPercent = studentStats.attendancePercent || 85;
  const ringColor = attPercent >= 85 ? '#22c55e' : attPercent >= 75 ? '#f59e0b' : '#ef4444';

  // Notification type icons
  const notifIcons: Record<string, string> = {
    academic: '📚', financial: '💰', alert: '⚠️', system: '📢',
  };

  return (
    <>
      {/* ─── Hero Section ─── */}
      <div className="page-hero">
        <div className="hero-left">
          <div className="progress-section" style={{ marginBottom: 16 }}>
            <div className="progress-item">
              <span className="progress-label">Assignments</span>
              <div className="progress-pill pill-dark">
                {studentStats.assignmentsCompleted}/{studentStats.assignmentsTotal}
              </div>
            </div>
            <div className="progress-item">
              <span className="progress-label">GPA</span>
              <div className="progress-pill pill-accent">
                {studentStats.gpa?.toFixed(2)}
              </div>
            </div>
            <div className="progress-item">
              <span className="progress-label">Streak</span>
              <div className="progress-pill pill-dark" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                🔥 {studentStats.streak || 14} days
              </div>
            </div>
            <div
              className="progress-item"
              onClick={() => router.push('/dashboard/fees')}
              style={{ cursor: 'pointer' }}
              title="Click to view and pay tuition fees"
            >
              <span className="progress-label">Tuition Due</span>
              <div className="progress-pill" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 600 }}>
                💳 $3,000.00
              </div>
            </div>
          </div>
          <h1 className="page-title">Welcome in, {name.split(" ")[0]}</h1>
        </div>

        <div className="hero-metrics">
          <div className="hero-metric">
            <span className="hero-metric-icon">
              <BookOpen size={20} strokeWidth={1.5} />
            </span>
            <div className="hero-metric-content">
              <span className="hero-metric-value">{studentStats.totalCredits}</span>
              <span className="hero-metric-label">Credits</span>
            </div>
          </div>
          <div className="hero-metric">
            <span className="hero-metric-icon">
              <Check size={20} strokeWidth={1.5} />
            </span>
            <div className="hero-metric-content">
              <span className="hero-metric-value">{studentStats.assignmentsCompleted}</span>
              <span className="hero-metric-label">Tasks</span>
            </div>
          </div>
          <div className="hero-metric">
            <span className="hero-metric-icon">
              <AlertCircle size={20} strokeWidth={1.5} />
            </span>
            <div className="hero-metric-content">
              <span className="hero-metric-value">{studentStats.upcomingDeadlines}</span>
              <span className="hero-metric-label">Deadlines</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── AI Academic Wellness & Empathetic Guidance Center (FR-AI-01) ─── */}
      <div
        className="card card-enter"
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(16, 185, 129, 0.08))',
          border: '1px solid rgba(99, 102, 241, 0.22)',
          borderRadius: 20,
          padding: '24px 28px',
          boxShadow: '0 8px 24px -6px rgba(99, 102, 241, 0.08)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, #6366f1, #10b981)'
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <HeartHandshake size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Academic Guidance & Wellness Center
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}
                >
                  AI Guided
                </span>
              </div>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                Continuous predictive pacing and faculty support office hours
              </span>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard/at-risk')}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              background: 'rgba(99, 102, 241, 0.12)',
              color: '#6366f1',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            Full Wellness Center <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Empathetic Notification Text */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 14,
            padding: '14px 18px',
            border: '1px solid var(--border-glass)',
            marginBottom: 16
          }}
        >
          <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 500 }}>
            {studentWellness?.empatheticMessage ||
              "Your professors are here to help! Schedule office hours or peer tutoring whenever you want to clarify concepts."}
          </p>
        </div>

        {/* Support Resources / Campus Circles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {(studentWellness?.supportResources || [
            { name: "Peer Tutoring (Calculus & Physics)", schedule: "Tue & Thu 3:00 - 5:00 PM", location: "Science Library Rm 204", actionText: "Reserve Peer Tutor" },
            { name: "Faculty Office Hours (Drop-In)", schedule: "Wednesdays 2:00 - 4:00 PM", location: "Turing Hall Suite 302", actionText: "Book Office Hours" },
            { name: "Academic Writing & Submission Lab", schedule: "Daily 10:00 AM - 6:00 PM", location: "Online / Student Union", actionText: "Join Writing Circle" }
          ]).map((circle: any, i: number) => (
            <div
              key={i}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 12,
                padding: '12px 14px',
                border: '1px solid var(--border-glass)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 8
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)', marginBottom: 2 }}>{circle.name}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>🕒 {circle.schedule}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>📍 {circle.location}</div>
              </div>
              <button
                onClick={() => alert(`Reserved slot for ${circle.name}. A calendar reminder has been dispatched to your schedule.`)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  background: 'var(--accent-primary)',
                  color: '#000',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                {circle.actionText}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Bento Grid ─── */}
      <div className="dashboard-grid-bento">
        {/* ── GPA Card ── */}
        <div className="card card-enter" style={{ animationDelay: '0.05s' }}>
          <div className="card-header">
            <h3 className="card-title">Cumulative GPA</h3>
            <button className="card-action-btn" onClick={() => router.push('/dashboard/grades')}>
              <ArrowUpRight size={16} strokeWidth={2} />
            </button>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="card-large-value count-up-value">
              {gpaDisplay}
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 400 }}>/ 4.00</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span className={`gpa-delta ${(studentStats.gpaTrend || 0) >= 0 ? 'positive' : 'negative'}`}>
                <TrendingUp size={12} />
                {(studentStats.gpaTrend || 0) >= 0 ? '+' : ''}{(studentStats.gpaTrend || 0).toFixed(2)}
              </span>
              <span className="card-badge" style={{ marginTop: 0 }}>
                Rank #{studentStats.rank || 24}/{studentStats.totalStudents || 180}
              </span>
            </div>
            <GpaSparkline data={gpaHistory} />
          </div>
        </div>

        {/* ── Attendance Card ── */}
        <div className="card card-enter" style={{ animationDelay: '0.1s' }}>
          <div className="card-header">
            <h3 className="card-title">Attendance</h3>
            <button className="card-action-btn" onClick={() => router.push('/dashboard/attendance')}>
              <ArrowUpRight size={16} strokeWidth={2} />
            </button>
          </div>
          <div className="circle-chart">
            <svg className="attendance-ring" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
              <circle className="circle-bg" cx="80" cy="80" r="70" />
              <circle
                className="circle-progress"
                cx="80"
                cy="80"
                r="70"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ stroke: ringColor }}
              />
            </svg>
            <div className="circle-content">
              <span className="circle-value">{attPercent}%</span>
              <span className="circle-label">Present</span>
            </div>
          </div>
          <div className="attendance-breakdown">
            <div className="att-stat">
              <span className="att-stat-value" style={{ color: '#22c55e' }}>{studentStats.presentDays || 52}</span>
              <span className="att-stat-label">Present</span>
            </div>
            <div className="att-stat">
              <span className="att-stat-value" style={{ color: '#ef4444' }}>{studentStats.absentDays || 4}</span>
              <span className="att-stat-label">Absent</span>
            </div>
            <div className="att-stat">
              <span className="att-stat-value" style={{ color: '#f59e0b' }}>{studentStats.lateDays || 3}</span>
              <span className="att-stat-label">Late</span>
            </div>
          </div>
        </div>

        {/* ── Upcoming Deadlines Card (spans 2 rows) ── */}
        <div className="card card-span-row-2 card-enter" style={{ animationDelay: '0.15s' }}>
          <div className="card-header">
            <h3 className="card-title">Upcoming Deadlines</h3>
            <button className="card-action-btn" onClick={() => router.push('/dashboard/assignments')}>
              <ArrowUpRight size={16} strokeWidth={2} />
            </button>
          </div>
          <div className="deadline-list" style={{ flex: 1 }}>
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map((d: any) => (
                <div className="deadline-item" key={d.id} onClick={() => { setSelectedAssignment(d); setIsModalOpen(true); }}>
                  <div className={`deadline-urgency-dot urgency-${d.urgency || 'medium'}`} />
                  <div className="deadline-content">
                    <div className="deadline-title">{d.title}</div>
                    <div className="deadline-course">{d.courseCode || d.course} · {d.courseName || d.course}</div>
                  </div>
                  <div className={`deadline-countdown ${d.urgency === 'high' ? 'urgent' : ''}`}>
                    {countdowns[d.id] || '—'}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Check size={28} color="#10b981" style={{ marginBottom: 8 }} />
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem' }}>No pending deadlines</div>
                <div style={{ fontSize: '0.8rem', marginTop: 4 }}>You have turned in all active assignments.</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Gamification Card ── */}
        <div className="card card-enter" style={{ animationDelay: '0.2s' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">Achievements</h3>
            <a
              href="/dashboard/gamification"
              style={{
                fontSize: '0.8rem',
                color: '#818cf8',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Leaderboard & Badges →
            </a>
          </div>
          <div className="gamification-section">
            {/* Streak */}
            <div className="streak-display">
              <span className="streak-flame">🔥</span>
              <div className="streak-info">
                <span className="streak-count">{studentStats.streak || 14}-day</span>
                <span className="streak-label">Attendance Streak</span>
              </div>
            </div>

            {/* XP Bar */}
            <div className="xp-section">
              <div className="xp-header">
                <span className="xp-level">Level {studentStats.level || 7}</span>
                <span className="xp-text">{studentStats.xp || 2340} / {studentStats.xpToNext || 3000} XP</span>
              </div>
              <div className="xp-bar">
                <div
                  className="xp-fill"
                  style={{ width: `${((studentStats.xp || 2340) / (studentStats.xpToNext || 3000)) * 100}%` }}
                />
              </div>
            </div>

            {/* Badges */}
            <div className="badge-grid">
              <div className="badge-item rarity-rare" title="100% attendance consistency">
                ⭐
                <span className="badge-tooltip">Active Scholar</span>
              </div>
              <div className="badge-item rarity-epic" title="Semester GPA advancement">
                📈
                <span className="badge-tooltip">GPA Climber</span>
              </div>
              <div className="badge-item rarity-common" title="Early assignment submission">
                🐦
                <span className="badge-tooltip">Early Submissions</span>
              </div>
              <div className="badge-item rarity-legendary" title="Active attendance streak">
                🔥
                <span className="badge-tooltip">Streak Legend</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Class Schedule Card (spans 2 columns) ── */}
        <div className="card card-span-col-2 card-enter" style={{ animationDelay: '0.25s' }}>
          <div className="card-header">
            <h3 className="card-title">Today&apos;s Schedule</h3>
            <button className="card-action-btn" onClick={() => router.push('/dashboard/schedule')}>
              <ArrowUpRight size={16} strokeWidth={2} />
            </button>
          </div>
          <div className="schedule-timeline">
            {schedule && schedule.length > 0 ? (
              schedule.map((entry: any) => {
                const now = new Date();
                const [startH, startM] = (entry.time || '09:00').split(':').map(Number);
                const [endH, endM] = (entry.endTime || '10:00').split(':').map(Number);
                const nowMinutes = now.getHours() * 60 + now.getMinutes();
                const startMinutes = startH * 60 + startM;
                const endMinutes = endH * 60 + endM;
                const isActive = nowMinutes >= startMinutes && nowMinutes < endMinutes;

                return (
                  <div className={`time-block ${isActive ? 'active' : ''}`} key={entry.id}>
                    <div className="time-block-indicator" style={{ background: entry.color || 'var(--accent-primary)' }} />
                    <div className="time-block-time">{entry.time} – {entry.endTime}</div>
                    <div className="time-block-content">
                      <div className="time-block-name">{entry.name || entry.courseName}</div>
                      <div className="time-block-meta">{entry.room || 'Room 101'} · {entry.instructor || 'Department Faculty'}</div>
                    </div>
                    <span className={`time-block-type type-${entry.type || 'lecture'}`}>{entry.type || 'lecture'}</span>
                  </div>
                );
              })
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Clock size={28} style={{ marginBottom: 8, opacity: 0.6 }} />
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem' }}>No lectures scheduled today</div>
                <div style={{ fontSize: '0.8rem', marginTop: 4 }}>Check your weekly calendar for upcoming course sessions.</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Notifications Card ── */}
        <div className="card card-enter" style={{ animationDelay: '0.3s' }}>
          <div className="card-header">
            <h3 className="card-title">Notifications</h3>
            <button className="card-action-btn" onClick={() => router.push('/dashboard/notifications')}>
              <ArrowUpRight size={16} strokeWidth={2} />
            </button>
          </div>
          <div className="notif-quick-list" style={{ flex: 1 }}>
            {notifications && notifications.length > 0 ? (
              notifications.slice(0, 3).map((n: any) => (
                <div className="notif-quick-item" key={n.id} onClick={() => n.link && router.push(n.link)}>
                  <div className={`notif-icon ${n.type || 'system'}`}>
                    {notifIcons[n.type] || '📢'}
                  </div>
                  <div className="notif-content">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-message">{n.message}</div>
                  </div>
                  <div className="notif-time">{getRelativeTime(n.createdAt)}</div>
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <BellIcon size={26} style={{ marginBottom: 8, opacity: 0.6 }} />
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem' }}>All caught up!</div>
                <div style={{ fontSize: '0.8rem', marginTop: 4 }}>No unread alerts or notifications.</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Exams & Online Assessments Card (FR-EXAM) ── */}
        <div className="card card-span-col-2 card-enter" style={{ animationDelay: '0.35s' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardList size={16} />
              </div>
              <h3 className="card-title">Exams & Assessments</h3>
            </div>
            <button className="card-action-btn" onClick={() => router.push('/dashboard/exams')}>
              <ArrowUpRight size={16} strokeWidth={2} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(99, 102, 241, 0.06)', borderRadius: 12, border: '1px solid rgba(99, 102, 241, 0.12)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>CS301 Midterm Exam</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Online Assessment & Marksheets</div>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, background: '#10b981', color: '#fff', padding: '3px 8px', borderRadius: 20 }}>
                Active
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button 
                onClick={() => router.push('/dashboard/exams')}
                style={{ padding: '8px 12px', background: 'var(--accent-primary)', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
              >
                Go to Exams <ArrowUpRight size={14} />
              </button>
              <button 
                onClick={() => router.push('/dashboard/exams')}
                style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.04)', border: '1px solid var(--border-glass)', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Marksheets
              </button>
            </div>
          </div>
        </div>

        {/* ── Tuition & Fees / Payment Portal Card ── */}
        <div className="card card-span-col-2 card-enter" style={{ animationDelay: '0.4s' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={18} />
              </div>
              <div>
                <h3 className="card-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Tuition & Payments</h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Spring 2026 Semester Billing</span>
              </div>
            </div>
            <button
              className="card-action-btn"
              onClick={() => router.push('/dashboard/fees')}
              title="Open Payment Portal"
            >
              <ArrowUpRight size={16} strokeWidth={2} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, justifyContent: 'space-between', marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Outstanding Balance</span>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  $3,000<span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500 }}>.00</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400, marginLeft: 8 }}>
                    of $4,500 total
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 9999, background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  Due Nov 15, 2026
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Installment 2 of 3
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                <span>Paid: $1,500.00 (33%)</span>
                <span>Remaining: $3,000.00</span>
              </div>
              <div style={{ width: '100%', height: 7, background: 'var(--border-glass, rgba(0,0,0,0.06))', borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{ width: '33.33%', height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: 9999 }} />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => router.push('/dashboard/fees')}
                style={{
                  padding: '9px 14px',
                  background: 'var(--accent-primary)',
                  color: '#000',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
              >
                <CreditCard size={15} /> Pay Fees Now
              </button>
              <button
                onClick={() => router.push('/dashboard/fees')}
                style={{
                  padding: '9px 14px',
                  background: 'rgba(0,0,0,0.04)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                Invoices & Receipts
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Detail Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Assignment Details">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>Data Structures - Binary Search Tree Implementation</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Due: Tomorrow, 11:59 PM</p>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.03)', padding: '16px', borderRadius: '12px' }}>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              Implement a Binary Search Tree (BST) in Python or Java. Your implementation must include standard methods for insertion, deletion, and searching. Additionally, write a method to perform an in-order traversal and return the elements as a list.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button style={{ flex: 1, padding: '12px', background: 'var(--accent-primary)', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', color: '#000' }}>
              Start Assignment
            </button>
            <button style={{ flex: 1, padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}>
              View Course Materials
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ═══════════════════════════════════════════════════
// TEACHER DASHBOARD
// ═══════════════════════════════════════════════════
// TEACHER DASHBOARD
// ═══════════════════════════════════════════════════
function TeacherDashboard({
  name,
  stats,
  user,
  atRiskStudents,
  schedule = [],
}: {
  name: string;
  stats?: any;
  user?: any;
  atRiskStudents?: any[];
  schedule?: any[];
}) {
  const router = useRouter();
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const teacherStats = {
    totalStudents: 0,
    classesToday: 0,
    pendingGrading: 0,
    atRiskCount: 0,
    averageAttendance: 0,
    assignmentsCreated: 0,
    ...stats,
  };
  const attendanceCircumference = 2 * Math.PI * 70;
  const attendanceOffset = attendanceCircumference * (1 - (teacherStats.averageAttendance || 90) / 100);
  
  const aiRiskCount = atRiskStudents && atRiskStudents.length > 0 ? atRiskStudents.length : teacherStats.atRiskCount || 0;

  return (
    <>
      <div className="page-hero">
        <div className="hero-left">
          <div className="progress-section" style={{ marginBottom: 16 }}>
            <div className="progress-item">
              <span className="progress-label">Pending Grading</span>
              <div className="progress-pill pill-dark">
                {teacherStats.pendingGrading || teacherStats.pendingGrades || 0}
              </div>
            </div>
            <div className="progress-item">
              <span className="progress-label">Avg Attendance</span>
              <div className="progress-pill pill-accent">
                {teacherStats.averageAttendance || 90}%
              </div>
            </div>
          </div>
          <h1 className="page-title">Welcome, Professor {(user?.firstName || name).split(" ").slice(-1)[0]}</h1>
        </div>

        <div className="hero-metrics">
          <div className="hero-metric">
            <span className="hero-metric-icon">
              <BookOpen size={20} strokeWidth={1.5} />
            </span>
            <div className="hero-metric-content">
              <span className="hero-metric-value">{teacherStats.totalStudents || teacherStats.students || 0}</span>
              <span className="hero-metric-label">Students</span>
            </div>
          </div>
          <div className="hero-metric">
            <span className="hero-metric-icon">
              <Check size={20} strokeWidth={1.5} />
            </span>
            <div className="hero-metric-content">
              <span className="hero-metric-value">{teacherStats.classesToday || teacherStats.classes || 0}</span>
              <span className="hero-metric-label">Classes Today</span>
            </div>
          </div>
          <div className="hero-metric">
            <span className="hero-metric-icon">
              <AlertCircle size={20} strokeWidth={1.5} />
            </span>
            <div className="hero-metric-content">
              <span className="hero-metric-value">{aiRiskCount}</span>
              <span className="hero-metric-label">At Risk</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Classes Today */}
        <div className="card card-span-2">
          <div className="card-header">
            <h3 className="card-title">Today's Schedule</h3>
            <button className="card-action-btn" onClick={() => router.push('/dashboard/attendance')}>
              <ArrowUpRight size={16} strokeWidth={2} />
            </button>
          </div>
          <div style={{ marginTop: 'auto' }}>
            {schedule && schedule.length > 0 ? (
              schedule.map((entry: any) => (
                <div className="list-item" key={entry.id}>
                  <div className="list-icon" style={{ background: 'var(--accent-primary)', color: '#000' }}>
                    <BookOpen size={18} />
                  </div>
                  <div className="list-content">
                    <div className="list-title">{entry.name || entry.courseName}</div>
                    <div className="list-subtitle">{entry.time} - {entry.endTime} • {entry.room || 'Room 101'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="list-meta">{entry.courseCode || entry.code}</div>
                    <button
                      onClick={() => router.push('/dashboard/attendance')}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(0,0,0,0.05)',
                        border: '1px solid var(--border-glass)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        color: 'var(--text-primary)'
                      }}
                    >
                      Roll Call
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Clock size={24} style={{ marginBottom: 6, opacity: 0.6 }} />
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>No lectures scheduled today</div>
                <div style={{ fontSize: '0.78rem', marginTop: 2 }}>All classes conclude or are asynchronous.</div>
              </div>
            )}
          </div>
        </div>

        {/* At Risk Students */}
        <div className="card" style={{ background: '#333', color: '#fff' }}>
          <div className="card-header">
            <h3
              className="card-title"
              style={{ color: '#fff', cursor: 'pointer' }}
              onClick={() => router.push('/dashboard/at-risk')}
            >
              At Risk Students
            </h3>
            <button
              className="card-action-btn"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
              onClick={() => router.push('/dashboard/at-risk')}
              title="Open At-Risk Predictive Analytics"
            >
              <ArrowUpRight size={16} strokeWidth={2} />
            </button>
          </div>
          <div style={{ marginTop: 'auto' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 500, marginBottom: 8, color: '#f87171' }}>
              {aiRiskCount}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#A1A1AA', marginBottom: 16 }}>
              {atRiskStudents && atRiskStudents.length > 0 ? "AI predicted students require immediate counseling intervention." : "Students require immediate attention due to low attendance or grades."}
            </div>
            <div
              className="card-badge"
              style={{ background: '#fff', cursor: 'pointer' }}
              onClick={() => router.push('/dashboard/at-risk')}
            >
              View Predictive Report &rarr;
            </div>
          </div>
        </div>

        {/* Exams & Assessment Hub */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardList size={16} />
              </div>
              <h3 className="card-title">Exams & Grading Hub</h3>
            </div>
            <button className="card-action-btn" onClick={() => router.push('/dashboard/exams')}>
              <ArrowUpRight size={16} strokeWidth={2} />
            </button>
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Manage question banks, auto-generate variants, evaluate subjective answers & process grade curves.
            </div>
            <button
              onClick={() => router.push('/dashboard/exams')}
              style={{ padding: '8px 12px', background: 'var(--accent-primary)', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
            >
              Open Examinations Hub <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>


      <Modal isOpen={isRiskModalOpen} onClose={() => setIsRiskModalOpen(false)} title="AI Risk Predictions">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            The following students have been flagged by the predictive analytics model as being at risk of failing or dropping out based on recent activity, grades, and attendance.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {atRiskStudents && atRiskStudents.length > 0 ? (
              atRiskStudents.map((s) => (
                <div key={s.id || s.studentId} style={{ padding: '16px', background: '#F9FAFB', borderRadius: '12px', border: '1px solid #F3F4F6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                    <div style={{ color: '#EF4444', fontWeight: 600, fontSize: '0.9rem' }}>Risk Score: {s.riskScore}%</div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <strong>Factors:</strong> {s.reasons?.join(", ") || s.riskFactors?.join(", ") || "Low Engagement"}
                  </div>
                  <button style={{ marginTop: '12px', padding: '6px 12px', background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' }}>
                    Schedule Intervention
                  </button>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No students currently flagged as at risk.
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}

// ═══════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════
function AdminDashboard({ name, stats, user, atRiskStudents }: { name: string; stats?: any; user?: any; atRiskStudents?: any[] }) {
  const router = useRouter();
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const adminStats = {
    totalStudents: 0,
    totalFaculty: 0,
    activeCourses: 0,
    attendanceRate: 0,
    feeCollected: 0,
    feeOutstanding: 0,
    atRiskStudents: 0,
    systemUptime: 99.98,
    ...stats,
  };
  const riskList = atRiskStudents || [];

  return (
    <>
      <div className="page-hero">
        <div className="hero-left">
          <div className="progress-section" style={{ marginBottom: 16 }}>
            <div className="progress-item">
              <span className="progress-label">System Health</span>
              <div className="progress-pill pill-dark">
                {adminStats.systemUptime}%
              </div>
            </div>
            <div className="progress-item">
              <span className="progress-label">Fee Collection</span>
              <div className="progress-pill pill-accent">
                {((adminStats.feeCollected || 0) / 1000000).toFixed(1)}M
              </div>
            </div>
          </div>
          <h1 className="page-title">Institution Overview</h1>
        </div>

        <div className="hero-metrics">
          <div className="hero-metric">
            <span className="hero-metric-icon">
              <BookOpen size={20} strokeWidth={1.5} />
            </span>
            <div className="hero-metric-content">
              <span className="hero-metric-value">{adminStats.totalStudents}</span>
              <span className="hero-metric-label">Students</span>
            </div>
          </div>
          <div className="hero-metric">
            <span className="hero-metric-icon">
              <Check size={20} strokeWidth={1.5} />
            </span>
            <div className="hero-metric-content">
              <span className="hero-metric-value">{adminStats.totalFaculty}</span>
              <span className="hero-metric-label">Faculty</span>
            </div>
          </div>
          <div className="hero-metric">
            <span className="hero-metric-icon">
              <AlertCircle size={20} strokeWidth={1.5} />
            </span>
            <div className="hero-metric-content">
              <span className="hero-metric-value">{adminStats.activeCourses}</span>
              <span className="hero-metric-label">Courses</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* At Risk Overview */}
        <div className="card card-span-2">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={16} />
              </div>
              <h3
                className="card-title"
                style={{ cursor: 'pointer' }}
                onClick={() => router.push('/dashboard/at-risk')}
              >
                High Risk Interventions (AI Predicted)
              </h3>
            </div>
            <button
              className="card-action-btn"
              title="Open At-Risk Predictive Analytics & Interventions"
              onClick={() => router.push('/dashboard/at-risk')}
            >
              <ArrowUpRight size={16} strokeWidth={2} />
            </button>
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {riskList.slice(0, 3).map((s: any) => (
              <div
                className="list-item"
                key={s.id || s.studentId}
                style={{ cursor: 'pointer' }}
                onClick={() => router.push('/dashboard/at-risk')}
                title="View student diagnostic details in At-Risk Suite"
              >
                <div className="list-icon" style={{ background: (s.riskScore ?? s.overallRiskScore) > 70 ? '#f87171' : '#fbbf24', color: '#fff' }}>
                  <AlertCircle size={18} />
                </div>
                <div className="list-content">
                  <div className="list-title">{s.name || s.studentName}</div>
                  <div className="list-subtitle">{s.reasons?.join(", ") || s.riskFactors?.[0] || "Declining Performance"}</div>
                </div>
                <div className="list-meta" style={{ color: (s.riskScore ?? s.overallRiskScore) > 70 ? '#f87171' : '#fbbf24', fontWeight: 700 }}>
                  Risk: {s.riskScore ?? s.overallRiskScore}%
                </div>
              </div>
            ))}
            <button
              onClick={() => router.push('/dashboard/at-risk')}
              style={{
                marginTop: 8,
                padding: '8px 14px',
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              View Full At-Risk Intelligence Suite & Interventions &rarr;
            </button>
          </div>
        </div>

        {/* Financial Info Card */}
        <div className="card" style={{ background: '#333', color: '#fff' }}>
          <div className="card-header">
            <h3 className="card-title" style={{ color: '#fff' }}>Outstanding Fees</h3>
            <button className="card-action-btn" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }} onClick={() => setIsFeeModalOpen(true)}>
              <ArrowUpRight size={16} strokeWidth={2} />
            </button>
          </div>
          <div style={{ marginTop: 'auto' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 500, marginBottom: 8 }}>
              ₹{((adminStats.feeOutstanding || 0) / 100000).toFixed(1)}L
            </div>
            <div style={{ fontSize: '0.9rem', color: '#A1A1AA', marginBottom: 16 }}>
              Total pending fee collection across all departments.
            </div>
            <div className="card-badge" style={{ background: '#fff', cursor: 'pointer' }} onClick={() => setIsFeeModalOpen(true)}>Send Reminders</div>
          </div>
        </div>

        {/* Institutional Attendance Command Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Attendance Compliance</h3>
            <button className="card-action-btn" onClick={() => router.push('/dashboard/attendance')}>
              <ArrowUpRight size={16} strokeWidth={2} />
            </button>
          </div>
          <div style={{ marginTop: 'auto' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 600, marginBottom: 6, color: '#10B981' }}>
              {adminStats.attendanceRate || 0}%
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.4 }}>
              Campus-wide average. Configured institutional threshold: <strong>75%</strong>.
            </div>
            <div
              className="card-badge"
              style={{ background: 'var(--accent-primary)', color: '#000', cursor: 'pointer' }}
              onClick={() => router.push('/dashboard/attendance')}
            >
              Threshold Audits & Alerts
            </div>
          </div>
        </div>

        {/* Exams & Assessment Command Card */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardList size={16} />
              </div>
              <h3 className="card-title">Exams & Results Hub</h3>
            </div>
            <button className="card-action-btn" onClick={() => router.push('/dashboard/exams')}>
              <ArrowUpRight size={16} strokeWidth={2} />
            </button>
          </div>
          <div style={{ marginTop: 'auto' }}>
            <div style={{ fontSize: '2rem', fontWeight: 600, marginBottom: 6, color: '#6366F1' }}>
              FR-EXAM
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.4 }}>
              Timetable solver, question variants, grading queue, grade curves & official marksheet generation.
            </div>
            <div
              className="card-badge"
              style={{ background: '#333', color: '#fff', cursor: 'pointer' }}
              onClick={() => router.push('/dashboard/exams')}
            >
              Open Examinations Hub
            </div>
          </div>
        </div>
      </div>


      <Modal isOpen={isFeeModalOpen} onClose={() => setIsFeeModalOpen(false)} title="Outstanding Fee Collection">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#FEF2F2', padding: '20px', borderRadius: '12px', border: '1px solid #FEE2E2' }}>
            <h3 style={{ margin: 0, fontSize: '2rem', color: '#B91C1C', fontWeight: 600 }}>
              ₹{((adminStats.feeOutstanding || 0) / 100000).toFixed(1)} Lakhs
            </h3>
            <p style={{ margin: '8px 0 0 0', color: '#991B1B', fontSize: '0.9rem' }}>
              Total pending across 12 departments. Last reminder sent 5 days ago.
            </p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Action Required</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              Would you like to trigger an automated SMS and Email reminder campaign to all students with outstanding balances?
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button style={{ flex: 1, padding: '12px', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              Launch Campaign
            </button>
            <button onClick={() => setIsFeeModalOpen(false)} style={{ flex: 1, padding: '12px', background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ═══════════════════════════════════════════════════
// MAIN PAGE — ROLE ROUTER
// ═══════════════════════════════════════════════════
export default function DashboardPage() {
  const [user, setUser] = useState<{ role: Role, firstName?: string, name?: string } | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [atRiskStudents, setAtRiskStudents] = useState<any[]>([]);
  const [studentWellness, setStudentWellness] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      const token = localStorage.getItem("accessToken");
      
      if (userData) {
        setUser(JSON.parse(userData));
      }

      if (token) {
        const headers = { "Authorization": `Bearer ${token}` };

        // Fetch live stats from NestJS backend
        fetch("http://localhost:3001/academic/dashboard", { headers })
          .then(res => res.json())
          .then(data => setStats(data))
          .catch(err => console.error("Failed to fetch backend stats", err));

        // Fetch assignments for deadlines
        fetch("http://localhost:3001/academic/assignments", { headers })
          .then(res => res.json())
          .then(data => { if (Array.isArray(data)) setAssignments(data); })
          .catch(err => console.error("Failed to fetch assignments", err));

        // Fetch notifications
        fetch("http://localhost:3001/notifications?unreadOnly=true", { headers })
          .then(res => res.json())
          .then(data => { if (Array.isArray(data)) setNotifications(data); })
          .catch(err => console.error("Failed to fetch notifications", err));

        // Fetch courses for schedule
        fetch("http://localhost:3001/courses", { headers })
          .then(res => res.json())
          .then(data => { if (Array.isArray(data)) setCourses(data); })
          .catch(err => console.error("Failed to fetch courses", err));

        // Fetch AI risk predictions if teacher/admin
        const parsedUser = JSON.parse(userData || "{}");
        const role = parsedUser.role;
        if (role === 'teacher' || role === 'admin') {
          fetch("http://localhost:3001/ai/at-risk", { headers })
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setAtRiskStudents(data); })
            .catch(err => console.error("Failed to fetch AI risk predictions", err));
        } else if (role === 'student') {
          fetch("http://localhost:3001/ai/student-wellness", { headers })
            .then(res => res.json())
            .then(data => setStudentWellness(data))
            .catch(err => console.error("Failed to fetch student wellness", err));
        }

        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    } catch {
      setIsLoading(false);
    }
  }, []);

  const schedule = courses.map((c: any, i: number) => ({
    id: c.id,
    name: c.name,
    courseCode: c.code,
    room: c.room || `Room ${101 + i}`,
    instructor: c.instructorName || 'Department Faculty',
    time: ['09:00', '10:30', '13:00', '14:30'][i % 4] || '10:00',
    endTime: ['10:15', '11:45', '14:15', '15:45'][i % 4] || '11:00',
    type: c.code?.includes('L') ? 'lab' : 'lecture',
    color: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981'][i % 4],
  }));

  if (!user || isLoading) {
    return (
      <div style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
        <div className="page-hero">
          <div className="hero-left" style={{ flex: 1 }}>
            <div style={{ width: '40%', height: '36px', background: 'var(--bg-card)', borderRadius: '18px', marginBottom: '16px' }} />
            <div style={{ width: '60%', height: '56px', background: 'var(--bg-card)', borderRadius: '8px' }} />
          </div>
          <div className="hero-metrics">
            <div style={{ width: '100px', height: '64px', background: 'var(--bg-card)', borderRadius: '8px' }} />
            <div style={{ width: '100px', height: '64px', background: 'var(--bg-card)', borderRadius: '8px' }} />
            <div style={{ width: '100px', height: '64px', background: 'var(--bg-card)', borderRadius: '8px' }} />
          </div>
        </div>
        <div className="dashboard-grid">
          <div className="card" style={{ height: '300px' }} />
          <div className="card" style={{ height: '300px' }} />
          <div className="card card-span-2" style={{ height: '300px' }} />
          <div className="card" style={{ height: '300px' }} />
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .5; }
          }
        `}</style>
      </div>
    );
  }

  switch (user.role) {
    case "student":
      return (
        <StudentDashboard
          name={user.firstName || user.name || "Student"}
          stats={stats}
          studentWellness={studentWellness}
          assignments={assignments}
          notifications={notifications}
          schedule={schedule}
        />
      );
    case "teacher":
      return (
        <TeacherDashboard
          name={user.firstName || user.name || "Professor"}
          stats={stats}
          user={user}
          atRiskStudents={atRiskStudents}
          schedule={schedule}
        />
      );
    case "admin":
      return (
        <AdminDashboard
          name={user.firstName || user.name || "Admin"}
          stats={stats}
          user={user}
          atRiskStudents={atRiskStudents}
        />
      );
    default:
      return <div>Invalid role</div>;
  }
}
