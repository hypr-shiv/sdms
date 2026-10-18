"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import "./terms.css";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const SECTIONS = [
  { id: "acceptance", title: "1. Acceptance of Terms", num: "01" },
  { id: "accounts", title: "2. User Accounts & Security", num: "02" },
  { id: "roles", title: "3. Institutional Roles", num: "03" },
  { id: "academic-integrity", title: "4. Academic Integrity", num: "04" },
  { id: "ai-copilot", title: "5. AI Copilot Guidelines", num: "05" },
  { id: "records-ferpa", title: "6. Data & Academic Records", num: "06" },
  { id: "availability", title: "7. System Availability & SLA", num: "07" },
  { id: "intellectual-property", title: "8. Intellectual Property", num: "08" },
  { id: "fees", title: "9. Fees & Billing", num: "09" },
  { id: "liability", title: "10. Limitation of Liability", num: "10" },
  { id: "termination", title: "11. Account Termination", num: "11" },
  { id: "contact", title: "12. Governing Law & Contact", num: "12" },
];

export default function TermsAndConditions() {
  const [activeSection, setActiveSection] = useState("acceptance");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <main className="terms-page">
      {/* ─── Navigation ─── */}
      <nav className="terms-nav">
        <div className="terms-nav-inner">
          <Link href="/" className="terms-logo">
            <span className="logo-icon">▲</span>
            <span className="logo-text">ScholarPulse</span>
          </Link>
          <div className="terms-nav-actions">
            <Link href="/privacy" className="terms-nav-link">
              Privacy Policy
            </Link>
            <Link href="/login" className="btn-nav-login">
              Log In
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="terms-hero">
        <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
          <div className="terms-badge">
            <span className="terms-badge-dot"></span>
            Legal Agreements
          </div>
          <h1 className="terms-title">Terms and Conditions</h1>
          <p className="terms-subtitle">
            Please read these terms carefully before accessing or using the ScholarPulse Academic Management Platform and AI Learning Suite.
          </p>

          <div className="terms-meta-bar">
            <div className="terms-date-pill">
              Effective Date: <strong>October 17, 2026</strong>
            </div>
            <button type="button" onClick={handlePrint} className="terms-print-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Print / Save PDF
            </button>
          </div>
        </motion.div>
      </section>

      {/* ─── Key Highlights Card (TL;DR) ─── */}
      <section className="terms-tldr-wrapper">
        <div className="terms-tldr-card">
          <div className="tldr-header">
            <div className="tldr-icon">✓</div>
            <h3>Key Highlights at a Glance</h3>
          </div>
          <div className="tldr-grid">
            <div className="tldr-item">
              <div className="tldr-item-title">Authorized Access</div>
              <p>Platform accounts are strictly personal and tied to institutional email IDs or accredited student enrollments.</p>
            </div>
            <div className="tldr-item">
              <div className="tldr-item-title">Academic Integrity</div>
              <p>Automated tools, AI Copilot, and resources must adhere to your university honor code and plagiarism rules.</p>
            </div>
            <div className="tldr-item">
              <div className="tldr-item-title">Data Privacy &amp; Records</div>
              <p>We comply with educational privacy standards (FERPA / GDPR) ensuring grades and personal data remain protected.</p>
            </div>
            <div className="tldr-item">
              <div className="tldr-item-title">Responsible AI Use</div>
              <p>AI assistance is designed as an educational accelerator, not a replacement for independent student assessment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Main Content with Sticky TOC ─── */}
      <div className="terms-container">
        {/* Sidebar TOC */}
        <aside className="terms-sidebar">
          <div className="sidebar-title">Table of Contents</div>
          <nav className="toc-nav">
            {SECTIONS.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className={`toc-link ${activeSection === sec.id ? "active" : ""}`}
              >
                {sec.title}
              </a>
            ))}
          </nav>
          <div className="sidebar-contact-card">
            <p>Questions or institutional contracts inquiries?</p>
            <Link href="mailto:legal@scholarpulse.edu" className="sidebar-contact-btn">
              legal@scholarpulse.edu →
            </Link>
          </div>
        </aside>

        {/* Clauses Content */}
        <motion.article 
          className="terms-content"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Section 1 */}
          <motion.section id="acceptance" className="terms-section" variants={fadeInUp}>
            <h2>
              <span className="section-num">01</span>
              Acceptance of Terms
            </h2>
            <p>
              These Terms and Conditions (&quot;Terms&quot;, &quot;Agreement&quot;) constitute a legally binding agreement between you (&quot;User&quot;, &quot;Student&quot;, &quot;Faculty&quot;, or &quot;Institutional Administrator&quot;) and ScholarPulse Inc. (&quot;ScholarPulse&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) concerning your access to and use of the ScholarPulse web applications, mobile interfaces, API services, and associated academic tooling (collectively, the &quot;Services&quot;).
            </p>
            <p>
              By accessing, registering for, or using our Services, you certify that you have read, understood, and agreed to be bound by these Terms, as well as our <Link href="/privacy" style={{ color: "#d4af37", textDecoration: "underline" }}>Privacy Policy</Link>. If you do not agree with all of these terms, you are expressly prohibited from using the platform and must discontinue use immediately.
            </p>
          </motion.section>

          {/* Section 2 */}
          <motion.section id="accounts" className="terms-section" variants={fadeInUp}>
            <h2>
              <span className="section-num">02</span>
              User Accounts, Access &amp; Security
            </h2>
            <p>
              To access the student dashboard, attendance records, exam schedules, and grade books, you must register for an authenticated account using valid credentials authorized by your affiliated educational institution or program.
            </p>
            <ul>
              <li><strong>Account Confidentiality:</strong> You are strictly responsible for maintaining the confidentiality of your login credentials, passwords, and multi-factor authentication (MFA) tokens.</li>
              <li><strong>No Sharing:</strong> Sharing account credentials, student IDs, or session tokens with other students or unauthorized third parties is strictly prohibited.</li>
              <li><strong>Breach Notification:</strong> You must promptly notify our security team at security@scholarpulse.edu if you discover or suspect any unauthorized access to your account.</li>
            </ul>
          </motion.section>

          {/* Section 3 */}
          <motion.section id="roles" className="terms-section" variants={fadeInUp}>
            <h2>
              <span className="section-num">03</span>
              Institutional Roles &amp; Permissions
            </h2>
            <p>
              ScholarPulse enforces strict Role-Based Access Control (RBAC). Your access permissions are partitioned based on your designated institutional identity:
            </p>
            <ul>
              <li><strong>Students:</strong> Access to personal grade reports, attendance records, assignments, enrolled course materials, calendar timelines, and individual AI tutoring tools.</li>
              <li><strong>Faculty &amp; Instructors:</strong> Course curriculum management, student attendance verification, assignment grading, exam scheduling, and lecture note uploads.</li>
              <li><strong>Advisors &amp; Staff:</strong> Academic progress tracking, intervention flags, student counsel notes, and departmental schedules.</li>
              <li><strong>System Administrators:</strong> Campus-wide user provisioning, semester cycle configuration, audit logs, and institutional integration settings.</li>
            </ul>
            <div className="terms-callout">
              <p>
                <strong>Important:</strong> Any attempt to circumvent role boundaries, manipulate API authorization headers, or access unauthorized student records will result in immediate suspension and disciplinary reporting to institutional authorities.
              </p>
            </div>
          </motion.section>

          {/* Section 4 */}
          <motion.section id="academic-integrity" className="terms-section" variants={fadeInUp}>
            <h2>
              <span className="section-num">04</span>
              Academic Integrity &amp; Acceptable Use
            </h2>
            <p>
              ScholarPulse is committed to fostering academic honesty and ethical digital learning environments. When utilizing our dashboard and collaboration tools:
            </p>
            <ul>
              <li>You shall not submit fraudulent attendance verifications, falsified medical excuses, or alter timestamp records.</li>
              <li>You shall not use the platform to transmit, distribute, or store any malicious code, viruses, automated scrapers, or DDoS tools.</li>
              <li>You shall not copy, distribute, or commercially exploit exams, quiz answer keys, lecture materials, or fellow student submissions without explicit written authorization.</li>
              <li>You agree to comply with your institution&apos;s Honor Code and academic disciplinary guidelines at all times.</li>
            </ul>
          </motion.section>

          {/* Section 5 */}
          <motion.section id="ai-copilot" className="terms-section" variants={fadeInUp}>
            <h2>
              <span className="section-num">05</span>
              AI Copilot &amp; Automated Analytics Guidelines
            </h2>
            <p>
              ScholarPulse integrates generative AI capabilities, including predictive study planning, AI Copilot tutoring, and automated quiz preparation assistance.
            </p>
            <ul>
              <li><strong>Educational Acceleration:</strong> The AI Copilot is provided as a learning aid to explain concepts, clarify lecture material, and suggest practice questions. It is not an automated essay writer or exam cheating device.</li>
              <li><strong>Instructor Policies:</strong> You must strictly adhere to each course instructor&apos;s syllabus guidelines regarding AI usage on homework, problem sets, and take-home examinations.</li>
              <li><strong>No Model Guarantees:</strong> While our AI engines are fine-tuned on academic datasets, generative models may occasionally produce inaccuracies or hallucinations. You are solely responsible for independently verifying academic computations and facts.</li>
            </ul>
          </motion.section>

          {/* Section 6 */}
          <motion.section id="records-ferpa" className="terms-section" variants={fadeInUp}>
            <h2>
              <span className="section-num">06</span>
              Data Privacy &amp; Academic Records (FERPA)
            </h2>
            <p>
              ScholarPulse processes education records in strict compliance with applicable federal and international student privacy laws, including the Family Educational Rights and Privacy Act (FERPA, 20 U.S.C. § 1232g) and the General Data Protection Regulation (GDPR).
            </p>
            <p>
              Official student transcripts, GPA calculations, and disciplinary notations remain under the ultimate stewardship of your educational institution. ScholarPulse acts as an authorized school official with legitimate educational interests to provide modern dashboard infrastructure.
            </p>
          </motion.section>

          {/* Section 7 */}
          <motion.section id="availability" className="terms-section" variants={fadeInUp}>
            <h2>
              <span className="section-num">07</span>
              System Availability &amp; Service Level
            </h2>
            <p>
              We strive to maintain a 99.9% uptime SLA for critical academic services, including exam access and assignment submission portals. However:
            </p>
            <ul>
              <li>We perform scheduled maintenance during low-traffic windows with advance notification posted to the dashboard calendar.</li>
              <li>ScholarPulse is not liable for submission delays caused by individual ISP failures, power outages, local device crashes, or campus network bottlenecks. Students are strongly encouraged to submit coursework ahead of deadlines.</li>
            </ul>
          </motion.section>

          {/* Section 8 */}
          <motion.section id="intellectual-property" className="terms-section" variants={fadeInUp}>
            <h2>
              <span className="section-num">08</span>
              Intellectual Property Rights
            </h2>
            <p>
              All software, source code, UI animations, logos, trademark designs, database schemas, and documentation related to ScholarPulse are the exclusive intellectual property of ScholarPulse Inc. and its licensors.
            </p>
            <p>
              Students and instructors retain ownership of their proprietary original work, notes, and research submitted to the platform. By uploading content, you grant ScholarPulse a non-exclusive license solely to host, parse, cache, and display the content for instructional and platform performance purposes.
            </p>
          </motion.section>

          {/* Section 9 */}
          <motion.section id="fees" className="terms-section" variants={fadeInUp}>
            <h2>
              <span className="section-num">09</span>
              Fees, Subscriptions &amp; Institutional Billing
            </h2>
            <p>
              For individual students enrolled through an institutional partner, platform access is covered under the university&apos;s annual enterprise contract. For direct subscriptions or specialized certification tracks:
            </p>
            <ul>
              <li>All stated fees are transparent and billed according to the agreed term (monthly, per-semester, or annually).</li>
              <li>Invoices and receipts can be inspected at any time inside the Student Finance &amp; Invoices portal.</li>
              <li>Refund requests must be lodged within 14 days of academic enrollment, subject to institutional registration policies.</li>
            </ul>
          </motion.section>

          {/* Section 10 */}
          <motion.section id="liability" className="terms-section" variants={fadeInUp}>
            <h2>
              <span className="section-num">10</span>
              Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by applicable law, in no event shall ScholarPulse, its directors, employees, or educational affiliates be liable for any indirect, punitive, incidental, special, or consequential damages resulting from your use of or inability to access the Services, including but not limited to loss of academic credit, missed deadlines, or technical failures.
            </p>
          </motion.section>

          {/* Section 11 */}
          <motion.section id="termination" className="terms-section" variants={fadeInUp}>
            <h2>
              <span className="section-num">11</span>
              Account Termination &amp; Suspension
            </h2>
            <p>
              We reserve the right to suspend or terminate your account and revoke access to the platform immediately, without prior notice or liability, if you breach any provision of these Terms or engage in conduct that jeopardizes system security or student privacy.
            </p>
            <p>
              Upon graduation, withdrawal, or completion of your academic term, account records may transition into an alumni archive mode in accordance with institutional data retention policies.
            </p>
          </motion.section>

          {/* Section 12 */}
          <motion.section id="contact" className="terms-section" variants={fadeInUp}>
            <h2>
              <span className="section-num">12</span>
              Governing Law &amp; Contact Information
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of California and applicable federal regulations, without regard to its conflict of law provisions.
            </p>
            <p>
              For legal inquiries, copyright notices (DMCA), or institutional partnership agreements, please reach out to:
            </p>
            <div className="terms-callout">
              <p>
                <strong>ScholarPulse Legal &amp; Compliance Office</strong><br />
                ScholarPulse Inc.<br />
                123 Innovation Drive, Tech District<br />
                San Francisco, CA 94105<br />
                Email: <a href="mailto:legal@scholarpulse.edu" style={{ color: "#d4af37" }}>legal@scholarpulse.edu</a>
              </p>
            </div>
          </motion.section>
        </motion.article>
      </div>

      {/* ─── Footer ─── */}
      <footer className="terms-footer">
        <div className="terms-footer-inner">
          <div className="terms-footer-links">
            <Link href="/">Home</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/login">Dashboard Portal</Link>
            <Link href="mailto:support@scholarpulse.edu">Help Center</Link>
          </div>
          <p>&copy; {new Date().getFullYear()} ScholarPulse Inc. All rights reserved. Empowering modern student success.</p>
        </div>
      </footer>
    </main>
  );
}
