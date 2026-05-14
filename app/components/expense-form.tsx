"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Category = {
  _id: string;
  name: string;
  description: string;
  parentCategoryId: string | null;
};

// ─── Add-Category Modal ────────────────────────────────────────────────────────

type AddCategoryModalProps = {
  topLevelCategories: Category[];
  onClose: () => void;
  onCreated: (category: Category) => void;
};

function AddCategoryModal({ topLevelCategories, onClose, onCreated }: AddCategoryModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryType, setCategoryType] = useState<"category" | "subcategory">("category");
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (categoryType === "subcategory" && !parentCategoryId) {
      setError("Please select a parent category");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          parentCategoryId: categoryType === "subcategory" ? parentCategoryId : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create category");
        return;
      }

      onCreated({
        _id: data._id,
        name: data.name,
        description: data.description ?? "",
        parentCategoryId: data.parentCategoryId ?? null,
      });
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={handleOverlayClick}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Add New Category</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={categoryType}
              onChange={(e) => {
                setCategoryType(e.target.value as "category" | "subcategory");
                setParentCategoryId("");
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="category">Category</option>
              <option value="subcategory">Subcategory</option>
            </select>
          </div>

          {categoryType === "subcategory" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Category
              </label>
              <select
                value={parentCategoryId}
                onChange={(e) => setParentCategoryId(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select parent category</option>
                {topLevelCategories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Food, Transport"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional description"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Saving..." : "Save Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Expense Form ─────────────────────────────────────────────────────────────

type ExpenseFormProps = {
  initialCategories: Category[];
  onSuccess?: () => void;
};

export default function ExpenseForm({ initialCategories, onSuccess }: ExpenseFormProps) {
  const today = new Date().toISOString().split("T")[0];
  const [spendingDate, setSpendingDate] = useState(today);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [showModal, setShowModal] = useState(false);

  // Sync if server re-renders with new initialCategories
  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const topLevelCategories = categories.filter((c) => !c.parentCategoryId);
  const subcategoriesForSelected = categories.filter(
    (c) => c.parentCategoryId === categoryId
  );

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setSubcategoryId("");
  };

  const handleCategoryCreated = useCallback((newCategory: Category) => {
    setCategories((prev) => [newCategory, ...prev]);
    if (!newCategory.parentCategoryId) {
      setCategoryId(newCategory._id);
      setSubcategoryId("");
    } else {
      setCategoryId(newCategory.parentCategoryId);
      setSubcategoryId(newCategory._id);
    }
    setShowModal(false);
  }, []);

  const resetForm = () => {
    setSpendingDate(today);
    setAmount("");
    setCategoryId("");
    setSubcategoryId("");
    setNote("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");

    if (!categoryId) {
      setFormError("Please select a category");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spendingDate,
          amount: parseFloat(amount),
          categoryId,
          subcategoryId: subcategoryId || undefined,
          note,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || "Failed to save expense");
        return;
      }

      setSuccessMsg("Expense saved successfully!");
      resetForm();
      onSuccess?.();
    } catch {
      setFormError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {showModal && (
        <AddCategoryModal
          topLevelCategories={topLevelCategories}
          onClose={() => setShowModal(false)}
          onCreated={handleCategoryCreated}
        />
      )}

      {formError && (
        <div className="mb-4 rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-800">{formError}</p>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 rounded-md bg-green-50 p-3">
          <p className="text-sm text-green-800">{successMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Spending Date */}
        <div>
          <label
            htmlFor="spendingDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Spending Date <span className="text-red-500">*</span>
          </label>
          <input
            id="spendingDate"
            type="date"
            required
            value={spendingDate}
            max={today}
            onChange={(e) => setSpendingDate(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Amount */}
        <div>
          <label
            htmlFor="expenseAmount"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Amount <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500 text-sm">
              $
            </span>
            <input
              id="expenseAmount"
              type="number"
              required
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="expenseCategory"
              className="block text-sm font-medium text-gray-700"
            >
              Category <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              + Add Category
            </button>
          </div>
          <select
            id="expenseCategory"
            required
            value={categoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a category</option>
            {topLevelCategories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory — only shown when the selected category has subcategories */}
        {subcategoriesForSelected.length > 0 && (
          <div>
            <label
              htmlFor="expenseSubcategory"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Subcategory
            </label>
            <select
              id="expenseSubcategory"
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None</option>
              {subcategoriesForSelected.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Note */}
        <div>
          <label
            htmlFor="expenseNote"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Note
          </label>
          <textarea
            id="expenseNote"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving…" : "Save Expense"}
          </button>
        </div>
      </form>
    </>
  );
}
