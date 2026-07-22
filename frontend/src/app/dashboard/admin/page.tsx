"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { apiFetch } from "../../../lib/api";
import { Loading } from "../../../components/Loading";
import { ErrorMessage } from "../../../components/ErrorMessage";
import Link from "next/link";

interface Class {
  id: number;
  name: string;
  schedule: string | null;
  teacher_id: number;
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

export default function AdminDashboard() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    classes: 0,
    students: 0,
    sessions: 0,
  });
  const [recentClasses, setRecentClasses] = useState<Class[]>([]);
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch all data in parallel
      const [classesRes, studentsRes, sessionsRes] = await Promise.all([
        apiFetch<Class[]>("api/classes", { method: "GET" }, token),
        apiFetch<Student[]>("api/students", { method: "GET" }, token),
        apiFetch<Session[]>("api/sessions", { method: "GET" }, token),
      ]);

      if (classesRes.ok && studentsRes.ok && sessionsRes.ok) {
        setRecentClasses(classesRes.data.slice(0, 5));
        setRecentStudents(studentsRes.data.slice(0, 5));
        setRecentSessions(sessionsRes.data.slice(0, 5));
        setStats({
          classes: classesRes.data.length,
          students: studentsRes.data.length,
          sessions: sessionsRes.data.length,
        });
      } else {
        setError("Failed to load dashboard data");
      }
    } catch (err) {
      setError("An error occurred while loading data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Admin Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400">Overview of all classes, students, and sessions</p>
      </div>

      <ErrorMessage message={error} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Classes</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.classes}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Students</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.students}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Sessions</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.sessions}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Classes */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Classes</h2>
            <Link href="/dashboard/admin/classes" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentClasses.length > 0 ? (
              recentClasses.map((cls) => (
                <div key={cls.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <p className="font-semibold text-slate-900 dark:text-white">{cls.name}</p>
                  {cls.schedule && <p className="text-sm text-slate-600 dark:text-slate-400">{cls.schedule}</p>}
                </div>
              ))
            ) : (
              <p className="text-slate-500 dark:text-slate-400">No classes yet</p>
            )}
          </div>
        </div>

        {/* Recent Students */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Students</h2>
            <Link href="/dashboard/admin/students" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentStudents.length > 0 ? (
              recentStudents.map((student) => (
                <div key={student.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <p className="font-semibold text-slate-900 dark:text-white">{student.name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{student.email}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-500 dark:text-slate-400">No students yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Sessions</h2>
          <Link href="/dashboard/admin/sessions" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {recentSessions.length > 0 ? (
            recentSessions.map((session) => (
              <div key={session.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Session #{session.id}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Started: {new Date(session.start_time).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    session.status === "active"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {session.status}
                </span>
              </div>
            ))
          ) : (
            <p className="text-slate-500 dark:text-slate-400">No sessions yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

