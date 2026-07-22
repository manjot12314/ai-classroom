"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { apiFetch } from "../../../lib/api";
import { Loading } from "../../../components/Loading";
import { ErrorMessage } from "../../../components/ErrorMessage";

interface Attendance {
  id: number;
  session_id: number;
  student_id: number;
  detected_at: string;
  confidence_score: number;
}

interface Performance {
  attendance_rate: number;
  attentiveness_score: number;
  overall_score: number;
}

export default function StudentDashboard() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [performance, setPerformance] = useState<Performance | null>(null);

  useEffect(() => {
    if (token && user) {
      loadDashboardData();
    }
  }, [token, user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      // First, get all students to find the one matching the logged-in user's email
      const studentsRes = await apiFetch<any[]>("api/students", { method: "GET" }, token);
      if (!studentsRes.ok) {
        setError("Failed to load student data");
        return;
      }

      // Find student matching the logged-in user's email
      const currentStudent = studentsRes.data.find((s: any) => s.email === user?.email);
      if (!currentStudent) {
        setError("No student record found for your account");
        return;
      }

      // Fetch performance data
      const performanceRes = await apiFetch<any>(`api/performance/student/${currentStudent.id}`, { method: "GET" }, token);
      if (performanceRes.ok) {
        setPerformance({
          attendance_rate: performanceRes.data.attendance_rate || 0,
          attentiveness_score: performanceRes.data.avg_attentiveness || 0,
          overall_score: performanceRes.data.overall_score || 0,
        });
      }

      // Fetch all sessions and attendance records
      const [sessionsRes] = await Promise.all([
        apiFetch<any[]>("api/sessions", { method: "GET" }, token),
      ]);

      if (sessionsRes.ok) {
        // Load attendance for all sessions and filter by current student
        const attendancePromises = sessionsRes.data.map((session: any) =>
          apiFetch<Attendance[]>(`api/attendance/session/${session.id}`, { method: "GET" }, token)
        );
        const attendanceResults = await Promise.all(attendancePromises);
        const allAttendance: Attendance[] = [];
        attendanceResults.forEach((result) => {
          if (result.ok) {
            // Filter by current student
            allAttendance.push(...result.data.filter((a: Attendance) => a.student_id === currentStudent.id));
          }
        });
        setAttendance(allAttendance);
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
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Student Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400">View your attendance, performance, and reports</p>
      </div>

      <ErrorMessage message={error} />

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Attendance Rate</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {performance ? `${performance.attendance_rate}%` : "N/A"}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Attentiveness Score</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {performance ? `${performance.attentiveness_score}%` : "N/A"}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Overall Score</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {performance ? `${performance.overall_score}%` : "N/A"}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Attendance History</h2>
        <div className="space-y-3">
          {attendance.length > 0 ? (
            attendance.map((record) => (
              <div key={record.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Session #{record.session_id}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {new Date(record.detected_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Confidence: {(record.confidence_score * 100).toFixed(1)}%
                  </p>
                </div>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  Present
                </span>
              </div>
            ))
          ) : (
            <p className="text-slate-500 dark:text-slate-400">No attendance records yet</p>
          )}
        </div>
      </div>

      {/* Performance Details */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Performance Details</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Attendance</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {performance ? `${performance.attendance_rate}%` : "N/A"}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${performance?.attendance_rate || 0}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Attentiveness</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {performance ? `${performance.attentiveness_score}%` : "N/A"}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${performance?.attentiveness_score || 0}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Overall</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {performance ? `${performance.overall_score}%` : "N/A"}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${performance?.overall_score || 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

