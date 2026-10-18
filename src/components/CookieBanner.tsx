"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "./CookieBanner.css";

interface CookieConsentPreferences {
  accepted: boolean;
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  timestamp: string;
}

const STORAGE_KEY = "scholarpulse_cookie_consent";

export default function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    functional: true,
    analytics: true,
  });

  useEffect(() => {
    setMounted(true);

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CookieConsentPreferences;
        setPreferences({
          necessary: true,
          functional: parsed.functional ?? true,
          analytics: parsed.analytics ?? true,
        });
      } else {
        // Natural entrance delay for a smoother user experience
        const timer = setTimeout(() => setShowBanner(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      setShowBanner(true);
    }
  }, []);

  // Listen for global custom event to reopen cookie settings from footer
  useEffect(() => {
    const handleOpenSettings = () => {
      setShowBanner(false);
      setShowModal(true);
    };

    window.addEventListener("open-cookie-settings", handleOpenSettings);
    return () => window.removeEventListener("open-cookie-settings", handleOpenSettings);
  }, []);

  const saveConsent = (functional: boolean, analytics: boolean) => {
    const consentData: CookieConsentPreferences = {
      accepted: true,
      necessary: true,
      functional,
      analytics,
      timestamp: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consentData));
    } catch (e) {
      console.warn("Unable to save cookie consent to localStorage:", e);
    }

    setPreferences({
      necessary: true,
      functional,
      analytics,
    });
    setShowBanner(false);
    setShowModal(false);
  };

  const handleAcceptAll = () => {
    saveConsent(true, true);
  };

  const handleRejectNonEssential = () => {
    saveConsent(false, false);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences.functional, preferences.analytics);
  };

  if (!mounted) return null;

  return (
    <>
      {/* ─── Floating Cookie Consent Banner ─── */}
      {showBanner && (
        <aside className="cookie-banner-wrapper" aria-label="Cookie consent banner" role="dialog">
          <div className="cookie-banner-card">
            <div className="cookie-header">
              <div className="cookie-icon-badge" aria-hidden="true">
                🍪
              </div>
              <div className="cookie-header-text">
                <h3>Cookie &amp; Privacy Preferences</h3>
                <p>ScholarPulse Academic Intelligence</p>
              </div>
            </div>

            <div className="cookie-body">
              <p>
                We use cookies to maintain your authenticated academic sessions, ensure system security, and power tailored learning insights. Review our{" "}
                <Link href="/privacy">Privacy Policy</Link> and{" "}
                <Link href="/terms">Terms &amp; Conditions</Link> for details.
              </p>
            </div>

            <div className="cookie-actions">
              <button
                type="button"
                onClick={handleAcceptAll}
                className="btn-cookie-accept"
              >
                Accept All
              </button>
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="btn-cookie-reject"
              >
                Essential Only
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBanner(false);
                  setShowModal(true);
                }}
                className="btn-cookie-manage"
              >
                Customize
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ─── Preferences Modal ─── */}
      {showModal && (
        <div className="cookie-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="cookie-modal-title">
          <div className="cookie-modal">
            <div className="cookie-modal-header">
              <h2 id="cookie-modal-title">Customize Cookie Settings</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="cookie-modal-close"
                aria-label="Close cookie preferences modal"
              >
                ✕
              </button>
            </div>

            <div className="cookie-modal-content">
              <p className="cookie-modal-intro">
                When you visit ScholarPulse, we store information through cookies to optimize your learning workflow, preserve dashboard settings, and evaluate platform reliability. You can personalize your cookie categories below:
              </p>

              <div className="cookie-categories-list">
                {/* 1. Necessary */}
                <div className="cookie-category-item">
                  <div className="cookie-category-top">
                    <div className="cookie-category-info">
                      <h4>Strictly Necessary Cookies</h4>
                      <p className="cookie-category-desc">
                        Required for logging in, role authentication (RBAC), CSRF protection, and keeping your session securely alive.
                      </p>
                    </div>
                    <span className="cookie-badge-always-active">Always Active</span>
                  </div>
                </div>

                {/* 2. Functional & Learning */}
                <div className="cookie-category-item">
                  <div className="cookie-category-top">
                    <div className="cookie-category-info">
                      <h4>Functional &amp; Learning Preferences</h4>
                      <p className="cookie-category-desc">
                        Saves dashboard layout preferences, AI Copilot voice preferences, active semester filters, and language settings.
                      </p>
                    </div>
                    <label className="cookie-switch">
                      <input
                        type="checkbox"
                        checked={preferences.functional}
                        onChange={(e) =>
                          setPreferences({ ...preferences, functional: e.target.checked })
                        }
                      />
                      <span className="cookie-slider"></span>
                    </label>
                  </div>
                </div>

                {/* 3. Analytics */}
                <div className="cookie-category-item">
                  <div className="cookie-category-top">
                    <div className="cookie-category-info">
                      <h4>Analytics &amp; Performance Telemetry</h4>
                      <p className="cookie-category-desc">
                        Collects anonymous load times and error logs to help us improve page transitions and prevent campus bottleneck issues.
                      </p>
                    </div>
                    <label className="cookie-switch">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) =>
                          setPreferences({ ...preferences, analytics: e.target.checked })
                        }
                      />
                      <span className="cookie-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="cookie-modal-footer">
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="btn-cookie-reject"
              >
                Reject Non-Essential
              </button>
              <button
                type="button"
                onClick={handleSavePreferences}
                className="btn-cookie-save"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Persistent Reopen Trigger Button (Bottom Left) ─── */}
      {!showBanner && !showModal && (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="cookie-reopen-trigger"
          title="Cookie & Privacy Preferences"
          aria-label="Open cookie preferences"
        >
          🍪
        </button>
      )}
    </>
  );
}
