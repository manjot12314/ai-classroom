"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { apiFetch } from "../../../../lib/api";
import { Loading } from "../../../../components/Loading";
import { ErrorMessage } from "../../../../components/ErrorMessage";
import Link from "next/link";

interface Class {
  id: number;
  name: string;
  schedule: string | null;
  teacher_id: number;
  created_at: string;
}

export default function TeacherClassesPage() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", schedule: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      loadClasses();
    }
  }, [token]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await apiFetch<Class[]>("api/classes", { method: "GET" }, token);
      if (result.ok) {
        setClasses(result.data);
      } else {
        setError(result.error || "Failed to load classes");
      }
    } catch (err) {
      setError("An error occurred while loading classes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const result = await apiFetch("api/classes", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          schedule: formData.schedule || null,
        }),
      }, token);

      if (result.ok) {
        setShowCreateForm(false);
        setFormData({ name: "", schedule: "" });
        await loadClasses();
      } else {
        setError(result.error || "Failed to create class");
      }
    } catch (err) {
      setError("An error occurred while creating class");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">My Classes</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your classes</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
        >
          {showCreateForm ? "Cancel" : "Create New Class"}
        </button>
      </div>

      <ErrorMessage message={error} />

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Create New Class</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Class Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Mathematics 101"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Schedule (Optional)
              </label>
              <input
                type="text"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Monday, Wednesday, Friday 9:00 AM - 10:30 AM"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Class"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ name: "", schedule: "" });
                }}
                className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Classes List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Your Classes ({classes.length})</h2>
          {classes.length > 0 ? (
            <div className="space-y-3">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{cls.name}</h3>
                    {cls.schedule && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{cls.schedule}</p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Created: {new Date(cls.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/teacher/classes/${cls.id}`}
                    className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">No classes yet. Create your first class to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

