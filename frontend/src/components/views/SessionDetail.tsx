"use client";

import { useState } from "react";

interface Session {
  id: number;
  class_id: number;
  start_time: string;
  end_time: string | null;
  status: string;
}

interface Attendance {
  id: number;
  student_id: number;
  detected_at: string;
  confidence_score: number;
}

interface Attentiveness {
  id: number;
  student_id: number;
  timestamp: string;
  score: number;
  head_pose: string | null;
  eye_state: string | null;
}

interface VoiceAnalytics {
  id: number;
  timestamp: string;
  activity_level: number;
  clarity_score: number;
  speaking_pattern: string | null;
}

interface SessionDetailProps {
  session: Session;
  attendance: Attendance[];
  attentiveness: Attentiveness[];
  voiceAnalytics: VoiceAnalytics[];
  onEndSession?: () => void;
  onGenerateReport?: () => void;
}

export function SessionDetail({
  session,
  attendance,
  attentiveness,
  voiceAnalytics,
  onEndSession,
  onGenerateReport,
}: SessionDetailProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "attentiveness" | "voice">("overview");

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Session #{session.id}</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Started: {new Date(session.start_time).toLocaleString()}
            </p>
            {session.end_time && (
              <p className="text-slate-600 dark:text-slate-400">
                Ended: {new Date(session.end_time).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            {session.status === "active" && onEndSession && (
              <button
                onClick={onEndSession}
                className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              >
                End Session
              </button>
            )}
            {session.status === "completed" && onGenerateReport && (
              <button
                onClick={onGenerateReport}
                className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                Generate Report
              </button>
            )}
          </div>
        </div>
        <span
          className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
            session.status === "active"
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
          }`}
        >
          {session.status}
        </span>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="flex -mb-px">
            {(["overview", "attendance", "attentiveness", "voice"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Attendance Records</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{attendance.length}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Attentiveness Checks</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{attentiveness.length}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Voice Analytics</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{voiceAnalytics.length}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="space-y-3">
              {attendance.length > 0 ? (
                attendance.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Student #{record.student_id}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Detected: {new Date(record.detected_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                      {(record.confidence_score * 100).toFixed(1)}% confidence
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 dark:text-slate-400">No attendance records</p>
              )}
            </div>
          )}

          {activeTab === "attentiveness" && (
            <div className="space-y-3">
              {attentiveness.length > 0 ? (
                attentiveness.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-slate-900 dark:text-white">Student #{record.student_id}</p>
                      <span className="px-3 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                        Score: {(record.score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {new Date(record.timestamp).toLocaleString()}
                    </p>
                    {record.head_pose && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Head: {record.head_pose} | Eyes: {record.eye_state || "N/A"}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-500 dark:text-slate-400">No attentiveness records</p>
              )}
            </div>
          )}

          {activeTab === "voice" && (
            <div className="space-y-3">
              {voiceAnalytics.length > 0 ? (
                voiceAnalytics.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {new Date(record.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Activity Level</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {(record.activity_level * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Clarity Score</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {(record.clarity_score * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    {record.speaking_pattern && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Pattern: {record.speaking_pattern}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-500 dark:text-slate-400">No voice analytics records</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

