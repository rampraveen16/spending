import { NextResponse } from "next/server";
import { getMflixCollection } from "@/lib/mflix-db";
import bcrypt from "bcryptjs";

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

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    const trimmedUsername = String(username).trim();
    const trimmedEmail = String(email).trim().toLowerCase();
    const rawPassword = String(password);

    if (trimmedUsername.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (rawPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const usersCollection = await getMflixCollection("users");

    const existingUser = await usersCollection.findOne({
      $or: [{ username: trimmedUsername }, { email: trimmedEmail }],
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const result = await usersCollection.insertOne({
      username: trimmedUsername,
      email: trimmedEmail,
      password: hashedPassword,
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          _id: result.insertedId,
          username: trimmedUsername,
          email: trimmedEmail,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
