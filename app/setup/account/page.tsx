"use client";

import { SetupProfileForm } from "@/components/settings/SetupProfileForm";
import { Database } from "lucide-react";

export default function SetupAccountPage() {
  const handleComplete = () => {
    // onComplete is handled inside SetupProfileForm's own handleSubmit
    // but we can add extra logic here if needed.
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Finish Your Setup
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Create your permanent administrator account to secure your
            workspace.
          </p>
        </div>

        <div className="flex justify-center">
          <SetupProfileForm onComplete={handleComplete} />
        </div>
      </div>
    </div>
  );
}
