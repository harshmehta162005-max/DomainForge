"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BorderTrailProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

export function BorderTrail({ className, size = 100, style, ...props }: BorderTrailProps) {
  return (
    <div
      className={cn("absolute inset-0 pointer-events-none rounded-[inherit] overflow-hidden", className)}
      {...props}
    >
      <motion.div
        className="absolute w-[200%] h-[200%] top-[-50%] left-[-50%] origin-center"
        style={{
          background: `conic-gradient(from 0deg, transparent 70%, rgba(34,211,238,0.7) 100%)`,
          ...style
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: "linear",
        }}
      />
    </div>
  );
}
