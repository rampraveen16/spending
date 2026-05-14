import { getDatabase } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import CategoryForm from "@/app/components/category-form";
import Link from "next/link";

type CategoryListItem = {
  id: string;
  name: string;
  description: string;
  parentCategoryId: string | null;
};

export default async function NewCategoryPage() {
  const session = await getSession();
  let categories: CategoryListItem[] = [];

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

    categories = categoryDocs.map((c) => ({
      id: c._id.toString(),
      name: typeof c.name === "string" ? c.name : "",
      description: typeof c.description === "string" ? c.description : "",
      parentCategoryId:
        typeof c.parentCategoryId === "string" ? c.parentCategoryId : null,
    }));
  } catch {
    // render with empty list if DB is unreachable
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto pt-16">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Add Category</h1>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <CategoryForm initialCategories={categories} />
        </div>
      </div>
    </div>
  );
}
