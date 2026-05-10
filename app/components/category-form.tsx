"use client";

import { useState } from "react";

type CategoryItem = {
  id: string;
  name: string;
  description: string;
};

type CreatedCategory = {
  _id: string | { $oid?: string };
  name: string;
  description: string;
};

type CategoryFormProps = {
  initialCategories: CategoryItem[];
};

function normalizeCategoryId(value: CreatedCategory["_id"]): string {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && typeof value.$oid === "string") {
    return value.$oid;
  }

  return `${Date.now()}-${Math.random()}`;
}

export default function CategoryForm({ initialCategories }: CategoryFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description }),
      });

      const data = (await response.json()) as
        | CreatedCategory
        | { error?: string };

      if (!response.ok) {
        const errorMessage =
          "error" in data && data.error
            ? data.error
            : "Failed to add category";
        setMessage(errorMessage);
        return;
      }

      setMessage(`Category \"${("name" in data && data.name) || name}\" added.`);
      if ("_id" in data && "name" in data) {
        setCategories((previous) => [
          {
            id: normalizeCategoryId(data._id),
            name: data.name,
            description: data.description ?? "",
          },
          ...previous,
        ]);
      }
      setName("");
      setDescription("");
    } catch {
      setMessage("Failed to add category");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-10 w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-zinc-900">Categories</h2>
      <form className="mt-4" onSubmit={onSubmit}>
        <input
          type="text"
          placeholder="Enter category name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-md border border-zinc-300 p-2 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          required
        />
        <textarea
          placeholder="Enter category description (optional)"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-3 w-full rounded-md border border-zinc-300 p-2 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          rows={3}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Adding..." : "Add Category"}
        </button>
      </form>
      {message ? <p className="mt-3 text-sm text-zinc-700">{message}</p> : null}
      <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
          Existing Categories
        </h3>
        {categories.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600">No categories found.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {categories.map((category) => (
              <li key={category.id} className="rounded-md bg-white p-3 shadow-sm">
                <p className="font-medium text-zinc-900">{category.name}</p>
                {category.description ? (
                  <p className="mt-1 text-sm text-zinc-600">{category.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
