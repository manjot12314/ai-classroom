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

export default function AdminClassesPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">All Classes</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage all classes in the system</p>
        </div>
        <Link
          href="/dashboard/admin/classes/new"
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
        >
          Create New Class
        </Link>
      </div>

      <ErrorMessage message={error} />

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-200 dark:border-slate-700">
        <input
          type="text"
          placeholder="Search classes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Classes List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Classes ({filteredClasses.length})
          </h2>
          {filteredClasses.length > 0 ? (
            <div className="space-y-3">
              {filteredClasses.map((cls) => (
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
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/admin/classes/${cls.id}`}
                      className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">
                {searchTerm ? "No classes found matching your search" : "No classes yet. Create your first class!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

