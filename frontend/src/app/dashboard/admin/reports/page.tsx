"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../../contexts/AuthContext";
import { apiFetch } from "../../../../lib/api";
import { Loading } from "../../../../components/Loading";
import { ErrorMessage } from "../../../../components/ErrorMessage";

interface Report {
  id: number;
  session_id: number;
  generated_at: string;
  attendance_summary: any;
  engagement_metrics: any;
  report_data: any;
}

interface Session {
  id: number;
  class_id: number;
  start_time: string;
  status: string;
}

export default function AdminReportsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    if (token) {
      loadSessions();
    }
  }, [token]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await apiFetch<Session[]>("api/sessions", { method: "GET" }, token);
      if (result.ok) {
        setSessions(result.data);
        // Load reports for all completed sessions
        await loadReportsForSessions(result.data.filter((s) => s.status === "completed"));
      } else {
        setError("Failed to load sessions");
      }
    } catch (err) {
      setError("An error occurred while loading data");
    } finally {
      setLoading(false);
    }
  };

  const loadReportsForSessions = async (completedSessions: Session[]) => {
    const reportPromises = completedSessions.map((session) =>
      apiFetch<Report[]>(`api/reports/session/${session.id}`, { method: "GET" }, token)
    );
    const results = await Promise.all(reportPromises);
    const allReports: Report[] = [];
    results.forEach((result) => {
      if (result.ok) {
        allReports.push(...result.data);
      }
    });
    setReports(allReports.sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()));
  };

  const handleGenerateReport = async (sessionId: number) => {
    try {
      setError("");
      const result = await apiFetch(`api/reports/generate?session_id=${sessionId}`, { method: "POST" }, token);
      if (result.ok) {
        await loadSessions();
      } else {
        setError(result.error || "Failed to generate report");
      }
    } catch (err) {
      setError("An error occurred while generating report");
    }
  };

  const completedSessions = sessions.filter((s) => s.status === "completed");

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Reports</h1>
        <p className="text-slate-600 dark:text-slate-400">View and generate daily reports for sessions</p>
      </div>

      <ErrorMessage message={error} />

      {/* Generate Reports Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Generate New Report</h2>
        {completedSessions.length > 0 ? (
          <div className="space-y-3">
            {completedSessions.map((session) => (
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
                <button
                  onClick={() => handleGenerateReport(session.id)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  Generate Report
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400">No completed sessions available for report generation</p>
        )}
      </div>

      {/* Reports List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Generated Reports ({reports.length})</h2>
          {reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        Report for Session #{report.session_id}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Generated: {new Date(report.generated_at).toLocaleString()}
                      </p>
                      {report.attendance_summary && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Attendance: {report.attendance_summary.present || 0} / {report.attendance_summary.total_students || 0} students
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/dashboard/admin/reports/${report.id}`}
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
              <p className="text-slate-500 dark:text-slate-400">No reports generated yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

