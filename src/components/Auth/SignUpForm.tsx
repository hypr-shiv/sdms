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
  X,
  ShieldAlert,
  Clock,
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
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [userIdError, setUserIdError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [termsError, setTermsError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [globalSuccess, setGlobalSuccess] = useState("");

  // Rate limit cooldown countdown
  useEffect(() => {
    if (rateLimitCooldown <= 0) return;
    const timer = setInterval(() => {
      setRateLimitCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitCooldown]);

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

  // ─── Validators ───
  const validateName = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) {
      setNameError("Full name is required");
      return false;
    }
    if (trimmed.length < 2) {
      setNameError("Full name must be at least 2 characters");
      return false;
    }
    if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
      setNameError("Name should only contain letters and standard characters");
      return false;
    }
    setNameError("");
    return true;
  };

  const validateEmail = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) {
      setEmailError("Email address is required");
      return false;
    }
    if (!EMAIL_REGEX.test(trimmed) || trimmed.length > 254) {
      setEmailError("Please enter a valid institutional or personal email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validateUserId = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) {
      setUserIdError(`${config.idLabel} is required`);
      return false;
    }
    if (trimmed.length < 3) {
      setUserIdError(`${config.idLabel} must be at least 3 characters`);
      return false;
    }
    setUserIdError("");
    return true;
  };

  const validatePassword = (value: string): boolean => {
    if (!value) {
      setPasswordError("Password is required");
      return false;
    }
    const allMet = PASSWORD_REQUIREMENTS.every((r) => r.test(value));
    if (!allMet) {
      setPasswordError("Password must satisfy all security requirements below");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const validateConfirmPassword = (confirmVal: string, pwdVal?: string): boolean => {
    const basePwd = pwdVal !== undefined ? pwdVal : password;
    if (!confirmVal) {
      setConfirmError("Please confirm your password");
      return false;
    }
    if (confirmVal !== basePwd) {
      setConfirmError("Passwords do not match");
      return false;
    }
    setConfirmError("");
    return true;
  };

  const validateTerms = (accepted: boolean): boolean => {
    if (!accepted) {
      setTermsError("You must agree to the Terms of Service & Privacy Policy to create an account");
      return false;
    }
    setTermsError("");
    return true;
  };

  // ─── Input Handlers ───
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (globalError) setGlobalError("");
    if (nameError) validateName(value);
  };

  const handleNameBlur = () => {
    if (name) validateName(name);
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

  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserId(value);
    if (globalError) setGlobalError("");
    if (userIdError) validateUserId(value);
  };

  const handleUserIdBlur = () => {
    if (userId) validateUserId(userId);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (globalError) setGlobalError("");
    if (passwordError) validatePassword(value);
    if (confirmPassword) validateConfirmPassword(confirmPassword, value);
  };

  const handlePasswordBlur = () => {
    if (password) validatePassword(password);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (globalError) setGlobalError("");
    if (confirmError) validateConfirmPassword(value);
  };

  const handleConfirmPasswordBlur = () => {
    if (confirmPassword) validateConfirmPassword(confirmPassword);
  };

  const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setAcceptTerms(checked);
    if (globalError) setGlobalError("");
    if (termsError && checked) setTermsError("");
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
      setNameError("");
      setEmailError("");
      setUserIdError("");
      setPasswordError("");
      setConfirmError("");
      setTermsError("");
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

      const isNameValid = validateName(name);
      const isEmailValid = validateEmail(email);
      const isUserIdValid = validateUserId(userId);
      const isPasswordValid = validatePassword(password);
      const isConfirmValid = validateConfirmPassword(confirmPassword);
      const isTermsValid = validateTerms(acceptTerms);

      // Client-side validations: halt if any check fails
      if (!isNameValid || !isEmailValid || !isUserIdValid || !isPasswordValid || !isConfirmValid || !isTermsValid) {
        setGlobalError("Please review and resolve the highlighted errors before creating your account.");
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
          if (res.status === 429) {
            const retry = Number(data.retryAfter || res.headers.get("Retry-After")) || 60;
            setRateLimitCooldown(retry);
            setGlobalError(data.message || `Too many requests. Please wait ${retry}s.`);
          } else {
            setGlobalError(data.message || "Sign up failed");
          }
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

      {/* ─── Rate Limit Cooldown Warning ─── */}
      {rateLimitCooldown > 0 && (
        <div className="auth-rate-limit-card" role="alert">
          <div className="auth-rate-limit-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
              <ShieldAlert size={18} color="#fbbf24" />
              <span>Security Rate Limit Active</span>
            </div>
            <span className="auth-rate-limit-badge">
              <Clock size={12} /> {rateLimitCooldown}s
            </span>
          </div>
          <div className="auth-rate-limit-body">
            Registration limit reached. Please wait <strong>{rateLimitCooldown} seconds</strong> before submitting again.
          </div>
          <div className="auth-rate-limit-bar">
            <div
              className="auth-rate-limit-bar-fill"
              style={{ width: `${Math.min(100, (rateLimitCooldown / 60) * 100)}%` }}
            />
          </div>
        </div>
      )}

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

      {/* ─── Sign Up Form ─── */}
      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Full Name */}
        <div>
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
              className={`input-field ${config.focusClass} ${nameError ? "input-error" : name && !nameError ? "input-valid" : ""}`}
              placeholder="Full name"
              value={name}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              required
              autoComplete="name"
              aria-label="Full name"
              aria-invalid={!!nameError}
            />
          </div>
          {nameError && (
            <div className="field-error">
              <AlertCircle size={12} />
              <span>{nameError}</span>
            </div>
          )}
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

        {/* User ID */}
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
              id="signup-userId"
              type="text"
              className={`input-field ${config.focusClass} ${userIdError ? "input-error" : userId && !userIdError ? "input-valid" : ""}`}
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
              className={`input-field ${config.focusClass} ${passwordError ? "input-error" : ""}`}
              placeholder="Create password"
              value={password}
              onChange={handlePasswordChange}
              onBlur={handlePasswordBlur}
              required
              autoComplete="new-password"
              aria-label="Create password"
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
              className={`input-field ${config.focusClass} ${confirmError ? "input-error" : confirmPassword && !confirmError && confirmPassword === password ? "input-valid" : ""}`}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
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
        <div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 4 }}>
            <input
              type="checkbox"
              id="accept-terms"
              checked={acceptTerms}
              onChange={handleTermsChange}
              style={{
                marginTop: 3,
                cursor: "pointer",
                accentColor: "var(--primary)",
              }}
            />
            <label htmlFor="accept-terms" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.4, cursor: "pointer" }}>
              I agree to the <Link href="/privacy" style={{ color: "var(--primary)", textDecoration: "underline" }} target="_blank">Privacy Policy</Link> and <Link href="/terms" style={{ color: "var(--primary)", textDecoration: "underline" }} target="_blank">Terms &amp; Conditions</Link>.
            </label>
          </div>
          {termsError && (
            <div className="field-error" style={{ marginTop: 4, marginBottom: 4 }}>
              <AlertCircle size={12} />
              <span>{termsError}</span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          id="signup-submit"
          type="submit"
          className={`btn-primary ${config.btnClass}`}
          disabled={isLoading || rateLimitCooldown > 0}
          style={{
            marginTop: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: isLoading || rateLimitCooldown > 0 ? 0.65 : 1,
            cursor: isLoading || rateLimitCooldown > 0 ? "not-allowed" : "pointer",
          }}
        >
          {rateLimitCooldown > 0 ? (
            <>
              <Clock size={16} /> Cooldown Active ({rateLimitCooldown}s)
            </>
          ) : isLoading ? (
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
