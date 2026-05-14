"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import ExpenseForm, { type Category } from "@/app/components/expense-form";

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

type ExpenseInsightsProps = {
  categories: CategoryListItem[];
  expenseCategories: Category[];
  expenses: ExpenseListItem[];
};

type CategorySpend = {
  categoryId: string;
  categoryName: string;
  amount: number;
  share: number;
  subcategories: {
    subcategoryId: string;
    subcategoryName: string;
    amount: number;
  }[];
};

const ALL_MONTHS = "all";

const PIE_COLORS = [
  "#0f766e",
  "#2563eb",
  "#ea580c",
  "#ca8a04",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#65a30d",
];

function formatMonthLabel(month: string) {
  const [year, monthIndex] = month.split("-");
  const date = new Date(Number(year), Number(monthIndex) - 1, 1);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatMonthSelection(month: string) {
  return month === ALL_MONTHS ? "All months" : formatMonthLabel(month);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function toMonthKey(dateString: string) {
  return dateString.slice(0, 7);
}

export default function ExpenseInsights({
  categories,
  expenseCategories,
  expenses,
}: ExpenseInsightsProps) {
  const router = useRouter();
  const [expenseItems, setExpenseItems] = useState(expenses);
  useEffect(() => {
    setExpenseItems(expenses);
  }, [expenses]);

  const monthOptions = Array.from(
    new Set(expenseItems.map((expense) => toMonthKey(expense.spendingDate)))
  ).sort((left, right) => right.localeCompare(left));
  const currentMonth = new Date().toISOString().slice(0, 7);
  const defaultMonth = monthOptions.includes(currentMonth)
    ? currentMonth
    : monthOptions[0] ?? currentMonth;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editExpenseAmount, setEditExpenseAmount] = useState("");
  const [isExpenseSubmitting, setIsExpenseSubmitting] = useState(false);
  const [expenseActionError, setExpenseActionError] = useState("");

  const categoryNameById = new Map(
    categories.map((category) => [category.id, category.name])
  );

  const subcategoryNameById = new Map(
    categories
      .filter((category) => category.parentCategoryId)
      .map((category) => [category.id, category.name])
  );

  const filteredExpenses =
    selectedMonth === ALL_MONTHS
      ? expenseItems
      : expenseItems.filter((expense) => toMonthKey(expense.spendingDate) === selectedMonth);

  const totalsByCategory = new Map<string, number>();
  const totalsBySubcategory = new Map<string, Map<string, number>>();
  for (const expense of filteredExpenses) {
    const nextAmount = (totalsByCategory.get(expense.categoryId) ?? 0) + expense.amount;
    totalsByCategory.set(expense.categoryId, nextAmount);

    if (expense.subcategoryId) {
      const currentSubcategoryTotals =
        totalsBySubcategory.get(expense.categoryId) ?? new Map<string, number>();
      currentSubcategoryTotals.set(
        expense.subcategoryId,
        (currentSubcategoryTotals.get(expense.subcategoryId) ?? 0) + expense.amount
      );
      totalsBySubcategory.set(expense.categoryId, currentSubcategoryTotals);
    }
  }

  const totalSpent = filteredExpenses.reduce(
    (total, expense) => total + expense.amount,
    0
  );

  const categorySpendRows: CategorySpend[] = Array.from(totalsByCategory.entries())
    .map(([categoryId, amount]) => ({
      categoryId,
      categoryName: categoryNameById.get(categoryId) ?? "Unknown Category",
      amount,
      share: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
      subcategories: Array.from(
        (totalsBySubcategory.get(categoryId) ?? new Map<string, number>()).entries()
      )
        .map(([subcategoryId, subcategoryAmount]) => ({
          subcategoryId,
          subcategoryName:
            subcategoryNameById.get(subcategoryId) ?? "Unknown Subcategory",
          amount: subcategoryAmount,
        }))
        .sort((left, right) => right.amount - left.amount),
    }))
    .sort((left, right) => right.amount - left.amount);

  const activeCategoryId = categorySpendRows.some(
    (row) => row.categoryId === selectedCategoryId
  )
    ? selectedCategoryId
    : null;

  const expenseListRows = activeCategoryId
    ? filteredExpenses.filter((expense) => expense.categoryId === activeCategoryId)
    : filteredExpenses;

  function handleCategorySelection(categoryId: string) {
    setSelectedCategoryId((current) =>
      current === categoryId ? null : categoryId
    );
  }

  function handleStartExpenseEdit(expense: ExpenseListItem) {
    setEditingExpenseId(expense.id);
    setEditExpenseAmount(expense.amount.toFixed(2));
    setExpenseActionError("");
  }

  function handleCancelExpenseEdit() {
    setEditingExpenseId(null);
    setEditExpenseAmount("");
    setExpenseActionError("");
  }

  async function handleSaveExpenseAmount(expenseId: string) {
    const parsedAmount = Number.parseFloat(editExpenseAmount);

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setExpenseActionError("Amount must be a positive number");
      return;
    }

    setIsExpenseSubmitting(true);
    setExpenseActionError("");

    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: parsedAmount }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setExpenseActionError(data.error || "Failed to update amount");
        return;
      }

      setExpenseItems((current) =>
        current.map((expense) =>
          expense.id === expenseId ? { ...expense, amount: parsedAmount } : expense
        )
      );
      setEditingExpenseId(null);
      setEditExpenseAmount("");
    } catch {
      setExpenseActionError("Failed to update amount");
    } finally {
      setIsExpenseSubmitting(false);
    }
  }

  async function handleDeleteExpense(expenseId: string) {
    setIsExpenseSubmitting(true);
    setExpenseActionError("");

    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setExpenseActionError(data.error || "Failed to delete expense");
        return;
      }

      setExpenseItems((current) => current.filter((expense) => expense.id !== expenseId));
      if (editingExpenseId === expenseId) {
        setEditingExpenseId(null);
        setEditExpenseAmount("");
      }
    } catch {
      setExpenseActionError("Failed to delete expense");
    } finally {
      setIsExpenseSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Expense</h2>
            <p className="mt-1 text-sm text-gray-600">
              Record spending and refresh the monthly breakdown instantly.
            </p>
          </div>
        </div>
        <ExpenseForm
          initialCategories={expenseCategories}
          onSuccess={() => router.refresh()}
        />
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Monthly Category Spend</h2>
            <p className="mt-1 text-sm text-gray-600">
              Review how much you spent in each category for the selected month.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <label
              htmlFor="month-filter"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              View Month
            </label>
            <select
              id="month-filter"
              value={selectedMonth}
              onChange={(event) => {
                setSelectedMonth(event.target.value);
                setSelectedCategoryId(null);
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={ALL_MONTHS}>All months</option>
              {monthOptions.length > 0 ? (
                monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {formatMonthLabel(month)}
                  </option>
                ))
              ) : (
                <option value={currentMonth}>{formatMonthLabel(currentMonth)}</option>
              )}
            </select>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total spent</p>
                <p className="text-3xl font-bold text-slate-900">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {activeCategoryId ? (
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId(null)}
                    className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    Clear selection
                  </button>
                ) : null}
                <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {formatMonthSelection(selectedMonth)}
                </div>
              </div>
            </div>

            <p className="mb-3 text-xs text-slate-500">
              Click a pie slice to highlight the matching category in the table.
            </p>

            {categorySpendRows.length > 0 ? (
              <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySpendRows}
                      dataKey="amount"
                      nameKey="categoryName"
                      innerRadius={70}
                      outerRadius={115}
                      paddingAngle={3}
                    >
                      {categorySpendRows.map((entry, index) => (
                        <Cell
                          key={entry.categoryId}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                          onClick={() => handleCategorySelection(entry.categoryId)}
                          style={{ cursor: "pointer" }}
                          opacity={
                            activeCategoryId && activeCategoryId !== entry.categoryId
                              ? 0.35
                              : 1
                          }
                          stroke={
                            activeCategoryId === entry.categoryId ? "#0f172a" : "#ffffff"
                          }
                          strokeWidth={activeCategoryId === entry.categoryId ? 3 : 1}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: 12, borderColor: "#cbd5e1" }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[340px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-center text-sm text-slate-500">
                No expenses recorded for {formatMonthSelection(selectedMonth)}.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Category totals</h3>
              <p className="text-sm text-slate-500">
                {filteredExpenses.length} expense{filteredExpenses.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Spent</th>
                    <th className="px-4 py-3 font-medium">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {categorySpendRows.length > 0 ? (
                    categorySpendRows.map((row) => (
                      <Fragment key={row.categoryId}>
                        <tr
                          className={
                            activeCategoryId === row.categoryId
                              ? "bg-blue-50 ring-1 ring-inset ring-blue-200"
                              : undefined
                          }
                        >
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {row.categoryName}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {formatCurrency(row.amount)}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {row.share.toFixed(1)}%
                          </td>
                        </tr>
                        {row.subcategories.length > 0 ? (
                          <tr>
                            <td
                              colSpan={3}
                              className={
                                activeCategoryId === row.categoryId
                                  ? "bg-blue-50 px-4 py-3"
                                  : "bg-slate-50 px-4 py-3"
                              }
                            >
                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Subcategory breakdown
                                </p>
                                <div className="space-y-1">
                                  {row.subcategories.map((subcategory) => (
                                    <div
                                      key={subcategory.subcategoryId}
                                      className={
                                        activeCategoryId === row.categoryId
                                          ? "flex items-center justify-between rounded-md border border-blue-200 bg-white px-3 py-2 text-xs text-slate-700"
                                          : "flex items-center justify-between rounded-md bg-white px-3 py-2 text-xs text-slate-700"
                                      }
                                    >
                                      <span>{subcategory.subcategoryName}</span>
                                      <span className="font-medium text-slate-900">
                                        {formatCurrency(subcategory.amount)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                        No category totals available for this selection.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Expense Entries</h3>
            <p className="mt-1 text-sm text-slate-500">
              Edit the amount or delete an expense from the filtered list.
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            {activeCategoryId
              ? categoryNameById.get(activeCategoryId) ?? "Selected category"
              : "All categories"}
          </div>
        </div>

        {expenseActionError ? (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {expenseActionError}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Subcategory</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Note</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {expenseListRows.length > 0 ? (
                expenseListRows.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-4 py-3 text-slate-700">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(expense.spendingDate))}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {categoryNameById.get(expense.categoryId) ?? "Unknown Category"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {expense.subcategoryId
                        ? subcategoryNameById.get(expense.subcategoryId) ??
                          "Unknown Subcategory"
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {editingExpenseId === expense.id ? (
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={editExpenseAmount}
                          onChange={(event) => setEditExpenseAmount(event.target.value)}
                          className="w-28 rounded-md border border-slate-300 px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        formatCurrency(expense.amount)
                      )}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-slate-700">
                      <span className="block truncate">
                        {expense.note.trim() ? expense.note : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {editingExpenseId === expense.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSaveExpenseAmount(expense.id)}
                              disabled={isExpenseSubmitting}
                              className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelExpenseEdit}
                              className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartExpenseEdit(expense)}
                              className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                            >
                              Edit amount
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(expense.id)}
                              disabled={isExpenseSubmitting}
                              className="rounded-md bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No expense entries available for this selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
