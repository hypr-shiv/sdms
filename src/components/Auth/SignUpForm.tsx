"use client";

import { useState, useCallback, useMemo } from "react";
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
  User,
  AlertCircle,
  Check,
} from "lucide-react";

type Role = "student" | "teacher" | "admin";

interface RoleConfig {
  label: string;
  icon: React.ReactNode;
  btnClass: string;
  focusClass: string;
  idPlaceholder: string;
  idLabel: string;
}

const ROLE_CONFIG: Record<Role, RoleConfig> = {
  student: {
    label: "Student",
    icon: <GraduationCap size={20} />,
    btnClass: "btn-student",
    focusClass: "focus-student",
    idPlaceholder: "e.g. STU-2026-001",
    idLabel: "Student ID",
  },
  teacher: {
    label: "Teacher",
    icon: <BookOpen size={20} />,
    btnClass: "btn-teacher",
    focusClass: "focus-teacher",
    idPlaceholder: "e.g. FAC-2026-042",
    idLabel: "Faculty ID",
  },
  admin: {
    label: "Admin",
    icon: <ShieldCheck size={20} />,
    btnClass: "btn-admin",
    focusClass: "focus-admin",
    idPlaceholder: "e.g. ADM-001",
    idLabel: "Admin ID",
  },
};

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

interface PasswordRequirement {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: "8+ characters", test: (pw) => pw.length >= 8 },
  { label: "Uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "Number", test: (pw) => /[0-9]/.test(pw) },
  { label: "Special character", test: (pw) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw) },
];

interface SignUpFormProps {
  onSwitchToLogin: () => void;
  onRoleChange: (role: Role) => void;
  onSwitchToVerify?: (email: string, code?: string) => void;
}

export default function SignUpForm({ onSwitchToLogin, onRoleChange, onSwitchToVerify }: SignUpFormProps) {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<Role>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [globalSuccess, setGlobalSuccess] = useState("");

  const config = ROLE_CONFIG[activeRole];

  // ─── Password Strength ───
  const passwordStrength = useMemo(() => {
    if (!password) return { level: 0, label: "", className: "" };
    const metCount = PASSWORD_REQUIREMENTS.filter((r) => r.test(password)).length;
    if (metCount <= 1) return { level: 1, label: "Weak", className: "strength-weak" };
    if (metCount <= 2) return { level: 2, label: "Fair", className: "strength-fair" };
    if (metCount <= 4) return { level: 3, label: "Good", className: "strength-good" };
    return { level: 4, label: "Strong", className: "strength-strong" };
  }, [password]);

  const validateEmail = (value: string): boolean => {
    if (!value) {
      setEmailError("");
      return false;
    }
    if (!EMAIL_REGEX.test(value) || value.length > 254) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError) validateEmail(value);
  };

  const handleEmailBlur = () => {
    if (email) validateEmail(email);
  };

  const handleConfirmPasswordBlur = () => {
    if (confirmPassword && confirmPassword !== password) {
      setConfirmError("Passwords do not match");
    } else {
      setConfirmError("");
    }
  };

  const handleRoleSwitch = useCallback(
    (role: Role) => {
      setActiveRole(role);
      setName("");
      setEmail("");
      setUserId("");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      setEmailError("");
      setConfirmError("");
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

      // Client-side validations
      if (!name.trim() || !email.trim() || !userId.trim() || !password) {
        setGlobalError("Please fill out all required fields");
        return;
      }

      if (!acceptTerms) {
        setGlobalError("You must agree to the Terms of Service and Privacy Policy to continue");
        return;
      }

      if (!name.trim()) {
        setGlobalError("Full name is required");
        return;
      }

      if (!validateEmail(email)) {
        setEmailError("Please enter a valid email address");
        return;
      }

      if (!userId.trim()) {
        setGlobalError("User ID is required");
        return;
      }

      const allMet = PASSWORD_REQUIREMENTS.every((r) => r.test(password));
      if (!allMet) {
        setGlobalError("Password does not meet all requirements");
        return;
      }

      if (password !== confirmPassword) {
        setConfirmError("Passwords do not match");
        return;
      }

      setIsLoading(true);

      try {
        const res = await fetch("http://localhost:3001/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: name.split(" ")[0] || "",
            lastName: name.split(" ").slice(1).join(" ") || "",
            email: email.trim(),
            userId: userId.trim(),
            password,
            role: activeRole,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setGlobalError(data.message || "Sign up failed");
          return;
        }

        // Store access tokens
        if (data.access_token) {
          localStorage.setItem("accessToken", data.access_token);
          localStorage.setItem("token", data.access_token);
          document.cookie = `accessToken=${data.access_token}; Path=/; SameSite=Lax;`;
        }
        const userObj = {
          ...data.user,
          userId: data.user?.userId || userId.trim() || `${activeRole.slice(0, 3).toUpperCase()}-001`,
        };
        localStorage.setItem("user", JSON.stringify(userObj));

        if (onSwitchToVerify) {
          setGlobalSuccess(
            data.verificationCode
              ? `Account created! Verification code: ${data.verificationCode}`
              : "Account created! Please verify your institutional email."
          );
          setTimeout(() => {
            onSwitchToVerify(email.trim(), data.verificationCode);
          }, 800);
        } else {
          setGlobalSuccess("Account created successfully! Redirecting...");
          setTimeout(() => {
            router.push("/dashboard");
          }, 1200);
        }
      } catch {
        setGlobalError("Network error. Please check your connection and try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [name, email, userId, password, confirmPassword, activeRole, acceptTerms, router, onSwitchToVerify]
  );

  return (
    <div className="auth-card form-enter" key="signup">
      {/* ─── Header ─── */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
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
          Create Account
        </h1>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.8rem",
            fontWeight: 400,
            letterSpacing: "0.02em",
          }}
        >
          Join ScholarPulse today
        </p>
      </div>

      {/* ─── Role Selector Tabs ─── */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 20,
          padding: 4,
          background: "rgba(255,255,255,0.02)",
          borderRadius: "var(--radius-md)",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {(Object.keys(ROLE_CONFIG) as Role[]).map((role) => (
          <button
            key={role}
            id={`signup-tab-${role}`}
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

      {/* ─── Alert Banner ─── */}
      {globalError && (
        <div className="auth-alert error">
          <AlertCircle size={16} />
          <span>{globalError}</span>
        </div>
      )}
      {globalSuccess && (
        <div className="auth-alert success">
          <span>{globalSuccess}</span>
        </div>
      )}

      {/* ─── Sign Up Form ─── */}
      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Full Name */}
        <div style={{ position: "relative" }}>
          <User
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
            id="signup-name"
            type="text"
            className={`input-field ${config.focusClass}`}
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            aria-label="Full name"
          />
        </div>

        {/* Email */}
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
              id="signup-email"
              type="email"
              className={`input-field ${config.focusClass}`}
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

        {/* User ID */}
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
            id="signup-userId"
            type="text"
            className={`input-field ${config.focusClass}`}
            placeholder={config.idPlaceholder}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            autoComplete="username"
            aria-label={config.idLabel}
          />
        </div>

        {/* Password */}
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
              id="signup-password"
              type={showPassword ? "text" : "password"}
              className={`input-field ${config.focusClass}`}
              placeholder="Create password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              aria-label="Create password"
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

          {/* Password Strength Bar */}
          {password && (
            <div className="password-strength">
              <div className="strength-bar-track">
                <div className={`strength-bar-fill ${passwordStrength.className}`} />
              </div>
              <div className="strength-label">
                <span style={{ color: "var(--text-muted)" }}>Password strength</span>
                <span className={`strength-text ${passwordStrength.className}`}>
                  {passwordStrength.label}
                </span>
              </div>
            </div>
          )}

          {/* Password Requirements */}
          {password && (
            <div className="password-requirements">
              {PASSWORD_REQUIREMENTS.map((req, i) => {
                const met = req.test(password);
                return (
                  <div key={i} className={`requirement ${met ? "met" : ""}`}>
                    <div className="requirement-icon">
                      {met && <Check size={8} strokeWidth={3} />}
                    </div>
                    <span>{req.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirm Password */}
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
              id="signup-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              className={`input-field ${config.focusClass}`}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (confirmError) setConfirmError("");
              }}
              onBlur={handleConfirmPasswordBlur}
              required
              autoComplete="new-password"
              aria-label="Confirm password"
              aria-invalid={!!confirmError}
              style={{ paddingRight: 48 }}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {confirmError && (
            <div className="field-error">
              <AlertCircle size={12} />
              <span>{confirmError}</span>
            </div>
          )}
          {confirmPassword && !confirmError && confirmPassword === password && (
            <div className="field-success">✓ Passwords match</div>
          )}
        </div>

        {/* Accept Terms Checkbox */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 4, marginBottom: 8 }}>
          <input
            type="checkbox"
            id="accept-terms"
            checked={acceptTerms}
            onChange={(e) => {
              setAcceptTerms(e.target.checked);
              if (globalError) setGlobalError("");
            }}
            style={{ marginTop: 3, cursor: "pointer" }}
          />
          <label htmlFor="accept-terms" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.4, cursor: "pointer" }}>
            I agree to the <Link href="/privacy" style={{ color: "var(--primary)", textDecoration: "underline" }} target="_blank">Privacy Policy</Link> and <Link href="/terms" style={{ color: "var(--primary)", textDecoration: "underline" }} target="_blank">Terms &amp; Conditions</Link>.
          </label>
        </div>

        {/* Submit Button */}
        <button
          id="signup-submit"
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
              Create {config.label} Account
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      {/* ─── Footer ─── */}
      <div style={{ marginTop: 20, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
          <span
            style={{
              color: "var(--text-muted)",
              fontSize: "0.72rem",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Already a member?
          </span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        </div>

        <p style={{ color: "var(--text-muted)", fontSize: "0.813rem" }}>
          Already have an account?{" "}
          <button type="button" className="auth-toggle" onClick={onSwitchToLogin}>
            Sign in →
          </button>
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
