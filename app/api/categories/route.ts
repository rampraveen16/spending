import { NextResponse } from "next/server";
import { getCategoriesCollection } from "@/lib/mflix-db";

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

    const categoriesCollection = await getCategoriesCollection();
    const category = {
      name,
      description: body.description?.trim() || "",
      createdAt: new Date(),
    };

    const result = await categoriesCollection.insertOne(category);

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
