import { getDatabase } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import UserHeader from "@/app/components/user-header";
import ExpenseInsights from "./components/expense-insights";
import type { Category } from "@/app/components/expense-form";

type CategoryListItem = {
  id: string;
  name: string;
  description: string;
  parentCategoryId: string | null;
};

type ExpenseListItem = {
  id: string;
  categoryId: string;
  subcategoryId: string | null;
  amount: number;
  spendingDate: string;
  note: string;
};

export default async function Home() {
  const session = await getSession();
  let categories: CategoryListItem[] = [];
  let expenseCategories: Category[] = [];
  let expenses: ExpenseListItem[] = [];

  try {
    const db = await getDatabase("sample_mflix");
    const categoryDocs = session?.email
      ? await db
          .collection("Categories")
          .find(
            { ownerEmail: session.email },
            { projection: { name: 1, description: 1, parentCategoryId: 1 } }
          )
          .toArray()
      : [];

    const expenseDocs = session?.email
      ? await db
          .collection("Expenses")
          .find(
            { ownerEmail: session.email },
            {
              projection: {
                categoryId: 1,
                subcategoryId: 1,
                amount: 1,
                spendingDate: 1,
                note: 1,
              },
            }
          )
          .sort({ spendingDate: -1 })
          .toArray()
      : [];

    categories = categoryDocs.map((category) => ({
      id: category._id.toString(),
      name: typeof category.name === "string" ? category.name : "",
      description:
        typeof category.description === "string" ? category.description : "",
      parentCategoryId:
        typeof category.parentCategoryId === "string"
          ? category.parentCategoryId
          : null,
    }));

    expenseCategories = categoryDocs.map((category) => ({
      _id: category._id.toString(),
      name: typeof category.name === "string" ? category.name : "",
      description:
        typeof category.description === "string" ? category.description : "",
      parentCategoryId:
        typeof category.parentCategoryId === "string"
          ? category.parentCategoryId
          : null,
    }));

    expenses = expenseDocs.map((expense) => ({
      id: expense._id.toString(),
      categoryId:
        expense.categoryId && typeof expense.categoryId === "object" && "toString" in expense.categoryId
          ? expense.categoryId.toString()
          : "",
      subcategoryId:
        expense.subcategoryId &&
        typeof expense.subcategoryId === "object" &&
        "toString" in expense.subcategoryId
          ? expense.subcategoryId.toString()
          : null,
      amount: typeof expense.amount === "number" ? expense.amount : 0,
      spendingDate:
        expense.spendingDate instanceof Date
          ? expense.spendingDate.toISOString()
          : new Date().toISOString(),
      note: typeof expense.note === "string" ? expense.note : "",
    }));
  } catch (error) {
    console.error("Failed to load home page data:", error);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <UserHeader user={session} />
      <div className="mx-auto mt-20 max-w-6xl">
        <ExpenseInsights
          categories={categories}
          expenseCategories={expenseCategories}
          expenses={expenses}
        />
      </div>
    </main>
  );
}
