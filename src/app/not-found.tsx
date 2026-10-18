"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { ArrowLeft, Home } from "lucide-react";
import "./not-found.css";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="not-found-page">
      <div className="not-found-background" />
      
      <motion.div 
        className="not-found-content"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div variants={fadeInUp}>
          <h1 className="error-code">404</h1>
        </motion.div>
        
        <motion.div variants={fadeInUp}>
          <h2 className="error-title">Page Not Found</h2>
        </motion.div>
        
        <motion.div variants={fadeInUp}>
          <p className="error-description">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable. Let's get you back on track.
          </p>
        </motion.div>
        
        <motion.div className="not-found-actions" variants={fadeInUp}>
          <button onClick={() => router.back()} className="btn-primary-back">
            <ArrowLeft size={18} />
            Go Back
          </button>
          <Link href="/" className="btn-secondary-home">
            <Home size={18} />
            Home
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
