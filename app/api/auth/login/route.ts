import { NextResponse, NextRequest } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getMflixCollection } from "@/lib/mflix-db";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const usersCollection = await getMflixCollection('users');

    // Check if user exists
    let user = await usersCollection.findOne({ username });

    if (user) {
      // User exists - verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Invalid username or password" },
          { status: 401 }
        );
      }

      // Login successful
      return NextResponse.json(
        {
          success: true,
          message: "Login successful",
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
          },
        },
        { status: 200 }
      );
    } else {
      // User doesn't exist - create new user
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = {
        username,
        password: hashedPassword,
        email: `${username}@example.com`,
        createdAt: new Date(),
      };

      const result = await usersCollection.insertOne(newUser);

      return NextResponse.json(
        {
          success: true,
          message: "User created and logged in successfully",
          user: {
            _id: result.insertedId,
            username: newUser.username,
            email: newUser.email,
          },
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
