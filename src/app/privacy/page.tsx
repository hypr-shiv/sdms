"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import "./privacy.css";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function PrivacyPolicy() {
  return (
    <main className="privacy-page">
      {/* ─── Navigation ─── */}
      <nav className="privacy-nav">
        <div className="privacy-nav-inner">
          <Link href="/" className="privacy-logo">
            <span className="logo-icon">▲</span>
            <span className="logo-text">ScholarPulse</span>
          </Link>
          <div className="privacy-nav-actions">
            <Link href="/terms" style={{ color: "#94a3b8", fontSize: "0.875rem", textDecoration: "none", marginRight: "1rem" }}>
              Terms
            </Link>
            <Link href="/login" className="btn-nav-login">
              Log In
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="privacy-hero">
        <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
          <h1 className="privacy-title">Privacy Policy</h1>
          <p className="privacy-subtitle">
            We are committed to protecting your personal information and your right to privacy.
          </p>
          <div className="privacy-date">Last Updated: October 8, 2026</div>
        </motion.div>
      </section>

      {/* ─── Content ─── */}
      <motion.section 
        className="privacy-content"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div className="privacy-section" variants={fadeInUp}>
          <h2>1. Introduction</h2>
          <p>
            Welcome to ScholarPulse ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice or our practices with regard to your personal information, please contact us.
          </p>
          <p>
            When you visit our website and use our services (the "Services"), you trust us with your personal information. We take your privacy very seriously. In this privacy notice, we describe our privacy policy.
          </p>
        </motion.div>

        <motion.div className="privacy-section" variants={fadeInUp}>
          <h2>2. Information We Collect</h2>
          <p>
            We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.
          </p>
          <ul>
            <li><strong>Personal Information Provided by You:</strong> We collect names; email addresses; usernames; passwords; institutional affiliations; and other similar information.</li>
            <li><strong>Academic Data:</strong> Courses enrolled, grades, assignment submissions, and interaction logs with AI tutoring systems.</li>
            <li><strong>Automatically Collected Information:</strong> We automatically collect certain information when you visit, use, or navigate the Services (e.g., IP address, browser type, device characteristics).</li>
          </ul>
        </motion.div>

        <motion.div className="privacy-section" variants={fadeInUp}>
          <h2>3. How We Use Your Information</h2>
          <p>
            We use personal information collected via our Services for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
          </p>
          <ul>
            <li>To facilitate account creation and logon process.</li>
            <li>To manage user accounts and provide academic infrastructure services.</li>
            <li>To power AI Copilot functionalities using provided academic context.</li>
            <li>To protect our Services from misuse and unauthorized access.</li>
          </ul>
        </motion.div>

        <motion.div className="privacy-section" variants={fadeInUp}>
          <h2>4. Will Your Information Be Shared?</h2>
          <p>
            We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We may process or share your data that we hold based on the following legal basis:
          </p>
          <ul>
            <li><strong>Consent:</strong> We may process your data if you have given us specific consent to use your personal information.</li>
            <li><strong>Legitimate Interests:</strong> We may process your data when it is reasonably necessary to achieve our legitimate business interests.</li>
            <li><strong>Performance of a Contract:</strong> Where we have entered into a contract with you (or your institution), we may process your personal information to fulfill the terms of our contract.</li>
          </ul>
        </motion.div>

        <motion.div className="privacy-section" variants={fadeInUp}>
          <h2>5. AI Processing & Third Parties</h2>
          <p>
            Some features of ScholarPulse, such as the AI Copilot and Predictive Analytics, utilize large language models (e.g., NVIDIA AI services). When you interact with these features, course context and queries may be processed by these external providers. However, we ensure that:
          </p>
          <ul>
            <li>No personally identifiable information (PII) is sent to external AI providers unless explicitly required for the query.</li>
            <li>Data processed by AI partners is not used to train their foundational models.</li>
          </ul>
        </motion.div>

        <motion.div className="privacy-section" variants={fadeInUp}>
          <h2>6. Data Security</h2>
          <p>
            We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
          </p>
        </motion.div>

        <motion.div className="privacy-section" variants={fadeInUp}>
          <h2>7. Contact Us</h2>
          <p>
            If you have questions or comments about this notice, you may email us at privacy@scholarpulse.edu or by post to:
          </p>
          <p>
            ScholarPulse Inc.<br/>
            123 Innovation Drive<br/>
            Tech District, CA 94105
          </p>
        </motion.div>
      </motion.section>

      {/* ─── Footer ─── */}
      <footer className="privacy-footer">
        <p>&copy; {new Date().getFullYear()} ScholarPulse Inc. All rights reserved. <Link href="/terms" style={{ color: "#d4af37", textDecoration: "none", margin: "0 0.5rem" }}>Terms &amp; Conditions</Link> &bull; <Link href="/" style={{ color: "#d4af37", textDecoration: "none", margin: "0 0.5rem" }}>Return to Platform</Link></p>
      </footer>
    </main>
  );
}
