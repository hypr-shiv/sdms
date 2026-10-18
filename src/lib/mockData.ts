// ─── Mock Data & TypeScript Interfaces ───
// Development-only. All interfaces will map 1:1 to Prisma models when the backend is ready.

// ─── Types ───
export type Role = "student" | "teacher" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  userId: string;
  role: Role;
  avatar?: string;
  department?: string;
}

export interface CourseSection {
  id: string;
  code: string;
  name: string;
  section: string;
  instructor: string;
  room: string;
  schedule: string; // e.g. "MWF 10:00-11:00"
  color: string;
}

export interface ScheduleEntry {
  id: string;
  courseCode: string;
  courseName: string;
  time: string;
  endTime: string;
  room: string;
  instructor: string;
  type: "lecture" | "lab" | "tutorial" | "exam";
  color: string;
}

export interface Assignment {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  dueDate: string;
  status: "upcoming" | "submitted" | "graded" | "late" | "missing";
  grade?: number;
  totalMarks: number;
  submittedAt?: string;
}

export interface GradeEntry {
  id: string;
  courseCode: string;
  courseName: string;
  category: string; // "Assignment", "Midterm", "Final", "Quiz"
  title: string;
  score: number;
  total: number;
  weight: number;
  date: string;
}

export interface AttendanceRecord {
  date: string;
  status: "present" | "absent" | "late" | "excused";
  courseCode?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "academic" | "financial" | "system" | "alert";
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface FeeInvoice {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue" | "partial";
  paidAmount?: number;
}

export interface AtRiskStudent {
  id: string;
  name: string;
  userId: string;
  riskScore: number; // 0-100
  riskFactors: string[];
  attendancePercent: number;
  gpa: number;
  lastActive: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  scope: "global" | "department" | "course";
  scopeLabel: string;
  pinned: boolean;
  createdAt: string;
}

// ─── Sidebar Navigation Config ───
export interface NavItem {
  label: string;
  href: string;
  icon: string; // lucide icon name
  badge?: number;
  roles: Role[];
}

export const SIDEBAR_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", roles: ["student", "teacher", "admin"] },
  { label: "Courses", href: "/dashboard/courses", icon: "BookOpen", roles: ["student", "teacher", "admin"] },
  { label: "Attendance", href: "/dashboard/attendance", icon: "CalendarCheck", roles: ["student", "teacher", "admin"] },
  { label: "Grades", href: "/dashboard/grades", icon: "GraduationCap", roles: ["student", "teacher", "admin"] },
  { label: "Assignments", href: "/dashboard/assignments", icon: "FileText", roles: ["student", "teacher"] },
  { label: "Exams", href: "/dashboard/exams", icon: "ClipboardList", roles: ["student", "teacher", "admin"] },
  { label: "Schedule", href: "/dashboard/schedule", icon: "Clock", roles: ["student", "teacher"] },
  { label: "Calendar", href: "/dashboard/calendar", icon: "Calendar", roles: ["student", "teacher", "admin"] },
  { label: "Fees", href: "/dashboard/fees", icon: "CreditCard", roles: ["student", "admin"] },
  { label: "Notifications", href: "/dashboard/notifications", icon: "Bell", roles: ["student", "teacher", "admin"] },
  { label: "Announcements", href: "/dashboard/announcements", icon: "Megaphone", roles: ["student", "teacher", "admin"] },
  { label: "Gamification", href: "/dashboard/gamification", icon: "Trophy", roles: ["student", "teacher", "admin"] },
  { label: "AI Copilot", href: "/dashboard/copilot", icon: "BrainCircuit", roles: ["student"] },
  { label: "At-Risk Students", href: "/dashboard/at-risk", icon: "AlertTriangle", roles: ["teacher", "admin"] },
  { label: "Reports", href: "/dashboard/reports", icon: "BarChart3", roles: ["teacher", "admin"] },
  { label: "Audit Log", href: "/dashboard/audit", icon: "Shield", roles: ["admin"] },
  { label: "Evaluations", href: "/dashboard/evaluations", icon: "Star", roles: ["student", "teacher", "admin"] },
  { label: "Settings", href: "/dashboard/settings", icon: "Settings", roles: ["student", "teacher", "admin"] },
];

// ─── Mock Data ───

export const MOCK_SCHEDULE_TODAY: ScheduleEntry[] = [
  {
    id: "s1",
    courseCode: "CS301",
    courseName: "Data Structures & Algorithms",
    time: "09:00",
    endTime: "10:30",
    room: "Room 204",
    instructor: "Dr. Sarah Mitchell",
    type: "lecture",
    color: "#6366f1",
  },
  {
    id: "s2",
    courseCode: "MTH201",
    courseName: "Linear Algebra",
    time: "11:00",
    endTime: "12:00",
    room: "Room 108",
    instructor: "Prof. James Chen",
    type: "lecture",
    color: "#8b5cf6",
  },
  {
    id: "s3",
    courseCode: "CS301L",
    courseName: "DSA Lab",
    time: "14:00",
    endTime: "16:00",
    room: "Lab 3",
    instructor: "Dr. Sarah Mitchell",
    type: "lab",
    color: "#06b6d4",
  },
  {
    id: "s4",
    courseCode: "PHY102",
    courseName: "Physics II",
    time: "16:30",
    endTime: "17:30",
    room: "Room 312",
    instructor: "Dr. Emily Parker",
    type: "lecture",
    color: "#f59e0b",
  },
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: "a1",
    title: "Binary Search Tree Implementation",
    courseCode: "CS301",
    courseName: "Data Structures & Algorithms",
    dueDate: "2026-09-18T23:59:00",
    status: "upcoming",
    totalMarks: 100,
  },
  {
    id: "a2",
    title: "Matrix Operations Project",
    courseCode: "MTH201",
    courseName: "Linear Algebra",
    dueDate: "2026-09-20T23:59:00",
    status: "upcoming",
    totalMarks: 50,
  },
  {
    id: "a3",
    title: "Linked List Assignment",
    courseCode: "CS301",
    courseName: "Data Structures & Algorithms",
    dueDate: "2026-09-12T23:59:00",
    status: "graded",
    grade: 88,
    totalMarks: 100,
    submittedAt: "2026-09-11T18:30:00",
  },
  {
    id: "a4",
    title: "Eigenvalue Problem Set",
    courseCode: "MTH201",
    courseName: "Linear Algebra",
    dueDate: "2026-09-10T23:59:00",
    status: "graded",
    grade: 45,
    totalMarks: 50,
    submittedAt: "2026-09-10T22:15:00",
  },
  {
    id: "a5",
    title: "Oscillation Lab Report",
    courseCode: "PHY102",
    courseName: "Physics II",
    dueDate: "2026-09-15T23:59:00",
    status: "late",
    totalMarks: 30,
  },
];

export const MOCK_GRADES: GradeEntry[] = [
  { id: "g1", courseCode: "CS301", courseName: "Data Structures & Algorithms", category: "Assignment", title: "Linked List", score: 88, total: 100, weight: 10, date: "2026-09-12" },
  { id: "g2", courseCode: "CS301", courseName: "Data Structures & Algorithms", category: "Quiz", title: "Quiz 1", score: 18, total: 20, weight: 5, date: "2026-09-05" },
  { id: "g3", courseCode: "MTH201", courseName: "Linear Algebra", category: "Assignment", title: "Eigenvalue Problem Set", score: 45, total: 50, weight: 10, date: "2026-09-10" },
  { id: "g4", courseCode: "MTH201", courseName: "Linear Algebra", category: "Midterm", title: "Midterm Exam", score: 78, total: 100, weight: 30, date: "2026-09-08" },
  { id: "g5", courseCode: "PHY102", courseName: "Physics II", category: "Quiz", title: "Quiz 2", score: 15, total: 20, weight: 5, date: "2026-09-06" },
  { id: "g6", courseCode: "PHY102", courseName: "Physics II", category: "Assignment", title: "Wave Mechanics", score: 27, total: 30, weight: 10, date: "2026-09-03" },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "n1", title: "Grade Posted", message: "Your Linked List assignment has been graded — 88/100", type: "academic", read: false, createdAt: "2026-09-16T08:00:00", link: "/dashboard/grades" },
  { id: "n2", title: "Fee Reminder", message: "Tuition payment of ₹45,000 is due by Sep 30", type: "financial", read: false, createdAt: "2026-09-15T14:00:00", link: "/dashboard/fees" },
  { id: "n3", title: "Attendance Alert", message: "Your Physics II attendance has dropped below 75%", type: "alert", read: false, createdAt: "2026-09-14T10:00:00", link: "/dashboard/attendance" },
  { id: "n4", title: "New Announcement", message: "Mid-semester break schedule has been published", type: "system", read: true, createdAt: "2026-09-13T09:00:00", link: "/dashboard/announcements" },
  { id: "n5", title: "Assignment Due", message: "BST Implementation due in 2 days", type: "academic", read: true, createdAt: "2026-09-12T16:00:00", link: "/dashboard/assignments" },
];

export const MOCK_FEES: FeeInvoice[] = [
  { id: "f1", title: "Tuition Fee — Semester 3", amount: 45000, dueDate: "2026-09-30", status: "pending" },
  { id: "f2", title: "Lab Fee — CS Department", amount: 5000, dueDate: "2026-10-15", status: "pending" },
  { id: "f3", title: "Tuition Fee — Semester 2", amount: 45000, dueDate: "2026-03-31", status: "paid", paidAmount: 45000 },
  { id: "f4", title: "Library Fee", amount: 2000, dueDate: "2026-08-15", status: "paid", paidAmount: 2000 },
];

export const MOCK_AT_RISK_STUDENTS: AtRiskStudent[] = [
  { id: "r1", name: "Rahul Sharma", userId: "STU-2026-042", riskScore: 82, riskFactors: ["Low attendance (62%)", "3 missing assignments", "Declining quiz scores"], attendancePercent: 62, gpa: 2.1, lastActive: "2026-09-14" },
  { id: "r2", name: "Priya Patel", userId: "STU-2026-019", riskScore: 71, riskFactors: ["Low attendance (68%)", "Failed midterm"], attendancePercent: 68, gpa: 2.4, lastActive: "2026-09-15" },
  { id: "r3", name: "Arun Kumar", userId: "STU-2026-088", riskScore: 65, riskFactors: ["2 consecutive absences", "Late submissions"], attendancePercent: 73, gpa: 2.6, lastActive: "2026-09-16" },
  { id: "r4", name: "Sneha Reddy", userId: "STU-2026-055", riskScore: 58, riskFactors: ["Declining attendance trend"], attendancePercent: 76, gpa: 2.8, lastActive: "2026-09-15" },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: "an1", title: "Mid-Semester Break Schedule", content: "The mid-semester break will be from October 5-12. All classes resume on October 13. Please plan accordingly.", author: "Administration", scope: "global", scopeLabel: "All Students", pinned: true, createdAt: "2026-09-13T09:00:00" },
  { id: "an2", title: "CS Department Hackathon", content: "Annual CodeSprint hackathon registrations are open. Form teams of 3-4 and register by Sep 25.", author: "CS Department", scope: "department", scopeLabel: "CS Department", pinned: false, createdAt: "2026-09-12T11:00:00" },
  { id: "an3", title: "DSA Guest Lecture", content: "Dr. Vikram Rao from Google will deliver a guest lecture on 'Graph Algorithms at Scale' on Sep 22 at 3 PM.", author: "Dr. Sarah Mitchell", scope: "course", scopeLabel: "CS301", pinned: false, createdAt: "2026-09-11T15:00:00" },
];

// ─── Stat Summaries ───
export const MOCK_STUDENT_STATS = {
  gpa: 3.42,
  gpaTrend: +0.15,
  attendancePercent: 87,
  attendanceTrend: -2,
  assignmentsCompleted: 12,
  assignmentsTotal: 15,
  upcomingDeadlines: 3,
  streak: 14, // consecutive attendance days
  totalCredits: 18,
  rank: 24,
  totalStudents: 180,
  presentDays: 52,
  absentDays: 4,
  lateDays: 3,
  xp: 2340,
  xpToNext: 3000,
  level: 7,
};

export const MOCK_TEACHER_STATS = {
  totalStudents: 245,
  classesToday: 4,
  pendingGrading: 38,
  atRiskCount: 4,
  averageAttendance: 81,
  assignmentsCreated: 12,
};

export const MOCK_ADMIN_STATS = {
  totalStudents: 2847,
  totalFaculty: 156,
  activeCourses: 312,
  attendanceRate: 83,
  feeCollected: 12450000,
  feeOutstanding: 3250000,
  atRiskStudents: 127,
  systemUptime: 99.97,
};

// ─── Gamification ───
export interface Badge {
  id: string;
  name: string;
  icon: string; // emoji
  description: string;
  earnedAt: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export const MOCK_BADGES: Badge[] = [
  { id: "b1", name: "Perfect Week", icon: "⭐", description: "100% attendance for a full week", earnedAt: "2026-09-15", rarity: "rare" },
  { id: "b2", name: "GPA Climber", icon: "📈", description: "Improved GPA by 0.1+ in a semester", earnedAt: "2026-09-10", rarity: "epic" },
  { id: "b3", name: "Early Bird", icon: "🐦", description: "Submitted 5 assignments before deadline", earnedAt: "2026-09-08", rarity: "common" },
  { id: "b4", name: "Quiz Master", icon: "🧠", description: "Scored 90%+ on 3 consecutive quizzes", earnedAt: "2026-09-01", rarity: "rare" },
  { id: "b5", name: "Streak Legend", icon: "🔥", description: "Maintained a 14-day attendance streak", earnedAt: "2026-09-16", rarity: "legendary" },
];

// ─── Student Schedule Today ───
export const MOCK_STUDENT_SCHEDULE_TODAY: ScheduleEntry[] = [
  {
    id: "ss1",
    courseCode: "CS301",
    courseName: "Data Structures & Algorithms",
    time: "09:00",
    endTime: "10:30",
    room: "Room 204",
    instructor: "Dr. Sarah Mitchell",
    type: "lecture",
    color: "#6366f1",
  },
  {
    id: "ss2",
    courseCode: "MTH201",
    courseName: "Linear Algebra",
    time: "11:00",
    endTime: "12:00",
    room: "Room 108",
    instructor: "Prof. James Chen",
    type: "lecture",
    color: "#8b5cf6",
  },
  {
    id: "ss3",
    courseCode: "CS301L",
    courseName: "DSA Lab",
    time: "14:00",
    endTime: "16:00",
    room: "Lab 3",
    instructor: "Dr. Sarah Mitchell",
    type: "lab",
    color: "#06b6d4",
  },
  {
    id: "ss4",
    courseCode: "PHY102",
    courseName: "Physics II",
    time: "16:30",
    endTime: "17:30",
    room: "Room 312",
    instructor: "Dr. Emily Parker",
    type: "lecture",
    color: "#f59e0b",
  },
];

// ─── Upcoming Deadlines (for countdown) ───
export interface UpcomingDeadline {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  dueDate: string; // ISO
  type: "assignment" | "quiz" | "project" | "exam";
  urgency: "low" | "medium" | "high";
}

export const MOCK_UPCOMING_DEADLINES: UpcomingDeadline[] = [
  { id: "d1", title: "Binary Search Tree Implementation", courseCode: "CS301", courseName: "Data Structures", dueDate: "2026-09-23T23:59:00", type: "assignment", urgency: "high" },
  { id: "d2", title: "Matrix Operations Project", courseCode: "MTH201", courseName: "Linear Algebra", dueDate: "2026-09-25T23:59:00", type: "project", urgency: "medium" },
  { id: "d3", title: "Quiz 3 — Oscillations", courseCode: "PHY102", courseName: "Physics II", dueDate: "2026-09-28T10:00:00", type: "quiz", urgency: "low" },
  { id: "d4", title: "Graph Traversal Homework", courseCode: "CS301", courseName: "Data Structures", dueDate: "2026-09-30T23:59:00", type: "assignment", urgency: "low" },
];

// ─── GPA History (sparkline) ───
export interface GpaHistoryEntry {
  semester: string;
  gpa: number;
}

export const MOCK_GPA_HISTORY: GpaHistoryEntry[] = [
  { semester: "Sem 1", gpa: 3.10 },
  { semester: "Sem 2", gpa: 3.25 },
  { semester: "Sem 3", gpa: 3.18 },
  { semester: "Sem 4", gpa: 3.35 },
  { semester: "Sem 5", gpa: 3.42 },
];
