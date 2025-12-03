"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function AppLoader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* Logo */}
      <div className="mb-8 animate-pulse">
        <Image
          src="/provision-logo.png"
          alt="ProVision WorkSuite"
          width={120}
          height={120}
          priority
        />
      </div>

      {/* App Name */}
      <h1 className="text-2xl font-bold text-foreground mb-8">
        ProVision WorkSuite
      </h1>

      {/* Progress Bar */}
      <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Loading Text */}
      <p className="mt-4 text-sm text-muted-foreground">
        Loading your workspace...
      </p>
    </div>
  );
}
