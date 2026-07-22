"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../../../contexts/AuthContext";
import { apiFetch } from "../../../../../lib/api";
import { StudentForm } from "../../../../../components/forms/StudentForm";
import { Loading } from "../../../../../components/Loading";
import { ErrorMessage } from "../../../../../components/ErrorMessage";

interface Class {
  id: number;
  name: string;
}

export default function AdminNewStudentPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    if (token) {
      loadClasses();
    }
  }, [token]);

  const loadClasses = async () => {
    try {
      const result = await apiFetch<Class[]>("api/classes", { method: "GET" }, token);
      if (result.ok) {
        setClasses(result.data);
      }
    } catch (err) {
      // Ignore errors
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: { name: string; email: string; class_id: number }) => {
    setSubmitting(true);
    setError("");

    try {
      const result = await apiFetch("api/students", {
        method: "POST",
        body: JSON.stringify(data),
      }, token);

      if (result.ok) {
        router.push("/dashboard/admin/students");
      } else {
        setError(result.error || "Failed to create student");
      }
    } catch (err) {
      setError("An error occurred while creating student");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/admin/students"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block"
        >
          ← Back to Students
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Add New Student</h1>
        <p className="text-slate-600 dark:text-slate-400">Add a new student to the system</p>
      </div>

      <ErrorMessage message={error} />

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <StudentForm
          onSubmit={handleSubmit}
          onCancel={() => router.push("/dashboard/admin/students")}
          classes={classes}
          submitting={submitting}
        />
      </div>
    </div>
  );
}

