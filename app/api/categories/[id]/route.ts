import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";

type UpdateCategoryBody = {
  name?: string;
  description?: string;
};

async function updateCategory(id: string, body: UpdateCategoryBody) {
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
  }

  const updateFields = Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined)
  );

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json(
      { error: "No fields provided to update" },
      { status: 400 }
    );
  }

  const db = await getDatabase("sample_mflix");
  const result = await db
    .collection("Categories")
    .updateOne({ _id: new ObjectId(id) }, { $set: updateFields });

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const updatedCategory = await db
    .collection("Categories")
    .findOne({ _id: new ObjectId(id) });

  return NextResponse.json(updatedCategory, { status: 200 });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as UpdateCategoryBody;
    return await updateCategory(id, body);
  } catch (error) {
    console.error("Failed to update category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as UpdateCategoryBody;
    return await updateCategory(id, body);
  } catch (error) {
    console.error("Failed to update category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}
