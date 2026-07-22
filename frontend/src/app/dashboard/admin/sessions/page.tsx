"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { apiFetch } from "../../../../lib/api";
import { Loading } from "../../../../components/Loading";
import { ErrorMessage } from "../../../../components/ErrorMessage";
import Link from "next/link";

interface Session {
  id: number;
  class_id: number;
  start_time: string;
  end_time: string | null;
  status: string;
}

interface Class {
  id: number;
  name: string;
}

export default function AdminSessionsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [sessionsRes, classesRes] = await Promise.all([
        apiFetch<Session[]>("api/sessions", { method: "GET" }, token),
        apiFetch<Class[]>("api/classes", { method: "GET" }, token),
      ]);

      if (sessionsRes.ok && classesRes.ok) {
        setSessions(sessionsRes.data);
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

  const getClassName = (classId: number) => {
    const cls = classes.find((c) => c.id === classId);
    return cls?.name || "Unknown Class";
  };

  const handleEndSession = async (sessionId: number) => {
    if (!confirm("Are you sure you want to end this session?")) return;

    try {
      const result = await apiFetch(`api/sessions/${sessionId}/end`, { method: "POST" }, token);
      if (result.ok) {
        await loadData();
      } else {
        setError(result.error || "Failed to end session");
      }
    } catch (err) {
      setError("An error occurred while ending session");
    }
  };

  const filteredSessions = sessions.filter(
    (session) => statusFilter === "all" || session.status === statusFilter
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">All Sessions</h1>
          <p className="text-slate-600 dark:text-slate-400">View and manage all class sessions</p>
        </div>
      </div>

      <ErrorMessage message={error} />

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Sessions ({filteredSessions.length})
          </h2>
          {filteredSessions.length > 0 ? (
            <div className="space-y-3">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                        Session #{session.id}
                      </h3>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          session.status === "active"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : session.status === "completed"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {session.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Class: {getClassName(session.class_id)}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Started: {new Date(session.start_time).toLocaleString()}
                    </p>
                    {session.end_time && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Ended: {new Date(session.end_time).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/admin/sessions/${session.id}`}
                      className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      View Details
                    </Link>
                    {session.status === "active" && (
                      <button
                        onClick={() => handleEndSession(session.id)}
                        className="px-4 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      >
                        End Session
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">No sessions found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

