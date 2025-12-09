"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, ArrowLeft, CheckCircle2, Sparkles, Lock } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setIsSubmitted(true);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-4 sm:p-6 lg:p-8 overflow-auto">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <Card className="w-full max-w-md relative z-10 p-6 sm:p-8 lg:p-10 bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl">
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center shadow-lg shadow-green-500/20 animate-bounce-slow">
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                Check Your Email
              </h1>
              <div className="flex items-center justify-center gap-2 text-purple-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Reset Link Sent</span>
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed px-2">
                If an account with{" "}
                <span className="font-semibold text-white bg-white/10 px-2 py-1 rounded">
                  {email}
                </span>{" "}
                exists, we&apos;ve sent a password reset link.
              </p>

              <div className="bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-400">
                  <span className="inline-block w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                  The link will expire in{" "}
                  <strong className="text-white">1 hour</strong>
                </p>
              </div>

              <p className="text-xs sm:text-sm text-gray-500 italic">
                Don&apos;t see the email? Check your spam folder.
              </p>
            </div>

            <div className="pt-2 sm:pt-4 space-y-3">
              <Link href="/auth/login" className="block">
                <Button
                  variant="outline"
                  className="w-full bg-white/5 border-white/20 hover:bg-white/10 text-white transition-all duration-200 py-5 sm:py-6 text-sm sm:text-base"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </Link>

              <button
                onClick={() => setIsSubmitted(false)}
                className="text-xs sm:text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Use a different email?
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 p-6 sm:p-8 lg:p-10 bg-white/5 border border-white/10">
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-linear-to-br from-purple-500/30 to-indigo-500/30 flex items-center justify-center mb-4 sm:mb-6 shadow-lg shadow-purple-500/20">
            <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400" />
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 tracking-tight">
            Forgot Password?
          </h1>

          <p className="text-sm sm:text-base text-gray-400 leading-relaxed px-2">
            No worries! Enter your email and we&apos;ll send you reset
            instructions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {error && (
            <div className="p-3 sm:p-4 rounded-lg bg-red-500/10 border border-red-500/30 backdrop-blur-sm animate-shake">
              <p className="text-red-200 text-xs sm:text-sm font-medium flex items-start gap-2">
                <span className="inline-block w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>{error}</span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-xs sm:text-sm font-semibold text-gray-300 uppercase tracking-wide"
            >
              Email Address
            </label>
            <div className="relative group">
              <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="pl-10 sm:pl-12 pr-4 py-5 sm:py-6 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 text-sm sm:text-base"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !email}
            className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-700 hover:via-purple-600 hover:to-indigo-700 text-white font-semibold py-5 sm:py-6 text-sm sm:text-base shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Sending...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Send Reset Link
              </span>
            )}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-gradient-to-r from-transparent via-slate-900 to-transparent text-gray-500">
                OR
              </span>
            </div>
          </div>

          <Link href="/auth/login" className="block">
            <button
              type="button"
              className="w-full py-3 sm:py-4 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-gray-300 hover:text-white transition-all duration-200 text-sm sm:text-base font-medium flex items-center justify-center gap-2 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Login
            </button>
          </Link>
        </form>

        <p className="text-center mt-6 sm:mt-8 text-xs text-gray-600">
          Remember your password?{" "}
          <Link
            href="/auth/login"
            className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            Sign in here
          </Link>
        </p>
      </Card>
    </div>
  );
}
