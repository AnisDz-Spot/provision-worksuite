import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createUser } from "@/lib/db/postgres";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, fullName } = body;

    // 1. Check if ANY user exists
    const userCount = await prisma.user.count();

    if (userCount > 0) {
      // If users exist, blocking public registration for now (per plan)
      // Future: allow invites
      return NextResponse.json(
        {
          error:
            "Registration is closed. Please ask an administrator for an invite.",
        },
        { status: 403 }
      );
    }

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create User (Admin)
    const newUser = await createUser({
      email,
      passwordHash: hashedPassword,
      fullName,
      isActive: true, // First user always active
      systemRole: "admin", // First user is admin
      isBillable: true,
      employmentType: "full-time",
      defaultWorkingHoursPerDay: 8,
      hourlyCostRate: 0,
      hourlyBillableRate: 0,
      timezone: "UTC", // Default
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
