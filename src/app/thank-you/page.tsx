"use client";

import Link from "next/link";
import { CheckCircle2, Home, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import "./thank-you.css";

export default function ThankYouPage() {
  return (
    <main className="thankyou-page-container">
      <div className="thankyou-background" />
      
      <motion.div 
        className="thankyou-content"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="thankyou-icon-wrapper">
          <CheckCircle2 size={48} strokeWidth={2} />
        </div>
        
        <h1 className="thankyou-heading">Request Received</h1>
        
        <p className="thankyou-message">
          Thank you for your interest in ScholarPulse! We have successfully received your demo request. One of our academic integration specialists will reach out to the email provided within 1 business day to schedule your advisory call.
        </p>
        
        <div className="thankyou-actions">
          <Link href="/login" className="btn-thankyou-primary">
            Enter Dashboard <ArrowRight size={18} />
          </Link>
          
          <Link href="/" className="btn-thankyou-secondary">
            <Home size={18} /> Back to Home
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
