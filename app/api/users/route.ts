import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getMflixCollection } from "@/lib/mflix-db";

export async function GET() {
  try {
    const usersCollection = await getMflixCollection('users');
    const users = await usersCollection
      .find({})
      .project({ password: 0 })
      .toArray();
    return NextResponse.json(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
