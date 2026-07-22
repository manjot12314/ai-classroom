"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { apiFetch, uploadFile } from "../../../../lib/api";
import { Loading } from "../../../../components/Loading";
import { ErrorMessage } from "../../../../components/ErrorMessage";
import Link from "next/link";

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

export default function TeacherSessionsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ class_id: "" });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState<number | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState<number | null>(null);
  const [liveAttendanceSession, setLiveAttendanceSession] = useState<number | null>(null);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [sessionsRes, classesRes] = await Promise.all([
        apiFetch<Session[]>("api/sessions", { method: "GET" }, token),
        apiFetch<Class[]>("api/classes", { method: "GET" }, token),
      ]);

      if (sessionsRes.ok && classesRes.ok) {
        setSessions(sessionsRes.data);
        setClasses(classesRes.data);
      } else {
        setError("Failed to load data");
      }
    } catch (err) {
      setError("An error occurred while loading data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const result = await apiFetch("api/sessions", {
        method: "POST",
        body: JSON.stringify({
          class_id: parseInt(formData.class_id),
        }),
      }, token);

      if (result.ok) {
        setShowCreateForm(false);
        setFormData({ class_id: "" });
        await loadData();
      } else {
        setError(result.error || "Failed to create session");
      }
    } catch (err) {
      setError("An error occurred while creating session");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndSession = async (sessionId: number) => {
    if (!confirm("Are you sure you want to end this session?")) return;

    try {
      const result = await apiFetch(`api/sessions/${sessionId}/end`, { method: "POST" }, token);
      if (result.ok) {
        await loadData();
      } else {
        setError(result.error || "Failed to end session");
      }
    } catch (err) {
      setError("An error occurred while ending session");
    }
  };

  const handleVideoUpload = async (sessionId: number, file: File) => {
    setUploadingVideo(sessionId);
    setError("");

    try {
      const result = await uploadFile(
        "/api/attendance/process-video",
        file,
        { session_id: sessionId },
        token
      );

      if (result.ok) {
        alert("Attendance video processed successfully!");
      } else {
        setError(result.error || "Failed to process video");
      }
    } catch (err) {
      setError("An error occurred while uploading video");
    } finally {
      setUploadingVideo(null);
    }
  };

  const handleAudioUpload = async (sessionId: number, file: File) => {
    setUploadingAudio(sessionId);
    setError("");

    try {
      const result = await uploadFile(
        "/api/voice/process-audio",
        file,
        { session_id: sessionId },
        token
      );

      if (result.ok) {
        alert("Voice audio processed successfully!");
      } else {
        setError(result.error || "Failed to process audio");
      }
    } catch (err) {
      setError("An error occurred while uploading audio");
    } finally {
      setUploadingAudio(null);
    }
  };

  const getClassName = (classId: number) => {
    const cls = classes.find((c) => c.id === classId);
    return cls?.name || "Unknown Class";
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">My Sessions</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage and monitor your class sessions</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
        >
          {showCreateForm ? "Cancel" : "Start New Session"}
        </button>
      </div>

      <ErrorMessage message={error} />

      {/* Create Session Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Start New Session</h2>
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Select Class *
              </label>
              <select
                required
                value={formData.class_id}
                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
              >
                {submitting ? "Starting..." : "Start Session"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ class_id: "" });
                }}
                className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sessions List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Sessions ({sessions.length})</h2>
          {sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                          Session #{session.id}
                        </h3>
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
                        Class: {getClassName(session.class_id)}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Started: {new Date(session.start_time).toLocaleString()}
                      </p>
                      {session.end_time && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Ended: {new Date(session.end_time).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/teacher/sessions/${session.id}`}
                        className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        View Details
                      </Link>
                      {session.status === "active" && (
                        <button
                          onClick={() => handleEndSession(session.id)}
                          className="px-4 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                          End Session
                        </button>
                      )}
                    </div>
                  </div>
                  {session.status === "active" && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 flex gap-3 flex-wrap">
                      <button
                        onClick={() => setLiveAttendanceSession(session.id)}
                        className="px-4 py-2 text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                      >
                        Mark Live Attendance
                      </button>
                      <label className="px-4 py-2 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors cursor-pointer">
                        {uploadingVideo === session.id ? "Uploading..." : "Upload Attendance Video"}
                        <input
                          type="file"
                          accept="video/*,image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleVideoUpload(session.id, file);
                          }}
                          disabled={uploadingVideo === session.id}
                        />
                      </label>
                      <label className="px-4 py-2 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors cursor-pointer">
                        {uploadingAudio === session.id ? "Uploading..." : "Upload Voice Audio"}
                        <input
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleAudioUpload(session.id, file);
                          }}
                          disabled={uploadingAudio === session.id}
                        />
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">No sessions yet. Start your first session!</p>
            </div>
          )}
        </div>
      </div>

      {/* Live Attendance Modal */}
      {liveAttendanceSession && (
        <LiveAttendanceModal
          sessionId={liveAttendanceSession}
          onClose={() => setLiveAttendanceSession(null)}
          onSuccess={async () => {
            setLiveAttendanceSession(null);
            await loadData();
          }}
          token={token}
        />
      )}
    </div>
  );
}

// Live Attendance Modal Component
function LiveAttendanceModal({
  sessionId,
  onClose,
  onSuccess,
  token,
}: {
  sessionId: number;
  onClose: () => void;
  onSuccess: () => void;
  token: string | null;
}) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [detectedStudents, setDetectedStudents] = useState<Array<{ student_id: number; confidence: number; timestamp: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessTimeRef = useRef<number>(0);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      setStream(mediaStream);
    } catch (err) {
      setError("Failed to access camera. Please allow camera permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    setError(null);
    setDetectedStudents([]);
    lastProcessTimeRef.current = Date.now();
    
    // Process frames every 3 seconds
    intervalRef.current = setInterval(() => {
      captureAndProcess();
    }, 3000);
    
    // Also process immediately
    captureAndProcess();
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const captureAndProcess = async () => {
    if (!videoRef.current || !stream || processing) return;

    // Throttle: don't process if last processing was less than 2 seconds ago
    const now = Date.now();
    if (now - lastProcessTimeRef.current < 2000) return;
    lastProcessTimeRef.current = now;

    setProcessing(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx && videoRef.current) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob(async (blob) => {
          if (blob) {
            await processAttendance(blob);
          }
          setProcessing(false);
        }, "image/jpeg");
      } else {
        setProcessing(false);
      }
    } catch (err) {
      setError("Failed to capture frame");
      setProcessing(false);
    }
  };

  const processAttendance = async (blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("file", blob, "live-attendance.jpg");
      formData.append("session_id", sessionId.toString());

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"}/api/attendance/process-video`, {
        method: "POST",
        body: formData,
        headers,
      });

      const json = await res.json();

      if (res.ok && json.matches && json.matches.length > 0) {
        // Add newly detected students to the list
        const newDetections = json.matches.map((match: any) => ({
          student_id: match.student_id,
          confidence: match.confidence,
          timestamp: new Date().toLocaleTimeString(),
        }));
        
        setDetectedStudents((prev) => {
          // Only add if not already detected recently (within last 10 seconds)
          const recent = prev.filter(
            (d) => Date.now() - new Date(d.timestamp).getTime() < 10000
          );
          const newOnes = newDetections.filter(
            (newDet: any) => !recent.some((r) => r.student_id === newDet.student_id)
          );
          return [...recent, ...newOnes].slice(-20); // Keep last 20 detections
        });
      } else if (!res.ok) {
        if (json.detail && !json.detail.includes("No faces detected") && !json.detail.includes("No enrolled faces")) {
          setError(json.detail);
        }
      }
    } catch (err) {
      // Silently handle errors during continuous processing
      console.error("Processing error:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Mark Live Attendance</h2>
            <button
              onClick={onClose}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="font-semibold text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Status Indicator */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isMonitoring ? "bg-green-500 animate-pulse" : "bg-slate-400"}`}></div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {isMonitoring ? "Live Monitoring Active" : "Monitoring Stopped"}
              </span>
            </div>
            {processing && (
              <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </span>
            )}
          </div>

          <div className="relative bg-slate-900 rounded-lg overflow-hidden" style={{ aspectRatio: "4/3" }}>
            {stream ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
                {isMonitoring && (
                  <div className="absolute top-4 left-4 bg-green-500/90 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    LIVE
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <p>Camera not available</p>
                </div>
              </div>
            )}
          </div>

          {/* Detected Students List */}
          {detectedStudents.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Recently Detected Students
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {detectedStudents.map((detection, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">Student #{detection.student_id}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">{detection.timestamp}</span>
                    </div>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {(detection.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {!isMonitoring ? (
              <button
                onClick={startMonitoring}
                disabled={!stream}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Live Monitoring
              </button>
            ) : (
              <button
                onClick={stopMonitoring}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
                </svg>
                Stop Monitoring
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            {isMonitoring
              ? "Students will be automatically detected and marked present as they appear in front of the camera."
              : "Click 'Start Live Monitoring' to begin automatic attendance marking. Students will be detected as they come into view."}
          </p>
        </div>
      </div>
    </div>
  );
}

