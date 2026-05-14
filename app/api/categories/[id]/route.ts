import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";

type UpdateCategoryBody = {
  name?: string;
  description?: string;
  parentCategoryId?: string | null;
};

async function updateCategory(
  id: string,
  body: UpdateCategoryBody,
  ownerEmail: string
) {
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
  }

  const categoryObjectId = new ObjectId(id);
  const normalizedParentCategoryId = body.parentCategoryId?.trim() || null;

  if (normalizedParentCategoryId === id) {
    return NextResponse.json(
      { error: "Category cannot be its own parent" },
      { status: 400 }
    );
  }

  if (normalizedParentCategoryId && !ObjectId.isValid(normalizedParentCategoryId)) {
    return NextResponse.json(
      { error: "Invalid parent category id" },
      { status: 400 }
    );
  }

  const updateFields = Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined)
  );

  if ("parentCategoryId" in body) {
    updateFields.parentCategoryId = normalizedParentCategoryId;
  }

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json(
      { error: "No fields provided to update" },
      { status: 400 }
    );
  }

  const db = await getDatabase("sample_mflix");
  const categoriesCollection = db.collection("Categories");

  const existingCategory = await categoriesCollection.findOne({
    _id: categoryObjectId,
    ownerEmail,
  });

  if (!existingCategory) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  if (normalizedParentCategoryId) {
    const parentCategory = await categoriesCollection.findOne({
      _id: new ObjectId(normalizedParentCategoryId),
      ownerEmail,
    });

    if (!parentCategory) {
      return NextResponse.json(
        { error: "Parent category not found" },
        { status: 404 }
      );
    }

    if (parentCategory.parentCategoryId) {
      return NextResponse.json(
        { error: "Subcategory cannot be used as a parent" },
        { status: 400 }
      );
    }
  }

  const result = await db
    .collection("Categories")
    .updateOne({ _id: categoryObjectId, ownerEmail }, { $set: updateFields });

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const updatedCategory = await db
    .collection("Categories")
    .findOne({ _id: categoryObjectId, ownerEmail });

  return NextResponse.json(updatedCategory, { status: 200 });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const ownerEmail = session?.email?.trim();

    if (!ownerEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = (await request.json()) as UpdateCategoryBody;
    return await updateCategory(id, body, ownerEmail);
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
    const session = await getSession();
    const ownerEmail = session?.email?.trim();

    if (!ownerEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = (await request.json()) as UpdateCategoryBody;
    return await updateCategory(id, body, ownerEmail);
  } catch (error) {
    console.error("Failed to update category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}
