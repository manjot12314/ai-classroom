"use client";

import { useState } from "react";

interface Class {
  id: number;
  name: string;
}

interface SessionFormProps {
  onSubmit: (data: { class_id: number; start_time?: string }) => Promise<void>;
  onCancel: () => void;
  classes: Class[];
  submitting?: boolean;
}

export function SessionForm({ onSubmit, onCancel, classes, submitting = false }: SessionFormProps) {
  const [formData, setFormData] = useState({
    class_id: "",
    start_time: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.class_id) {
      setError("Please select a class");
      return;
    }

    try {
      await onSubmit({
        class_id: parseInt(formData.class_id),
        start_time: formData.start_time || undefined,
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
          Select Class *
        </label>
        <select
          required
          value={formData.class_id}
          onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a class</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Start Time (Optional)
        </label>
        <input
          type="datetime-local"
          value={formData.start_time}
          onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Leave empty to start immediately
        </p>
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
        >
          {submitting ? "Starting..." : "Start Session"}
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

