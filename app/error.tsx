"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Home,
  RefreshCcw,
  Mail,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { log } from "@/lib/logger";
import { appConfig } from "@/lib/config/app-config";
import { captureError } from "@/lib/sentry";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log error to monitoring service in production
    log.error({ err: error, digest: error.digest }, "Application error");

    // Send error to Sentry if enabled
    if (appConfig.features.enableErrorTracking) {
      captureError(error, {
        tags: { digest: error.digest || "unknown" },
        level: "error",
      });
    }
  }, [error]);

  // Determine error type for better messaging
  const isNetworkError =
    error.message.includes("fetch") || error.message.includes("network");
  const isDatabaseError =
    error.message.includes("database") || error.message.includes("Prisma");
  const isAuthError =
    error.message.includes("Unauthorized") ||
    error.message.includes("authentication");

  const getErrorDetails = () => {
    if (isAuthError) {
      return {
        title: "Authentication Required",
        message: "You need to be logged in to access this page.",
        suggestion: "Please log in and try again.",
        icon: "🔒",
      };
    }
    if (isNetworkError) {
      return {
        title: "Connection Problem",
        message: "We're having trouble connecting to our servers.",
        suggestion: "Please check your internet connection and try again.",
        icon: "🌐",
      };
    }
    if (isDatabaseError) {
      return {
        title: "Database Error",
        message: "We encountered a problem accessing your data.",
        suggestion:
          "Our team has been notified. Please try again in a few moments.",
        icon: "💾",
      };
    }
    return {
      title: "Something Went Wrong",
      message: "We encountered an unexpected error.",
      suggestion:
        "Please try again or contact support if the problem persists.",
      icon: "⚠️",
    };
  };

  const errorDetails = getErrorDetails();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-background via-background to-muted/20">
      <Card className="w-full max-w-2xl p-8 md:p-12 shadow-2xl">
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 text-destructive mb-4">
            <AlertTriangle className="w-10 h-10" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">
              {errorDetails.icon} {errorDetails.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {errorDetails.message}
            </p>
            <p className="text-sm text-muted-foreground">
              {errorDetails.suggestion}
            </p>
          </div>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg text-left">
              <p className="text-xs font-mono text-muted-foreground mb-2">
                <strong>Error Details (Dev Mode):</strong>
              </p>
              <p className="text-xs font-mono text-destructive break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs font-mono text-muted-foreground mt-2">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Button
              onClick={() => reset()}
              variant="primary"
              size="lg"
              className="min-w-[140px]"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>

            <Button
              onClick={() => router.back()}
              variant="outline"
              size="lg"
              className="min-w-[140px]"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>

            <Button
              onClick={() => router.push("/")}
              variant="outline"
              size="lg"
              className="min-w-[140px]"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>

          {/* Help Section */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">
              Still having issues?
            </p>
            <Button
              onClick={() => router.push("/settings?tab=support")}
              variant="ghost"
              size="sm"
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </div>

          {/* Error ID for Support */}
          {error.digest && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">
                Error ID:{" "}
                <code className="px-2 py-1 bg-muted rounded">
                  {error.digest}
                </code>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Please reference this ID when contacting support
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
