"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import "@/components/Auth/Auth.css";

// Dynamically import components to avoid SSR issues
const LoginForm = dynamic(
  () => import("@/components/Auth/LoginForm"),
  { ssr: false }
);
const SignUpForm = dynamic(
  () => import("@/components/Auth/SignUpForm"),
  { ssr: false }
);
const ForgotPasswordForm = dynamic(
  () => import("@/components/Auth/ForgotPasswordForm"),
  { ssr: false }
);
const VerifyEmailForm = dynamic(
  () => import("@/components/Auth/VerifyEmailForm"),
  { ssr: false }
);

type AuthMode = "login" | "signup" | "forgot" | "verify";
type Role = "student" | "teacher" | "admin";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [, setActiveRole] = useState<Role>("student");
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(true);
  const [loggedOutNotice, setLoggedOutNotice] = useState("");
  const [prefilledEmail, setPrefilledEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  // ─── Session check on mount ───
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("verify") === "true") {
        setMode("verify");
        if (searchParams.get("email")) setPrefilledEmail(searchParams.get("email")!);
        if (searchParams.get("code")) setVerificationCode(searchParams.get("code")!);
        setIsAutoLoggingIn(false);
        return;
      }

      if (searchParams.get("reset") === "true") {
        setMode("forgot");
        if (searchParams.get("email")) setPrefilledEmail(searchParams.get("email")!);
        setIsAutoLoggingIn(false);
        return;
      }

      if (searchParams.get("loggedOut") === "true") {
        setLoggedOutNotice("You have been safely logged out.");
        setIsAutoLoggingIn(false);
        return;
      }

      // Check if user already has an active, valid session
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      const user = localStorage.getItem("user");

      if (token && user) {
        try {
          const parsed = JSON.parse(user);
          if (parsed && parsed.id) {
            router.replace("/dashboard");
            return;
          }
        } catch {
          localStorage.removeItem("user");
          localStorage.removeItem("accessToken");
        }
      }
    } catch {
      // Browser navigation fallback
    } finally {
      setIsAutoLoggingIn(false);
    }
  }, [router]);

  const handleSwitchToSignup = useCallback(() => setMode("signup"), []);
  const handleSwitchToLogin = useCallback((email?: string) => {
    if (email) setPrefilledEmail(email);
    setMode("login");
  }, []);
  const handleSwitchToForgot = useCallback(() => setMode("forgot"), []);
  const handleSwitchToVerify = useCallback((email?: string, code?: string) => {
    if (email) setPrefilledEmail(email);
    if (code) setVerificationCode(code);
    setMode("verify");
  }, []);
  const handleRoleChange = useCallback((role: Role) => setActiveRole(role), []);

  // ─── Auto-login loading state ───
  if (isAutoLoggingIn) {
    return (
      <main className="auth-loading">
        <div className="auth-loading-spinner" />
        <p className="auth-loading-text">Checking session...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="auth-page">
      {/* ═══════════════════════════════════════════
          FULL-SCREEN MASCOT VIDEO BACKGROUND
          ═══════════════════════════════════════════ */}
      <div className="auth-video-bg">
        <video
          className="auth-video"
          src="/mascot-animation.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />
        {/* Gradient overlays for readability */}
        <div className="auth-video-overlay" />
        <div className="auth-video-vignette" />
      </div>

      {/* ═══════════════════════════════════════════
          FLOATING PARTICLES / DECORATIVE ELEMENTS
          ═══════════════════════════════════════════ */}
      <div className="auth-particles">
        <div className="particle particle-1" />
        <div className="particle particle-2" />
        <div className="particle particle-3" />
        <div className="particle particle-4" />
        <div className="particle particle-5" />
      </div>

      {/* ═══════════════════════════════════════════
          FORM CARD — OVERLAID ON THE VIDEO
          ═══════════════════════════════════════════ */}
      <div className="auth-form-container">
        <div className="auth-form-inner">
          {mode === "login" ? (
            <LoginForm
              onSwitchToSignup={handleSwitchToSignup}
              onSwitchToForgotPassword={handleSwitchToForgot}
              onRoleChange={handleRoleChange}
              loggedOutNotice={loggedOutNotice}
              initialEmail={prefilledEmail}
            />
          ) : mode === "signup" ? (
            <SignUpForm
              onSwitchToLogin={() => handleSwitchToLogin()}
              onRoleChange={handleRoleChange}
              onSwitchToVerify={handleSwitchToVerify}
            />
          ) : mode === "forgot" ? (
            <ForgotPasswordForm
              onBackToLogin={(email) => handleSwitchToLogin(email)}
              initialEmail={prefilledEmail}
            />
          ) : (
            <VerifyEmailForm
              initialEmail={prefilledEmail}
              initialCode={verificationCode}
              onBackToLogin={(email) => handleSwitchToLogin(email)}
              onSuccess={() => router.push("/dashboard")}
            />
          )}
        </div>
      </div>
    </main>
  );
}
