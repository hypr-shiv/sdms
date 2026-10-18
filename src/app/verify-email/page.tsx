"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import "@/components/Auth/Auth.css";

const VerifyEmailForm = dynamic(
  () => import("@/components/Auth/VerifyEmailForm"),
  { ssr: false }
);

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const codeParam = searchParams.get("code");
    if (emailParam) setEmail(emailParam);
    if (codeParam) setCode(codeParam);
  }, [searchParams]);

  return (
    <main className="auth-page">
      {/* Background Mascot Video */}
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
        <div className="auth-video-overlay" />
        <div className="auth-video-vignette" />
      </div>

      {/* Floating Particles */}
      <div className="auth-particles">
        <div className="particle particle-1" />
        <div className="particle particle-2" />
        <div className="particle particle-3" />
        <div className="particle particle-4" />
        <div className="particle particle-5" />
      </div>

      <div className="auth-form-container">
        <div className="auth-form-inner">
          <VerifyEmailForm
            initialEmail={email}
            initialCode={code}
            onBackToLogin={() => router.push("/login")}
            onSuccess={() => router.push("/dashboard")}
          />
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-loading">
          <div className="auth-loading-spinner" />
          <p className="auth-loading-text">Loading verification...</p>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
