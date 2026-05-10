import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

type CreateCategoryBody = {
  name?: string;
  description?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateCategoryBody;
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase("sample_mflix");
    const category = {
      name,
      description: body.description?.trim() || "",
      createdAt: new Date(),
    };

    const result = await db.collection("Categories").insertOne(category);

    return NextResponse.json(
      {
        _id: result.insertedId.toString(),
        ...category,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
