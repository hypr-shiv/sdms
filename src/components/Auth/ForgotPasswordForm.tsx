"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Clock,
  X,
} from "lucide-react";

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const PASSWORD_REQUIREMENTS = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

interface ForgotPasswordFormProps {
  onBackToLogin: (prefilledEmail?: string) => void;
  initialEmail?: string;
}

export default function ForgotPasswordForm({
  onBackToLogin,
  initialEmail = "",
}: ForgotPasswordFormProps) {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState(initialEmail);
  const [verificationCode, setVerificationCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0);
  const [emailError, setEmailError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [globalSuccess, setGlobalSuccess] = useState("");

  // Rate limit cooldown countdown
  useEffect(() => {
    if (rateLimitCooldown <= 0) return;
    const interval = setInterval(() => {
      setRateLimitCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitCooldown]);

  const validateEmail = (value: string): boolean => {
    if (!value) {
      setEmailError("Email address is required");
      return false;
    }
    if (!EMAIL_REGEX.test(value) || value.length > 254) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  // ─── Step 1: Request Reset ───
  const handleRequestReset = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setGlobalError("");
      setGlobalSuccess("");

      const cleanEmail = email.trim();
      if (!validateEmail(cleanEmail)) return;

      setIsLoading(true);

      try {
        const res = await fetch(apiUrl("/auth/forgot-password"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail }),
        });

        const data = await res.json();

        if (!res.ok) {
          const rawMsg = data.message || "Failed to process request. Please try again.";
          if (res.status === 429) {
            const retry = Number(data.retryAfter || res.headers?.get("Retry-After")) || 60;
            setRateLimitCooldown(retry);
            setGlobalError(rawMsg);
            return;
          }
          if (res.status === 404 || rawMsg.toLowerCase().includes("not found")) {
            setGlobalError(`No account registered with "${cleanEmail}". Please check for typos or select a demo account above.`);
          } else {
            setGlobalError(rawMsg);
          }
          return;
        }

        // Auto-populate code/token for smooth educational local development
        if (data.resetCode) setVerificationCode(data.resetCode);
        if (data.resetToken) setResetToken(data.resetToken);

        setGlobalSuccess(
          data.resetCode
            ? `Reset code issued! (${data.resetCode}). Enter your new password below.`
            : "Reset instructions sent to your email. Please verify below."
        );
        setStep("reset");
      } catch {
        setGlobalError("Network error. Please make sure the backend is running on port 3001.");
      } finally {
        setIsLoading(false);
      }
    },
    [email]
  );

  // ─── Step 2: Confirm & Update Password ───
  const handleConfirmReset = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setGlobalError("");
      setGlobalSuccess("");
      setCodeError("");
      setPasswordError("");
      setConfirmError("");

      const cleanEmail = email.trim();
      if (!validateEmail(cleanEmail)) return;

      if (!verificationCode.trim()) {
        setCodeError("Reset code is required");
        return;
      }
      if (verificationCode.trim().length !== 6) {
        setCodeError("Reset code must be exactly 6 digits");
        return;
      }

      if (!newPassword) {
        setPasswordError("New password is required");
        return;
      }

      const allMet = PASSWORD_REQUIREMENTS.every((req) => req.test(newPassword));
      if (!allMet) {
        setPasswordError("Password does not meet all security requirements below");
        return;
      }

      if (!confirmPassword) {
        setConfirmError("Please confirm your new password");
        return;
      }

      if (newPassword !== confirmPassword) {
        setConfirmError("Passwords do not match");
        return;
      }

      setIsLoading(true);

      try {
        const res = await fetch(apiUrl("/auth/reset-password"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            newPassword,
            resetToken,
            resetCode: verificationCode,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          const errMsg =
            typeof data.message === "string"
              ? data.message
              : Array.isArray(data.message)
              ? data.message[0]
              : data.error || "Password reset failed. Please request a new code.";
          if (res.status === 429) {
            const retry = Number(data.retryAfter || res.headers?.get("Retry-After")) || 60;
            setRateLimitCooldown(retry);
            setGlobalError(errMsg);
            return;
          }
          setGlobalError(errMsg);
          return;
        }

        setGlobalSuccess("Password updated successfully! Redirecting to sign in...");
        setTimeout(() => {
          onBackToLogin(cleanEmail);
        }, 1200);
      } catch {
        setGlobalError("Network error. Please verify backend connection and try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [email, newPassword, confirmPassword, resetToken, verificationCode, onBackToLogin]
  );

  return (
    <div className="auth-card form-enter" key="forgot-password">
      {/* ─── Header ─── */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 58,
            height: 58,
            borderRadius: 16,
            background:
              "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(99,102,241,0.15))",
            border: "1px solid rgba(212,175,55,0.3)",
            marginBottom: 12,
            color: "#d4af37",
          }}
        >
          <KeyRound size={26} strokeWidth={2} />
        </div>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "#ffffff",
            marginBottom: 4,
          }}
        >
          {step === "request" ? "Reset Password" : "Set New Password"}
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.825rem", margin: 0 }}>
          {step === "request"
            ? "Enter your academic email to receive a password reset code"
            : `Set a strong new password for ${email}`}
        </p>
      </div>

      {/* ─── Rate Limit Cooldown Warning ─── */}
      {rateLimitCooldown > 0 && (
        <div className="auth-rate-limit-card" role="alert" style={{ marginBottom: 16 }}>
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
            Too many password reset requests detected. This action is temporarily paused for{" "}
            <strong>{rateLimitCooldown} seconds</strong> to protect institutional security.
          </div>
          <div className="auth-rate-limit-bar">
            <div
              className="auth-rate-limit-bar-fill"
              style={{ width: `${Math.min(100, (rateLimitCooldown / 60) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* ─── Alerts ─── */}
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
            <CheckCircle2 size={16} />
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

      {/* ─── STEP 1: REQUEST FORM ─── */}
      {step === "request" ? (
        <form onSubmit={handleRequestReset} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Email Quick-Fill Chips */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              marginBottom: 4,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Fill Demo:</span>
            <button
              type="button"
              onClick={() => {
                setEmail("student@scholarpulse.edu");
                setGlobalError("");
              }}
              style={{
                background: "rgba(99, 102, 241, 0.1)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                color: "#a5b4fc",
                padding: "2px 8px",
                borderRadius: 9999,
                fontSize: "0.72rem",
                cursor: "pointer",
              }}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("teacher@scholarpulse.edu");
                setGlobalError("");
              }}
              style={{
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                color: "#6ee7b7",
                padding: "2px 8px",
                borderRadius: 9999,
                fontSize: "0.72rem",
                cursor: "pointer",
              }}
            >
              Faculty
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("admin@scholarpulse.edu");
                setGlobalError("");
              }}
              style={{
                background: "rgba(245, 158, 11, 0.1)",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                color: "#fcd34d",
                padding: "2px 8px",
                borderRadius: 9999,
                fontSize: "0.72rem",
                cursor: "pointer",
              }}
            >
              Admin
            </button>
          </div>

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
                }}
              />
              <input
                id="reset-email"
                type="email"
                className="input-field focus-student"
                placeholder="Institutional email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (globalError) setGlobalError("");
                  if (emailError) setEmailError("");
                }}
                required
                autoComplete="email"
              />
            </div>
            {emailError && (
              <div className="field-error">
                <AlertCircle size={12} />
                <span>{emailError}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary btn-student"
            disabled={isLoading || rateLimitCooldown > 0}
            style={{
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: isLoading || rateLimitCooldown > 0 ? "not-allowed" : "pointer",
              opacity: isLoading || rateLimitCooldown > 0 ? 0.6 : 1,
            }}
          >
            {isLoading ? "Generating Reset Code..." : "Continue"}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>
      ) : (
        /* ─── STEP 2: SET NEW PASSWORD ─── */
        <form onSubmit={handleConfirmReset} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Verification Code */}
          <div>
            <div style={{ position: "relative" }}>
              <ShieldAlert
                size={18}
                style={{
                  position: "absolute",
                  left: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                id="reset-code"
                type="text"
                className={`input-field focus-student ${codeError ? "input-error" : ""}`}
                placeholder="6-digit verification code"
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value);
                  if (globalError) setGlobalError("");
                  if (codeError) setCodeError("");
                }}
                required
                aria-invalid={!!codeError}
              />
            </div>
            {codeError && (
              <div className="field-error">
                <AlertCircle size={12} />
                <span>{codeError}</span>
              </div>
            )}
          </div>

          {/* New Password */}
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
                }}
              />
              <input
                id="reset-new-password"
                type={showPassword ? "text" : "password"}
                className={`input-field focus-student ${passwordError ? "input-error" : ""}`}
                placeholder="New secure password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (globalError) setGlobalError("");
                  if (passwordError) setPasswordError("");
                }}
                required
                aria-invalid={!!passwordError}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
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
                }}
              />
              <input
                id="reset-confirm-password"
                type={showPassword ? "text" : "password"}
                className={`input-field focus-student ${confirmError ? "input-error" : confirmPassword && !confirmError && confirmPassword === newPassword ? "input-valid" : ""}`}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (globalError) setGlobalError("");
                  if (confirmError) setConfirmError("");
                }}
                required
                aria-invalid={!!confirmError}
              />
            </div>
            {confirmError && (
              <div className="field-error">
                <AlertCircle size={12} />
                <span>{confirmError}</span>
              </div>
            )}
            {confirmPassword && !confirmError && confirmPassword === newPassword && (
              <div className="field-success">✓ Passwords match</div>
            )}
          </div>

          {/* Password Requirements Checklist */}
          {newPassword && (
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "var(--radius-md)",
                padding: "10px 12px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 6,
              }}
            >
              {PASSWORD_REQUIREMENTS.map((req, idx) => {
                const met = req.test(newPassword);
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: "0.72rem",
                      color: met ? "#4ade80" : "var(--text-muted)",
                    }}
                  >
                    <span style={{ fontSize: "0.8rem" }}>{met ? "✓" : "○"}</span>
                    <span>{req.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary btn-student"
            disabled={isLoading || rateLimitCooldown > 0}
            style={{
              marginTop: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: isLoading || rateLimitCooldown > 0 ? "not-allowed" : "pointer",
              opacity: isLoading || rateLimitCooldown > 0 ? 0.6 : 1,
            }}
          >
            {isLoading ? "Updating Password..." : "Update Password"}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>
      )}

      {/* ─── Back to Login Footer ─── */}
      <div style={{ marginTop: 22, textAlign: "center" }}>
        <button
          type="button"
          onClick={() => onBackToLogin(email)}
          style={{
            background: "none",
            border: "none",
            color: "#94a3b8",
            fontSize: "0.825rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
        >
          <ArrowLeft size={16} />
          Back to Sign In
        </button>
      </div>
    </div>
  );
}
