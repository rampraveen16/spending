import { NextResponse } from "next/server";
import { getCategoriesCollection } from "@/lib/mflix-db";
import { getSession } from "@/lib/auth";
import { ObjectId } from "mongodb";

type CreateCategoryBody = {
  name?: string;
  description?: string;
  parentCategoryId?: string;
};

export async function GET() {
  try {
    const session = await getSession();
    const ownerEmail = session?.email?.trim();

    if (!ownerEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categoriesCollection = await getCategoriesCollection();
    const docs = await categoriesCollection
      .find({ ownerEmail })
      .project({ name: 1, description: 1, parentCategoryId: 1 })
      .toArray();

    const categories = docs.map((c) => ({
      _id: c._id.toString(),
      name: typeof c.name === "string" ? c.name : "",
      description: typeof c.description === "string" ? c.description : "",
      parentCategoryId:
        typeof c.parentCategoryId === "string" ? c.parentCategoryId : null,
    }));

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const ownerEmail = session?.email?.trim();
    console.log("Session data in POST /api/categories:", session);

    if (!ownerEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateCategoryBody;
    const name = body.name?.trim();
    const parentCategoryId = body.parentCategoryId?.trim() || "";

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const categoriesCollection = await getCategoriesCollection();

    let parentCategoryName = "";
    if (parentCategoryId) {
      if (!ObjectId.isValid(parentCategoryId)) {
        return NextResponse.json(
          { error: "Invalid parent category id" },
          { status: 400 }
        );
      }

      const parentCategory = await categoriesCollection.findOne({
        _id: new ObjectId(parentCategoryId),
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

      parentCategoryName =
        typeof parentCategory.name === "string" ? parentCategory.name : "";
    }

    const category = {
      name,
      description: body.description?.trim() || "",
      parentCategoryId: parentCategoryId || null,
      ownerEmail,
      ownerUsername: session?.username || "",
      createdAt: new Date(),
    };

    const result = await categoriesCollection.insertOne(category);

    return NextResponse.json(
      {
        _id: result.insertedId.toString(),
        ...category,
        parentCategoryName,
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
