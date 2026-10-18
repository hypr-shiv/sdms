"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  User,
  Send,
  Sparkles,
  BookOpen,
  FileText,
  HelpCircle,
  ShieldCheck,
  CheckCircle,
  XCircle,
  RefreshCw,
  Zap,
  TrendingDown,
  Layers,
  Settings,
  Sliders,
  DollarSign,
  AlertTriangle,
  Lightbulb,
  Check,
  Award,
} from "lucide-react";
import "./copilot.css";

interface Citation {
  courseCode: string;
  sourceType: string;
  title: string;
  score?: number;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  citations?: Citation[];
  modelUsed?: string;
  isCacheHit?: boolean;
  costSaved?: number;
  tokensUsed?: number;
  timestamp: string;
}

interface QuizQuestion {
  questionNumber: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  citation: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

interface NoteSummary {
  courseCode: string;
  topic: string;
  summary: string;
  keyTakeaways: string[];
  keyDefinitions: Record<string, string>;
  studyTips: string[];
  sourceCitations: Citation[];
}

interface UsageQuota {
  todayQueries: number;
  dailyLimit: number;
  remainingQueries: number;
  resetInHours: number;
}

interface AdminMonitoringData {
  config: {
    dailyQueryLimitPerStudent: number;
    responseCachingEnabled: boolean;
    costPer1kTokensSmall: number;
    costPer1kTokensDense: number;
  };
  totalQueries: number;
  totalTokens: number;
  cacheHits: number;
  cacheHitRate: number;
  totalCostUsd: number;
  totalCostSavedUsd: number;
  modelBreakdown: {
    fastModelQueries: number;
    denseModelQueries: number;
  };
  recentLogs: Array<{
    id: string;
    studentId: string;
    courseCode: string;
    query: string;
    modelUsed: string;
    isCacheHit: boolean;
    costSaved: number;
    tokensUsed: number;
    createdAt: string;
  }>;
}

const COURSES = [
  { code: "CS301", name: "CS301: Data Structures & Algorithms", defaultTopic: "Binary Search Trees" },
  { code: "PHY201", name: "PHY201: General Physics II", defaultTopic: "Faraday's Law & Induction" },
  { code: "MATH201", name: "MATH201: Linear Algebra & Matrix Theory", defaultTopic: "Eigenvalues & Diagonalization" },
];

const STARTER_PROMPTS: Record<string, string[]> = {
  CS301: [
    "What is the late submission policy for CS301 programming assignments?",
    "Explain the worst-case and average-case time complexity of QuickSort.",
    "What are the grading weights for Homework vs Midterm in CS301?",
    "How does an AVL Tree maintain balance during insertions?",
  ],
  PHY201: [
    "State Gauss's Law and its differential equation form.",
    "What is the safety policy for the Optics laboratory session?",
    "Explain Faraday's Law of Electromagnetic Induction with Lenz's Law.",
    "How do dielectric materials affect capacitor capacitance?",
  ],
  MATH201: [
    "How do I compute the characteristic polynomial and eigenvalues of a 2x2 matrix?",
    "What are the conditions required for a square matrix to be diagonalizable?",
    "Explain the Gram-Schmidt orthogonalization process.",
    "What percentage of the final grade is the linear algebra project?",
  ],
};

export default function AICopilotPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "quiz" | "summary" | "admin">("chat");
  const [selectedCourse, setSelectedCourse] = useState<string>("CS301");

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [quota, setQuota] = useState<UsageQuota>({
    todayQueries: 0,
    dailyLimit: 50,
    remainingQueries: 50,
    resetInHours: 24,
  });
  const [queryError, setQueryError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quiz State
  const [quizTopic, setQuizTopic] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizScore, setQuizScore] = useState<{ answered: number; correct: number } | null>(null);

  // Summarizer State
  const [summaryTopic, setSummaryTopic] = useState("");
  const [notesContent, setNotesContent] = useState("");
  const [summaryResult, setSummaryResult] = useState<NoteSummary | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Admin Monitoring State
  const [monitoringData, setMonitoringData] = useState<AdminMonitoringData | null>(null);
  const [isLoadingMonitoring, setIsLoadingMonitoring] = useState(false);
  const [adminLimitInput, setAdminLimitInput] = useState(50);
  const [adminCacheToggle, setAdminCacheToggle] = useState(true);
  const [adminConfigSaved, setAdminConfigSaved] = useState(false);

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    return null;
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        setCurrentUser(u);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchQuota = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch("http://localhost:3001/ai/copilot/usage", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setQuota({
          todayQueries: data.usedToday ?? data.todayQueries ?? 0,
          dailyLimit: data.dailyLimit ?? 50,
          remainingQueries: data.remaining ?? data.remainingQueries ?? 50,
          resetInHours: data.resetInHours ?? 24,
        });
      }
    } catch (err) {
      console.error("Failed to fetch quota:", err);
    }
  }, []);

  const fetchAdminMonitoring = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    setIsLoadingMonitoring(true);
    try {
      const res = await fetch("http://localhost:3001/ai/copilot/admin/monitoring", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMonitoringData({
          config: {
            dailyQueryLimitPerStudent: data.dailyQueryLimitPerStudent ?? 50,
            responseCachingEnabled: data.enableCaching ?? true,
            costPer1kTokensSmall: 0.0005,
            costPer1kTokensDense: 0.0035,
          },
          totalQueries: data.totalQueries ?? 0,
          totalTokens: data.totalTokens ?? 0,
          cacheHits: data.cacheHits ?? 0,
          cacheHitRate: data.cacheHitRate ?? 0,
          totalCostUsd: data.netCostUsd ?? 0,
          totalCostSavedUsd: data.totalCostSavedUsd ?? 0,
          modelBreakdown: {
            fastModelQueries: data.modelDistribution?.["ScholarPulse-Fast-3B (Lightweight Factual)"] ?? 0,
            denseModelQueries: data.totalQueries - (data.modelDistribution?.["ScholarPulse-Fast-3B (Lightweight Factual)"] ?? 0),
          },
          recentLogs: (data.recentLogs || []).map((l: any) => ({
            id: l.id,
            studentId: l.studentName || l.studentId,
            courseCode: l.courseId || "CS301",
            query: l.queryPrompt || l.query || "",
            modelUsed: l.modelUsed || "ScholarPulse",
            isCacheHit: l.isCacheHit ?? false,
            costSaved: l.costSavedUsd ?? 0,
            tokensUsed: (l.promptTokens || 0) + (l.completionTokens || 0),
            createdAt: l.createdAt || new Date().toISOString(),
          })),
        });
        setAdminLimitInput(data.dailyQueryLimitPerStudent ?? 50);
        setAdminCacheToggle(data.enableCaching ?? true);
      }
    } catch (err) {
      console.error("Failed to fetch admin monitoring:", err);
    } finally {
      setIsLoadingMonitoring(false);
    }
  }, []);

  useEffect(() => {
    fetchQuota();
    // Default initial greeting message
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome-1",
          sender: "ai",
          text: `Hello! I am your AI Study Copilot for ${selectedCourse}. My knowledge is strictly indexed from verified course syllabi, lecture slides, and project rubrics to prevent hallucinations.\n\nAsk me any course questions, generate a 5-question review quiz, or summarize lecture notes!`,
          citations: [
            {
              courseCode: selectedCourse,
              sourceType: "Syllabus",
              title: `${selectedCourse} Official Syllabus & Policy Document`,
            },
          ],
          modelUsed: "ScholarPulse-Fast-3B",
          isCacheHit: false,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [fetchQuota, selectedCourse]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isQuerying]);

  useEffect(() => {
    if (activeTab === "admin") {
      fetchAdminMonitoring();
    }
  }, [activeTab, fetchAdminMonitoring]);

  // Handle Chat Submit
  const handleSendQuery = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isQuerying) return;

    setQueryError(null);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsQuerying(true);

    try {
      const token = getAuthToken();
      const res = await fetch("http://localhost:3001/ai/copilot/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: textToSend,
          courseId: selectedCourse,
        }),
      });

      if (res.status === 429) {
        const errorData = await res.json();
        setQueryError(errorData.message || "Daily query limit reached. Please wait for reset.");
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: "ai",
            text: `⚠️ Rate Limit Exceeded: ${errorData.message || "You have reached your daily query limit."} Administrative cost controls reset your quota daily.`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to query AI Study Copilot");
      }

      const data = await res.json();

      const normalizedCitations: Citation[] = (data.citations || []).map((c: any) =>
        typeof c === "string"
          ? { courseCode: selectedCourse, sourceType: "Course Doc", title: c }
          : c
      );

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.answer,
        citations: normalizedCitations,
        modelUsed: data.modelUsed,
        isCacheHit: data.isCacheHit,
        costSaved: data.costSaved ?? data.costSavedUsd ?? 0,
        tokensUsed: (data.promptTokens || 0) + (data.completionTokens || 0),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      fetchQuota();
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "ai",
          text: "I experienced a connection issue reaching the academic vector index. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  // Handle Quiz Generation
  const handleGenerateQuiz = async () => {
    setIsGeneratingQuiz(true);
    setUserAnswers({});
    setQuizScore(null);
    try {
      const token = getAuthToken();
      const res = await fetch("http://localhost:3001/ai/copilot/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: selectedCourse,
          topic: quizTopic.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setQuizQuestions(data.questions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleSelectAnswer = (qIndex: number, optionIndex: number) => {
    if (userAnswers[qIndex] !== undefined) return; // Prevent re-answering
    const updated = { ...userAnswers, [qIndex]: optionIndex };
    setUserAnswers(updated);

    // Compute updated score
    let correct = 0;
    quizQuestions.forEach((q, idx) => {
      if (updated[idx] === q.correctAnswerIndex) {
        correct++;
      }
    });
    setQuizScore({ answered: Object.keys(updated).length, correct });
  };

  // Handle Summarizer Submit
  const handleSummarize = async () => {
    setIsSummarizing(true);
    setSummaryResult(null);
    try {
      const token = getAuthToken();
      const res = await fetch("http://localhost:3001/ai/copilot/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: selectedCourse,
          topic: summaryTopic.trim() || undefined,
          notesContent: notesContent.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const payload = data.summary || data;
        setSummaryResult({
          courseCode: payload.courseId || selectedCourse,
          topic: payload.topic || payload.summaryTitle || selectedCourse + " Notes",
          summary: payload.summary || payload.summaryTitle || "Key course summary generated.",
          keyTakeaways: payload.keyTakeaways || [],
          keyDefinitions: payload.keyDefinitions || {},
          studyTips: payload.studyTips || [],
          sourceCitations: (payload.citations || payload.sourceCitations || []).map((c: any) =>
            typeof c === "string" ? { courseCode: selectedCourse, sourceType: "Document", title: c } : c
          ),
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSummarizing(false);
    }
  };

  // Handle Admin Config Update
  const handleSaveAdminConfig = async () => {
    const token = getAuthToken();
    try {
      const res = await fetch("http://localhost:3001/ai/copilot/admin/config", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dailyQueryLimitPerStudent: adminLimitInput,
          responseCachingEnabled: adminCacheToggle,
        }),
      });
      if (res.ok) {
        setAdminConfigSaved(true);
        setTimeout(() => setAdminConfigSaved(false), 3000);
        fetchAdminMonitoring();
        fetchQuota();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isAdminOrFaculty = currentUser?.role === "admin" || currentUser?.role === "faculty";

  return (
    <div className="copilot-container">
      {/* ─── Hero Header ─── */}
      <div className="copilot-hero">
        <div className="copilot-hero-left">
          <h1>
            <Sparkles size={28} color="#6366f1" />
            AI Study Assistant & Copilot
          </h1>
          <p>
            Retrieval-Augmented Generation (RAG) powered study assistant grounded strictly in verified course
            materials, lecture slides, and rubrics.
          </p>
          <div className="copilot-badges">
            <span className="copilot-pill rag-active">
              <Layers size={13} />
              Multi-Course Vector DB Active
            </span>
            <span className="copilot-pill grounded">
              <ShieldCheck size={13} />
              Hallucination Guardrail: Strict Grounding
            </span>
            <span className="copilot-pill quota">
              <Zap size={13} />
              Daily Limit: {quota.remainingQueries} / {quota.dailyLimit} remaining
            </span>
          </div>
        </div>

        <div className="copilot-hero-right">
          <div className="course-selector-box">
            <BookOpen size={16} color="var(--text-secondary)" />
            <select
              className="course-select"
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setQuizTopic("");
                setSummaryTopic("");
                setQuizQuestions([]);
                setSummaryResult(null);
              }}
            >
              {COURSES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─── Mode Tabs Bar ─── */}
      <div className="copilot-tabs-bar">
        <div className="copilot-tab-group">
          <button
            className={`copilot-tab-btn ${activeTab === "chat" ? "active" : ""}`}
            onClick={() => setActiveTab("chat")}
          >
            <Bot size={16} />
            Course Q&A (RAG Chatbot)
          </button>
          <button
            className={`copilot-tab-btn ${activeTab === "quiz" ? "active" : ""}`}
            onClick={() => setActiveTab("quiz")}
          >
            <HelpCircle size={16} />
            5-Question Review Quiz
          </button>
          <button
            className={`copilot-tab-btn ${activeTab === "summary" ? "active" : ""}`}
            onClick={() => setActiveTab("summary")}
          >
            <FileText size={16} />
            PDF & Notes Summarizer
          </button>
          {isAdminOrFaculty && (
            <button
              className={`copilot-tab-btn ${activeTab === "admin" ? "active" : ""}`}
              onClick={() => setActiveTab("admin")}
            >
              <Sliders size={16} />
              Token Usage & Cost Controls
            </button>
          )}
        </div>

        <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 500 }}>
          Logged in as: <strong style={{ color: "var(--text-primary)" }}>{currentUser?.name || "Student"}</strong> ({currentUser?.role || "student"})
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: RAG CHATBOT (Course Q&A)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "chat" && (
        <div className="rag-chat-wrapper">
          <div className="rag-chat-card">
            {/* Messages Area */}
            <div className="rag-chat-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`rag-message ${msg.sender}`}>
                  <div className="rag-msg-avatar">
                    {msg.sender === "user" ? <User size={18} /> : <Bot size={18} />}
                  </div>

                  <div>
                    <div className="rag-msg-bubble">
                      <div style={{ whiteSpace: "pre-line" }}>{msg.text}</div>

                      {/* Source Citations */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="rag-citations-box">
                          <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                            Verified Sources:
                          </span>
                          {msg.citations.map((c, idx) => (
                            <span key={idx} className="rag-citation-chip" title={c.title}>
                              <BookOpen size={10} />
                              {c.sourceType}: {c.title.length > 35 ? c.title.substring(0, 35) + "..." : c.title}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Metadata Chips: Model Used & Caching */}
                      {msg.sender === "ai" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                          {msg.isCacheHit ? (
                            <span className="rag-cache-chip">
                              <Zap size={10} />
                              Redis/Cache Hit (~${msg.costSaved?.toFixed(4)} saved)
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                              Fresh Vector Retrieval
                            </span>
                          )}

                          {msg.modelUsed && (
                            <span className="rag-model-tag">
                              Engine: <strong>{msg.modelUsed}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-secondary)",
                        marginTop: 4,
                        display: "block",
                        textAlign: msg.sender === "user" ? "right" : "left",
                        padding: "0 6px",
                      }}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isQuerying && (
                <div className="rag-message ai">
                  <div className="rag-msg-avatar">
                    <Bot size={18} />
                  </div>
                  <div className="rag-msg-bubble" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <RefreshCw size={16} className="animate-spin" color="#6366f1" />
                    <span>Searching course vector index & synthesizing grounded answer...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error Banner */}
            {queryError && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  borderTop: "1px solid rgba(239, 68, 68, 0.3)",
                  padding: "10px 20px",
                  color: "#dc2626",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertTriangle size={16} />
                <span>{queryError}</span>
              </div>
            )}

            {/* Input Bar */}
            <div className="rag-input-bar">
              <input
                className="rag-input-field"
                placeholder={`Ask anything about ${selectedCourse} syllabus, concepts, or assignments...`}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendQuery();
                  }
                }}
                disabled={isQuerying}
              />
              <button
                className="rag-send-btn"
                onClick={() => handleSendQuery()}
                disabled={!inputQuery.trim() || isQuerying}
              >
                <Send size={15} />
                Ask Copilot
              </button>
            </div>
          </div>

          {/* Right Sidebar: Starter Prompts & Guardrails Info */}
          <div className="rag-sidebar">
            {/* Suggested Starter Prompts */}
            <div className="rag-sidebar-card">
              <h4>
                <Lightbulb size={16} color="#f59e0b" />
                Verified Course Prompts
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(STARTER_PROMPTS[selectedCourse] || []).map((prompt, idx) => (
                  <button
                    key={idx}
                    className="prompt-pill-btn"
                    onClick={() => handleSendQuery(prompt)}
                    disabled={isQuerying}
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>

            {/* Guardrail Policy */}
            <div className="rag-sidebar-card">
              <h4>
                <ShieldCheck size={16} color="#10b981" />
                Anti-Hallucination Guardrails
              </h4>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Every answer generated by this Copilot is strictly cross-referenced against your uploaded course documents.
                If a concept falls outside course materials, the Copilot explicitly declines rather than inventing facts.
              </p>
            </div>

            {/* Daily Quota Counter */}
            <div className="rag-sidebar-card">
              <h4>
                <Zap size={16} color="#6366f1" />
                Student Daily Query Quota
              </h4>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: 6 }}>
                <span>Usage Today:</span>
                <strong>
                  {quota.todayQueries} / {quota.dailyLimit} queries
                </strong>
              </div>
              <div
                style={{
                  height: 8,
                  borderRadius: 4,
                  background: "rgba(0,0,0,0.06)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${Math.min(100, (quota.todayQueries / quota.dailyLimit) * 100)}%`,
                    background:
                      quota.remainingQueries <= 5
                        ? "#ef4444"
                        : quota.remainingQueries <= 15
                        ? "#f59e0b"
                        : "#10b981",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              <p style={{ margin: "8px 0 0 0", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                Quota resets in approximately {quota.resetInHours} hours.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: 5-QUESTION REVIEW QUIZ
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "quiz" && (
        <div className="quiz-container">
          <div className="quiz-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "1.2rem", fontWeight: 700 }}>
                  Generate 5-Question Adaptive Review Quiz
                </h3>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)" }}>
                  Grounded in {selectedCourse} lecture slides, formulas, and examination rubrics.
                </p>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Specify focus topic (e.g. Heaps, Induction)..."
                  value={quizTopic}
                  onChange={(e) => setQuizTopic(e.target.value)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--border-color, rgba(226, 232, 240, 0.8))",
                    fontSize: "0.88rem",
                    outline: "none",
                    minWidth: 260,
                  }}
                />

                <button
                  className="rag-send-btn"
                  onClick={handleGenerateQuiz}
                  disabled={isGeneratingQuiz}
                  style={{ height: 38 }}
                >
                  {isGeneratingQuiz ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Generate 5 Questions
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Score tracker if answered */}
            {quizScore && (
              <div
                style={{
                  background: "rgba(99, 102, 241, 0.08)",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                  padding: "12px 18px",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Award size={20} color="#6366f1" />
                  <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                    Quiz Progress: {quizScore.answered} of {quizQuestions.length} answered
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#6366f1" }}>
                  Current Score: {quizScore.correct} / {quizScore.answered} (
                  {Math.round((quizScore.correct / (quizScore.answered || 1)) * 100)}%)
                </div>
              </div>
            )}
          </div>

          {/* Render 5 Questions */}
          {quizQuestions.length > 0 ? (
            quizQuestions.map((q, qIndex) => {
              const selectedAnswer = userAnswers[qIndex];
              const isAnswered = selectedAnswer !== undefined;
              const isCorrect = isAnswered && selectedAnswer === q.correctAnswerIndex;

              return (
                <div key={qIndex} className="quiz-card">
                  <div className="quiz-q-header">
                    <span className="quiz-q-num">Question {q.questionNumber || qIndex + 1} of 5</span>
                    <span className={`quiz-diff-badge ${q.difficulty}`}>{q.difficulty}</span>
                  </div>

                  <h4 className="quiz-q-text">{q.question}</h4>

                  <div className="quiz-options-grid">
                    {q.options.map((option, optIdx) => {
                      let btnClass = "quiz-option-btn";
                      if (isAnswered) {
                        if (optIdx === q.correctAnswerIndex) {
                          btnClass += " correct";
                        } else if (optIdx === selectedAnswer) {
                          btnClass += " wrong";
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          className={btnClass}
                          onClick={() => handleSelectAnswer(qIndex, optIdx)}
                          disabled={isAnswered}
                        >
                          <span>{option}</span>
                          {isAnswered && optIdx === q.correctAnswerIndex && <CheckCircle size={18} color="#10b981" />}
                          {isAnswered && optIdx === selectedAnswer && optIdx !== q.correctAnswerIndex && (
                            <XCircle size={18} color="#ef4444" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isAnswered && (
                    <div className="quiz-explanation-box">
                      <div style={{ fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                        {isCorrect ? (
                          <span style={{ color: "#10b981" }}>✓ Correct!</span>
                        ) : (
                          <span style={{ color: "#ef4444" }}>✗ Incorrect</span>
                        )}
                        <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>— Explanation:</span>
                      </div>
                      <p style={{ margin: "0 0 6px 0" }}>{q.explanation}</p>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                        <strong>Grounded Citation:</strong> {q.citation}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div
              className="quiz-card"
              style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-secondary)" }}
            >
              <HelpCircle size={48} color="#6366f1" style={{ margin: "0 auto 12px auto" }} />
              <h3 style={{ margin: "0 0 6px 0", color: "var(--text-primary)" }}>No Active Quiz Generated</h3>
              <p style={{ maxWidth: 450, margin: "0 auto 16px auto", fontSize: "0.9rem" }}>
                Click "Generate 5 Questions" above to pull a tailored 5-question multiple choice quiz directly from the{" "}
                {selectedCourse} curriculum.
              </p>
              <button
                className="rag-send-btn"
                onClick={handleGenerateQuiz}
                disabled={isGeneratingQuiz}
                style={{ margin: "0 auto" }}
              >
                <Sparkles size={14} />
                Generate Review Quiz for {selectedCourse}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: NOTES & SLIDE SUMMARIZER
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "summary" && (
        <div className="summary-container">
          <div className="summary-card">
            <h3 style={{ margin: "0 0 4px 0", fontSize: "1.2rem", fontWeight: 700 }}>
              Summarize Course Documents & Lecture Notes
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
              Extracts high-yield key takeaways, core definitions, and exam study tips grounded in {selectedCourse}.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: 6 }}>
                  Focus Topic
                </label>
                <input
                  type="text"
                  placeholder="e.g. Asymptotic Analysis, Maxwell's Equations, Vector Spaces"
                  value={summaryTopic}
                  onChange={(e) => setSummaryTopic(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--border-color, rgba(226, 232, 240, 0.8))",
                    fontSize: "0.88rem",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: 6 }}>
                  Quick Preset Topics
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(STARTER_PROMPTS[selectedCourse] || []).slice(0, 2).map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSummaryTopic(p.split(" ").slice(0, 3).join(" "))}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        background: "var(--bg-hover, #f1f5f9)",
                        border: "1px solid var(--border-color, #e2e8f0)",
                        fontSize: "0.78rem",
                        cursor: "pointer",
                      }}
                    >
                      {p.split(" ").slice(0, 3).join(" ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: 6 }}>
                Paste Lecture Notes or PDF Excerpt (Optional — defaults to indexed course files)
              </label>
              <textarea
                rows={4}
                placeholder="Paste any slide transcript or notes you want structured into bullet points..."
                value={notesContent}
                onChange={(e) => setNotesContent(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--border-color, rgba(226, 232, 240, 0.8))",
                  fontSize: "0.88rem",
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                className="rag-send-btn"
                onClick={handleSummarize}
                disabled={isSummarizing}
                style={{ height: 40 }}
              >
                {isSummarizing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Synthesizing Notes...
                  </>
                ) : (
                  <>
                    <FileText size={14} />
                    Generate Structured Summary
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Render Summary Results */}
          {summaryResult && (
            <div className="summary-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "1.3rem", fontWeight: 700, color: "#6366f1" }}>
                    {summaryResult.topic}
                  </h3>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    Course Reference: <strong>{summaryResult.courseCode}</strong>
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {summaryResult.sourceCitations?.map((c, i) => (
                    <span key={i} className="rag-citation-chip">
                      <BookOpen size={10} />
                      {c.title}
                    </span>
                  ))}
                </div>
              </div>

              {/* Executive Summary */}
              <div
                style={{
                  background: "rgba(99, 102, 241, 0.05)",
                  borderLeft: "4px solid #6366f1",
                  padding: "14px 18px",
                  borderRadius: "0 12px 12px 0",
                  fontSize: "0.94rem",
                  lineHeight: 1.6,
                }}
              >
                <strong>Overview:</strong> {summaryResult.summary}
              </div>

              {/* High-Yield Key Takeaways */}
              <div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle size={16} color="#10b981" />
                  Key Takeaways
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {summaryResult.keyTakeaways?.map((takeaway, idx) => (
                    <div key={idx} className="summary-bullet-item">
                      <span style={{ color: "#6366f1", fontWeight: 700 }}>•</span>
                      <span>{takeaway}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Definitions */}
              {summaryResult.keyDefinitions && Object.keys(summaryResult.keyDefinitions).length > 0 && (
                <div>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                    <BookOpen size={16} color="#6366f1" />
                    Essential Terminology & Definitions
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
                    {Object.entries(summaryResult.keyDefinitions).map(([term, def], idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "12px 16px",
                          background: "var(--bg-hover, #f8fafc)",
                          border: "1px solid var(--border-color, rgba(226, 232, 240, 0.8))",
                          borderRadius: 12,
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#6366f1", marginBottom: 4 }}>
                          {term}
                        </div>
                        <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                          {def}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Study Tips */}
              {summaryResult.studyTips && summaryResult.studyTips.length > 0 && (
                <div>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                    <Lightbulb size={16} color="#f59e0b" />
                    Exam Mastery & Study Recommendations
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {summaryResult.studyTips.map((tip, idx) => (
                      <div key={idx} className="summary-bullet-item">
                        <span style={{ color: "#f59e0b", fontWeight: 700 }}>★</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: ADMIN TOKEN MONITORING & COST CONTROLS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "admin" && isAdminOrFaculty && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Top Metric Cards */}
          <div className="monitoring-grid">
            <div className="monitoring-card">
              <span className="mon-label">Total Queries</span>
              <span className="mon-val">{monitoringData?.totalQueries ?? 0}</span>
              <span className="mon-sub">Across all enrolled students</span>
            </div>

            <div className="monitoring-card">
              <span className="mon-label">Total Tokens Processed</span>
              <span className="mon-val">
                {monitoringData?.totalTokens ? monitoringData.totalTokens.toLocaleString() : 0}
              </span>
              <span className="mon-sub">Prompt + Completion</span>
            </div>

            <div className="monitoring-card">
              <span className="mon-label">Cache Hit Rate</span>
              <span className="mon-val" style={{ color: "#10b981" }}>
                {monitoringData?.cacheHitRate ?? 0}%
              </span>
              <span className="mon-sub">{monitoringData?.cacheHits ?? 0} cached responses</span>
            </div>

            <div className="monitoring-card">
              <span className="mon-label">Cost Saved (Caching)</span>
              <span className="mon-val" style={{ color: "#10b981" }}>
                ${monitoringData?.totalCostSavedUsd?.toFixed(4) ?? "0.0000"}
              </span>
              <span className="mon-sub">Redis-backed zero-latency hits</span>
            </div>

            <div className="monitoring-card">
              <span className="mon-label">Net Incurred Cost</span>
              <span className="mon-val" style={{ color: "#6366f1" }}>
                ${monitoringData?.totalCostUsd?.toFixed(4) ?? "0.0000"}
              </span>
              <span className="mon-sub">Model API compute</span>
            </div>
          </div>

          {/* Model Routing & Rate Limiting Controls */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Rate Limiting Configuration Card */}
            <div className="monitoring-card" style={{ gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Settings size={20} color="#6366f1" />
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
                  Cost Controls & Guardrails Config
                </h3>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, marginBottom: 6 }}>
                  Per-Student Daily Query Limit (Queries/Day)
                </label>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    type="number"
                    min={5}
                    max={500}
                    value={adminLimitInput}
                    onChange={(e) => setAdminLimitInput(Number(e.target.value))}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 10,
                      border: "1px solid var(--border-color, rgba(226, 232, 240, 0.8))",
                      fontSize: "0.95rem",
                      width: 140,
                    }}
                  />
                  <button className="rag-send-btn" onClick={handleSaveAdminConfig}>
                    Save Settings
                  </button>
                </div>
                <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 4, display: "block" }}>
                  Default is 50 queries/day. Exceeding students receive HTTP 429 rate limit responses.
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--border-color, #e2e8f0)" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Response Caching (Redis/In-Memory)</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    Caches identical student queries to eliminate redundant LLM API calls.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={adminCacheToggle}
                  onChange={(e) => setAdminCacheToggle(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: "pointer" }}
                />
              </div>

              {adminConfigSaved && (
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    color: "#065f46",
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: "0.82rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Check size={14} /> Configuration saved and actively enforced.
                </div>
              )}
            </div>

            {/* Model Fallback Architecture Card */}
            <div className="monitoring-card" style={{ gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <TrendingDown size={20} color="#10b981" />
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
                  Intelligent Model Fallback Routing
                </h3>
              </div>

              <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                To optimize educational cloud expenditure, queries are dynamically triaged by complexity:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: "rgba(99, 102, 241, 0.05)",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <strong style={{ fontSize: "0.88rem", color: "#6366f1" }}>
                      ScholarPulse-Fast-3B (Factual Queries)
                    </strong>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                      {monitoringData?.modelBreakdown.fastModelQueries ?? 0} queries
                    </span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    Used for syllabi deadlines, office hours, grading rubrics, and quick definitions. ~$0.0005 / 1k tokens.
                  </div>
                </div>

                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: "rgba(139, 92, 246, 0.05)",
                    border: "1px solid rgba(139, 92, 246, 0.2)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <strong style={{ fontSize: "0.88rem", color: "#8b5cf6" }}>
                      ScholarPulse-Dense-70B (Complex Reasoning)
                    </strong>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                      {monitoringData?.modelBreakdown.denseModelQueries ?? 0} queries
                    </span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    Used for algorithmic step-by-step proofs, physics derivations, and multi-concept quiz synthesis. ~$0.0035 / 1k tokens.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Query Log Table */}
          <div className="monitoring-card" style={{ gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Recent Student AI Query Logs</h3>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color, #e2e8f0)", textAlign: "left", color: "var(--text-secondary)" }}>
                    <th style={{ padding: "8px 12px" }}>Time</th>
                    <th style={{ padding: "8px 12px" }}>Student</th>
                    <th style={{ padding: "8px 12px" }}>Course</th>
                    <th style={{ padding: "8px 12px" }}>Query Snippet</th>
                    <th style={{ padding: "8px 12px" }}>Model</th>
                    <th style={{ padding: "8px 12px" }}>Cache Status</th>
                    <th style={{ padding: "8px 12px" }}>Tokens</th>
                  </tr>
                </thead>
                <tbody>
                  {(monitoringData?.recentLogs || []).map((log) => (
                    <tr key={log.id} style={{ borderBottom: "1px solid var(--border-color, rgba(226, 232, 240, 0.5))" }}>
                      <td style={{ padding: "10px 12px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>{log.studentId}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span className="rag-citation-chip">{log.courseCode}</span>
                      </td>
                      <td style={{ padding: "10px 12px", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {log.query}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontSize: "0.76rem" }}>{log.modelUsed}</span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        {log.isCacheHit ? (
                          <span className="rag-cache-chip">Cached (-${log.costSaved?.toFixed(4)})</span>
                        ) : (
                          <span style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>Computed</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>{log.tokensUsed}</td>
                    </tr>
                  ))}
                  {(!monitoringData?.recentLogs || monitoringData.recentLogs.length === 0) && (
                    <tr>
                      <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)" }}>
                        No query logs recorded yet. Ask a question in the Course Q&A tab to populate metrics.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
