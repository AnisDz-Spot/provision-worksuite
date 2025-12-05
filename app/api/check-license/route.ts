import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const LICENSE_FILE = path.join(process.cwd(), "data", "licenses.json");

export async function POST(req: Request) {
  const { serial } = await req.json();
  if (!serial) {
    return NextResponse.json(
      { success: false, error: "No serial provided." },
      { status: 400 }
    );
  }

  try {
    const file = fs.readFileSync(LICENSE_FILE, "utf-8");
    const licenses = JSON.parse(file);
    const valid = licenses.includes(serial);
    if (valid) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid serial number." },
        { status: 403 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "License file not found or invalid." },
      { status: 500 }
    );
  }
}
