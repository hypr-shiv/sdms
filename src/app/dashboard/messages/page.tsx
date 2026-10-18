"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { type Role } from "@/lib/mockData";
import {
  MessageSquare, Send, Paperclip, Search, Plus, ShieldAlert,
  CornerUpLeft, Flag, Check, CheckCheck, FileText, Download,
  User, Shield, Eye, Trash2, X, RefreshCw, AlertTriangle, CheckCircle2,
  BookOpen, Clock
} from "lucide-react";
import "../dashboard.css";
import "./messages.css";
import EmptyState from "@/components/UI/EmptyState";

interface Conversation {
  id: string;
  title: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  courseId?: string;
  courseCode?: string;
  courseName?: string;
  status: "ACTIVE" | "ARCHIVED" | "MUTED";
  lastMessagePreview?: string;
  lastMessageAt?: string;
  lastSenderId?: string;
  unreadCountStudent: number;
  unreadCountTeacher: number;
  hasFlaggedMessages: boolean;
  createdAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderEmail?: string;
  senderRole: string;
  content: string;
  parentMessageId?: string;
  parentMessageSnippet?: string;
  parentMessageSenderName?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  attachmentSize?: number;
  isRead: boolean;
  readAt?: string;
  moderationStatus: "CLEAN" | "PENDING_REVIEW" | "FLAGGED" | "REDACTED";
  flagReason?: string;
  flaggedBy?: string;
  flaggedAt?: string;
  reviewedBy?: string;
  moderationNotes?: string;
  createdAt: string;
}

interface DirectoryContact {
  id: string;
  name: string;
  email: string;
  role: string;
  courseContext: string;
  courseId?: string;
}

interface DirectoryData {
  contacts: DirectoryContact[];
  courses: Array<{ id: string; code: string; name: string }>;
}

export default function MessagesPage() {
  const [user, setUser] = useState<{ id?: string; role: Role; name?: string; email?: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Data states
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [directory, setDirectory] = useState<DirectoryData>({ contacts: [], courses: [] });
  const [moderationQueue, setModerationQueue] = useState<any[]>([]);
  const [stats, setStats] = useState<{ totalConversations: number; unreadCount: number; flaggedCount: number } | null>(null);

  // Filter states
  const [sidebarTab, setSidebarTab] = useState<"all" | "unread" | "moderation">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Composer states
  const [composerText, setComposerText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [attachment, setAttachment] = useState<{ url: string; name: string; type: string; size: number } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Modals
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatRecipientId, setNewChatRecipientId] = useState("");
  const [newChatCourseId, setNewChatCourseId] = useState("");
  const [newChatTitle, setNewChatTitle] = useState("");
  const [newChatInitialMessage, setNewChatInitialMessage] = useState("");

  const [flaggingMessage, setFlaggingMessage] = useState<Message | null>(null);
  const [flagReason, setFlagReason] = useState("");

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

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

  const fetchConversations = useCallback(async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (sidebarTab === "unread") params.append("unreadOnly", "true");

      const res = await fetch(`http://localhost:3001/messages/conversations?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        if (data.length > 0 && !activeConversation && sidebarTab !== "moderation") {
          setActiveConversation(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, searchQuery, sidebarTab, activeConversation]);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:3001/messages/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setStats(await res.json());
    } catch {}
  }, [token]);

  const fetchDirectory = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:3001/messages/directory", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setDirectory(await res.json());
    } catch {}
  }, [token]);

  const fetchModerationQueue = useCallback(async () => {
    if (!token || user?.role !== "admin") return;
    try {
      const res = await fetch("http://localhost:3001/messages/moderation/queue", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setModerationQueue(await res.json());
    } catch {}
  }, [token, user?.role]);

  // Load Messages for Active Conversation
  const loadMessages = useCallback(async (convId: string) => {
    if (!token) return;
    setMessagesLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/messages/conversations/${convId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setActiveConversation(data.conversation);
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMessagesLoading(false);
    }
  }, [token, fetchStats]);

  useEffect(() => {
    if (token) {
      fetchConversations();
      fetchStats();
      fetchDirectory();
      if (user?.role === "admin") fetchModerationQueue();
    }
  }, [token, fetchConversations, fetchStats, fetchDirectory, fetchModerationQueue, user?.role]);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
    }
  }, [activeConversation?.id, loadMessages]);

  // Auto-scroll chat stream to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handler: Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeConversation || !token) return;
    if (!composerText.trim() && !attachment) return;

    const payload: any = {
      content: composerText.trim(),
    };

    if (replyingTo) {
      payload.parentMessageId = replyingTo.id;
    }

    if (attachment) {
      payload.attachmentUrl = attachment.url;
      payload.attachmentName = attachment.name;
      payload.attachmentType = attachment.type;
      payload.attachmentSize = attachment.size;
    }

    try {
      const res = await fetch(`http://localhost:3001/messages/conversations/${activeConversation.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to send message");
      const createdMessage = await res.json();

      setMessages((prev) => [...prev, createdMessage]);
      setComposerText("");
      setReplyingTo(null);
      setAttachment(null);

      // Update conversation last message in sidebar
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? { ...c, lastMessagePreview: createdMessage.content.slice(0, 80), lastMessageAt: new Date().toISOString() }
            : c
        )
      );

      if (createdMessage.moderationStatus === "FLAGGED") {
        showToast("Notice: Message flagged by automated content scanner for review.", "info");
      }
    } catch (err: any) {
      showToast("Error sending message: " + err.message, "error");
    }
  };

  // Handler: Upload File Attachment
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:3001/messages/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("File upload failed");
      const data = await res.json();

      setAttachment({
        url: data.fileUrl,
        name: data.fileName,
        type: data.fileType,
        size: data.fileSize,
      });
      showToast(`Attached: ${data.fileName}`, "success");
    } catch (err: any) {
      showToast("Upload failed: " + err.message, "error");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handler: Start New Conversation
  const handleCreateNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newChatRecipientId || !newChatInitialMessage.trim()) {
      showToast("Please choose a recipient and write an initial message.", "error");
      return;
    }

    try {
      const res = await fetch("http://localhost:3001/messages/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: newChatRecipientId,
          title: newChatTitle || "Academic Discussion",
          courseId: newChatCourseId || undefined,
          initialMessage: newChatInitialMessage,
        }),
      });

      if (!res.ok) throw new Error("Failed to start conversation");
      const data = await res.json();

      setConversations((prev) => [data.conversation, ...prev]);
      setActiveConversation(data.conversation);
      setIsNewChatModalOpen(false);

      // Reset form
      setNewChatRecipientId("");
      setNewChatCourseId("");
      setNewChatTitle("");
      setNewChatInitialMessage("");

      showToast("Conversation started successfully!", "success");
    } catch (err: any) {
      showToast("Error starting chat: " + err.message, "error");
    }
  };

  // Handler: Flag Inappropriate Message
  const handleFlagMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flaggingMessage || !token) return;

    try {
      const res = await fetch(`http://localhost:3001/messages/messages/${flaggingMessage.id}/flag`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ flagReason: flagReason || "User reported message" }),
      });

      if (!res.ok) throw new Error("Failed to flag message");
      const updated = await res.json();

      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setFlaggingMessage(null);
      setFlagReason("");
      showToast("Message reported to institutional moderators.", "success");
      if (user?.role === "admin") fetchModerationQueue();
    } catch (err: any) {
      showToast("Failed to report message: " + err.message, "error");
    }
  };

  // Handler: Admin Moderate (Dismiss or Redact)
  const handleAdminModerate = async (messageId: string, decision: "DISMISS" | "REDACT") => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3001/messages/messages/${messageId}/moderate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ decision }),
      });

      if (!res.ok) throw new Error("Moderation decision failed");
      const updated = await res.json();

      setModerationQueue((prev) => prev.filter((m) => m.id !== messageId));
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      showToast(
        decision === "REDACT"
          ? "Message content redacted across system."
          : "Flag dismissed. Message returned to clean standing.",
        "success"
      );
      fetchStats();
    } catch (err: any) {
      showToast("Error: " + err.message, "error");
    }
  };

  const isTeacher = user?.role === "teacher";
  const isAdmin = user?.role === "admin";

  return (
    <div className="messages-app-container">
      {/* Toast Alert */}
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
          {toast.type === "info" && <ShieldAlert size={16} />}
          {toast.message}
        </div>
      )}

      {/* Hidden File Upload Input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />

      {/* LEFT SIDEBAR: Conversations List */}
      <aside className="messages-sidebar">
        <div className="messages-sidebar-header">
          <div className="messages-sidebar-title">
            <MessageSquare size={20} color="#818cf8" />
            Direct Messages
          </div>

          <button
            className="compliance-btn compliance-btn-primary"
            style={{ padding: "6px 12px", fontSize: "0.78rem" }}
            onClick={() => setIsNewChatModalOpen(true)}
            title="Start new conversation"
          >
            <Plus size={14} /> New
          </button>
        </div>

        {/* Search */}
        <div className="messages-search-wrap">
          <Search size={14} className="messages-search-icon" />
          <input
            type="text"
            className="messages-search-input"
            placeholder="Search conversations, courses, or users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tabs Filter */}
        <div className="messages-filter-tabs">
          <button
            className={`messages-tab-btn ${sidebarTab === "all" ? "active" : ""}`}
            onClick={() => setSidebarTab("all")}
          >
            All Threads ({conversations.length})
          </button>
          <button
            className={`messages-tab-btn ${sidebarTab === "unread" ? "active" : ""}`}
            onClick={() => setSidebarTab("unread")}
          >
            Unread {stats && stats.unreadCount > 0 && <span className="unread-pill">{stats.unreadCount}</span>}
          </button>
          {isAdmin && (
            <button
              className={`messages-tab-btn ${sidebarTab === "moderation" ? "active" : ""}`}
              onClick={() => setSidebarTab("moderation")}
              style={{ color: stats && stats.flaggedCount > 0 ? "#f87171" : undefined }}
            >
              <ShieldAlert size={12} /> Moderation
              {stats && stats.flaggedCount > 0 && (
                <span className="unread-pill" style={{ background: "#ef4444" }}>
                  {stats.flaggedCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Conversation List Stream */}
        <div className="messages-list-scroll">
          {sidebarTab === "moderation" ? (
            /* Admin Moderation Queue Stream */
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldAlert size={14} color="#f87171" /> Flagged Messages Queue ({moderationQueue.length})
              </div>

              {moderationQueue.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 10px", color: "var(--text-tertiary, #94a3b8)", fontSize: "0.82rem" }}>
                  No messages currently flagged for policy review.
                </div>
              ) : (
                moderationQueue.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      borderRadius: 10,
                      padding: 12,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff" }}>
                        {m.senderName} ({m.senderRole})
                      </span>
                      <span style={{ fontSize: "0.68rem", color: "#fca5a5" }}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.82rem", color: "#fecaca", fontStyle: "italic", background: "rgba(0,0,0,0.3)", padding: 8, borderRadius: 6 }}>
                      "{m.content}"
                    </div>

                    <div style={{ fontSize: "0.72rem", color: "#fca5a5" }}>
                      <strong>Flag Reason:</strong> {m.flagReason || "Reported for review"}
                    </div>

                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 4 }}>
                      <button
                        className="compliance-btn compliance-btn-outline"
                        style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                        onClick={() => handleAdminModerate(m.id, "DISMISS")}
                      >
                        Dismiss
                      </button>
                      <button
                        className="compliance-btn compliance-btn-danger"
                        style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                        onClick={() => handleAdminModerate(m.id, "REDACT")}
                      >
                        Redact Content
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : conversations.length === 0 ? (
            <EmptyState
              compact
              variant="messages"
              title="No Conversations Yet"
              description="Connect with faculty or students to begin chatting securely."
              action={{
                label: "Start New Message",
                onClick: () => setIsNewChatModalOpen(true),
                icon: <Plus size={13} />,
              }}
            />
          ) : (
            conversations.map((conv) => {
              const isSelected = activeConversation?.id === conv.id;
              const otherPartyName = isTeacher ? conv.studentName : conv.teacherName;
              const unreadCount = isTeacher ? conv.unreadCountTeacher : conv.unreadCountStudent;

              return (
                <div
                  key={conv.id}
                  className={`conversation-item ${isSelected ? "active" : ""}`}
                  onClick={() => setActiveConversation(conv)}
                >
                  <div className="conversation-avatar">
                    {otherPartyName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  <div className="conversation-info">
                    <div className="conversation-top-row">
                      <span className="conversation-name">{otherPartyName}</span>
                      <span className="conversation-time">
                        {conv.lastMessageAt
                          ? new Date(conv.lastMessageAt).toLocaleDateString([], { month: "short", day: "numeric" })
                          : ""}
                      </span>
                    </div>

                    <div className="conversation-title-snippet">{conv.title}</div>
                    <div className="conversation-last-msg">
                      {conv.lastMessagePreview || "No messages yet"}
                    </div>

                    <div className="conversation-badge-row">
                      {conv.courseCode && (
                        <span className="announcements-badge" style={{ fontSize: "0.68rem", padding: "1px 6px" }}>
                          <BookOpen size={10} /> {conv.courseCode}
                        </span>
                      )}

                      {conv.hasFlaggedMessages && (
                        <span className="announcements-badge" style={{ borderColor: "#ef4444", color: "#f87171", fontSize: "0.68rem", padding: "1px 6px" }}>
                          <ShieldAlert size={10} /> Flagged
                        </span>
                      )}

                      {unreadCount > 0 && <span className="unread-pill">{unreadCount}</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* RIGHT MAIN CHAT AREA */}
      <main className="messages-main-pane">
        {activeConversation ? (
          <>
            {/* Chat Top Header */}
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="conversation-avatar" style={{ width: 44, height: 44, fontSize: "0.95rem" }}>
                  {(isTeacher ? activeConversation.studentName : activeConversation.teacherName)
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                <div>
                  <div className="chat-header-name">
                    {isTeacher ? activeConversation.studentName : activeConversation.teacherName}
                  </div>
                  <div className="chat-header-details">
                    <span>
                      {isTeacher ? "Enrolled Scholar" : "Course Instructor"}
                    </span>
                    <span>•</span>
                    <span style={{ color: "#a5b4fc", fontWeight: 600 }}>
                      {activeConversation.title}
                    </span>
                    {activeConversation.courseName && (
                      <>
                        <span>•</span>
                        <span style={{ color: "var(--text-secondary, #94a3b8)" }}>
                          {activeConversation.courseName}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {activeConversation.hasFlaggedMessages && (
                  <span className="announcements-badge" style={{ borderColor: "#f59e0b", color: "#fbbf24" }}>
                    <ShieldAlert size={12} /> Under Moderation Watch
                  </span>
                )}
              </div>
            </div>

            {/* Chat Messages Stream */}
            <div className="chat-messages-stream">
              {messagesLoading ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-tertiary, #94a3b8)" }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                  <div>Loading message history...</div>
                </div>
              ) : messages.length === 0 ? (
                <EmptyState
                  variant="messages"
                  title="No Messages in this Thread"
                  description="Be the first to say hello! Send a message below to start this academic conversation."
                />
              ) : (
                messages.map((msg) => {
                  const isOutgoing = msg.senderId === user?.id;
                  const isRedacted = msg.moderationStatus === "REDACTED";
                  const isFlagged = msg.moderationStatus === "FLAGGED";

                  return (
                    <div
                      key={msg.id}
                      className={`message-bubble-wrapper ${isOutgoing ? "outgoing" : "incoming"}`}
                    >
                      {/* Message Hover Actions */}
                      <div className="message-hover-actions">
                        <button
                          className="msg-action-btn"
                          title="Reply / Quote"
                          onClick={() => setReplyingTo(msg)}
                        >
                          <CornerUpLeft size={13} />
                        </button>
                        {!isOutgoing && !isRedacted && (
                          <button
                            className="msg-action-btn"
                            title="Report / Flag"
                            style={{ color: "#f87171" }}
                            onClick={() => {
                              setFlaggingMessage(msg);
                              setFlagReason("");
                            }}
                          >
                            <Flag size={13} />
                          </button>
                        )}
                      </div>

                      {/* Bubble */}
                      <div className={`message-bubble ${isFlagged ? "is-flagged" : ""} ${isRedacted ? "is-redacted" : ""}`}>
                        {/* Parent Quote */}
                        {msg.parentMessageSnippet && (
                          <div className="message-quote-container">
                            <div className="message-quote-author">
                              {msg.parentMessageSenderName || "Quoted Message"}
                            </div>
                            <div>"{msg.parentMessageSnippet}"</div>
                          </div>
                        )}

                        {/* Content */}
                        <div>{msg.content}</div>

                        {/* Attachment Card */}
                        {msg.attachmentUrl && (
                          <a
                            href={`http://localhost:3001${msg.attachmentUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="message-attachment-card"
                          >
                            <FileText size={18} color="#818cf8" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {msg.attachmentName || "Attached File"}
                              </div>
                              <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                                {msg.attachmentSize ? `${Math.round(msg.attachmentSize / 1024)} KB` : "Document"}
                              </div>
                            </div>
                            <Download size={14} color="#a5b4fc" />
                          </a>
                        )}

                        {/* Flag Warning Banner */}
                        {isFlagged && (
                          <div style={{ marginTop: 6, fontSize: "0.7rem", color: "#fbbf24", display: "flex", alignItems: "center", gap: 4 }}>
                            <ShieldAlert size={12} /> Flagged for review: {msg.flagReason || "Policy violation"}
                          </div>
                        )}
                      </div>

                      {/* Metadata Timestamp & Read check */}
                      <div className="message-meta-row">
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {isOutgoing && (
                          <span title={msg.isRead ? "Read by recipient" : "Sent"}>
                            {msg.isRead ? (
                              <CheckCheck size={13} color="#10b981" />
                            ) : (
                              <Check size={13} color="rgba(255,255,255,0.6)" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Composer Box */}
            <div className="chat-composer-container">
              {/* Replying To Banner */}
              {replyingTo && (
                <div className="replying-banner">
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <CornerUpLeft size={13} color="#818cf8" />
                    <span>
                      Replying to <strong>{replyingTo.senderName}</strong>: "{replyingTo.content.slice(0, 60)}..."
                    </span>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Uploaded Attachment Chip */}
              {attachment && (
                <div className="attachment-preview-chip">
                  <FileText size={14} color="#818cf8" />
                  <span>{attachment.name} ({Math.round(attachment.size / 1024)} KB)</span>
                  <button
                    onClick={() => setAttachment(null)}
                    style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="composer-input-row">
                <button
                  type="button"
                  className="composer-attach-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  title="Attach file (PDF, Doc, Image, Code)"
                >
                  <Paperclip size={18} className={uploadingFile ? "animate-spin" : ""} />
                </button>

                <textarea
                  className="composer-textarea"
                  rows={1}
                  placeholder={`Write message to ${isTeacher ? activeConversation.studentName : activeConversation.teacherName}... (Press Enter to send, Shift+Enter for new line)`}
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />

                <button
                  type="submit"
                  className="composer-btn"
                  disabled={!composerText.trim() && !attachment}
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Empty Placeholder State */
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: "var(--text-tertiary, #94a3b8)" }}>
            <MessageSquare size={48} color="#6366f1" style={{ opacity: 0.7 }} />
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>
              Direct Student ↔ Teacher Messaging
            </div>
            <div style={{ fontSize: "0.85rem", maxWidth: 420, textAlign: "center", lineHeight: 1.5 }}>
              Connect with faculty for course questions, office hours inquiries, assignment feedback, and academic guidance.
            </div>
            <button
              className="compliance-btn compliance-btn-primary"
              onClick={() => setIsNewChatModalOpen(true)}
            >
              <Plus size={16} /> Start a Conversation
            </button>
          </div>
        )}
      </main>

      {/* MODAL 1: Start New Conversation */}
      {isNewChatModalOpen && (
        <div className="messages-modal-overlay">
          <div className="messages-modal">
            <div className="messages-modal-header">
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                <Plus size={18} color="#818cf8" /> New Direct Conversation
              </div>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewChat}>
              <div className="messages-modal-body">
                <div className="form-field">
                  <label className="form-label">
                    Select Recipient ({isTeacher ? "Student" : "Faculty Member"}) *
                  </label>
                  <select
                    className="form-select"
                    value={newChatRecipientId}
                    onChange={(e) => {
                      setNewChatRecipientId(e.target.value);
                      const contact = directory.contacts.find((c) => c.id === e.target.value);
                      if (contact?.courseId) setNewChatCourseId(contact.courseId);
                    }}
                    required
                  >
                    <option value="">Choose contact...</option>
                    {directory.contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email}) — {c.courseContext}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Course Affiliation (Optional)</label>
                  <select
                    className="form-select"
                    value={newChatCourseId}
                    onChange={(e) => setNewChatCourseId(e.target.value)}
                  >
                    <option value="">No course affiliation (General)</option>
                    {directory.courses.map((crs) => (
                      <option key={crs.id} value={crs.id}>
                        {crs.code}: {crs.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Conversation Subject / Topic *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Question on Project 2 Graph Algorithm"
                    value={newChatTitle}
                    onChange={(e) => setNewChatTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Initial Message *</label>
                  <textarea
                    rows={4}
                    className="form-textarea"
                    placeholder="Explain your inquiry or topic clearly..."
                    value={newChatInitialMessage}
                    onChange={(e) => setNewChatInitialMessage(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="messages-modal-footer">
                <button
                  type="button"
                  className="compliance-btn compliance-btn-outline"
                  onClick={() => setIsNewChatModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="compliance-btn compliance-btn-primary"
                >
                  Start Conversation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Report / Flag Message */}
      {flaggingMessage && (
        <div className="messages-modal-overlay">
          <div className="messages-modal">
            <div className="messages-modal-header">
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                <Flag size={18} color="#ef4444" /> Report Inappropriate Message
              </div>
              <button
                onClick={() => setFlaggingMessage(null)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFlagMessage}>
              <div className="messages-modal-body">
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.25)", padding: 12, borderRadius: 8, fontSize: "0.82rem", color: "#fca5a5" }}>
                  <strong>Report Policy:</strong> Flagged messages are immediately routed to institutional moderators for policy compliance review under campus conduct standards.
                </div>

                <div style={{ background: "rgba(0,0,0,0.3)", padding: 12, borderRadius: 8, fontStyle: "italic", fontSize: "0.82rem", color: "#cbd5e1" }}>
                  "{flaggingMessage.content}"
                </div>

                <div className="form-field">
                  <label className="form-label">Reason for Report *</label>
                  <select
                    className="form-select"
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    required
                  >
                    <option value="">Select violation reason...</option>
                    <option value="Academic Dishonesty / Sharing Assessment Answers">Academic Dishonesty / Sharing Assessment Answers</option>
                    <option value="Harassment or Unprofessional Communication">Harassment or Unprofessional Communication</option>
                    <option value="Inappropriate Content or Language">Inappropriate Content or Language</option>
                    <option value="Spam or Unsolicited Material">Spam or Unsolicited Material</option>
                    <option value="Other Policy Violation">Other Policy Violation</option>
                  </select>
                </div>
              </div>

              <div className="messages-modal-footer">
                <button
                  type="button"
                  className="compliance-btn compliance-btn-outline"
                  onClick={() => setFlaggingMessage(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="compliance-btn compliance-btn-danger"
                >
                  Confirm & Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
