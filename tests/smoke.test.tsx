import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
// Mock standard Next.js hooks
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn() }),
  usePathname: () => "/auth/login",
}));

// Mock NextAuth
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Simple smoke test
describe("Smoke Test", () => {
  it("verify test runner", () => {
    expect(true).toBe(true);
  });
});
