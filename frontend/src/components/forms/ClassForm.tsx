"use client";

import { useState } from "react";
import { apiFetch } from "../../lib/api";

interface ClassFormProps {
  onSubmit: (data: { name: string; schedule: string | null }) => Promise<void>;
  onCancel: () => void;
  initialData?: { name: string; schedule: string | null };
  token?: string | null;
  submitting?: boolean;
}

export function ClassForm({ onSubmit, onCancel, initialData, submitting = false }: ClassFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    schedule: initialData?.schedule || "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Class name is required");
      return;
    }

    try {
      await onSubmit({
        name: formData.name.trim(),
        schedule: formData.schedule.trim() || null,
      });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
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
          {submitting ? "Saving..." : initialData ? "Update Class" : "Create Class"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

