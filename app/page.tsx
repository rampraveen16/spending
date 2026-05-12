import { getDatabase } from "@/lib/mongodb";
import CategoryForm from "@/app/components/category-form";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import UserHeader from "@/app/components/user-header";

type CategoryListItem = {
  id: string;
  name: string;
  description: string;
};

export default async function Home() {
  const session = await getSession();
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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <UserHeader user={session} />
      
      {/* Dashboard Header with User Info */}
      <div className="mt-20 max-w-4xl mx-auto">
        <section className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Dashboard</h1>
          {session && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Username</p>
                  <p className="text-2xl font-bold text-gray-900">{session.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Email Address</p>
                  <p className="text-2xl font-bold text-gray-900">{session.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">User ID</p>
                  <p className="text-lg font-mono text-gray-900 break-all">{session.userId}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* MongoDB Connection Status */}
        <section className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Database Connection</h2>
          <p className="mt-2 text-gray-600 mb-4">
            This status is checked server-side using <code className="bg-gray-100 px-2 py-1 rounded">MONGODB_URI</code>
          </p>
          <div className="rounded-lg bg-blue-50 border-2 border-blue-300 p-4">
            <p className="font-mono text-sm font-semibold text-blue-900">{status}</p>
          </div>
        </section>

        {/* Categories Section */}
        <section className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Categories Management</h2>
          <CategoryForm initialCategories={categories} />
        </section>
      </div>
    </main>
  );
}
