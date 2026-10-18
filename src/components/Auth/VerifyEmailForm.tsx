"use client";

import { useState, useCallback, useRef, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MailCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Edit2,
  X,
} from "lucide-react";

interface VerifyEmailFormProps {
  initialEmail?: string;
  initialCode?: string;
  onBackToLogin?: (prefilledEmail?: string) => void;
  onSuccess?: () => void;
}

export default function VerifyEmailForm({
  initialEmail = "",
  initialCode = "",
  onBackToLogin,
  onSuccess,
}: VerifyEmailFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(!initialEmail);
  const [digits, setDigits] = useState<string[]>(() => {
    if (initialCode && initialCode.length === 6) {
      return initialCode.split("");
    }
    return ["", "", "", "", "", ""];
  });
  const [activeCode, setActiveCode] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [emailError, setEmailError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [globalSuccess, setGlobalSuccess] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (!isEditingEmail && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isEditingEmail]);

  // Handle countdown timer for Resend button
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Quick switch demo email helper
  const handleSetDemoEmail = (demoEmail: string) => {
    setEmail(demoEmail);
    setIsEditingEmail(false);
    setEmailError("");
    setCodeError("");
    setGlobalError("");
    setGlobalSuccess("");
  };

  const validateEmail = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setEmailError("Institutional email address is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  // Handle individual digit change
  const handleDigitChange = (index: number, value: string) => {
    setGlobalError("");
    setCodeError("");
    const cleaned = value.replace(/\D/g, "");

    // Handle typing single character
    if (cleaned.length <= 1) {
      const nextDigits = [...digits];
      nextDigits[index] = cleaned;
      setDigits(nextDigits);

      // Auto-advance to next input
      if (cleaned && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
      return;
    }

    // Handle pasting multiple digits into a box
    const pastedDigits = cleaned.slice(0, 6).split("");
    const nextDigits = [...digits];
    pastedDigits.forEach((char, i) => {
      if (index + i < 6) {
        nextDigits[index + i] = char;
      }
    });
    setDigits(nextDigits);

    const nextFocus = Math.min(5, index + pastedDigits.length);
    inputRefs.current[nextFocus]?.focus();
  };

  // Handle backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    setGlobalError("");
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste event
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    setGlobalError("");
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const nextDigits = [...digits];
    pasted.split("").forEach((char, i) => {
      if (i < 6) nextDigits[i] = char;
    });
    setDigits(nextDigits);

    const targetIndex = Math.min(5, pasted.length);
    inputRefs.current[targetIndex]?.focus();
  };

  // Quick fill helper
  const handleQuickFill = () => {
    if (!activeCode) return;
    const chars = activeCode.trim().slice(0, 6).split("");
    if (chars.length === 6) {
      setDigits(chars);
      setCodeError("");
      setGlobalError("");
      inputRefs.current[5]?.focus();
    }
  };

  // Resend code handler
  const handleResend = useCallback(async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setGlobalError("Please provide a valid institutional email address.");
      return;
    }

    setIsResending(true);
    setGlobalError("");
    setGlobalSuccess("");

    try {
      const res = await fetch("http://localhost:3001/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        const rawMsg = data.message || "Failed to resend code.";
        if (res.status === 404 || rawMsg.toLowerCase().includes("not found")) {
          setGlobalError(
            `No registered account found for "${cleanEmail}". Check for typos or use our demo student: student@scholarpulse.edu.`
          );
        } else {
          setGlobalError(rawMsg);
        }
        return;
      }

      if (data.alreadyVerified) {
        setIsVerified(true);
        setGlobalSuccess("This email is already verified! Redirecting to dashboard...");
        setTimeout(() => {
          if (onSuccess) onSuccess();
          else router.push("/dashboard");
        }, 1200);
        return;
      }

      if (data.verificationCode) {
        setActiveCode(data.verificationCode);
      }

      setCooldown(60);
      setGlobalSuccess(
        data.verificationCode
          ? `New verification code issued (${data.verificationCode})! Click 'Fill Code' below.`
          : "A new verification code has been dispatched to your email."
      );
    } catch {
      setGlobalError("Network error. Please make sure the backend server is running on port 3001.");
    } finally {
      setIsResending(false);
    }
  }, [email, router, onSuccess]);

  // Submit verification
  const handleVerify = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setGlobalError("");
      setGlobalSuccess("");
      setCodeError("");

      const cleanEmail = email.trim();
      const isEmailValid = validateEmail(cleanEmail);
      if (!isEmailValid) {
        setGlobalError("Please provide a valid email address to verify.");
        return;
      }

      const fullCode = digits.join("").trim();
      if (fullCode.length !== 6) {
        setCodeError("Please enter the complete 6-digit verification code.");
        setGlobalError("Please enter all 6 digits of your security code.");
        return;
      }

      setIsLoading(true);

      try {
        const res = await fetch("http://localhost:3001/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            code: fullCode,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          const rawMsg =
            typeof data.message === "string"
              ? data.message
              : Array.isArray(data.message)
              ? data.message[0]
              : "Verification failed. Please double-check your code.";

          if (res.status === 404 || rawMsg.toLowerCase().includes("not found")) {
            setGlobalError(
              `No account found for "${cleanEmail}". Check for typos or switch to demo student account (student@scholarpulse.edu).`
            );
          } else if (rawMsg.toLowerCase().includes("invalid or expired")) {
            setGlobalError("The code entered is invalid or has expired. Please check your digits or click Resend Code.");
          } else {
            setGlobalError(rawMsg);
          }
          return;
        }

        // Update stored session if present
        if (data.access_token) {
          localStorage.setItem("accessToken", data.access_token);
          localStorage.setItem("token", data.access_token);
          document.cookie = `accessToken=${data.access_token}; Path=/; SameSite=Lax;`;
        }

        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            parsed.isEmailVerified = true;
            localStorage.setItem("user", JSON.stringify(parsed));
          } catch {
            // ignore
          }
        } else if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        setIsVerified(true);
        setGlobalSuccess(data.message || "Institutional email verified successfully!");

        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push("/dashboard");
          }
        }, 1500);
      } catch {
        setGlobalError("Network error. Please verify the backend is running on port 3001.");
      } finally {
        setIsLoading(false);
      }
    },
    [email, digits, router, onSuccess]
  );

  return (
    <div className="auth-card form-enter" key="verify-email">
      {/* ─── Header ─── */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 68,
            height: 68,
            borderRadius: 20,
            background: isVerified
              ? "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))"
              : "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))",
            border: isVerified
              ? "1px solid rgba(16, 185, 129, 0.3)"
              : "1px solid rgba(99, 102, 241, 0.3)",
            color: isVerified ? "#10b981" : "#818cf8",
            marginBottom: 16,
            boxShadow: isVerified
              ? "0 8px 32px rgba(16, 185, 129, 0.2)"
              : "0 8px 32px rgba(99, 102, 241, 0.2)",
          }}
        >
          {isVerified ? <CheckCircle2 size={34} /> : <MailCheck size={34} />}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 8 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              background: "rgba(99, 102, 241, 0.12)",
              color: "#a5b4fc",
              border: "1px solid rgba(99, 102, 241, 0.25)",
            }}
          >
            <ShieldCheck size={12} /> Institutional Security
          </span>
        </div>

        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "#f8fafc",
            margin: "0 0 6px",
            letterSpacing: "-0.02em",
          }}
        >
          {isVerified ? "Email Verified!" : "Verify Your Email"}
        </h1>

        <p
          style={{
            color: "#94a3b8",
            fontSize: "0.875rem",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {isVerified
            ? "Your identity has been confirmed. Redirecting to your dashboard..."
            : "Enter the 6-digit verification code sent to your academic inbox."}
        </p>

        {/* Target Email display / edit */}
        {!isVerified && (
          <div
            style={{
              marginTop: 12,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 12,
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              fontSize: "0.85rem",
              color: "#cbd5e1",
            }}
          >
            {isEditingEmail ? (
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (globalError) setGlobalError("");
                  if (emailError) validateEmail(e.target.value);
                }}
                onBlur={() => {
                  if (email) validateEmail(email);
                }}
                placeholder="student@scholarpulse.edu"
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#f8fafc",
                  fontFamily: "inherit",
                  fontSize: "0.85rem",
                  width: 220,
                }}
              />
            ) : (
              <span style={{ fontWeight: 600, color: "#f8fafc" }}>{email || "No email specified"}</span>
            )}

            <button
              type="button"
              onClick={() => {
                setIsEditingEmail(!isEditingEmail);
                if (globalError) setGlobalError("");
              }}
              title={isEditingEmail ? "Save email" : "Edit email"}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: 2,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <Edit2 size={13} />
            </button>
          </div>
        )}

        {emailError && (
          <div className="field-error" style={{ justifyContent: "center", marginTop: 6 }}>
            <AlertCircle size={12} />
            <span>{emailError}</span>
          </div>
        )}

        {/* Quick Demo Switcher */}
        {!isVerified && (
          <div
            style={{
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Demo Accounts:</span>
            <button
              type="button"
              onClick={() => handleSetDemoEmail("student@scholarpulse.edu")}
              style={{
                background: "rgba(99, 102, 241, 0.12)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                color: "#a5b4fc",
                padding: "2px 8px",
                borderRadius: 9999,
                fontSize: "0.72rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              title="Test with registered student account"
            >
              student@scholarpulse.edu
            </button>
            <button
              type="button"
              onClick={() => handleSetDemoEmail("teacher@scholarpulse.edu")}
              style={{
                background: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                color: "#6ee7b7",
                padding: "2px 8px",
                borderRadius: 9999,
                fontSize: "0.72rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              title="Test with registered faculty account"
            >
              teacher@scholarpulse.edu
            </button>
          </div>
        )}
      </div>

      {/* ─── Global Error Banner ─── */}
      {globalError && (
        <div
          role="alert"
          className="auth-alert error"
          style={{ marginBottom: 20 }}
        >
          <div className="auth-alert-content">
            <AlertCircle size={18} />
            <div className="auth-alert-text">
              <div>{globalError}</div>
              {globalError.includes("student@scholarpulse.edu") && (
                <button
                  type="button"
                  onClick={() => handleSetDemoEmail("student@scholarpulse.edu")}
                  className="auth-alert-action-btn"
                  title="Switch to registered demo student"
                >
                  <Sparkles size={12} /> Use student@scholarpulse.edu
                </button>
              )}
            </div>
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

      {/* ─── Global Success Banner ─── */}
      {globalSuccess && (
        <div
          role="status"
          className="auth-alert success"
          style={{ marginBottom: 20 }}
        >
          <div className="auth-alert-content">
            <CheckCircle2 size={18} />
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

      {!isVerified ? (
        <form onSubmit={handleVerify}>
          {/* ─── 6-Digit Code Input Boxes ─── */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 10,
                textAlign: "center",
              }}
            >
              6-Digit Security Code
            </label>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
              }}
              onPaste={handlePaste}
            >
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  aria-label={`Digit ${i + 1}`}
                  style={{
                    width: 46,
                    height: 56,
                    textAlign: "center",
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    fontFamily: "monospace",
                    borderRadius: 12,
                    background: digit ? "rgba(99, 102, 241, 0.08)" : "rgba(15, 23, 42, 0.6)",
                    border: codeError && !digit
                      ? "2px solid #f87171"
                      : digit
                      ? "2px solid #818cf8"
                      : "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#f8fafc",
                    outline: "none",
                    transition: "all 0.15s ease",
                    boxShadow: codeError && !digit
                      ? "0 0 12px rgba(239, 68, 68, 0.25)"
                      : digit
                      ? "0 0 16px rgba(99, 102, 241, 0.25)"
                      : "none",
                  }}
                />
              ))}
            </div>

            {codeError && (
              <div className="field-error" style={{ justifyContent: "center", marginTop: 8 }}>
                <AlertCircle size={12} />
                <span>{codeError}</span>
              </div>
            )}
          </div>

          {/* ─── Quick Fill Chip (Convenience for testing / dev) ─── */}
          {activeCode && (
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <button
                type="button"
                onClick={handleQuickFill}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 12px",
                  borderRadius: 20,
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  background: "rgba(99, 102, 241, 0.12)",
                  color: "#c7d2fe",
                  border: "1px dashed rgba(99, 102, 241, 0.4)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <Sparkles size={12} color="#818cf8" />
                Fill Code: <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{activeCode}</span>
              </button>
            </div>
          )}

          {/* ─── Verify Action Button ─── */}
          <button
            type="submit"
            disabled={isLoading || digits.join("").length !== 6}
            className="auth-btn btn-student"
            style={{
              width: "100%",
              height: 48,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: isLoading || digits.join("").length !== 6 ? "not-allowed" : "pointer",
              opacity: isLoading || digits.join("").length !== 6 ? 0.6 : 1,
              marginBottom: 16,
            }}
          >
            {isLoading ? (
              <>
                <div
                  style={{
                    width: 18,
                    height: 18,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Confirm & Activate Account</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>

          {/* ─── Resend Code & Cooldown ─── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              marginBottom: 20,
              fontSize: "0.82rem",
            }}
          >
            <span style={{ color: "#94a3b8" }}>Didn't receive the email?</span>
            <button
              type="button"
              disabled={isResending || cooldown > 0}
              onClick={handleResend}
              style={{
                background: "transparent",
                border: "none",
                color: cooldown > 0 ? "#64748b" : "#818cf8",
                fontWeight: 600,
                cursor: cooldown > 0 || isResending ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: "0.82rem",
              }}
            >
              <RefreshCw size={12} className={isResending ? "spin" : ""} />
              {cooldown > 0 ? `Resend in ${cooldown}s` : isResending ? "Sending..." : "Resend Code"}
            </button>
          </div>
        </form>
      ) : (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <button
            type="button"
            onClick={() => {
              if (onSuccess) onSuccess();
              else router.push("/dashboard");
            }}
            className="auth-btn btn-student"
            style={{
              width: "100%",
              height: 48,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <span>Proceed to Dashboard</span>
            <ArrowRight size={17} />
          </button>
        </div>
      )}

      {/* ─── Footer: Back to Login ─── */}
      <div
        style={{
          textAlign: "center",
          paddingTop: 16,
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (onBackToLogin) {
              onBackToLogin(email);
            } else {
              router.push("/login");
            }
          }}
          style={{
            background: "transparent",
            border: "none",
            color: "#94a3b8",
            fontSize: "0.85rem",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f8fafc")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
        >
          <ArrowLeft size={14} /> Back to Sign In
        </button>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
