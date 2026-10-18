"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
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
  const [emailError, setEmailError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [globalSuccess, setGlobalSuccess] = useState("");

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
        const res = await fetch("http://localhost:3001/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail }),
        });

        const data = await res.json();

        if (!res.ok) {
          setGlobalError(data.message || "Failed to process request. Please try again.");
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

      const cleanEmail = email.trim();
      if (!validateEmail(cleanEmail)) return;

      const allMet = PASSWORD_REQUIREMENTS.every((req) => req.test(newPassword));
      if (!allMet) {
        setGlobalError("Password does not meet all security requirements");
        return;
      }

      if (newPassword !== confirmPassword) {
        setGlobalError("Passwords do not match");
        return;
      }

      setIsLoading(true);

      try {
        const res = await fetch("http://localhost:3001/auth/reset-password", {
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

      {/* ─── Alerts ─── */}
      {globalError && (
        <div className="auth-alert error">
          <AlertCircle size={16} />
          <span>{globalError}</span>
        </div>
      )}
      {globalSuccess && (
        <div className="auth-alert success">
          <CheckCircle2 size={16} />
          <span>{globalSuccess}</span>
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
              onClick={() => setEmail("student@scholarpulse.edu")}
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
              onClick={() => setEmail("teacher@scholarpulse.edu")}
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
              onClick={() => setEmail("admin@scholarpulse.edu")}
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
            disabled={isLoading}
            style={{
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: isLoading ? "not-allowed" : "pointer",
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
                  transform: "translateY(-50)",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                id="reset-code"
                type="text"
                className="input-field focus-student"
                placeholder="6-digit verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
              />
            </div>
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
                className="input-field focus-student"
                placeholder="New secure password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
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
                className="input-field focus-student"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
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
            disabled={isLoading}
            style={{
              marginTop: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: isLoading ? "not-allowed" : "pointer",
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
