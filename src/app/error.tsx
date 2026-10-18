"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, RefreshCcw, Home } from "lucide-react";
import { motion } from "framer-motion";
import "./error.css";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <main className="error-page-container">
      <div className="error-background" />
      
      <motion.div 
        className="error-content"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <div className="error-icon-wrapper">
          <AlertOctagon size={40} strokeWidth={2} />
        </div>
        
        <h2 className="error-heading">Something went wrong</h2>
        
        <p className="error-message">
          We encountered an unexpected error while processing your request. Our systems have logged the issue, and we are looking into it.
        </p>
        
        <div className="error-actions">
          <button onClick={() => reset()} className="btn-error-primary">
            <RefreshCcw size={18} />
            Try Again
          </button>
          
          <Link href="/" className="btn-error-secondary">
            <Home size={18} />
            Return Home
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
