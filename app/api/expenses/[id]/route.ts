import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getMflixCollection } from "@/lib/mflix-db";
import { getSession } from "@/lib/auth";

type UpdateExpenseBody = {
  amount?: number | string;
};

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
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid expense id" }, { status: 400 });
    }

    const body = (await request.json()) as UpdateExpenseBody;
    if (body.amount === undefined) {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 400 }
      );
    }

    const parsedAmount = Number.parseFloat(String(body.amount));
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    const expensesCollection = await getMflixCollection("Expenses");
    const result = await expensesCollection.updateOne(
      { _id: new ObjectId(id), ownerEmail },
      { $set: { amount: parsedAmount, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Expense updated" }, { status: 200 });
  } catch (error) {
    console.error("Failed to update expense:", error);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const ownerEmail = session?.email?.trim();

    if (!ownerEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid expense id" }, { status: 400 });
    }

    const expensesCollection = await getMflixCollection("Expenses");
    const result = await expensesCollection.deleteOne({
      _id: new ObjectId(id),
      ownerEmail,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Expense deleted" }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
