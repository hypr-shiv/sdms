"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import {
  Search,
  FileText,
  Award,
  Calendar,
  MessageSquare,
  Bell,
  Shield,
  BookOpen,
  Inbox,
  Sparkles,
} from "lucide-react";
import "./EmptyState.css";

export type EmptyStateVariant =
  | "search"
  | "assignments"
  | "grades"
  | "attendance"
  | "messages"
  | "notifications"
  | "audit"
  | "courses"
  | "general";

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
}

export interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string | ReactNode;
  icon?: ReactNode;
  badge?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  compact?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const VARIANT_DEFAULTS: Record<
  EmptyStateVariant,
  {
    icon: (size: number) => ReactNode;
    title: string;
    description: string;
    badge: string;
  }
> = {
  search: {
    icon: (s) => <Search size={s} />,
    title: "No Matching Results",
    description:
      "We couldn't find anything matching your filters or keywords. Try broadening your query or clearing active filters.",
    badge: "Search Filter",
  },
  assignments: {
    icon: (s) => <FileText size={s} />,
    title: "No Assignments Found",
    description:
      "All coursework is completed, or no assignments have been assigned for this course or category yet.",
    badge: "Coursework",
  },
  grades: {
    icon: (s) => <Award size={s} />,
    title: "No Grade Records Available",
    description:
      "Academic scores and evaluations will appear here as soon as course instructors publish assessments.",
    badge: "Academic Ledger",
  },
  attendance: {
    icon: (s) => <Calendar size={s} />,
    title: "No Attendance Records",
    description:
      "No attendance sessions have been logged for this period or course. Regular class sessions will populate here.",
    badge: "Attendance",
  },
  messages: {
    icon: (s) => <MessageSquare size={s} />,
    title: "No Conversations Found",
    description:
      "Connect with faculty, academic advisors, or study peers to begin messaging securely.",
    badge: "Direct Messages",
  },
  notifications: {
    icon: (s) => <Bell size={s} />,
    title: "You're All Caught Up!",
    description:
      "There are no unread notifications, academic announcements, or security alerts at this time.",
    badge: "Notification Center",
  },
  audit: {
    icon: (s) => <Shield size={s} />,
    title: "Audit Ledger Log Empty",
    description:
      "No system audit events match the specified date range, action type, or user filter criteria.",
    badge: "Audit Ledger",
  },
  courses: {
    icon: (s) => <BookOpen size={s} />,
    title: "No Courses Found",
    description:
      "No courses match your enrollment or department filter. Explore the course catalog to register for upcoming terms.",
    badge: "Course Catalog",
  },
  general: {
    icon: (s) => <Inbox size={s} />,
    title: "Nothing to Display",
    description:
      "This section currently has no active records. New data will appear automatically as it becomes available.",
    badge: "Empty State",
  },
};

export default function EmptyState({
  variant = "general",
  title,
  description,
  icon,
  badge,
  action,
  secondaryAction,
  compact = false,
  className = "",
  style,
}: EmptyStateProps) {
  const defaults = VARIANT_DEFAULTS[variant] || VARIANT_DEFAULTS.general;

  const resolvedTitle = title ?? defaults.title;
  const resolvedDesc = description ?? defaults.description;
  const resolvedBadge = badge ?? defaults.badge;
  const iconSize = compact ? 22 : 32;
  const resolvedIcon = icon ?? defaults.icon(iconSize);

  const renderAction = (act: EmptyStateAction, isPrimary = true) => {
    const btnClass = isPrimary ? "empty-state-btn-primary" : "empty-state-btn-secondary";

    if (act.href) {
      return (
        <Link key={act.label} href={act.href} className={btnClass} onClick={act.onClick}>
          {act.icon}
          <span>{act.label}</span>
        </Link>
      );
    }

    return (
      <button key={act.label} type="button" className={btnClass} onClick={act.onClick}>
        {act.icon}
        <span>{act.label}</span>
      </button>
    );
  };

  return (
    <div
      className={`empty-state-wrapper empty-variant-${variant} ${compact ? "compact" : ""} ${className}`}
      style={style}
      role="region"
      aria-label={resolvedTitle}
    >
      {/* Ambient background glow */}
      <div className="empty-state-glow" aria-hidden="true" />

      {/* Floating icon */}
      <div className="empty-state-icon-box" aria-hidden="true">
        {resolvedIcon}
      </div>

      {/* Badge */}
      {resolvedBadge && (
        <span className="empty-state-badge">
          <Sparkles size={11} /> {resolvedBadge}
        </span>
      )}

      {/* Title */}
      <h3 className="empty-state-title">{resolvedTitle}</h3>

      {/* Description */}
      <p className="empty-state-desc">{resolvedDesc}</p>

      {/* Action Buttons */}
      {(action || secondaryAction) && (
        <div className="empty-state-actions">
          {action && renderAction(action, true)}
          {secondaryAction && renderAction(secondaryAction, false)}
        </div>
      )}
    </div>
  );
}

/**
 * Convenience wrapper for rendering empty states within an HTML table `<tbody>`
 */
export function EmptyStateTableRow({
  colSpan,
  ...props
}: EmptyStateProps & { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="empty-state-table-cell">
        <EmptyState compact {...props} />
      </td>
    </tr>
  );
}
