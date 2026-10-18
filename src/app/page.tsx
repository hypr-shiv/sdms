"use client";

import Link from "next/link";
import DriftWall from "@/components/DriftWall";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  BrainCircuit, 
  BarChart3, 
  CalendarDays, 
  GraduationCap, 
  ShieldCheck, 
  Globe
} from "lucide-react";
import "./landing.css";

// Animation Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [demoRequested, setDemoRequested] = useState(false);
  const router = useRouter();

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/thank-you");
  };
  return (
    <main className="landing-page">
      {/* ─── Navigation ─── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <span className="logo-icon">▲</span>
            <span className="logo-text">ScholarPulse</span>
          </div>
          <div className="landing-nav-links">
            <a href="#services">Platform</a>
            <a href="#methodology">Methodology</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="landing-nav-actions">
            <Link href="/login" className="btn-nav-login">
              Log In
            </Link>
            <a href="#contact" className="btn-primary-nav">
              Request Demo
            </a>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="hero-section">
        <div className="hero-background">
          <DriftWall
            columns={5}
            tileWidth={220}
            tileHeight={146}
            gap={20}
            tilt={18}
            turn={-12}
            perspective={1200}
            depth={150}
            speed={35}
            direction="up"
            variance={0.5}
            parallax={0.8}
            lift={40}
            fade={0.7}
            dim={0.4}
            overlayColor="#0b132b"
          />
        </div>
        
        <motion.div 
          className="hero-content"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div className="hero-badge" variants={fadeInUp}>
            Academic Intelligence Infrastructure
          </motion.div>
          <motion.h1 className="hero-title" variants={fadeInUp}>
            Navigate Academic Excellence. <br />
            <span className="text-gradient">Scale Without Limits.</span>
          </motion.h1>
          <motion.p className="hero-description" variants={fadeInUp}>
            Specialized AI-driven platforms and analytics infrastructure for leading educational institutions expanding their digital capabilities.
          </motion.p>
          <motion.div className="hero-actions" variants={fadeInUp}>
            <Link href="/login" className="btn-primary-hero">
              Enter Dashboard
            </Link>
            <a href="#methodology" className="btn-secondary-hero">
              Explore Platform
            </a>
          </motion.div>

          <motion.div id="insights" className="metrics-banner" variants={fadeInUp}>
            <div className="metric-item">
              <span className="metric-value">1M+</span>
              <span className="metric-label">Students Supported</span>
            </div>
            <div className="metric-item">
              <span className="metric-value">50+</span>
              <span className="metric-label">Global Institutions</span>
            </div>
            <div className="metric-item">
              <span className="metric-value">99%</span>
              <span className="metric-label">Uptime Reliability</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Services / Features Grid ─── */}
      <section id="services" className="features-section">
        <motion.div 
          className="features-container"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div className="section-header" variants={fadeInUp}>
            <span className="section-badge">Core Capabilities</span>
            <h2 className="section-title">Strategic Academic Advantage</h2>
            <p className="section-description">
              Comprehensive infrastructure designed to elevate performance, streamline administration, and secure institutional data.
            </p>
          </motion.div>

          <div className="services-grid">
            {/* Service 1 */}
            <motion.div className="service-card" variants={fadeInUp}>
              <div className="service-icon"><BrainCircuit size={28} /></div>
              <h3 className="service-title">AI Copilot & Tutoring</h3>
              <p className="service-desc">
                Deploy personalized learning paths and instant AI-assisted tutoring generated directly from proprietary course materials and institutional curriculum.
              </p>
              <a href="#" className="service-link">
                Learn more <ArrowRight size={16} />
              </a>
            </motion.div>

            {/* Service 2 */}
            <motion.div className="service-card" variants={fadeInUp}>
              <div className="service-icon"><BarChart3 size={28} /></div>
              <h3 className="service-title">Predictive Analytics</h3>
              <p className="service-desc">
                Leverage big data to identify academic trends, forecast enrollment, and provide early intervention warnings for at-risk demographics.
              </p>
              <a href="#" className="service-link">
                Learn more <ArrowRight size={16} />
              </a>
            </motion.div>

            {/* Service 3 */}
            <motion.div className="service-card" variants={fadeInUp}>
              <div className="service-icon"><ShieldCheck size={28} /></div>
              <h3 className="service-title">Enterprise Security</h3>
              <p className="service-desc">
                Bank-grade encryption, automated compliance reporting, and role-based access control protecting sensitive student and faculty data.
              </p>
              <a href="#" className="service-link">
                Learn more <ArrowRight size={16} />
              </a>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ─── Methodology ─── */}
      <section id="methodology" className="methodology-section">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div className="section-header" variants={fadeInUp}>
            <span className="section-badge">Implementation</span>
            <h2 className="section-title">The ScholarPulse Methodology</h2>
            <p className="section-description">
              A proven four-step framework for integrating AI into your institutional workflow.
            </p>
          </motion.div>

          <div className="methodology-grid">
            <motion.div className="methodology-step" variants={fadeInUp}>
              <div className="step-number">01</div>
              <h3 className="step-title">Data Audit & Audit</h3>
              <p className="step-desc">Comprehensive analysis of existing IT infrastructure and data silos.</p>
            </motion.div>
            
            <motion.div className="methodology-step" variants={fadeInUp}>
              <div className="step-number">02</div>
              <h3 className="step-title">Strategic Integration</h3>
              <p className="step-desc">Mapping AI models to specific faculty needs and compliance requirements.</p>
            </motion.div>
            
            <motion.div className="methodology-step" variants={fadeInUp}>
              <div className="step-number">03</div>
              <h3 className="step-title">Deployment & Scaling</h3>
              <p className="step-desc">Phased rollout starting with core administrative and analytics functions.</p>
            </motion.div>
            
            <motion.div className="methodology-step" variants={fadeInUp}>
              <div className="step-number">04</div>
              <h3 className="step-title">Continuous Optimization</h3>
              <p className="step-desc">Ongoing algorithmic refinement based on real-time student engagement data.</p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ─── Contact/CTA ─── */}
      <section id="contact" className="cta-section">
        <motion.div 
          className="cta-container"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <span className="section-badge">Get Started</span>
          <h2 className="section-title">Request a Platform Demo</h2>
          <p className="section-description">
            Discover how ScholarPulse can transform your institution's digital capabilities.
          </p>
          {demoRequested ? (
            <div className="cta-success" style={{ padding: "2rem", background: "rgba(16, 185, 129, 0.1)", borderRadius: 12, border: "1px solid rgba(16, 185, 129, 0.3)" }}>
              <h3 style={{ color: "#10b981", marginBottom: "0.5rem" }}>Request Received</h3>
              <p>Thank you! Our advisory team will contact you shortly to schedule your demo.</p>
            </div>
          ) : (
            <form className="cta-form" onSubmit={handleDemoSubmit}>
              <input type="text" placeholder="Full Name" className="cta-input" required />
              <input type="email" placeholder="Institutional Email" className="cta-input" required />
              <input type="text" placeholder="Institution Name" className="cta-input" required />
              <button type="submit" className="cta-submit">Schedule Advisory Call</button>
            </form>
          )}
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="landing-logo">
              <span className="logo-icon">▲</span>
              <span className="logo-text">ScholarPulse</span>
            </div>
            <p className="footer-desc">
              Specialized academic intelligence and technology scaling for leading global institutions.
            </p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Platform</h4>
              <a href="#">Analytics</a>
              <a href="#">AI Copilot</a>
              <a href="#">Security</a>
              <a href="#">Integrations</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Careers</a>
              <a href="#">Case Studies</a>
              <a href="#">Contact</a>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms &amp; Conditions</Link>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("open-cookie-settings"));
                  }
                }}
                className="footer-cookie-btn"
                style={{ background: "none", border: "none", padding: 0, color: "inherit", font: "inherit", cursor: "pointer", textAlign: "left" }}
              >
                Cookie Preferences
              </button>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} ScholarPulse Inc. All rights reserved.</p>
          <div className="social-links">
            <a href="#">X</a>
            <a href="#">LN</a>
            <a href="#">GH</a>
          </div>
        </div>
      </footer>

      {/* ─── Sticky Mobile CTA ─── */}
      <div className="sticky-mobile-cta">
        <Link href="/login" className="btn-sticky-cta">
          Enter Dashboard
        </Link>
      </div>
    </main>
  );
}
