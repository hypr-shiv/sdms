"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  IdCard,
  AlertCircle,
  X,
} from "lucide-react";

type Role = "student" | "teacher" | "admin";

interface RoleConfig {
  label: string;
  icon: React.ReactNode;
  description: string;
  btnClass: string;
  focusClass: string;
  idPlaceholder: string;
  idLabel: string;
}

const ROLE_CONFIG: Record<Role, RoleConfig> = {
  student: {
    label: "Student",
    icon: <GraduationCap size={20} />,
    description: "Access your grades, attendance, assignments & AI Study Copilot",
    btnClass: "btn-student",
    focusClass: "focus-student",
    idPlaceholder: "e.g. STU-2026-001",
    idLabel: "Student ID",
  },
  teacher: {
    label: "Teacher",
    icon: <BookOpen size={20} />,
    description: "Manage attendance, gradebook, at-risk alerts & timetables",
    btnClass: "btn-teacher",
    focusClass: "focus-teacher",
    idPlaceholder: "e.g. FAC-2026-042",
    idLabel: "Faculty ID",
  },
  admin: {
    label: "Admin",
    icon: <ShieldCheck size={20} />,
    description: "Full platform control — users, analytics, schedules & config",
    btnClass: "btn-admin",
    focusClass: "focus-admin",
    idPlaceholder: "e.g. ADM-001",
    idLabel: "Admin ID",
  },
};

// Email regex (matches the server-side validation)
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onRoleChange: (role: Role) => void;
  onSwitchToForgotPassword?: () => void;
  loggedOutNotice?: string;
  initialEmail?: string;
}

export default function LoginForm({
  onSwitchToSignup,
  onRoleChange,
  onSwitchToForgotPassword,
  loggedOutNotice,
  initialEmail = "",
}: LoginFormProps) {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<Role>("student");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [userIdError, setUserIdError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [globalSuccess, setGlobalSuccess] = useState(loggedOutNotice || "");

  const config = ROLE_CONFIG[activeRole];

  const validateEmail = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) {
      setEmailError("Email address is required");
      return false;
    }
    if (!EMAIL_REGEX.test(trimmed) || trimmed.length > 254) {
      setEmailError("Please enter a valid institutional email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (value: string): boolean => {
    if (!value) {
      setPasswordError("Password is required");
      return false;
    }
    if (value.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const validateUserId = (value: string): boolean => {
    const trimmed = value.trim();
    if (trimmed && trimmed.length < 3) {
      setUserIdError(`${config.idLabel} must be at least 3 characters`);
      return false;
    }
    setUserIdError("");
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (globalError) setGlobalError("");
    if (emailError) validateEmail(value);
  };

  const handleEmailBlur = () => {
    if (email) validateEmail(email);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (globalError) setGlobalError("");
    if (passwordError) validatePassword(value);
  };

  const handlePasswordBlur = () => {
    if (password) validatePassword(password);
  };

  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserId(value);
    if (globalError) setGlobalError("");
    if (userIdError) validateUserId(value);
  };

  const handleUserIdBlur = () => {
    if (userId) validateUserId(userId);
  };

  const handleRoleSwitch = useCallback(
    (role: Role) => {
      setActiveRole(role);
      setEmail("");
      setPassword("");
      setUserId("");
      setShowPassword(false);
      setEmailError("");
      setPasswordError("");
      setUserIdError("");
      setGlobalError("");
      setGlobalSuccess("");
      onRoleChange(role);
    },
    [onRoleChange]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setGlobalError("");
      setGlobalSuccess("");

      const cleanEmail = email.trim();
      const isEmailValid = validateEmail(cleanEmail);
      const isPasswordValid = validatePassword(password);
      const isUserIdValid = validateUserId(userId);

      // Client-side validation: halt if any required field fails
      if (!isEmailValid || !isPasswordValid || !isUserIdValid) {
        if (!cleanEmail && !password) {
          setGlobalError("Please provide your credentials to sign in.");
        }
        return;
      }

      const fallbackId = `${activeRole.slice(0, 3).toUpperCase()}-001`;
      const resolvedUserId = userId.trim() || fallbackId;

      setIsLoading(true);

      try {
        const res = await fetch("http://localhost:3001/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          const rawMsg =
            typeof data.message === "string"
              ? data.message
              : Array.isArray(data.message)
              ? data.message[0]
              : data.error || "Login failed. Please check your credentials.";

          if (res.status === 401 || rawMsg.toLowerCase().includes("invalid credentials") || rawMsg.toLowerCase().includes("unauthorized")) {
            setGlobalError("Invalid email or password. Please verify your credentials or click a Quick Demo role above.");
          } else if (res.status === 404 || rawMsg.toLowerCase().includes("not found")) {
            setGlobalError("Account not found. Please create a new account or select a Quick Demo role above.");
          } else {
            setGlobalError(rawMsg);
          }
          return;
        }

        // Store access tokens
        localStorage.setItem("accessToken", data.access_token);
        localStorage.setItem("token", data.access_token);
        const userObj = {
          ...data.user,
          userId: data.user?.userId || resolvedUserId,
        };
        localStorage.setItem("user", JSON.stringify(userObj));
        document.cookie = `accessToken=${data.access_token}; Path=/; SameSite=Lax;`;

        setGlobalSuccess(
          `Welcome back, ${userObj.name || userObj.firstName || "User"}! Redirecting...`
        );

        // Redirect to dashboard after a brief delay for UX
        setTimeout(() => router.push("/dashboard"), 400);
      } catch {
        setGlobalError(
          "Network error. Please make sure the backend server is running on port 3001."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [email, userId, password, activeRole, router]
  );

  return (
    <div className="auth-card form-enter" key="login">
      {/* ─── Logo & Branding ─── */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: 18,
            background:
              "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1), rgba(236,72,153,0.1))",
            border: "1px solid rgba(255,255,255,0.06)",
            marginBottom: 14,
            overflow: "hidden",
          }}
        >
          <img
            src="/logo.jpg"
            alt="ScholarPulse Logo"
            width={52}
            height={52}
            style={{ objectFit: "contain" }}
          />
        </div>
        <h1
          className="logo-text"
          style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            marginBottom: 4,
          }}
        >
          ScholarPulse
        </h1>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.8rem",
            fontWeight: 400,
            letterSpacing: "0.02em",
          }}
        >
          Sign in to your account
        </p>
      </div>

      {/* ─── Role Selector Tabs ─── */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 22,
          padding: 4,
          background: "rgba(255,255,255,0.02)",
          borderRadius: "var(--radius-md)",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {(Object.keys(ROLE_CONFIG) as Role[]).map((role) => (
          <button
            key={role}
            id={`login-tab-${role}`}
            type="button"
            className={`role-tab ${role} ${activeRole === role ? "active" : ""}`}
            onClick={() => handleRoleSwitch(role)}
            aria-selected={activeRole === role}
            role="tab"
          >
            <div className="tab-icon">{ROLE_CONFIG[role].icon}</div>
            <span>{ROLE_CONFIG[role].label}</span>
            <div className="tab-indicator" />
          </button>
        ))}
      </div>

      {/* ─── Role Description ─── */}
      <p
        key={`desc-${activeRole}`}
        className="animate-slide-down"
        style={{
          color: "var(--text-muted)",
          fontSize: "0.78rem",
          textAlign: "center",
          marginBottom: 12,
          lineHeight: 1.5,
          minHeight: 32,
        }}
      >
        {config.description}
      </p>

      {/* ─── Demo Credentials Quick Fill ─── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: "0.72rem",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginRight: 2,
          }}
        >
          Quick Demo:
        </span>
        <button
          type="button"
          onClick={() => {
            handleRoleSwitch("student");
            setEmail("student@scholarpulse.edu");
            setUserId("STU-2026-001");
            setPassword("Password123!");
          }}
          style={{
            background: "rgba(99, 102, 241, 0.12)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            color: "#a5b4fc",
            padding: "3px 10px",
            borderRadius: 9999,
            fontSize: "0.75rem",
            cursor: "pointer",
            fontWeight: 500,
            transition: "all 0.2s ease",
          }}
          title="Auto-fill student demo credentials"
        >
          Student
        </button>
        <button
          type="button"
          onClick={() => {
            handleRoleSwitch("teacher");
            setEmail("teacher@scholarpulse.edu");
            setUserId("FAC-2026-042");
            setPassword("Password123!");
          }}
          style={{
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#6ee7b7",
            padding: "3px 10px",
            borderRadius: 9999,
            fontSize: "0.75rem",
            cursor: "pointer",
            fontWeight: 500,
            transition: "all 0.2s ease",
          }}
          title="Auto-fill faculty demo credentials"
        >
          Faculty
        </button>
        <button
          type="button"
          onClick={() => {
            handleRoleSwitch("admin");
            setEmail("admin@scholarpulse.edu");
            setUserId("ADM-001");
            setPassword("Password123!");
          }}
          style={{
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            color: "#fcd34d",
            padding: "3px 10px",
            borderRadius: 9999,
            fontSize: "0.75rem",
            cursor: "pointer",
            fontWeight: 500,
            transition: "all 0.2s ease",
          }}
          title="Auto-fill administrator demo credentials"
        >
          Admin
        </button>
      </div>

      {/* ─── Alert Banner ─── */}
      {globalError && (
        <div className="auth-alert error">
          <div className="auth-alert-content">
            <AlertCircle size={16} />
            <div className="auth-alert-text">{globalError}</div>
          </div>
          <button
            type="button"
            onClick={() => setGlobalError("")}
            className="auth-alert-dismiss"
            aria-label="Clear error message"
            title="Clear error message"
          >
            <X size={15} />
          </button>
        </div>
      )}
      {globalSuccess && (
        <div className="auth-alert success">
          <div className="auth-alert-content">
            <div className="auth-alert-text">{globalSuccess}</div>
          </div>
          <button
            type="button"
            onClick={() => setGlobalSuccess("")}
            className="auth-alert-dismiss"
            aria-label="Clear message"
            title="Clear message"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ─── Login Form ─── */}
      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* User ID Field */}
        <div>
          <div style={{ position: "relative" }}>
            <IdCard
              size={18}
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            <input
              id="login-userId"
              type="text"
              className={`input-field ${config.focusClass} ${userIdError ? "input-error" : ""}`}
              placeholder={config.idPlaceholder}
              value={userId}
              onChange={handleUserIdChange}
              onBlur={handleUserIdBlur}
              required
              autoComplete="username"
              aria-label={config.idLabel}
              aria-invalid={!!userIdError}
            />
          </div>
          {userIdError && (
            <div className="field-error">
              <AlertCircle size={12} />
              <span>{userIdError}</span>
            </div>
          )}
        </div>

        {/* Email Field */}
        <div>
          <div style={{ position: "relative" }}>
            <Mail
              size={18}
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            <input
              id="login-email"
              type="email"
              className={`input-field ${config.focusClass} ${emailError ? "input-error" : email && !emailError ? "input-valid" : ""}`}
              placeholder="Email address"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              required
              autoComplete="email"
              aria-label="Email address"
              aria-invalid={!!emailError}
            />
          </div>
          {emailError && (
            <div className="field-error">
              <AlertCircle size={12} />
              <span>{emailError}</span>
            </div>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div style={{ position: "relative" }}>
            <Lock
              size={18}
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              className={`input-field ${config.focusClass} ${passwordError ? "input-error" : ""}`}
              placeholder="Password"
              value={password}
              onChange={handlePasswordChange}
              onBlur={handlePasswordBlur}
              required
              autoComplete="current-password"
              aria-label="Password"
              aria-invalid={!!passwordError}
              style={{ paddingRight: 48 }}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {passwordError && (
            <div className="field-error">
              <AlertCircle size={12} />
              <span>{passwordError}</span>
            </div>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            margin: "2px 0",
          }}
        >
          <label
            htmlFor="login-remember"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--text-secondary)",
              fontSize: "0.813rem",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <input
              id="login-remember"
              type="checkbox"
              className="custom-checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember me
          </label>
          <button
            type="button"
            id="forgot-password"
            onClick={onSwitchToForgotPassword}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "var(--text-muted)",
              fontSize: "0.813rem",
              cursor: "pointer",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            Forgot password?
          </button>
        </div>

        {/* Submit Button */}
        <button
          id="login-submit"
          type="submit"
          className={`btn-primary ${config.btnClass}`}
          disabled={isLoading}
          style={{
            marginTop: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? (
            <div
              style={{
                width: 20,
                height: 20,
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "white",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
              }}
            />
          ) : (
            <>
              Sign in as {config.label}
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      {/* ─── Footer ─── */}
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
          <span
            style={{
              color: "var(--text-muted)",
              fontSize: "0.72rem",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            New here?
          </span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        </div>

        <p style={{ color: "var(--text-muted)", fontSize: "0.813rem" }}>
          Don&apos;t have an account?{" "}
          <button type="button" className="auth-toggle" onClick={onSwitchToSignup}>
            Create account →
          </button>
        </p>
      </div>

      {/* ─── Bottom Branding ─── */}
      <div
        style={{
          marginTop: 20,
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: "0.75rem",
          letterSpacing: "0.04em",
          opacity: 0.7,
        }}
      >
        <p style={{ marginBottom: 4 }}>Powered by AI • Built for Education</p>
        <Link href="/privacy" style={{ textDecoration: "underline" }} target="_blank">Privacy Policy</Link>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
