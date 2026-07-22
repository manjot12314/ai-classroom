"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../../../contexts/AuthContext";
import { apiFetch } from "../../../../../lib/api";
import { Loading } from "../../../../../components/Loading";
import { ErrorMessage } from "../../../../../components/ErrorMessage";
import { SessionDetail } from "../../../../../components/views/SessionDetail";

interface Session {
  id: number;
  class_id: number;
  start_time: string;
  end_time: string | null;
  status: string;
}

interface Attendance {
  id: number;
  session_id: number;
  student_id: number;
  detected_at: string;
  confidence_score: number;
}

interface Attentiveness {
  id: number;
  session_id: number;
  student_id: number;
  timestamp: string;
  score: number;
  head_pose: string | null;
  eye_state: string | null;
}

interface VoiceAnalytics {
  id: number;
  session_id: number;
  timestamp: string;
  activity_level: number;
  clarity_score: number;
  speaking_pattern: string | null;
}

export default function AdminSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const sessionId = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [attentiveness, setAttentiveness] = useState<Attentiveness[]>([]);
  const [voiceAnalytics, setVoiceAnalytics] = useState<VoiceAnalytics[]>([]);

  useEffect(() => {
    if (token && sessionId) {
      loadSessionData();
    }
  }, [token, sessionId]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      setError("");

      // Load all sessions and find the one we need
      const sessionsRes = await apiFetch<Session[]>("api/sessions", { method: "GET" }, token);
      if (!sessionsRes.ok) {
        setError("Failed to load session");
        return;
      }

      const foundSession = sessionsRes.data.find((s) => s.id === sessionId);
      if (!foundSession) {
        setError("Session not found");
        return;
      }

      setSession(foundSession);

      // Load related data in parallel
      const [attendanceRes, attentivenessRes, voiceRes] = await Promise.all([
        apiFetch<Attendance[]>(`api/attendance/session/${sessionId}`, { method: "GET" }, token),
        apiFetch<Attentiveness[]>(`api/attentiveness/session/${sessionId}`, { method: "GET" }, token),
        apiFetch<VoiceAnalytics[]>(`api/voice/session/${sessionId}`, { method: "GET" }, token),
      ]);

      if (attendanceRes.ok) {
        setAttendance(attendanceRes.data);
      }
      if (attentivenessRes.ok) {
        setAttentiveness(attentivenessRes.data);
      }
      if (voiceRes.ok) {
        setVoiceAnalytics(voiceRes.data);
      }
    } catch (err) {
      setError("An error occurred while loading session data");
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!confirm("Are you sure you want to end this session?")) return;

    try {
      const result = await apiFetch(`api/sessions/${sessionId}/end`, { method: "POST" }, token);
      if (result.ok) {
        await loadSessionData();
      } else {
        setError(result.error || "Failed to end session");
      }
    } catch (err) {
      setError("An error occurred while ending session");
    }
  };

  const handleGenerateReport = async () => {
    try {
      const result = await apiFetch(`api/reports/generate?session_id=${sessionId}`, { method: "POST" }, token);
      if (result.ok) {
        alert("Report generated successfully!");
        router.push(`/dashboard/admin/reports`);
      } else {
        setError(result.error || "Failed to generate report");
      }
    } catch (err) {
      setError("An error occurred while generating report");
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <ErrorMessage message={error || "Session not found"} />
        <Link
          href="/dashboard/admin/sessions"
          className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
        >
          Back to Sessions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/admin/sessions"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block"
          >
            ← Back to Sessions
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Session Details</h1>
          <p className="text-slate-600 dark:text-slate-400">View detailed analytics for this session</p>
        </div>
      </div>

      <ErrorMessage message={error} />

      <SessionDetail
        session={session}
        attendance={attendance}
        attentiveness={attentiveness}
        voiceAnalytics={voiceAnalytics}
        onEndSession={handleEndSession}
        onGenerateReport={handleGenerateReport}
      />
    </div>
  );
}

