import { NextResponse } from "next/server";
import { getMflixCollection } from "@/lib/mflix-db";
import { getSession } from "@/lib/auth";
import { ObjectId } from "mongodb";

type CreateExpenseBody = {
  spendingDate?: string;
  amount?: number | string;
  categoryId?: string;
  subcategoryId?: string;
  note?: string;
};

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const ownerEmail = session?.email?.trim();

    if (!ownerEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateExpenseBody;
    const { spendingDate, amount, categoryId, subcategoryId, note } = body;

    if (!spendingDate || !amount || !categoryId) {
      return NextResponse.json(
        { error: "Spending date, amount, and category are required" },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(String(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(categoryId)) {
      return NextResponse.json(
        { error: "Invalid category id" },
        { status: 400 }
      );
    }

    if (subcategoryId && !ObjectId.isValid(subcategoryId)) {
      return NextResponse.json(
        { error: "Invalid subcategory id" },
        { status: 400 }
      );
    }

    const expensesCollection = await getMflixCollection("Expenses");

    const result = await expensesCollection.insertOne({
      spendingDate: new Date(spendingDate),
      amount: parsedAmount,
      categoryId: new ObjectId(categoryId),
      subcategoryId: subcategoryId ? new ObjectId(subcategoryId) : null,
      note: note?.trim() || "",
      ownerEmail,
      ownerUsername: session?.username || "",
      createdAt: new Date(),
    });

    return NextResponse.json(
      { message: "Expense created successfully", _id: result.insertedId.toString() },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
