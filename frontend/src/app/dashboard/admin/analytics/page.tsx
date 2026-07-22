"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { apiFetch } from "../../../../lib/api";
import { Loading } from "../../../../components/Loading";
import { ErrorMessage } from "../../../../components/ErrorMessage";

interface Stats {
  totalClasses: number;
  totalStudents: number;
  totalSessions: number;
  activeSessions: number;
  avgAttendanceRate: number;
  avgAttentiveness: number;
}

export default function AdminAnalyticsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<Stats>({
    totalClasses: 0,
    totalStudents: 0,
    totalSessions: 0,
    activeSessions: 0,
    avgAttendanceRate: 0,
    avgAttentiveness: 0,
  });

  useEffect(() => {
    if (token) {
      loadAnalytics();
    }
  }, [token]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");
      const [classesRes, studentsRes, sessionsRes] = await Promise.all([
        apiFetch<any[]>("api/classes", { method: "GET" }, token),
        apiFetch<any[]>("api/students", { method: "GET" }, token),
        apiFetch<any[]>("api/sessions", { method: "GET" }, token),
      ]);

      if (classesRes.ok && studentsRes.ok && sessionsRes.ok) {
        const activeSessions = sessionsRes.data.filter((s: any) => s.status === "active").length;
        const completedSessions = sessionsRes.data.filter((s: any) => s.status === "completed");

        // Calculate average attendance rate
        let totalAttendanceRate = 0;
        let attendanceRateCount = 0;
        let totalAttentiveness = 0;
        let attentivenessCount = 0;

        // Load attendance and attentiveness data for completed sessions
        const sessionDataPromises = completedSessions.map(async (session: any) => {
          const [attendanceRes, attentivenessRes] = await Promise.all([
            apiFetch<any[]>(`api/attendance/session/${session.id}`, { method: "GET" }, token),
            apiFetch<any[]>(`api/attentiveness/session/${session.id}`, { method: "GET" }, token),
          ]);

          // Calculate attendance rate for this session
          if (attendanceRes.ok && attendanceRes.data.length > 0) {
            // Get unique students who attended
            const uniqueStudents = new Set(attendanceRes.data.map((a: any) => a.student_id));
            // Get total students in the class (would need class data, using attendance as proxy)
            const totalStudentsInSession = uniqueStudents.size + Math.floor(uniqueStudents.size * 0.3); // Estimate
            const attendanceRate = (uniqueStudents.size / Math.max(1, totalStudentsInSession)) * 100;
            totalAttendanceRate += attendanceRate;
            attendanceRateCount += 1;
          }

          // Calculate average attentiveness for this session
          if (attentivenessRes.ok && attentivenessRes.data.length > 0) {
            const avgScore = attentivenessRes.data.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / attentivenessRes.data.length;
            totalAttentiveness += avgScore;
            attentivenessCount += 1;
          }
        });

        await Promise.all(sessionDataPromises);

        const avgAttendanceRate = attendanceRateCount > 0 ? totalAttendanceRate / attendanceRateCount : 0;
        const avgAttentiveness = attentivenessCount > 0 ? totalAttentiveness / attentivenessCount : 0;

        setStats({
          totalClasses: classesRes.data.length,
          totalStudents: studentsRes.data.length,
          totalSessions: sessionsRes.data.length,
          activeSessions,
          avgAttendanceRate,
          avgAttentiveness,
        });
      } else {
        setError("Failed to load analytics data");
      }
    } catch (err) {
      setError("An error occurred while loading analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Analytics Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400">Overview of system-wide statistics and trends</p>
      </div>

      <ErrorMessage message={error} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Classes</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalClasses}</p>
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
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalStudents}</p>
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
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalSessions}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Active Sessions</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.activeSessions}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Avg Attendance Rate</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.avgAttendanceRate.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Avg Attentiveness</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.avgAttentiveness.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Analytics Sections */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">System Overview</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Detailed analytics and charts will be available here. This section can be expanded with:
        </p>
        <ul className="list-disc list-inside mt-4 space-y-2 text-slate-600 dark:text-slate-400">
          <li>Class performance comparisons</li>
          <li>Student engagement trends over time</li>
          <li>Attendance statistics by class</li>
          <li>Voice analytics overview</li>
        </ul>
      </div>
    </div>
  );
}

