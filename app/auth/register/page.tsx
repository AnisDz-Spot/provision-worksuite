"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login - registration is disabled
    router.push("/auth/login");
  }, [router]);

  return null;
}


