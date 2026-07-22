"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../../../contexts/AuthContext";
import { apiFetch } from "../../../../../lib/api";
import { ClassForm } from "../../../../../components/forms/ClassForm";
import { ErrorMessage } from "../../../../../components/ErrorMessage";

export default function AdminNewClassPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (data: { name: string; schedule: string | null }) => {
    setSubmitting(true);
    setError("");

    try {
      const result = await apiFetch("api/classes", {
        method: "POST",
        body: JSON.stringify(data),
      }, token);

      if (result.ok) {
        router.push("/dashboard/admin/classes");
      } else {
        setError(result.error || "Failed to create class");
      }
    } catch (err) {
      setError("An error occurred while creating class");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/admin/classes"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block"
        >
          ← Back to Classes
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Create New Class</h1>
        <p className="text-slate-600 dark:text-slate-400">Add a new class to the system</p>
      </div>

      <ErrorMessage message={error} />

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <ClassForm
          onSubmit={handleSubmit}
          onCancel={() => router.push("/dashboard/admin/classes")}
          token={token}
          submitting={submitting}
        />
      </div>
    </div>
  );
}

