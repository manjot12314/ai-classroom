"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../../contexts/AuthContext";
import { apiFetch } from "../../../../../lib/api";
import { Loading } from "../../../../../components/Loading";
import { ErrorMessage } from "../../../../../components/ErrorMessage";
import Link from "next/link";

interface Class {
  id: number;
  name: string;
  schedule: string | null;
  teacher_id: number;
  created_at: string;
}

interface Student {
  id: number;
  name: string;
  email: string;
  class_id: number;
}

interface Session {
  id: number;
  class_id: number;
  start_time: string;
  end_time: string | null;
  status: string;
}

export default function TeacherClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const classId = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [classroom, setClassroom] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    if (token && classId) {
      loadClassData();
    }
  }, [token, classId]);

  const loadClassData = async () => {
    try {
      setLoading(true);
      setError("");

      const [classRes, studentsRes, sessionsRes] = await Promise.all([
        apiFetch<Class>(`api/classes/${classId}`, { method: "GET" }, token),
        apiFetch<Student[]>("api/students", { method: "GET" }, token),
        apiFetch<Session[]>("api/sessions", { method: "GET" }, token),
      ]);

      if (classRes.ok && studentsRes.ok && sessionsRes.ok) {
        setClassroom(classRes.data);
        setStudents(studentsRes.data.filter((s) => s.class_id === classId));
        setSessions(sessionsRes.data.filter((s) => s.class_id === classId));
      } else {
        setError("Failed to load class data");
      }
    } catch (err) {
      setError("An error occurred while loading class data");
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async () => {
    try {
      setError("");
      const result = await apiFetch("api/sessions", {
        method: "POST",
        body: JSON.stringify({ class_id: classId }),
      }, token);

      if (result.ok) {
        await loadClassData();
        router.push(`/dashboard/teacher/sessions`);
      } else {
        setError(result.error || "Failed to start session");
      }
    } catch (err) {
      setError("An error occurred while starting session");
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!classroom) {
    return (
      <div className="space-y-6">
        <ErrorMessage message="Class not found" />
        <Link href="/dashboard/teacher/classes" className="text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Classes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/teacher/classes" className="text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block">
            ← Back to Classes
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{classroom.name}</h1>
          {classroom.schedule && (
            <p className="text-slate-600 dark:text-slate-400">{classroom.schedule}</p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleStartSession}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
          >
            Start New Session
          </button>
          <Link
            href="/dashboard/teacher/students"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            Add Student
          </Link>
        </div>
      </div>

      <ErrorMessage message={error} />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Students</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{students.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Sessions</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{sessions.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Active Sessions</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {sessions.filter((s) => s.status === "active").length}
          </p>
        </div>
      </div>

      {/* Students Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Students ({students.length})</h2>
          <Link
            href="/dashboard/teacher/students"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Manage Students
          </Link>
        </div>
        {students.length > 0 ? (
          <div className="space-y-3">
            {students.map((student) => (
              <div
                key={student.id}
                className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{student.name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{student.email}</p>
                </div>
                <Link
                  href={`/dashboard/teacher/students/${student.id}`}
                  className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400">No students enrolled yet</p>
        )}
      </div>

      {/* Sessions Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sessions ({sessions.length})</h2>
          <Link
            href="/dashboard/teacher/sessions"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View All Sessions
          </Link>
        </div>
        {sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-slate-900 dark:text-white">Session #{session.id}</p>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        session.status === "active"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {new Date(session.start_time).toLocaleString()}
                  </p>
                </div>
                <Link
                  href={`/dashboard/teacher/sessions/${session.id}`}
                  className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400">No sessions yet. Start your first session!</p>
        )}
      </div>
    </div>
  );
}

