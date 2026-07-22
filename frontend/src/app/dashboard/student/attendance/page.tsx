"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { apiFetch } from "../../../../lib/api";
import { Loading } from "../../../../components/Loading";
import { ErrorMessage } from "../../../../components/ErrorMessage";

interface Attendance {
  id: number;
  session_id: number;
  student_id: number;
  detected_at: string;
  confidence_score: number;
}

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

export default function StudentAttendancePage() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
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

      // Load all sessions and classes to get context
      const [sessionsRes, classesRes] = await Promise.all([
        apiFetch<Session[]>("api/sessions", { method: "GET" }, token),
        apiFetch<Class[]>("api/classes", { method: "GET" }, token),
      ]);

      if (sessionsRes.ok && classesRes.ok) {
        setSessions(sessionsRes.data);
        setClasses(classesRes.data);

        // Load attendance for all sessions and filter by current student
        const attendancePromises = sessionsRes.data.map((session) =>
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
      } else {
        setError("Failed to load attendance data");
      }
    } catch (err) {
      setError("An error occurred while loading attendance data");
    } finally {
      setLoading(false);
    }
  };

  const getSessionInfo = (sessionId: number) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return null;
    const cls = classes.find((c) => c.id === session.class_id);
    return { session, className: cls?.name || "Unknown Class" };
  };

  // Calculate statistics for the logged-in student
  const presentCount = attendance.length;
  // Get sessions for classes the student is enrolled in
  const studentSessions = sessions.filter((s) => {
    // We need to check if this session's class has the student
    // For now, we'll use all completed sessions as total
    return s.status === "completed";
  });
  const totalSessions = studentSessions.length;
  const attendanceRate = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">My Attendance</h1>
        <p className="text-slate-600 dark:text-slate-400">View your attendance history and statistics</p>
      </div>

      <ErrorMessage message={error} />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Sessions Attended</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{presentCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Sessions</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalSessions}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Attendance Rate</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{attendanceRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Attendance History</h2>
          {attendance.length > 0 ? (
            <div className="space-y-3">
              {attendance.map((record) => {
                const sessionInfo = getSessionInfo(record.session_id);
                return (
                  <div
                    key={record.id}
                    className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {sessionInfo?.className || `Session #${record.session_id}`}
                        </p>
                        <span className="px-3 py-1 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                          Present
                        </span>
                      </div>
                      {sessionInfo?.session && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Session Date: {new Date(sessionInfo.session.start_time).toLocaleDateString()}
                        </p>
                      )}
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Detected: {new Date(record.detected_at).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Confidence: {(record.confidence_score * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">No attendance records found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

