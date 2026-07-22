"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../../../../contexts/AuthContext";
import { apiFetch } from "../../../../../../lib/api";
import { StudentForm } from "../../../../../../components/forms/StudentForm";
import { Loading } from "../../../../../../components/Loading";
import { ErrorMessage } from "../../../../../../components/ErrorMessage";

interface Student {
  id: number;
  name: string;
  email: string;
  class_id: number;
}

interface Class {
  id: number;
  name: string;
}

export default function AdminEditStudentPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const studentId = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    if (token && studentId) {
      loadData();
    }
  }, [token, studentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [studentsRes, classesRes] = await Promise.all([
        apiFetch<Student[]>("api/students", { method: "GET" }, token),
        apiFetch<Class[]>("api/classes", { method: "GET" }, token),
      ]);

      if (studentsRes.ok && classesRes.ok) {
        const found = studentsRes.data.find((s) => s.id === studentId);
        setStudent(found || null);
        setClasses(classesRes.data);
      } else {
        setError("Failed to load data");
      }
    } catch (err) {
      setError("An error occurred while loading data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: { name: string; email: string; class_id: number }) => {
    setSubmitting(true);
    setError("");

    try {
      const result = await apiFetch(`api/students/${studentId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }, token);

      if (result.ok) {
        router.push(`/dashboard/admin/students/${studentId}`);
      } else {
        setError(result.error || "Failed to update student");
      }
    } catch (err) {
      setError("An error occurred while updating student");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!student) {
    return (
      <div className="space-y-6">
        <ErrorMessage message={error || "Student not found"} />
        <Link
          href="/dashboard/admin/students"
          className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
        >
          Back to Students
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/dashboard/admin/students/${studentId}`}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block"
        >
          ← Back to Student
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Edit Student</h1>
        <p className="text-slate-600 dark:text-slate-400">Update {student.name}&apos;s information</p>
      </div>

      <ErrorMessage message={error} />

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <StudentForm
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/dashboard/admin/students/${studentId}`)}
          classes={classes}
          initialData={{ name: student.name, email: student.email, class_id: student.class_id }}
          submitting={submitting}
        />
      </div>
    </div>
  );
}
