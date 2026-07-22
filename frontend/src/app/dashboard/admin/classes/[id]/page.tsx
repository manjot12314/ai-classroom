"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../../../contexts/AuthContext";
import { apiFetch } from "../../../../../lib/api";
import { Loading } from "../../../../../components/Loading";
import { ErrorMessage } from "../../../../../components/ErrorMessage";

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

export default function AdminClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const classId = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [classData, setClassData] = useState<Class | null>(null);
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

      if (classRes.ok) {
        setClassData(classRes.data);
      } else {
        setError("Failed to load class data");
        return;
      }

      if (studentsRes.ok) {
        setStudents(studentsRes.data.filter((s) => s.class_id === classId));
      }

      if (sessionsRes.ok) {
        setSessions(sessionsRes.data.filter((s) => s.class_id === classId));
      }
    } catch (err) {
      setError("An error occurred while loading class data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!classData) {
    return (
      <div className="space-y-6">
        <ErrorMessage message={error || "Class not found"} />
        <Link
          href="/dashboard/admin/classes"
          className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
        >
          Back to Classes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/admin/classes"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block"
        >
          ← Back to Classes
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{classData.name}</h1>
        <p className="text-slate-600 dark:text-slate-400">Class details and information</p>
      </div>

      <ErrorMessage message={error} />

      {/* Class Info */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Class Information</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Class Name</p>
            <p className="font-semibold text-slate-900 dark:text-white">{classData.name}</p>
          </div>
          {classData.schedule && (
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Schedule</p>
              <p className="font-semibold text-slate-900 dark:text-white">{classData.schedule}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Created</p>
            <p className="font-semibold text-slate-900 dark:text-white">
              {new Date(classData.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Students */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Students ({students.length})</h2>
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
                  href={`/dashboard/admin/students/${student.id}`}
                  className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400">No students in this class</p>
        )}
      </div>

      {/* Sessions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Sessions ({sessions.length})</h2>
        {sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Session #{session.id}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {new Date(session.start_time).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      session.status === "active"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                    }`}
                  >
                    {session.status}
                  </span>
                  <Link
                    href={`/dashboard/admin/sessions/${session.id}`}
                    className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400">No sessions for this class</p>
        )}
      </div>
    </div>
  );
}

