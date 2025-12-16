"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { ShieldCheck, Copy, CheckCircle, RefreshCw, Lock } from "lucide-react";
import { fetchWithCsrf } from "@/lib/csrf-client";

interface TwoFactorSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const [step, setStep] = useState<"intro" | "scan" | "verify" | "backup">(
    "intro"
  );
  const [secret, setSecret] = useState<string>("");
  const [qrCode, setQrCode] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const startSetup = async () => {
    setLoading(true);
    try {
      const res = await fetchWithCsrf("/api/auth/2fa/setup", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setSecret(data.secret);
      setQrCode(data.qrCode);
      setStep("scan");
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    try {
      const res = await fetchWithCsrf("/api/auth/2fa/verify-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationCode }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setBackupCodes(data.backupCodes);
      setStep("backup");
      showToast(
        "Two-factor authentication has been successfully enabled.",
        "success"
      );
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard", "success");
  };

  const downloadBackupCodes = () => {
    const text = `ProVision WorkSuite Backup Codes\n\nGenerated on: ${new Date().toLocaleDateString()}\nKeep these safe!\n\n${backupCodes.join("\n")}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "provision-backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (step === "intro") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
          <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-full">
            <Lock className="w-6 h-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h3 className="font-medium">Secure Your Account</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Two-factor authentication adds an extra layer of security to your
              account. You&apos;ll need a code from your authenticator app to
              log in.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={startSetup} disabled={loading}>
            {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            Get Started
          </Button>
        </div>
      </div>
    );
  }

  if (step === "scan") {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium">Scan QR Code</h3>
          <p className="text-sm text-gray-500">
            Open your authenticator app (Google Authenticator, Authy, etc.) and
            scan this code.
          </p>
        </div>

        <div className="flex justify-center p-4 bg-white rounded-lg border w-fit mx-auto">
          {qrCode && (
            <Image src={qrCode} alt="2FA QR Code" width={200} height={200} />
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">
            Can&apos;t scan the code?
          </p>
          <div className="flex items-center justify-center gap-2">
            <code className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded text-sm font-mono">
              {secret}
            </code>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(secret)}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Enter Verification Code</label>
          <div className="flex gap-2">
            <Input
              placeholder="000 000"
              value={verificationCode}
              onChange={(e) =>
                setVerificationCode(
                  e.target.value.replace(/\D/g, "").slice(0, 6)
                )
              }
              className="text-center tracking-widest text-lg"
            />
            <Button
              onClick={verifyCode}
              disabled={verificationCode.length !== 6 || loading}
            >
              {loading ? "Verifying..." : "Verify"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "backup") {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-medium">2FA Enabled Successfully!</h3>
          <p className="text-sm text-gray-500">
            Save these backup codes in a secure place. You can use them to log
            in if you lose your phone.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
          {backupCodes.map((code, index) => (
            <div
              key={index}
              className="flex items-center gap-2 font-mono text-sm"
            >
              <span className="text-gray-400 mr-1">{index + 1}.</span>
              {code}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            onClick={downloadBackupCodes}
            className="w-full"
          >
            <Copy className="w-4 h-4 mr-2" /> Download Codes
          </Button>
          <Button onClick={onComplete} className="w-full">
            Done
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
