import { getDatabase } from "@/lib/mongodb";
import CategoryForm from "@/app/components/category-form";
import Link from "next/link";

type CategoryListItem = {
  id: string;
  name: string;
  description: string;
};

export default async function Home() {
  let status = "Not connected";
  let categories: CategoryListItem[] = [];

  try {
    const db = await getDatabase("sample_mflix");
    await db.command({ ping: 1 });
    status = `Connected to ${db.databaseName}`;
    const categoryDocs = await db
      .collection("Categories")
      .find({}, { projection: { name: 1, description: 1 } })
      .toArray();

    categories = categoryDocs.map((category) => ({
      id: category._id.toString(),
      name: typeof category.name === "string" ? category.name : "",
      description:
        typeof category.description === "string" ? category.description : "",
    }));
  } catch (error) {
    status =
      error instanceof Error ? `Connection failed: ${error.message}` : "Connection failed";
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6">
      <nav className="absolute top-0 right-0 p-6 flex gap-4">
        <Link
          href="/login"
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Login / Sign Up
        </Link>
        <Link
          href="/users"
          className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          View Users
        </Link>
      </nav>
      <section className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">MongoDB Connection</h1>
        <p className="mt-2 text-zinc-600">
          This status is checked server-side using <code>MONGODB_URI</code> (or
          <code> spending_MONGODB_URI</code>) from your env file.
        </p>
        <p className="mt-6 rounded-lg bg-zinc-100 p-4 font-mono text-sm text-zinc-800">{status}</p>
      </section>
      <CategoryForm initialCategories={categories} />
    </main>
  );
}
