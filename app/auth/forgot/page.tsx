"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleForgot = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await sendPasswordResetEmail(email);
      if (result.success) {
        setMessage("Password reset email sent.");
      } else {
        setError(result.error || "Failed to send reset email");
      }
    } catch (err: any) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="w-full max-w-md p-10 bg-card border rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-7 text-center">
        Forgot your password?
      </h1>
      {error && <div className="mb-4 text-red-500 text-center">{error}</div>}
      {message && (
        <div className="mb-4 text-green-600 text-center">{message}</div>
      )}
      <form className="flex flex-col gap-6" onSubmit={handleForgot}>
        <div>
          <label htmlFor="email" className="text-sm font-medium cursor-pointer">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            className="mt-1 w-full border rounded px-3 py-2 outline-none bg-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full mt-2" loading={loading}>
          Send Reset Email
        </Button>
      </form>
      <div className="text-sm mt-6 text-center">
        Back to{" "}
        <Link href="/auth/login" className="hover:underline cursor-pointer">
          Sign In
        </Link>
      </div>
    </div>
  );
}


