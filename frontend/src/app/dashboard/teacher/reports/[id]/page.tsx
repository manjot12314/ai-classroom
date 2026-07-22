"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../../contexts/AuthContext";
import { apiFetch } from "../../../../../lib/api";
import { Loading } from "../../../../../components/Loading";
import { ErrorMessage } from "../../../../../components/ErrorMessage";
import { ReportDetail } from "../../../../../components/views/ReportDetail";
import Link from "next/link";

interface Report {
  id: number;
  session_id: number;
  generated_at: string;
  attendance_summary: {
    total_students?: number;
    present?: number;
    absent?: number;
    attendance_rate?: number;
  } | null;
  engagement_metrics: {
    avg_attentiveness?: number;
    total_checks?: number;
    high_engagement?: number;
    low_engagement?: number;
  } | null;
  report_data: any;
}

interface Session {
  id: number;
  class_id: number;
  start_time: string;
  end_time: string | null;
  status: string;
}

export default function TeacherReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const reportId = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    if (token && reportId) {
      loadReport();
    }
  }, [token, reportId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      // Load all sessions to get their reports
      const sessionsRes = await apiFetch<Session[]>("api/sessions", { method: "GET" }, token);
      if (!sessionsRes.ok) {
        setError("Failed to load sessions");
        return;
      }

      // Get all completed sessions
      const completedSessions = sessionsRes.data.filter((s) => s.status === "completed");

      // Load reports for all completed sessions
      const reportPromises = completedSessions.map((session) =>
        apiFetch<Report[]>(`api/reports/session/${session.id}`, { method: "GET" }, token)
      );
      const results = await Promise.all(reportPromises);

      // Find the report with matching ID
      let foundReport: Report | null = null;
      for (const result of results) {
        if (result.ok) {
          const matchingReport = result.data.find((r) => r.id === reportId);
          if (matchingReport) {
            foundReport = matchingReport;
            break;
          }
        }
      }

      if (!foundReport) {
        setError("Report not found");
        return;
      }

      setReport(foundReport);
    } catch (err) {
      setError("An error occurred while loading report");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <ErrorMessage message={error || "Report not found"} />
        <Link
          href="/dashboard/teacher/reports"
          className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
        >
          Back to Reports
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/teacher/reports"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block"
          >
            ← Back to Reports
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Report Details</h1>
          <p className="text-slate-600 dark:text-slate-400">View detailed report information</p>
        </div>
      </div>

      <ErrorMessage message={error} />

      <ReportDetail report={report} />
    </div>
  );
}

