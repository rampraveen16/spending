"use client";

import { useState } from "react";

type CategoryItem = {
  id: string;
  name: string;
  description: string;
  parentCategoryId: string | null;
};

type CreatedCategory = {
  _id: string | { $oid?: string };
  name: string;
  description: string;
  parentCategoryId?: string | null;
  parentCategoryName?: string;
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
  const [categoryType, setCategoryType] = useState<"category" | "subcategory">(
    "category"
  );
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [editSubcategoryName, setEditSubcategoryName] = useState("");
  const [editSubcategoryDescription, setEditSubcategoryDescription] = useState("");
  const [isSubcategoryEditSubmitting, setIsSubcategoryEditSubmitting] =
    useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [newSubcategoryDescription, setNewSubcategoryDescription] = useState("");
  const [isAddingSubcategory, setIsAddingSubcategory] = useState(false);
  const topLevelCategories = categories.filter(
    (category) => !category.parentCategoryId
  );
  const subcategoriesForEdit = editingId
    ? categories.filter((c) => c.parentCategoryId === editingId)
    : [];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (categoryType === "subcategory" && !parentCategoryId) {
      setMessage("Please select a parent category");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          parentCategoryId: categoryType === "subcategory" ? parentCategoryId : undefined,
        }),
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
            parentCategoryId:
              typeof data.parentCategoryId === "string"
                ? data.parentCategoryId
                : null,
          },
          ...previous,
        ]);
      }
      setName("");
      setDescription("");
      setCategoryType("category");
      setParentCategoryId("");
    } catch {
      setMessage("Failed to add category");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEdit(categoryId: string) {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;
    setEditingId(categoryId);
    setEditName(category.name);
    setEditDescription(category.description);
  }

  async function handleSaveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;

    setIsEditSubmitting(true);
    try {
      const response = await fetch(`/api/categories/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setMessage(data.error || "Failed to update category");
        return;
      }

      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? { ...c, name: editName, description: editDescription }
            : c
        )
      );
      setMessage(`Category "${editName}" updated.`);
      setEditingId(null);
      setEditName("");
      setEditDescription("");
      setNewSubcategoryName("");
      setNewSubcategoryDescription("");
    } catch {
      setMessage("Failed to update category");
    } finally {
      setIsEditSubmitting(false);
    }
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
    setEditingSubcategoryId(null);
    setEditSubcategoryName("");
    setEditSubcategoryDescription("");
    setNewSubcategoryName("");
    setNewSubcategoryDescription("");
    setIsAddingSubcategory(false);
  }

  function handleStartSubcategoryEdit(subcategoryId: string) {
    const subcategory = categories.find((category) => category.id === subcategoryId);
    if (!subcategory) return;

    setEditingSubcategoryId(subcategoryId);
    setEditSubcategoryName(subcategory.name);
    setEditSubcategoryDescription(subcategory.description);
  }

  async function handleSaveSubcategoryEdit(subcategoryId: string) {
    if (!editSubcategoryName.trim()) {
      setMessage("Subcategory name is required");
      return;
    }

    setIsSubcategoryEditSubmitting(true);
    try {
      const response = await fetch(`/api/categories/${subcategoryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editSubcategoryName,
          description: editSubcategoryDescription,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setMessage(data.error || "Failed to update subcategory");
        return;
      }

      setCategories((prev) =>
        prev.map((category) =>
          category.id === subcategoryId
            ? {
                ...category,
                name: editSubcategoryName,
                description: editSubcategoryDescription,
              }
            : category
        )
      );
      setMessage(`Subcategory "${editSubcategoryName}" updated.`);
      setEditingSubcategoryId(null);
      setEditSubcategoryName("");
      setEditSubcategoryDescription("");
    } catch {
      setMessage("Failed to update subcategory");
    } finally {
      setIsSubcategoryEditSubmitting(false);
    }
  }

  function handleCancelSubcategoryEdit() {
    setEditingSubcategoryId(null);
    setEditSubcategoryName("");
    setEditSubcategoryDescription("");
  }

  async function handleAddSubcategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId || !newSubcategoryName.trim()) return;

    setIsAddingSubcategory(true);
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newSubcategoryName,
          description: newSubcategoryDescription,
          parentCategoryId: editingId,
        }),
      });

      const data = (await response.json()) as CreatedCategory | { error?: string };

      if (!response.ok) {
        const errorMessage =
          "error" in data && data.error
            ? data.error
            : "Failed to add subcategory";
        setMessage(errorMessage);
        return;
      }

      if ("_id" in data && "name" in data) {
        setCategories((prev) => [
          {
            id: normalizeCategoryId(data._id),
            name: data.name,
            description: data.description ?? "",
            parentCategoryId: editingId,
          },
          ...prev,
        ]);
      }
      setMessage(`Subcategory "${newSubcategoryName}" added.`);
      setNewSubcategoryName("");
      setNewSubcategoryDescription("");
    } catch {
      setMessage("Failed to add subcategory");
    } finally {
      setIsAddingSubcategory(false);
    }
  }

  return (
    <section className="mt-10 w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-zinc-900">Categories</h2>
      {message ? <p className="mt-3 text-sm text-zinc-700">{message}</p> : null}
      <div className="mt-12 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        {categories.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600">No categories found.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {categories
              .filter((category) => !category.parentCategoryId)
              .map((category) => (
                <li key={category.id} className="rounded-md bg-white p-4 shadow-sm">
                  {editingId === category.id ? (
                    <form onSubmit={handleSaveEdit} className="space-y-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-zinc-700">
                          Category Name
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(event) => setEditName(event.target.value)}
                          className="w-full rounded-md border border-zinc-300 p-2 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-zinc-700">
                          Description
                        </label>
                        <textarea
                          value={editDescription}
                          onChange={(event) => setEditDescription(event.target.value)}
                          rows={2}
                          className="w-full rounded-md border border-zinc-300 p-2 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                      </div>

                      <div className="mt-3 rounded-md bg-blue-50 p-3">
                        <h4 className="mb-2 text-sm font-medium text-blue-900">Subcategories</h4>
                        {subcategoriesForEdit.length > 0 ? (
                          <ul className="mb-3 space-y-2">
                            {subcategoriesForEdit.map((sub) => (
                              <li
                                key={sub.id}
                                className="rounded bg-white p-2 text-sm text-zinc-700"
                              >
                                {editingSubcategoryId === sub.id ? (
                                  <div className="space-y-2">
                                    <input
                                      type="text"
                                      value={editSubcategoryName}
                                      onChange={(event) =>
                                        setEditSubcategoryName(event.target.value)
                                      }
                                      className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                      required
                                    />
                                    <textarea
                                      value={editSubcategoryDescription}
                                      onChange={(event) =>
                                        setEditSubcategoryDescription(event.target.value)
                                      }
                                      rows={2}
                                      className="w-full rounded-md border border-zinc-300 px-2 py-1 text-xs focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleSaveSubcategoryEdit(sub.id)}
                                        disabled={isSubcategoryEditSubmitting}
                                        className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {isSubcategoryEditSubmitting ? "Saving..." : "Save"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleCancelSubcategoryEdit}
                                        className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium">{sub.name}</p>
                                      {sub.description ? (
                                        <p className="mt-1 text-xs text-zinc-600">
                                          {sub.description}
                                        </p>
                                      ) : null}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleStartSubcategoryEdit(sub.id)}
                                      className="text-xs font-medium text-blue-600 hover:text-blue-800"
                                    >
                                      Edit
                                    </button>
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mb-3 text-xs text-blue-800">No subcategories yet.</p>
                        )}

                        <form
                          onSubmit={handleAddSubcategory}
                          className="border-t border-blue-200 pt-3"
                        >
                          <h5 className="mb-2 text-xs font-medium text-blue-900">
                            Add New Subcategory
                          </h5>
                          <input
                            type="text"
                            placeholder="Subcategory name"
                            value={newSubcategoryName}
                            onChange={(event) => setNewSubcategoryName(event.target.value)}
                            className="mb-2 w-full rounded-md border border-blue-200 px-2 py-1 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            required
                          />
                          <textarea
                            placeholder="Description (optional)"
                            value={newSubcategoryDescription}
                            onChange={(event) =>
                              setNewSubcategoryDescription(event.target.value)
                            }
                            rows={2}
                            className="mb-2 w-full rounded-md border border-blue-200 px-2 py-1 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          />
                          <button
                            type="submit"
                            disabled={isAddingSubcategory}
                            className="w-full rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isAddingSubcategory ? "Adding..." : "Add Subcategory"}
                          </button>
                        </form>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={isEditSubmitting}
                          className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isEditSubmitting ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-zinc-900">{category.name}</p>
                        {category.description ? (
                          <p className="mt-1 text-sm text-zinc-600">{category.description}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEdit(category.id)}
                        className="ml-2 rounded-md bg-blue-100 px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-200"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </li>
              ))}
          </ul>
        )}
      </div>
      <form className="mt-4" onSubmit={onSubmit}>
        <div>
          <label
            htmlFor="categoryType"
            className="mb-1 block text-sm font-medium text-zinc-700"
          >
            Category Type
          </label>
          <select
            id="categoryType"
            value={categoryType}
            onChange={(event) => {
              const nextType = event.target.value as "category" | "subcategory";
              setCategoryType(nextType);
              if (nextType === "category") {
                setParentCategoryId("");
              }
            }}
            className="w-full rounded-md border border-zinc-300 p-2 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          >
            <option value="category">Category</option>
            <option value="subcategory">Subcategory</option>
          </select>
        </div>
        {categoryType === "subcategory" ? (
          <div className="mt-3">
            <label
              htmlFor="parentCategory"
              className="mb-1 block text-sm font-medium text-zinc-700"
            >
              Parent Category
            </label>
            <select
              id="parentCategory"
              value={parentCategoryId}
              onChange={(event) => setParentCategoryId(event.target.value)}
              className="w-full rounded-md border border-zinc-300 p-2 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              required
            >
              <option value="">Select parent category</option>
              {topLevelCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <input
          type="text"
          placeholder="Enter category name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-3 w-full rounded-md border border-zinc-300 p-2 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
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
    </section>
  );
}
