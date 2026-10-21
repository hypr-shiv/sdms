"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { type Role } from "@/lib/mockData";
import { apiUrl } from "@/lib/api";
import {
  MessageSquare, Send, Paperclip, Search, Plus, ShieldAlert,
  CornerUpLeft, Flag, Check, CheckCheck, FileText, Download,
  User, Shield, Eye, Trash2, X, RefreshCw, AlertTriangle, CheckCircle2,
  BookOpen, Clock, Phone, Video, Info, Smile, Sparkles, ChevronRight,
  MoreVertical, Calendar, Mail, GraduationCap, Mic, ArrowLeft, ThumbsUp, Heart, Lightbulb, PartyPopper
} from "lucide-react";
import "../dashboard.css";
import "./messages.css";

// ─── Interfaces ───
export interface Conversation {
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
  avatarColor?: string;
  isOnline?: boolean;
  department?: string;
  officeHours?: string;
}

export interface Message {
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
  createdAt: string;
  reactions?: Record<string, number>;
}

// ─── Starter Academic Conversations (Fallback when backend empty) ───
const SAMPLE_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-sarah-mitchell",
    title: "Project 2 Neural Benchmark & Rubric",
    studentId: "usr-current-student",
    studentName: "Alex Rivera",
    studentEmail: "student@scholarpulse.edu",
    teacherId: "fac-sarah-mitchell",
    teacherName: "Dr. Sarah Mitchell",
    teacherEmail: "teacher@scholarpulse.edu",
    courseId: "crs-cs301",
    courseCode: "CS301",
    courseName: "Machine Learning & Neural Architectures",
    status: "ACTIVE",
    lastMessagePreview: "Great work! The revised convergence plot looks solid. See you in office hours tomorrow.",
    lastMessageAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    lastSenderId: "fac-sarah-mitchell",
    unreadCountStudent: 1,
    unreadCountTeacher: 0,
    hasFlaggedMessages: false,
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    avatarColor: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
    isOnline: true,
    department: "Computer Science & AI",
    officeHours: "Tuesdays & Thursdays, 2:00 PM – 4:30 PM (Turing Hall 402)",
  },
  {
    id: "conv-alan-chen",
    title: "Graph DP & Midterm 2 Review",
    studentId: "usr-current-student",
    studentName: "Alex Rivera",
    studentEmail: "student@scholarpulse.edu",
    teacherId: "fac-alan-chen",
    teacherName: "Prof. Alan Chen",
    teacherEmail: "alan.chen@scholarpulse.edu",
    courseId: "crs-cs402",
    courseCode: "CS402",
    courseName: "Advanced Algorithms & Optimization",
    status: "ACTIVE",
    lastMessagePreview: "Yes, Bellman-Ford can handle negative weights provided there are no negative cycles.",
    lastMessageAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    lastSenderId: "fac-alan-chen",
    unreadCountStudent: 0,
    unreadCountTeacher: 0,
    hasFlaggedMessages: false,
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    avatarColor: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
    isOnline: false,
    department: "Theoretical Computer Science",
    officeHours: "Wednesdays 10:00 AM – 12:30 PM (Online Zoom)",
  },
  {
    id: "conv-cs301-study-group",
    title: "CS301 Algorithm Pod & Hackathon Prep",
    studentId: "usr-current-student",
    studentName: "Alex Rivera",
    studentEmail: "student@scholarpulse.edu",
    teacherId: "grp-peer-pod",
    teacherName: "Emily Watson & Dev Patel",
    teacherEmail: "study-pod@scholarpulse.edu",
    courseId: "crs-cs301",
    courseCode: "CS301",
    courseName: "Machine Learning & Neural Architectures",
    status: "ACTIVE",
    lastMessagePreview: "We booked the study room in the main campus library for 6:00 PM tonight!",
    lastMessageAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    lastSenderId: "grp-peer-pod",
    unreadCountStudent: 0,
    unreadCountTeacher: 0,
    hasFlaggedMessages: false,
    createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    avatarColor: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    isOnline: true,
    department: "Undergraduate Study Group",
    officeHours: "Daily Peer Sessions • Turing Library 3B",
  },
  {
    id: "conv-advising-office",
    title: "Spring 2027 Electives & Capstone Approval",
    studentId: "usr-current-student",
    studentName: "Alex Rivera",
    studentEmail: "student@scholarpulse.edu",
    teacherId: "adm-academic-advising",
    teacherName: "Office of Academic Advising",
    teacherEmail: "advising@scholarpulse.edu",
    courseId: undefined,
    courseCode: "ACAD-01",
    courseName: "Institutional Degree Audit",
    status: "ACTIVE",
    lastMessagePreview: "Your degree audit check has passed. You are approved to register for CS490 Capstone.",
    lastMessageAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    lastSenderId: "adm-academic-advising",
    unreadCountStudent: 0,
    unreadCountTeacher: 0,
    hasFlaggedMessages: false,
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    avatarColor: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
    isOnline: true,
    department: "Registrar & Academic Affairs",
    officeHours: "Monday – Friday, 9:00 AM – 5:00 PM",
  },
];

const SAMPLE_MESSAGES_MAP: Record<string, Message[]> = {
  "conv-sarah-mitchell": [
    {
      id: "msg-sm-1",
      conversationId: "conv-sarah-mitchell",
      senderId: "usr-current-student",
      senderName: "Alex Rivera",
      senderRole: "student",
      content: "Hello Dr. Mitchell! For our Project 2 neural network pipeline, we tested both AdamW and SGD with cosine annealing. Could you review our convergence curve?",
      isRead: true,
      moderationStatus: "CLEAN",
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      reactions: { "👍": 1 },
    },
    {
      id: "msg-sm-2",
      conversationId: "conv-sarah-mitchell",
      senderId: "fac-sarah-mitchell",
      senderName: "Dr. Sarah Mitchell",
      senderRole: "teacher",
      content: "Hi Alex! That's excellent initiative. AdamW should give you tighter training loss on the Transformer encoder. Make sure you also measure validation perplexity over 10 epochs.",
      parentMessageSnippet: "For our Project 2 neural network pipeline, we tested both AdamW and SGD...",
      parentMessageSenderName: "Alex Rivera",
      attachmentName: "CS301_Benchmark_Rubric_v2.pdf",
      attachmentUrl: "/uploads/CS301_Benchmark_Rubric_v2.pdf",
      attachmentType: "application/pdf",
      attachmentSize: 184000,
      isRead: true,
      moderationStatus: "CLEAN",
      createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      reactions: { "💡": 2, "❤️": 1 },
    },
    {
      id: "msg-sm-3",
      conversationId: "conv-sarah-mitchell",
      senderId: "usr-current-student",
      senderName: "Alex Rivera",
      senderRole: "student",
      content: "Thank you Dr. Mitchell! We just added the validation perplexity benchmarks into the appendix.",
      isRead: true,
      moderationStatus: "CLEAN",
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
    {
      id: "msg-sm-4",
      conversationId: "conv-sarah-mitchell",
      senderId: "fac-sarah-mitchell",
      senderName: "Dr. Sarah Mitchell",
      senderRole: "teacher",
      content: "Great work! The revised convergence plot looks solid. See you in office hours tomorrow.",
      isRead: false,
      moderationStatus: "CLEAN",
      createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      reactions: { "👏": 2 },
    },
  ],
  "conv-alan-chen": [
    {
      id: "msg-ac-1",
      conversationId: "conv-alan-chen",
      senderId: "usr-current-student",
      senderName: "Alex Rivera",
      senderRole: "student",
      content: "Professor Chen, in Problem 3 from Assignment 4, does Dijkstra's algorithm work if there are zero-weight edges, or must all weights be strictly positive?",
      isRead: true,
      moderationStatus: "CLEAN",
      createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    },
    {
      id: "msg-ac-2",
      conversationId: "conv-alan-chen",
      senderId: "fac-alan-chen",
      senderName: "Prof. Alan Chen",
      senderRole: "teacher",
      content: "Dijkstra handles non-negative weights (including 0) correctly. The non-decreasing invariant of settled vertices still holds. However, if any edge is negative, you must use Bellman-Ford or Johnson's algorithm.",
      isRead: true,
      moderationStatus: "CLEAN",
      createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      reactions: { "💡": 3 },
    },
    {
      id: "msg-ac-3",
      conversationId: "conv-alan-chen",
      senderId: "fac-alan-chen",
      senderName: "Prof. Alan Chen",
      senderRole: "teacher",
      content: "Yes, Bellman-Ford can handle negative weights provided there are no negative cycles.",
      isRead: true,
      moderationStatus: "CLEAN",
      createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    },
  ],
  "conv-cs301-study-group": [
    {
      id: "msg-sg-1",
      conversationId: "conv-cs301-study-group",
      senderId: "grp-peer-pod",
      senderName: "Emily Watson",
      senderRole: "student",
      content: "Hey everyone! Did anyone finish implementing the GPU tensor allocation for Milestone 3?",
      isRead: true,
      moderationStatus: "CLEAN",
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    },
    {
      id: "msg-sg-2",
      conversationId: "conv-cs301-study-group",
      senderId: "usr-current-student",
      senderName: "Alex Rivera",
      senderRole: "student",
      content: "Yes! Using pinned host memory (`cudaHostAlloc`) gave us a 2.4x speedup during data transfer. Let's merge the branch tonight.",
      isRead: true,
      moderationStatus: "CLEAN",
      createdAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
      reactions: { "🔥": 3, "🚀": 2 },
    },
    {
      id: "msg-sg-3",
      conversationId: "conv-cs301-study-group",
      senderId: "grp-peer-pod",
      senderName: "Dev Patel",
      senderRole: "student",
      content: "We booked the study room in the main campus library for 6:00 PM tonight!",
      isRead: true,
      moderationStatus: "CLEAN",
      createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      reactions: { "👍": 2 },
    },
  ],
  "conv-advising-office": [
    {
      id: "msg-adv-1",
      conversationId: "conv-advising-office",
      senderId: "adm-academic-advising",
      senderName: "Academic Advising Office",
      senderRole: "admin",
      content: "Good morning Alex. We conducted your senior year degree audit review. You currently need 6 more upper-division elective credits.",
      isRead: true,
      moderationStatus: "CLEAN",
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: "msg-adv-2",
      conversationId: "conv-advising-office",
      senderId: "usr-current-student",
      senderName: "Alex Rivera",
      senderRole: "student",
      content: "Thank you! I plan to take CS480 Distributed Systems and CS490 Senior Capstone.",
      isRead: true,
      moderationStatus: "CLEAN",
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000 - 3600000).toISOString(),
    },
    {
      id: "msg-adv-3",
      conversationId: "conv-advising-office",
      senderId: "adm-academic-advising",
      senderName: "Academic Advising Office",
      senderRole: "admin",
      content: "Your degree audit check has passed. You are approved to register for CS490 Capstone.",
      isRead: true,
      moderationStatus: "CLEAN",
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      reactions: { "🎉": 1 },
    },
  ],
};

const QUICK_REPLIES = [
  "Can we meet during office hours?",
  "I've uploaded the revised draft.",
  "Could you clarify problem #3?",
  "Thank you for the detailed feedback!",
  "Understood, I will apply these changes.",
];

const POPULAR_EMOJIS = ["👍", "❤️", "💡", "👏", "🔥", "🚀", "🎓", "📚", "😊", "🎉", "❓", "✅", "☕", "📝", "💻", "✨"];

export default function MessagesPage() {
  const [user, setUser] = useState<{ id?: string; role: Role; name?: string; email?: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Data states
  const [conversations, setConversations] = useState<Conversation[]>(SAMPLE_CONVERSATIONS);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(SAMPLE_CONVERSATIONS[0]);
  const [messages, setMessages] = useState<Message[]>(SAMPLE_MESSAGES_MAP["conv-sarah-mitchell"] || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarTab, setSidebarTab] = useState<"all" | "faculty" | "peers" | "unread">("all");
  const [filterSearchChat, setFilterSearchChat] = useState("");
  const [showSearchInChat, setShowSearchInChat] = useState(false);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);

  // Composer
  const [composerText, setComposerText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [attachment, setAttachment] = useState<{ url: string; name: string; type: string; size: number } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTypingSimulated, setIsTypingSimulated] = useState(false);

  // Modals
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newRecipientName, setNewRecipientName] = useState("");
  const [newRecipientRole, setNewRecipientRole] = useState<"faculty" | "student">("faculty");
  const [newTopic, setNewTopic] = useState("");
  const [newInitialMsg, setNewInitialMsg] = useState("");

  const [callModal, setCallModal] = useState<{ type: "audio" | "video"; active: boolean; isMuted: boolean } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Initial Load & Auth
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("accessToken");
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setUser(u);
      } catch {}
    }
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // Fetch conversations from backend if available, fallback to rich sample
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(apiUrl("/messages/conversations"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setConversations(data);
          setActiveConversation(data[0]);
        }
      }
    } catch {
      // Backend not running / offline on Vercel: SAMPLE_CONVERSATIONS already pre-seeded
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchConversations();
  }, [token, fetchConversations]);

  // Load messages whenever activeConversation changes
  const loadMessages = useCallback(async (conv: Conversation) => {
    if (SAMPLE_MESSAGES_MAP[conv.id]) {
      setMessages(SAMPLE_MESSAGES_MAP[conv.id]);
      return;
    }
    if (!token) return;
    try {
      const res = await fetch(apiUrl(`/messages/conversations/${conv.id}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.messages && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      }
    } catch {
      // Fallback
      setMessages(SAMPLE_MESSAGES_MAP[conv.id] || []);
    }
  }, [token]);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation);
    }
  }, [activeConversation, loadMessages]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTypingSimulated]);

  // Handler: Send Message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText !== undefined ? customText : composerText;
    if (!activeConversation) return;
    if (!textToSend.trim() && !attachment) return;

    const currentUserId = user?.id || "usr-current-student";
    const currentUserName = user?.name || "Alex Rivera";
    const currentUserRole = user?.role || "student";

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: activeConversation.id,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: currentUserRole,
      content: textToSend.trim(),
      parentMessageSnippet: replyingTo ? replyingTo.content.slice(0, 70) : undefined,
      parentMessageSenderName: replyingTo ? replyingTo.senderName : undefined,
      attachmentName: attachment?.name,
      attachmentUrl: attachment?.url,
      attachmentType: attachment?.type,
      attachmentSize: attachment?.size,
      isRead: false,
      moderationStatus: "CLEAN",
      createdAt: new Date().toISOString(),
      reactions: {},
    };

    // Update state immediately for instant responsive UX
    setMessages((prev) => [...prev, newMessage]);
    setComposerText("");
    setReplyingTo(null);
    setAttachment(null);
    setShowEmojiPicker(false);

    // Update conversation card preview in sidebar
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              lastMessagePreview: newMessage.content.slice(0, 80),
              lastMessageAt: new Date().toISOString(),
              lastSenderId: currentUserId,
            }
          : c
      )
    );

    // Sync to backend asynchronously if active
    if (token) {
      fetch(apiUrl(`/messages/conversations/${activeConversation.id}/messages`), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          content: newMessage.content,
          parentMessageId: replyingTo?.id,
          attachmentUrl: attachment?.url,
          attachmentName: attachment?.name,
          attachmentType: attachment?.type,
          attachmentSize: attachment?.size,
        }),
      }).catch(() => {});
    }

    // Trigger interactive realistic academic auto-reply simulation after 1.5 seconds
    const isTalkingToFaculty = activeConversation.teacherName.includes("Dr.") || activeConversation.teacherName.includes("Prof.");
    if (isTalkingToFaculty) {
      setTimeout(() => {
        setIsTypingSimulated(true);
      }, 700);

      setTimeout(() => {
        setIsTypingSimulated(false);
        const autoResponses = [
          `Thanks for sending this update, ${currentUserName.split(" ")[0]}! I've noted this in your milestone progress. Let's discuss further during office hours.`,
          `Understood! That's a great observation regarding the rubric. Feel free to proceed with this methodology.`,
          `Received. I've reviewed your latest attachment and it adheres directly to our academic standards. Well done!`,
          `Good question. I will also mention this during tomorrow's lecture session for everyone's benefit.`,
        ];
        const randomResp = autoResponses[Math.floor(Math.random() * autoResponses.length)];
        const replyMsg: Message = {
          id: `reply-${Date.now()}`,
          conversationId: activeConversation.id,
          senderId: activeConversation.teacherId,
          senderName: activeConversation.teacherName,
          senderRole: "teacher",
          content: randomResp,
          isRead: true,
          moderationStatus: "CLEAN",
          createdAt: new Date().toISOString(),
          reactions: { "👍": 1 },
        };
        setMessages((prev) => [...prev, replyMsg]);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversation.id
              ? {
                  ...c,
                  lastMessagePreview: replyMsg.content.slice(0, 80),
                  lastMessageAt: new Date().toISOString(),
                  lastSenderId: activeConversation.teacherId,
                }
              : c
          )
        );
      }, 2200);
    }
  };

  // Handler: Add Emoji Reaction
  const handleToggleReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const currentReactions = { ...(m.reactions || {}) };
        currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
        return { ...m, reactions: currentReactions };
      })
    );
  };

  // Handler: Attach File Simulation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachment({
      url: `/uploads/${file.name}`,
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
    });
    showToast(`Attached file: ${file.name}`, "success");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handler: Create New Conversation
  const handleCreateNewConversation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipientName.trim() || !newTopic.trim() || !newInitialMsg.trim()) {
      showToast("Please fill in recipient name, topic, and initial message.", "error");
      return;
    }

    const newConvId = `conv-user-${Date.now()}`;
    const newConv: Conversation = {
      id: newConvId,
      title: newTopic.trim(),
      studentId: user?.id || "usr-current-student",
      studentName: user?.name || "Alex Rivera",
      studentEmail: user?.email || "student@scholarpulse.edu",
      teacherId: `usr-recipient-${Date.now()}`,
      teacherName: newRecipientName.trim(),
      teacherEmail: `${newRecipientName.toLowerCase().replace(/\s+/g, ".")}@scholarpulse.edu`,
      courseCode: newRecipientRole === "faculty" ? "CS-ADVISING" : "STUDY-POD",
      courseName: newRecipientRole === "faculty" ? "Faculty Academic Consultation" : "Peer Academic Discussion",
      status: "ACTIVE",
      lastMessagePreview: newInitialMsg.trim(),
      lastMessageAt: new Date().toISOString(),
      unreadCountStudent: 0,
      unreadCountTeacher: 0,
      hasFlaggedMessages: false,
      createdAt: new Date().toISOString(),
      avatarColor: newRecipientRole === "faculty" ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
      isOnline: true,
      department: newRecipientRole === "faculty" ? "Faculty Department" : "Student Collaboration",
      officeHours: "Office Hours: Mon–Thu 3:00 PM – 5:00 PM",
    };

    const initialMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: newConvId,
      senderId: user?.id || "usr-current-student",
      senderName: user?.name || "Alex Rivera",
      senderRole: user?.role || "student",
      content: newInitialMsg.trim(),
      isRead: true,
      moderationStatus: "CLEAN",
      createdAt: new Date().toISOString(),
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversation(newConv);
    setMessages([initialMessage]);
    setIsNewChatModalOpen(false);
    setNewRecipientName("");
    setNewTopic("");
    setNewInitialMsg("");
    showToast(`Conversation with ${newConv.teacherName} started!`, "success");
  };

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const matchSearch =
        c.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.courseCode && c.courseCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.lastMessagePreview && c.lastMessagePreview.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      if (sidebarTab === "unread") return c.unreadCountStudent > 0;
      if (sidebarTab === "faculty") return c.teacherName.includes("Dr.") || c.teacherName.includes("Prof.");
      if (sidebarTab === "peers") return !c.teacherName.includes("Dr.") && !c.teacherName.includes("Prof.");
      return true;
    });
  }, [conversations, searchQuery, sidebarTab]);

  // Filtered messages inside active thread if searching in chat
  const displayedMessages = useMemo(() => {
    if (!filterSearchChat.trim()) return messages;
    return messages.filter((m) => m.content.toLowerCase().includes(filterSearchChat.toLowerCase()));
  }, [messages, filterSearchChat]);

  const activeContactName = activeConversation
    ? user?.role === "teacher"
      ? activeConversation.studentName
      : activeConversation.teacherName
    : "";

  return (
    <div className={`messages-app-container ${activeConversation ? "chat-open" : ""}`}>
      {/* Toast Alert */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: 12,
            background: toast.type === "success" ? "#065f46" : toast.type === "error" ? "#7f1d1d" : "#1e1b4b",
            color: "#fff",
            border: `1px solid ${toast.type === "success" ? "#10b981" : toast.type === "error" ? "#ef4444" : "#6366f1"}`,
            boxShadow: "0 14px 30px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          {toast.type === "success" && <CheckCircle2 size={16} />}
          {toast.type === "error" && <AlertTriangle size={16} />}
          {toast.type === "info" && <Sparkles size={16} />}
          {toast.message}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* ═════════════════════════════════════════════════════════════════
          LEFT SIDEBAR: Conversations List
          ═════════════════════════════════════════════════════════════════ */}
      <aside className="messages-sidebar">
        <div className="messages-sidebar-header">
          <div className="messages-sidebar-title">
            <MessageSquare size={22} color="#818cf8" />
            <span>Messages</span>
            <span className="title-badge">{conversations.length} Active</span>
          </div>

          <button
            className="new-chat-btn"
            onClick={() => setIsNewChatModalOpen(true)}
            title="Start new direct conversation"
          >
            <Plus size={15} /> New Chat
          </button>
        </div>

        {/* Search Bar */}
        <div className="messages-search-wrap">
          <Search size={15} className="messages-search-icon" />
          <input
            type="text"
            className="messages-search-input"
            placeholder="Search messages, professors, or courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="messages-search-clear" onClick={() => setSearchQuery("")}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="messages-filter-tabs">
          <button
            className={`messages-tab-btn ${sidebarTab === "all" ? "active" : ""}`}
            onClick={() => setSidebarTab("all")}
          >
            All Threads ({conversations.length})
          </button>
          <button
            className={`messages-tab-btn ${sidebarTab === "faculty" ? "active" : ""}`}
            onClick={() => setSidebarTab("faculty")}
          >
            🎓 Faculty
          </button>
          <button
            className={`messages-tab-btn ${sidebarTab === "peers" ? "active" : ""}`}
            onClick={() => setSidebarTab("peers")}
          >
            👥 Peers & Pods
          </button>
          <button
            className={`messages-tab-btn ${sidebarTab === "unread" ? "active" : ""}`}
            onClick={() => setSidebarTab("unread")}
          >
            Unread
            {conversations.some((c) => c.unreadCountStudent > 0) && (
              <span className="unread-count-badge">1</span>
            )}
          </button>
        </div>

        {/* Conversation Stream */}
        <div className="messages-list-scroll">
          {filteredConversations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-tertiary, #94a3b8)" }}>
              <MessageSquare size={36} color="#6366f1" style={{ opacity: 0.4, margin: "0 auto 12px" }} />
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary, #fff)", marginBottom: 4 }}>
                No messages found
              </div>
              <div style={{ fontSize: "0.8rem", lineHeight: 1.5, marginBottom: 14 }}>
                No conversations match your search filter.
              </div>
              <button
                className="new-chat-btn"
                style={{ margin: "0 auto" }}
                onClick={() => setIsNewChatModalOpen(true)}
              >
                <Plus size={14} /> Start New Message
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = activeConversation?.id === conv.id;
              const contactName = user?.role === "teacher" ? conv.studentName : conv.teacherName;
              const initials = contactName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              const isFaculty = contactName.includes("Dr.") || contactName.includes("Prof.");

              return (
                <div
                  key={conv.id}
                  className={`conversation-card ${isSelected ? "active" : ""}`}
                  onClick={() => {
                    setActiveConversation(conv);
                    // Mark read
                    setConversations((prev) =>
                      prev.map((c) => (c.id === conv.id ? { ...c, unreadCountStudent: 0 } : c))
                    );
                  }}
                >
                  <div className="conversation-avatar-wrap">
                    <div
                      className="user-avatar-circle"
                      style={{ background: conv.avatarColor || "linear-gradient(135deg, #6366f1, #4338ca)" }}
                    >
                      {initials}
                    </div>
                    <span
                      className={`status-indicator-dot ${conv.isOnline ? "online" : "offline"}`}
                      title={conv.isOnline ? "Active now" : "Offline"}
                    />
                  </div>

                  <div className="conversation-card-body">
                    <div className="conversation-header-row">
                      <span className="conversation-contact-name">{contactName}</span>
                      <span className="conversation-timestamp">
                        {conv.lastMessageAt
                          ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : ""}
                      </span>
                    </div>

                    <div className="conversation-topic-title">
                      <BookOpen size={11} color="#818cf8" />
                      <span>{conv.title}</span>
                    </div>

                    <div className="conversation-preview-text">
                      {conv.lastMessagePreview || "No messages in thread yet"}
                    </div>

                    <div className="conversation-tags-row">
                      <span className={`role-pill ${isFaculty ? "faculty" : "student"}`}>
                        {isFaculty ? "Faculty" : "Peer"}
                      </span>
                      {conv.courseCode && (
                        <span className="course-tag">
                          {conv.courseCode}
                        </span>
                      )}
                      {conv.unreadCountStudent > 0 && (
                        <span className="unread-badge-pill">NEW</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ═════════════════════════════════════════════════════════════════
          MAIN CHAT PANE
          ═════════════════════════════════════════════════════════════════ */}
      <main className="messages-main-pane">
        {activeConversation ? (
          <>
            {/* Top Chat Header */}
            <div className="chat-main-header">
              <div className="chat-header-profile">
                <button
                  className="header-action-btn header-action-icon-only"
                  style={{ display: "none" }}
                  onClick={() => setActiveConversation(null)}
                  title="Back to conversations"
                >
                  <ArrowLeft size={16} />
                </button>

                <div className="conversation-avatar-wrap">
                  <div
                    className="user-avatar-circle"
                    style={{
                      width: 44,
                      height: 44,
                      background: activeConversation.avatarColor || "linear-gradient(135deg, #6366f1, #4338ca)",
                    }}
                  >
                    {activeContactName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <span
                    className={`status-indicator-dot ${activeConversation.isOnline ? "online" : "offline"}`}
                  />
                </div>

                <div>
                  <div className="chat-header-title">
                    <span>{activeContactName}</span>
                    <span className="role-pill faculty" style={{ fontSize: "0.68rem" }}>
                      {activeContactName.includes("Dr.") || activeContactName.includes("Prof.") ? "Instructor" : "Peer"}
                    </span>
                  </div>
                  <div className="chat-header-subtitle">
                    <span style={{ color: activeConversation.isOnline ? "#10b981" : "var(--text-tertiary)" }}>
                      {activeConversation.isOnline ? "🟢 Active now" : "⚪ Offline"}
                    </span>
                    <span>•</span>
                    <span style={{ color: "#818cf8", fontWeight: 600 }}>{activeConversation.title}</span>
                    {activeConversation.courseCode && (
                      <>
                        <span>•</span>
                        <span>{activeConversation.courseCode}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Header Action Controls */}
              <div className="chat-header-actions">
                <button
                  className="header-action-btn"
                  onClick={() => setCallModal({ type: "audio", active: true, isMuted: false })}
                  title="Quick Audio Consultation"
                >
                  <Phone size={14} color="#10b981" />
                  <span>Call</span>
                </button>

                <button
                  className="header-action-btn"
                  onClick={() => setCallModal({ type: "video", active: true, isMuted: false })}
                  title="Virtual Office Hours Video Meeting"
                >
                  <Video size={14} color="#818cf8" />
                  <span>Office Hours</span>
                </button>

                <button
                  className="header-action-btn header-action-icon-only"
                  onClick={() => setShowSearchInChat(!showSearchInChat)}
                  title="Search inside this conversation"
                >
                  <Search size={15} />
                </button>

                <button
                  className={`header-action-btn header-action-icon-only ${showInfoDrawer ? "active" : ""}`}
                  onClick={() => setShowInfoDrawer(!showInfoDrawer)}
                  title="Thread details & participant syllabus"
                >
                  <Info size={16} />
                </button>
              </div>
            </div>

            {/* In-Chat Search Bar Toggle */}
            {showSearchInChat && (
              <div
                style={{
                  padding: "10px 24px",
                  background: "rgba(15, 23, 42, 0.9)",
                  borderBottom: "1px solid var(--border-glass, rgba(255, 255, 255, 0.08))",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Search size={14} color="#818cf8" />
                <input
                  type="text"
                  placeholder="Filter messages in this conversation..."
                  value={filterSearchChat}
                  onChange={(e) => setFilterSearchChat(e.target.value)}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    color: "#fff",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                  autoFocus
                />
                {filterSearchChat && (
                  <button
                    onClick={() => setFilterSearchChat("")}
                    style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="chat-messages-stream">
              {/* Date Header */}
              <div className="chat-date-separator">
                <span className="chat-date-badge">Today • Academic Consultation</span>
              </div>

              {displayedMessages.map((msg) => {
                const isOutgoing = msg.senderId === (user?.id || "usr-current-student");

                return (
                  <div
                    key={msg.id}
                    className={`chat-message-row ${isOutgoing ? "outgoing" : "incoming"}`}
                  >
                    {/* Hover Reaction & Quote Quick Bar */}
                    <div className="chat-hover-bar">
                      <button
                        className="hover-bar-btn"
                        onClick={() => handleToggleReaction(msg.id, "👍")}
                        title="Thumbs Up"
                      >
                        👍
                      </button>
                      <button
                        className="hover-bar-btn"
                        onClick={() => handleToggleReaction(msg.id, "💡")}
                        title="Insightful"
                      >
                        💡
                      </button>
                      <button
                        className="hover-bar-btn"
                        onClick={() => handleToggleReaction(msg.id, "❤️")}
                        title="Love"
                      >
                        ❤️
                      </button>
                      <button
                        className="hover-bar-btn"
                        onClick={() => setReplyingTo(msg)}
                        title="Quote & Reply"
                      >
                        <CornerUpLeft size={13} />
                      </button>
                    </div>

                    <div className="chat-bubble-card">
                      {/* Incoming Sender Name */}
                      {!isOutgoing && (
                        <div className="bubble-sender-title">
                          <span>{msg.senderName}</span>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-tertiary)", fontWeight: 500 }}>
                            {msg.senderRole === "teacher" ? "Faculty" : "Student"}
                          </span>
                        </div>
                      )}

                      <div className="chat-bubble">
                        {/* Parent Quote */}
                        {msg.parentMessageSnippet && (
                          <div className="chat-quote-banner">
                            <div className="chat-quote-sender">
                              Replying to {msg.parentMessageSenderName || "Message"}
                            </div>
                            <div>"{msg.parentMessageSnippet}"</div>
                          </div>
                        )}

                        {/* Text Content */}
                        <div>{msg.content}</div>

                        {/* Attachment Card */}
                        {msg.attachmentName && (
                          <a
                            href={msg.attachmentUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="chat-attachment-box"
                            onClick={(e) => {
                              if (!msg.attachmentUrl || msg.attachmentUrl === "#") {
                                e.preventDefault();
                                showToast(`Opening document: ${msg.attachmentName}`, "info");
                              }
                            }}
                          >
                            <div className="attachment-icon-pill">
                              <FileText size={18} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {msg.attachmentName}
                              </div>
                              <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                                {msg.attachmentSize ? `${Math.round(msg.attachmentSize / 1024)} KB` : "Institutional Document"} • Verified PDF
                              </div>
                            </div>
                            <Download size={14} color="#818cf8" />
                          </a>
                        )}
                      </div>

                      {/* Meta bar: Time & Read receipt */}
                      <div className="chat-meta-bar">
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {isOutgoing && (
                          <span title={msg.isRead ? "Read by recipient" : "Sent"}>
                            {msg.isRead ? <CheckCheck size={13} color="#10b981" /> : <Check size={13} color="#94a3b8" />}
                          </span>
                        )}
                      </div>

                      {/* Emoji Reactions row */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="chat-reactions-row">
                          {Object.entries(msg.reactions).map(([emoji, count]) => (
                            <button
                              key={emoji}
                              className="reaction-pill reacted"
                              onClick={() => handleToggleReaction(msg.id, emoji)}
                              title={`Reacted with ${emoji}`}
                            >
                              <span>{emoji}</span>
                              <span style={{ fontWeight: 700 }}>{count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Simulated Typing Indicator */}
              {isTypingSimulated && (
                <div className="typing-indicator-wrap">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <span>{activeContactName} is typing...</span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* ─── Chat Composer Section ─── */}
            <div className="chat-composer-box">
              {/* Quick Academic Suggestion Chips */}
              <div className="quick-replies-stream">
                <span style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", alignSelf: "center", fontWeight: 600 }}>
                  Quick:
                </span>
                {QUICK_REPLIES.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="quick-reply-chip"
                    onClick={() => handleSendMessage(q)}
                  >
                    💬 {q}
                  </button>
                ))}
              </div>

              {/* Replying-to Preview */}
              {replyingTo && (
                <div className="reply-quote-preview">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CornerUpLeft size={14} color="#818cf8" />
                    <span>
                      Replying to <strong>{replyingTo.senderName}</strong>: "{replyingTo.content.slice(0, 55)}..."
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

              {/* Pending File Attachment Chip */}
              {attachment && (
                <div className="composer-attachment-preview">
                  <FileText size={15} color="#818cf8" />
                  <span>{attachment.name} ({Math.round(attachment.size / 1024)} KB)</span>
                  <button
                    onClick={() => setAttachment(null)}
                    style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              {/* Input Row Card */}
              <div className="composer-pill-card">
                <textarea
                  className="composer-textarea-field"
                  rows={1}
                  placeholder={`Write your message to ${activeContactName}... (Enter to send, Shift+Enter for newline)`}
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />

                <div className="composer-actions-group">
                  <button
                    type="button"
                    className="composer-tool-btn"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach assignment, code, or PDF"
                  >
                    <Paperclip size={18} />
                  </button>

                  <button
                    type="button"
                    className="composer-tool-btn"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    title="Insert emoji"
                  >
                    <Smile size={18} />
                  </button>

                  <button
                    type="button"
                    className="composer-send-button"
                    disabled={!composerText.trim() && !attachment}
                    onClick={() => handleSendMessage()}
                    title="Send Message (Enter)"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>

              {/* Emoji Drawer Popover */}
              {showEmojiPicker && (
                <div className="emoji-popover-box">
                  {POPULAR_EMOJIS.map((em, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="emoji-choice-btn"
                      onClick={() => {
                        setComposerText((prev) => prev + em);
                        setShowEmojiPicker(false);
                      }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}

              <div className="composer-footer-hint">
                <span>🔒 Institutional Messaging • FERPA Compliant & Encrypted</span>
                <span>Press <strong>Enter ↵</strong> to send • <strong>Shift + Enter</strong> for new line</span>
              </div>
            </div>
          </>
        ) : (
          /* Empty Chat Area Placeholder */
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: 32, color: "var(--text-tertiary)" }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: "rgba(99, 102, 241, 0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageSquare size={40} color="#818cf8" />
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary, #fff)" }}>
              ScholarPulse Direct Communications
            </div>
            <div style={{ fontSize: "0.88rem", maxWidth: 440, textAlign: "center", lineHeight: 1.6 }}>
              Select a faculty advisor or peer study thread on the left to review office hour notes, assignment feedback, and collaboration history.
            </div>
            <button
              className="new-chat-btn"
              onClick={() => setIsNewChatModalOpen(true)}
            >
              <Plus size={16} /> Start a Conversation
            </button>
          </div>
        )}
      </main>

      {/* ═════════════════════════════════════════════════════════════════
          RIGHT DRAWER: Thread / Participant Information
          ═════════════════════════════════════════════════════════════════ */}
      {showInfoDrawer && activeConversation && (
        <aside className="thread-info-drawer">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary, #fff)" }}>
              Contact Details
            </span>
            <button
              onClick={() => setShowInfoDrawer(false)}
              style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
            >
              <X size={16} />
            </button>
          </div>

          <div className="drawer-profile-card">
            <div
              className="drawer-avatar-lg"
              style={{ background: activeConversation.avatarColor || "linear-gradient(135deg, #6366f1, #4338ca)" }}
            >
              {activeContactName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="drawer-profile-name">{activeContactName}</div>
            <div className="drawer-profile-email">{activeConversation.teacherEmail}</div>
            <span className="role-pill faculty">
              {activeContactName.includes("Dr.") || activeContactName.includes("Prof.") ? "Academic Faculty" : "Peer Student"}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="drawer-section-title">
              <Calendar size={13} color="#818cf8" /> Office Hours Schedule
            </div>
            <div className="drawer-info-tile">
              <span style={{ color: "var(--text-primary, #fff)", fontWeight: 600 }}>
                {activeConversation.officeHours || "By Appointment (Online Video)"}
              </span>
              <span style={{ color: "var(--text-secondary, #94a3b8)", fontSize: "0.74rem" }}>
                Click "Office Hours" at the top to initiate an instant virtual meeting session.
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="drawer-section-title">
              <GraduationCap size={13} color="#818cf8" /> Course Context
            </div>
            <div className="drawer-info-tile">
              <span style={{ color: "#818cf8", fontWeight: 700 }}>
                {activeConversation.courseCode || "General Academic"}
              </span>
              <span style={{ color: "var(--text-primary, #fff)" }}>
                {activeConversation.courseName || "Academic Advising Track"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="drawer-section-title">
              <Shield size={13} color="#10b981" /> Institutional Standards
            </div>
            <div className="drawer-info-tile" style={{ borderLeft: "3px solid #10b981" }}>
              <span style={{ color: "#10b981", fontWeight: 600 }}>FERPA Protected</span>
              <span style={{ color: "var(--text-secondary, #94a3b8)", fontSize: "0.72rem" }}>
                All correspondence complies with campus integrity policies and institutional records retention guidelines.
              </span>
            </div>
          </div>
        </aside>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          MODAL: Start New Conversation
          ═════════════════════════════════════════════════════════════════ */}
      {isNewChatModalOpen && (
        <div className="call-modal-overlay">
          <div className="call-modal-card" style={{ maxWidth: 520, textAlign: "left", alignItems: "stretch" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 14 }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                <Plus size={18} color="#818cf8" /> New Direct Message
              </div>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewConversation} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#cbd5e1" }}>
                  Recipient Type
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className={`messages-tab-btn ${newRecipientRole === "faculty" ? "active" : ""}`}
                    onClick={() => setNewRecipientRole("faculty")}
                  >
                    🎓 Faculty / Professor
                  </button>
                  <button
                    type="button"
                    className={`messages-tab-btn ${newRecipientRole === "student" ? "active" : ""}`}
                    onClick={() => setNewRecipientRole("student")}
                  >
                    👥 Student Peer
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#cbd5e1" }}>
                  Recipient Name *
                </label>
                <input
                  type="text"
                  className="messages-search-input"
                  style={{ paddingLeft: 14 }}
                  placeholder="e.g. Dr. Robert Vance or Maya Patel"
                  value={newRecipientName}
                  onChange={(e) => setNewRecipientName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#cbd5e1" }}>
                  Subject / Discussion Topic *
                </label>
                <input
                  type="text"
                  className="messages-search-input"
                  style={{ paddingLeft: 14 }}
                  placeholder="e.g. Midterm 2 Grading Clarification"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#cbd5e1" }}>
                  Initial Message *
                </label>
                <textarea
                  className="composer-textarea-field"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    padding: 12,
                    minHeight: 80,
                  }}
                  placeholder="Type your introductory message..."
                  value={newInitialMsg}
                  onChange={(e) => setNewInitialMsg(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className="header-action-btn"
                  onClick={() => setIsNewChatModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="new-chat-btn"
                >
                  Start Conversation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          MODAL: Audio / Video Office Hours Call Simulation
          ═════════════════════════════════════════════════════════════════ */}
      {callModal?.active && activeConversation && (
        <div className="call-modal-overlay">
          <div className="call-modal-card">
            <div
              className="call-avatar-pulse"
              style={{ background: activeConversation.avatarColor || "linear-gradient(135deg, #6366f1, #4338ca)" }}
            >
              {activeContactName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff" }}>
              {activeContactName}
            </div>

            <div style={{ fontSize: "0.82rem", color: "#818cf8", fontWeight: 600 }}>
              {callModal.type === "video" ? "📹 Virtual Video Office Hours" : "📞 Secure Audio Consultation"}
            </div>

            <div style={{ fontSize: "0.78rem", color: "#10b981", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
              Encrypted Channel Connected • 00:24
            </div>

            <div className="call-controls-row">
              <button
                className="call-btn-circle mute"
                onClick={() => {
                  setCallModal((prev) => (prev ? { ...prev, isMuted: !prev.isMuted } : null));
                  showToast(callModal.isMuted ? "Microphone unmuted" : "Microphone muted", "info");
                }}
                title={callModal.isMuted ? "Unmute Mic" : "Mute Mic"}
              >
                <Mic size={20} color={callModal.isMuted ? "#ef4444" : "#fff"} />
              </button>

              <button
                className="call-btn-circle end-call"
                onClick={() => {
                  setCallModal(null);
                  showToast("Call ended", "info");
                }}
                title="End Consultation"
              >
                <Phone size={22} style={{ transform: "rotate(135deg)" }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
