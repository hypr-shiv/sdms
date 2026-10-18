"use client";

import React, { useState, useEffect } from "react";
import "./gamification.css";
import {
  Trophy,
  Flame,
  Award,
  Shield,
  Zap,
  Sliders,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  Lock,
  Star,
  ChevronRight,
  TrendingUp,
  BookOpen,
  Calendar,
  Sparkles,
} from "lucide-react";

interface UnlockedBadge {
  badgeId: string;
  name: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  earnedAt: string;
}

interface BadgeItem {
  id: string;
  name: string;
  category: "streak" | "assignment" | "academic" | "special";
  icon: string;
  description: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  xpReward: number;
  metric: string;
  threshold: number;
  isUnlocked: boolean;
  earnedAt: string | null;
  currentProgress: number;
  progressPercent: number;
}

interface StudentOverview {
  profile: {
    id: string;
    studentId: string;
    studentName: string;
    department: string;
    leaderboardOptIn: boolean;
    isAnonymous: boolean;
    anonymousAlias: string;
    avatar: string;
  };
  progression: {
    level: number;
    totalXp: number;
    currentLevelXp: number;
    xpToNextLevel: number;
    progressPercent: number;
    title: string;
  };
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastAttendanceDate: string | null;
    status: "active" | "at_risk" | "broken";
    nextMilestone: any | null;
  };
  stats: {
    assignmentsCompleted: number;
    earlySubmissionsCount: number;
    perfectScoresCount: number;
    highExamScoresCount: number;
    totalBadgesEarned: number;
    totalBadgesAvailable: number;
  };
  badges: BadgeItem[];
}

interface LeaderboardEntry {
  rank: number;
  id: string;
  studentId: string;
  displayName: string;
  isAnonymous: boolean;
  department: string;
  avatar: string;
  totalXp: number;
  level: number;
  currentStreak: number;
  badgesCount: number;
  isCurrentStudent: boolean;
}

export default function GamificationDashboard() {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "badges" | "streaks" | "points">("leaderboard");
  const [overview, setOverview] = useState<StudentOverview | null>(null);
  const [loading, setLoading] = useState(true);

  // Leaderboard filters & data
  const [leaderboardScope, setLeaderboardScope] = useState<string>("global");
  const [leaderboardDept, setLeaderboardDept] = useState<string>("All");
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState<string>("all_time");
  const [podium, setPodium] = useState<LeaderboardEntry[]>([]);
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [currentStudentRank, setCurrentStudentRank] = useState<LeaderboardEntry | null>(null);

  // Badges tab filters
  const [badgeCategory, setBadgeCategory] = useState<string>("all");
  const [badgeRarity, setBadgeRarity] = useState<string>("all");
  const [badgeUnlockStatus, setBadgeUnlockStatus] = useState<"all" | "unlocked" | "locked">("all");

  // Admin Config state
  const [pointRules, setPointRules] = useState<any>({
    attendancePresent: 20,
    attendanceLate: 5,
    assignmentSubmitted: 50,
    assignmentEarlyBonus: 25,
    assignmentPerfectScore: 100,
    dailyLogin: 10,
    streakDayBonus: 5,
  });
  const [levelMultiplier, setLevelMultiplier] = useState(1.25);
  const [configSaving, setConfigSaving] = useState(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState("");

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Overview
  const fetchOverview = async () => {
    try {
      const res = await fetch("http://localhost:3001/gamification/overview?studentId=std_alice");
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch (e) {
      console.error("Failed to fetch gamification overview", e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Leaderboard
  const fetchLeaderboard = async () => {
    try {
      const url = `http://localhost:3001/gamification/leaderboard?scope=${leaderboardScope}&department=${leaderboardDept}&timeframe=${leaderboardTimeframe}&currentStudentId=std_alice`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPodium(data.podium || []);
        setRankings(data.rankings || []);
        setCurrentStudentRank(data.currentStudentRank || null);
      }
    } catch (e) {
      console.error("Failed to fetch leaderboard", e);
    }
  };

  // Fetch Admin Config
  const fetchAdminConfig = async () => {
    try {
      const res = await fetch("http://localhost:3001/gamification/admin/config");
      if (res.ok) {
        const data = await res.json();
        if (data.pointRules) setPointRules(data.pointRules);
        if (data.levelCurve?.multiplier) setLevelMultiplier(data.levelCurve.multiplier);
      }
    } catch (e) {
      console.error("Failed to fetch admin config", e);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchLeaderboard();
    fetchAdminConfig();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [leaderboardScope, leaderboardDept, leaderboardTimeframe]);

  // Toggle Anonymity
  const handleToggleAnonymity = async () => {
    if (!overview) return;
    const newAnonState = !overview.profile.isAnonymous;
    try {
      const res = await fetch("http://localhost:3001/gamification/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: "std_alice",
          isAnonymous: newAnonState,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOverview(updated);
        fetchLeaderboard();
        showToast(newAnonState ? "🎭 Incognito Mode Enabled (Name masked on leaderboard)" : "👤 Public Name Visible on leaderboard");
      }
    } catch (e) {
      console.error("Failed to update preferences", e);
    }
  };

  // Toggle Opt-In
  const handleToggleOptIn = async () => {
    if (!overview) return;
    const newOptIn = !overview.profile.leaderboardOptIn;
    try {
      const res = await fetch("http://localhost:3001/gamification/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: "std_alice",
          leaderboardOptIn: newOptIn,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOverview(updated);
        fetchLeaderboard();
        showToast(newOptIn ? "✅ Opted in to public leaderboards" : "🚫 Opted out of leaderboards");
      }
    } catch (e) {
      console.error("Failed to update preferences", e);
    }
  };

  // Recalculate from database records
  const handleRecalculate = async () => {
    try {
      const res = await fetch("http://localhost:3001/gamification/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: "std_alice" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.overview) setOverview(data.overview);
        fetchLeaderboard();
        showToast(data.message || "Historical records recalculated!");
      }
    } catch (e) {
      console.error("Recalculation error", e);
    }
  };

  // Action Simulator (Testing real-time XP awards)
  const handleSimulateAward = async (action: string, metadata: any = {}) => {
    try {
      const res = await fetch("http://localhost:3001/gamification/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: "std_alice",
          action,
          ...metadata,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        await fetchOverview();
        await fetchLeaderboard();
        let toast = `🎉 +${result.xpAwarded} XP awarded! (Total: ${result.newTotalXp} XP)`;
        if (result.leveledUp) {
          toast = `🌟 LEVEL UP! You reached Level ${result.level}! ${toast}`;
        }
        if (result.newlyUnlockedBadges?.length > 0) {
          toast += ` 🏆 Unlocked: ${result.newlyUnlockedBadges.map((b: any) => b.name).join(", ")}`;
        }
        showToast(toast);
      }
    } catch (e) {
      console.error("Award error", e);
    }
  };

  // Save Admin Point Rules
  const handleSaveAdminConfig = async () => {
    setConfigSaving(true);
    setConfigSuccessMsg("");
    try {
      const res = await fetch("http://localhost:3001/gamification/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pointRules,
          levelCurve: { multiplier: levelMultiplier },
          adminEmail: "admin@scholarpulse.edu",
        }),
      });
      if (res.ok) {
        setConfigSuccessMsg("Point rules and level curve successfully updated and logged in Audit Trail!");
        setTimeout(() => setConfigSuccessMsg(""), 4000);
      }
    } catch (e) {
      console.error("Failed to save config", e);
    } finally {
      setConfigSaving(false);
    }
  };

  if (loading || !overview) {
    return (
      <div className="gamification-container" style={{ padding: "4rem 0", textAlign: "center" }}>
        <div style={{ fontSize: "1.5rem", color: "#a5b4fc" }}>Loading ScholarPulse Gamification Hub...</div>
      </div>
    );
  }

  // Filter Badges
  const filteredBadges = overview.badges.filter((b) => {
    if (badgeCategory !== "all" && b.category !== badgeCategory) return false;
    if (badgeRarity !== "all" && b.rarity !== badgeRarity) return false;
    if (badgeUnlockStatus === "unlocked" && !b.isUnlocked) return false;
    if (badgeUnlockStatus === "locked" && b.isUnlocked) return false;
    return true;
  });

  return (
    <div className="gamification-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            background: "linear-gradient(135deg, #1e1b4b, #312e81)",
            border: "1px solid #818cf8",
            color: "#ffffff",
            padding: "1rem 1.5rem",
            borderRadius: "0.875rem",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            fontSize: "0.95rem",
            fontWeight: 600,
            animation: "fadeIn 0.3s ease",
          }}
        >
          <Sparkles size={20} color="#a855f7" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── TOP HERO BANNER ── */}
      <div className="gamification-hero">
        <div className="hero-avatar-wrap">
          <span>{overview.profile.isAnonymous ? "🎭" : overview.profile.avatar}</span>
          <span className="hero-level-badge">LVL {overview.progression.level}</span>
        </div>

        <div className="hero-info">
          <div className="hero-title-row">
            <h1 className="hero-name">
              {overview.profile.isAnonymous
                ? `${overview.profile.anonymousAlias} (You)`
                : overview.profile.studentName}
            </h1>
            <span className="hero-role-pill">
              <Sparkles size={14} />
              {overview.progression.title}
            </span>
            <span className="hero-dept-pill">{overview.profile.department}</span>
            {overview.profile.isAnonymous && (
              <span className="incognito-badge">
                <EyeOff size={12} style={{ display: "inline", marginRight: "4px" }} />
                Incognito Active
              </span>
            )}
          </div>

          <div className="hero-xp-block">
            <div className="hero-xp-labels">
              <span>{overview.progression.totalXp.toLocaleString()} Total XP</span>
              <span>
                {overview.progression.currentLevelXp} / {overview.progression.xpToNextLevel} XP to Level{" "}
                {overview.progression.level + 1} ({overview.progression.progressPercent}%)
              </span>
            </div>
            <div className="hero-xp-progress">
              <div
                className="hero-xp-fill"
                style={{ width: `${overview.progression.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {/* Streak Card */}
          <div className="hero-streak-card">
            <span className="streak-flame-icon">🔥</span>
            <span className="streak-hero-count">{overview.streak.currentStreak}-Day</span>
            <span className="streak-hero-label">Active Streak</span>
          </div>

          {/* Quick Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <button
              onClick={handleToggleAnonymity}
              title="Toggle incognito identity on leaderboards"
              style={{
                background: overview.profile.isAnonymous ? "rgba(168, 85, 247, 0.2)" : "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                padding: "0.5rem 0.85rem",
                borderRadius: "0.6rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              {overview.profile.isAnonymous ? <Eye size={14} /> : <EyeOff size={14} />}
              {overview.profile.isAnonymous ? "Show Real Name" : "Go Incognito"}
            </button>

            <button
              onClick={handleRecalculate}
              title="Recalculate streaks and milestones from system records"
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#cbd5e1",
                padding: "0.5rem 0.85rem",
                borderRadius: "0.6rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <RefreshCw size={14} />
              Sync Milestones
            </button>
          </div>
        </div>
      </div>

      {/* ── NAVIGATION TABS ── */}
      <div className="gamification-nav-tabs">
        <button
          className={`gamification-tab-btn ${activeTab === "leaderboard" ? "active" : ""}`}
          onClick={() => setActiveTab("leaderboard")}
        >
          <Trophy size={18} />
          Leaderboard & Rankings
        </button>
        <button
          className={`gamification-tab-btn ${activeTab === "badges" ? "active" : ""}`}
          onClick={() => setActiveTab("badges")}
        >
          <Award size={18} />
          Achievements & Badges ({overview.stats.totalBadgesEarned}/{overview.stats.totalBadgesAvailable})
        </button>
        <button
          className={`gamification-tab-btn ${activeTab === "streaks" ? "active" : ""}`}
          onClick={() => setActiveTab("streaks")}
        >
          <Flame size={18} />
          Attendance Streaks
        </button>
        <button
          className={`gamification-tab-btn ${activeTab === "points" ? "active" : ""}`}
          onClick={() => setActiveTab("points")}
        >
          <Sliders size={18} />
          Points Engine & Admin Rules
        </button>
      </div>

      {/* ── TAB 1: LEADERBOARD & RANKINGS ── */}
      {activeTab === "leaderboard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Controls Bar */}
          <div className="leaderboard-controls-bar">
            {/* Opt-In & Privacy Toggles */}
            <div className="privacy-toggle-group">
              <label className="privacy-toggle-item">
                <input
                  type="checkbox"
                  checked={overview.profile.leaderboardOptIn}
                  onChange={handleToggleOptIn}
                />
                <span>Include me on leaderboards</span>
              </label>

              <label className="privacy-toggle-item">
                <input
                  type="checkbox"
                  checked={overview.profile.isAnonymous}
                  onChange={handleToggleAnonymity}
                />
                <span>Anonymize my identity (Incognito mode)</span>
              </label>
            </div>

            {/* Scope & Timeframe Selectors */}
            <div className="leaderboard-filters">
              <select
                className="leaderboard-select"
                value={leaderboardScope}
                onChange={(e) => setLeaderboardScope(e.target.value)}
              >
                <option value="global">Campus Global</option>
                <option value="department">Department</option>
              </select>

              {leaderboardScope === "department" && (
                <select
                  className="leaderboard-select"
                  value={leaderboardDept}
                  onChange={(e) => setLeaderboardDept(e.target.value)}
                >
                  <option value="All">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Business Administration">Business Administration</option>
                  <option value="Mathematics & Statistics">Mathematics & Statistics</option>
                  <option value="Physics">Physics</option>
                </select>
              )}

              <select
                className="leaderboard-select"
                value={leaderboardTimeframe}
                onChange={(e) => setLeaderboardTimeframe(e.target.value)}
              >
                <option value="all_time">All Time</option>
                <option value="monthly">This Month</option>
                <option value="weekly">This Week</option>
              </select>
            </div>
          </div>

          {/* Top 3 Podium Cards */}
          {podium.length >= 3 && (
            <div className="podium-section">
              {/* 2nd Place */}
              <div className="podium-card second-place">
                <span className="podium-rank-badge">🥈 2nd Place</span>
                <div className="podium-avatar">{podium[1].avatar}</div>
                <div className="podium-name">{podium[1].displayName}</div>
                <div className="podium-xp">{podium[1].totalXp.toLocaleString()} XP</div>
                <div className="podium-meta">
                  <span>Level {podium[1].level}</span>
                  <span>•</span>
                  <span>🔥 {podium[1].currentStreak}d Streak</span>
                </div>
              </div>

              {/* 1st Place */}
              <div className="podium-card first-place">
                <span className="podium-crown">👑</span>
                <span className="podium-rank-badge">🥇 Champion</span>
                <div className="podium-avatar">{podium[0].avatar}</div>
                <div className="podium-name">{podium[0].displayName}</div>
                <div className="podium-xp" style={{ color: "#eab308" }}>
                  {podium[0].totalXp.toLocaleString()} XP
                </div>
                <div className="podium-meta">
                  <span>Level {podium[0].level}</span>
                  <span>•</span>
                  <span>🔥 {podium[0].currentStreak}d Streak</span>
                  <span>•</span>
                  <span>🏆 {podium[0].badgesCount} Badges</span>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="podium-card third-place">
                <span className="podium-rank-badge">🥉 3rd Place</span>
                <div className="podium-avatar">{podium[2].avatar}</div>
                <div className="podium-name">{podium[2].displayName}</div>
                <div className="podium-xp">{podium[2].totalXp.toLocaleString()} XP</div>
                <div className="podium-meta">
                  <span>Level {podium[2].level}</span>
                  <span>•</span>
                  <span>🔥 {podium[2].currentStreak}d Streak</span>
                </div>
              </div>
            </div>
          )}

          {/* Current Student Position Banner */}
          {currentStudentRank && (
            <div className="my-rank-strip">
              <div className="my-rank-left">
                <div className="my-rank-number">Rank #{currentStudentRank.rank}</div>
                <div>
                  <strong style={{ color: "#ffffff", fontSize: "1.05rem" }}>
                    {currentStudentRank.displayName}
                  </strong>
                  <div style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>
                    Level {currentStudentRank.level} • {currentStudentRank.totalXp.toLocaleString()} XP •{" "}
                    🔥 {currentStudentRank.currentStreak}-day streak
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {currentStudentRank.isAnonymous ? (
                  <span className="incognito-badge">
                    <EyeOff size={13} style={{ display: "inline", marginRight: "4px" }} />
                    Hidden Identity
                  </span>
                ) : (
                  <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 600 }}>
                    Public Scholar Profile
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Rankings Table (4+) */}
          <div className="leaderboard-table-card">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Scholar / Alias</th>
                  <th>Department</th>
                  <th>Level</th>
                  <th>Attendance Streak</th>
                  <th>Badges</th>
                  <th>Total Points</th>
                </tr>
              </thead>
              <tbody>
                {podium.concat(rankings).map((scholar) => (
                  <tr
                    key={scholar.id}
                    className={scholar.isCurrentStudent ? "current-user-row" : ""}
                  >
                    <td style={{ fontWeight: 800 }}>
                      {scholar.rank === 1
                        ? "🥇 #1"
                        : scholar.rank === 2
                        ? "🥈 #2"
                        : scholar.rank === 3
                        ? "🥉 #3"
                        : `#${scholar.rank}`}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <span style={{ fontSize: "1.3rem" }}>{scholar.avatar}</span>
                        <div>
                          <div style={{ fontWeight: 700, color: scholar.isCurrentStudent ? "#a5b4fc" : "#ffffff" }}>
                            {scholar.displayName}
                            {scholar.isCurrentStudent && " (You)"}
                          </div>
                          {scholar.isAnonymous && (
                            <span style={{ fontSize: "0.7rem", color: "#c084fc" }}>
                              Incognito Scholar
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "#94a3b8" }}>{scholar.department}</td>
                    <td>
                      <span
                        style={{
                          background: "rgba(168, 85, 247, 0.15)",
                          border: "1px solid rgba(168, 85, 247, 0.3)",
                          color: "#d8b4fe",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "0.375rem",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                        }}
                      >
                        Lvl {scholar.level}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: "#f87171", fontWeight: 700 }}>
                        🔥 {scholar.currentStreak} days
                      </span>
                    </td>
                    <td style={{ color: "#cbd5e1" }}>🏆 {scholar.badgesCount}</td>
                    <td>
                      <strong style={{ color: "#a855f7", fontSize: "0.95rem" }}>
                        {scholar.totalXp.toLocaleString()} XP
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: ACHIEVEMENTS & BADGES ── */}
      {activeTab === "badges" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Filters Bar */}
          <div className="badge-filter-bar">
            {/* Category Pills */}
            <div className="badge-category-pills">
              {[
                { id: "all", label: "All Categories" },
                { id: "streak", label: "🔥 Attendance Streaks" },
                { id: "assignment", label: "📝 Coursework & Milestones" },
                { id: "academic", label: "🧠 Academic Mastery" },
                { id: "special", label: "🚀 Special & Community" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  className={`badge-pill-btn ${badgeCategory === cat.id ? "active" : ""}`}
                  onClick={() => setBadgeCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Unlock Status & Rarity Selectors */}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <select
                className="leaderboard-select"
                value={badgeUnlockStatus}
                onChange={(e: any) => setBadgeUnlockStatus(e.target.value)}
              >
                <option value="all">All Badges</option>
                <option value="unlocked">Unlocked Only</option>
                <option value="locked">Locked Only</option>
              </select>

              <select
                className="leaderboard-select"
                value={badgeRarity}
                onChange={(e) => setBadgeRarity(e.target.value)}
              >
                <option value="all">All Rarities</option>
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="badge-grid-container">
            {filteredBadges.map((badge) => (
              <div
                key={badge.id}
                className={`badge-card rarity-${badge.rarity} ${
                  badge.isUnlocked ? "unlocked" : "locked"
                }`}
              >
                <div className="badge-header">
                  <div className="badge-icon-wrap">
                    <span>{badge.icon}</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                    <span className="badge-rarity-tag">{badge.rarity}</span>
                    <span
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        color: "#a855f7",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        padding: "0.15rem 0.45rem",
                        borderRadius: "9999px",
                      }}
                    >
                      +{badge.xpReward} XP
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="badge-title">{badge.name}</h3>
                  <p className="badge-description">{badge.description}</p>
                </div>

                <div className="badge-footer">
                  {badge.isUnlocked ? (
                    <div className="badge-earned-date">
                      <CheckCircle2 size={14} />
                      <span>Unlocked {badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : "Earned"}</span>
                    </div>
                  ) : (
                    <div className="badge-progress-wrap">
                      <div className="badge-progress-label">
                        <span>
                          {badge.currentProgress} / {badge.threshold}
                        </span>
                        <span>{badge.progressPercent}%</span>
                      </div>
                      <div className="badge-progress-bar">
                        <div
                          className="badge-progress-fill"
                          style={{ width: `${badge.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: ATTENDANCE STREAKS ── */}
      {activeTab === "streaks" && (
        <div className="streak-grid">
          {/* Left: Streak Analytics & Status */}
          <div className="streak-card-panel">
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff" }}>
              Attendance Streak Tracker
            </h2>

            <div className="streak-hero-display">
              <span style={{ fontSize: "4rem", animation: "pulseFlame 1.8s infinite ease-in-out" }}>
                🔥
              </span>
              <div>
                <div style={{ fontSize: "2.75rem", fontWeight: 900, color: "#fca5a5" }}>
                  {overview.streak.currentStreak} Days
                </div>
                <div style={{ color: "#f87171", fontWeight: 700, textTransform: "uppercase", fontSize: "0.85rem" }}>
                  Status: {overview.streak.status === "active" ? "Active (Safe)" : overview.streak.status}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#cbd5e1", marginTop: "0.25rem" }}>
                  Personal Record: <strong>{overview.streak.longestStreak} consecutive days</strong>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "0.75rem",
                  padding: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <Calendar size={18} color="#818cf8" />
                  <span>Last Attendance Recorded</span>
                </div>
                <strong style={{ color: "#ffffff" }}>
                  {overview.streak.lastAttendanceDate || "Today"}
                </strong>
              </div>

              <div
                style={{
                  background: "rgba(16, 185, 129, 0.05)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  borderRadius: "0.75rem",
                  padding: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <Shield size={20} color="#10b981" />
                <div style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>
                  <strong style={{ color: "#10b981" }}>Streak Protection Enabled:</strong> You have 1 grace
                  day buffer before a streak resets. Attending today's lecture maintains the flame!
                </div>
              </div>
            </div>
          </div>

          {/* Right: Milestone Ladder */}
          <div className="streak-card-panel">
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff" }}>
              Streak Milestone Ladder
            </h2>

            <div className="streak-ladder">
              {[
                { days: 3, name: "3-Day Spark", icon: "🔥", xp: 50 },
                { days: 7, name: "7-Day Flame", icon: "⚡", xp: 150 },
                { days: 14, name: "14-Day Blaze", icon: "💥", xp: 350 },
                { days: 30, name: "30-Day Inferno", icon: "🌟", xp: 800 },
                { days: 60, name: "60-Day Titan", icon: "👑", xp: 1800 },
                { days: 100, name: "100-Day Supernova", icon: "🌌", xp: 5000 },
              ].map((step) => {
                const isCompleted = overview.streak.currentStreak >= step.days;
                const isNext = !isCompleted && overview.streak.currentStreak < step.days;

                return (
                  <div
                    key={step.days}
                    className={`streak-ladder-step ${
                      isCompleted ? "completed" : isNext ? "next-up" : ""
                    }`}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "1.4rem" }}>{step.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, color: "#ffffff" }}>{step.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                          Requires {step.days} consecutive days • +{step.xp} XP
                        </div>
                      </div>
                    </div>

                    <div>
                      {isCompleted ? (
                        <span style={{ color: "#10b981", fontWeight: 700, fontSize: "0.85rem" }}>
                          ✓ Achieved
                        </span>
                      ) : (
                        <span style={{ color: "#f97316", fontWeight: 700, fontSize: "0.85rem" }}>
                          {step.days - overview.streak.currentStreak} days left
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: POINTS ENGINE & ADMIN CONFIG ── */}
      {activeTab === "points" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          {/* Live Action Simulator Console */}
          <div className="simulator-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ffffff" }}>
                  ⚡ Real-Time Engagement Simulator
                </h2>
                <p style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>
                  Test points dispatch, streak incrementation, level-up transitions, and badge unlocks in real-time.
                </p>
              </div>
              <span
                style={{
                  background: "rgba(99, 102, 241, 0.2)",
                  border: "1px solid rgba(99, 102, 241, 0.4)",
                  color: "#a5b4fc",
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.6rem",
                  borderRadius: "9999px",
                  fontWeight: 700,
                }}
              >
                Interactive Demo
              </span>
            </div>

            <div className="simulator-actions-row">
              <button
                className="sim-btn sim-btn-primary"
                onClick={() => handleSimulateAward("attendancePresent")}
              >
                <Flame size={16} />
                Attend Class (+{pointRules.attendancePresent} XP & Streak +1)
              </button>

              <button
                className="sim-btn"
                onClick={() => handleSimulateAward("assignmentSubmitted", { earlySubmission: true })}
              >
                <TrendingUp size={16} />
                Submit Assignment Early (+{pointRules.assignmentSubmitted + pointRules.assignmentEarlyBonus} XP)
              </button>

              <button
                className="sim-btn"
                onClick={() =>
                  handleSimulateAward("assignmentSubmitted", { earlySubmission: true, perfectScore: true })
                }
              >
                <Star size={16} />
                Score 100% on Assignment (+
                {pointRules.assignmentSubmitted +
                  pointRules.assignmentEarlyBonus +
                  pointRules.assignmentPerfectScore}{" "}
                XP)
              </button>

              <button
                className="sim-btn"
                onClick={() => handleSimulateAward("dailyLogin")}
              >
                <Zap size={16} />
                Daily Portal Login (+{pointRules.dailyLogin} XP)
              </button>
            </div>
          </div>

          {/* Admin Configuration Console */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "1.25rem",
              padding: "1.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff" }}>
                  Institutional Points System Rules (Admin)
                </h2>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                  Customize the XP weights assigned to student activities across ScholarPulse.
                </p>
              </div>

              <button
                onClick={handleSaveAdminConfig}
                disabled={configSaving}
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  border: "none",
                  color: "#ffffff",
                  padding: "0.65rem 1.25rem",
                  borderRadius: "0.75rem",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                {configSaving ? "Saving..." : "Save Point Rules"}
              </button>
            </div>

            {configSuccessMsg && (
              <div
                style={{
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid #10b981",
                  color: "#6ee7b7",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.75rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                {configSuccessMsg}
              </div>
            )}

            <div className="points-rules-grid">
              <div className="points-rule-item">
                <div className="points-rule-header">
                  <span className="points-rule-title">Class Attendance (Present)</span>
                  <input
                    type="number"
                    className="points-rule-input"
                    value={pointRules.attendancePresent}
                    onChange={(e) =>
                      setPointRules({ ...pointRules, attendancePresent: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                  Awarded each time a student attends a scheduled lecture or lab session.
                </p>
              </div>

              <div className="points-rule-item">
                <div className="points-rule-header">
                  <span className="points-rule-title">Assignment Submitted</span>
                  <input
                    type="number"
                    className="points-rule-input"
                    value={pointRules.assignmentSubmitted}
                    onChange={(e) =>
                      setPointRules({ ...pointRules, assignmentSubmitted: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                  Base XP awarded for completing and submitting coursework before the cutoff.
                </p>
              </div>

              <div className="points-rule-item">
                <div className="points-rule-header">
                  <span className="points-rule-title">Early Submission Bonus</span>
                  <input
                    type="number"
                    className="points-rule-input"
                    value={pointRules.assignmentEarlyBonus}
                    onChange={(e) =>
                      setPointRules({ ...pointRules, assignmentEarlyBonus: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                  Extra bonus XP when work is turned in at least 24 hours ahead of deadline.
                </p>
              </div>

              <div className="points-rule-item">
                <div className="points-rule-header">
                  <span className="points-rule-title">Perfect Score (100%)</span>
                  <input
                    type="number"
                    className="points-rule-input"
                    value={pointRules.assignmentPerfectScore}
                    onChange={(e) =>
                      setPointRules({ ...pointRules, assignmentPerfectScore: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                  High-achievement bonus for scoring 100% on assignments or quizzes.
                </p>
              </div>

              <div className="points-rule-item">
                <div className="points-rule-header">
                  <span className="points-rule-title">Daily Platform Login</span>
                  <input
                    type="number"
                    className="points-rule-input"
                    value={pointRules.dailyLogin}
                    onChange={(e) =>
                      setPointRules({ ...pointRules, dailyLogin: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                  Daily reward to incentivize students to log into the portal.
                </p>
              </div>

              <div className="points-rule-item">
                <div className="points-rule-header">
                  <span className="points-rule-title">Active Streak Daily Bonus</span>
                  <input
                    type="number"
                    className="points-rule-input"
                    value={pointRules.streakDayBonus}
                    onChange={(e) =>
                      setPointRules({ ...pointRules, streakDayBonus: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                  Incremental XP multiplier for maintaining uninterrupted streaks.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
