"use client";

import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900 text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-4 sm:gap-6 max-w-md w-full"
      >
        {/* Animated loader */}
        <div className="relative w-12 h-12 sm:w-16 sm:h-16">
          <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 animate-spin text-yellow-400" />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-yellow-300"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Loading text with animation */}
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-base sm:text-lg font-medium text-gray-300 text-center px-4"
        >
          {message}
        </motion.div>

        {/* Animated dots */}
        <motion.div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-yellow-400 rounded-full"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 1, delay: i * 0.15, repeat: Infinity }}
            />
          ))}
        </motion.div>

        {/* Subtle description */}
        <div className="text-xs sm:text-sm text-gray-500 text-center mt-2 sm:mt-4 px-4">
          Please wait while we prepare your experience
        </div>
      </motion.div>
    </div>
  );
}

