"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { SessionPayload } from "@/lib/auth";

interface UserHeaderProps {
  user: SessionPayload | null;
}

export default function UserHeader({ user }: UserHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="absolute top-0 right-0 p-6 flex gap-4 items-center">
      {user && (
        <>
          <div className="text-sm">
            <p className="font-semibold text-gray-900">Welcome, {user.username}</p>
            <p className="text-gray-600">{user.email}</p>
          </div>
          <Link
            href="/categories/new"
            className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            Add Category
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </>
      )}
    </nav>
  );
}
