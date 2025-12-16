"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Home, ArrowLeft, HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
      <Card className="w-full max-w-2xl p-8 md:p-12 shadow-2xl">
        <div className="text-center space-y-6">
          {/* 404 Visual */}
          <div className="relative mb-8">
            <div className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500 animate-pulse">
              404
            </div>
            <div className="absolute inset-0 blur-3xl opacity-20 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />
          </div>

          {/* Title and Message */}
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Page Not Found
            </h1>
            <p className="text-lg text-muted-foreground">
              Oops! The page you're looking for doesn't exist.
            </p>
            <p className="text-sm text-muted-foreground">
              It might have been moved, deleted, or the URL might be incorrect.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link href="/">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto min-w-[160px]"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>

            <Button
              onClick={() => window.history.back()}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto min-w-[160px]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>

          {/* Quick Links */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">Quick Links</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/projects">
                <Button variant="ghost" size="sm">
                  Projects
                </Button>
              </Link>
              <Link href="/tasks">
                <Button variant="ghost" size="sm">
                  Tasks
                </Button>
              </Link>
              <Link href="/team">
                <Button variant="ghost" size="sm">
                  Team
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  Settings
                </Button>
              </Link>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-6">
            <Link href="/settings?tab=support">
              <Button variant="ghost" size="sm">
                <HelpCircle className="w-4 h-4 mr-2" />
                Need Help?
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}


