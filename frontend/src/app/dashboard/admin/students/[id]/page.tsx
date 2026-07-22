"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../../../contexts/AuthContext";
import { apiFetch, uploadFile } from "../../../../../lib/api";
import { Loading } from "../../../../../components/Loading";
import { ErrorMessage } from "../../../../../components/ErrorMessage";
import { FileUpload } from "../../../../../components/upload/FileUpload";

interface Student {
  id: number;
  name: string;
  email: string;
  class_id: number;
  face_encoding: any | null;
  created_at: string;
}

interface Class {
  id: number;
  name: string;
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
}

export default function AdminStudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const studentId = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [classData, setClassData] = useState<Class | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [attentiveness, setAttentiveness] = useState<Attentiveness[]>([]);
  const [viewingFace, setViewingFace] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (token && studentId) {
      loadStudentData();
    }
  }, [token, studentId]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      setError("");

      // Load all students and find the one we need
      const studentsRes = await apiFetch<Student[]>("api/students", { method: "GET" }, token);
      if (!studentsRes.ok) {
        setError("Failed to load student data");
        return;
      }

      const foundStudent = studentsRes.data.find((s) => s.id === studentId);
      if (!foundStudent) {
        setError("Student not found");
        return;
      }

      setStudent(foundStudent);

      // Load class data
      const classesRes = await apiFetch<Class[]>("api/classes", { method: "GET" }, token);
      if (classesRes.ok) {
        const foundClass = classesRes.data.find((c) => c.id === foundStudent.class_id);
        setClassData(foundClass || null);
      }

      // Load attendance and attentiveness (would need student-specific endpoints)
      // For now, we'll load all and filter
      const [sessionsRes] = await Promise.all([
        apiFetch<any[]>("api/sessions", { method: "GET" }, token),
      ]);

      if (sessionsRes.ok) {
        // Load attendance for all sessions and filter by student
        const attendancePromises = sessionsRes.data.map((session) =>
          apiFetch<Attendance[]>(`api/attendance/session/${session.id}`, { method: "GET" }, token)
        );
        const attendanceResults = await Promise.all(attendancePromises);
        const allAttendance: Attendance[] = [];
        attendanceResults.forEach((result) => {
          if (result.ok) {
            allAttendance.push(...result.data.filter((a) => a.student_id === studentId));
          }
        });
        setAttendance(allAttendance);

        // Load attentiveness
        const attentivenessPromises = sessionsRes.data.map((session) =>
          apiFetch<Attentiveness[]>(`api/attentiveness/session/${session.id}`, { method: "GET" }, token)
        );
        const attentivenessResults = await Promise.all(attentivenessPromises);
        const allAttentiveness: Attentiveness[] = [];
        attentivenessResults.forEach((result) => {
          if (result.ok) {
            allAttentiveness.push(...result.data.filter((a) => a.student_id === studentId));
          }
        });
        setAttentiveness(allAttentiveness);
      }
    } catch (err) {
      setError("An error occurred while loading student data");
    } finally {
      setLoading(false);
    }
  };

  const handleFaceUpload = async (file: File) => {
    try {
      const result = await uploadFile(`/api/students/${studentId}/face-encoding`, file, undefined, token);
      if (result.ok) {
        await loadStudentData();
        alert("Face encoding uploaded successfully!");
      } else {
        setError(result.error || "Failed to upload face encoding");
      }
    } catch (err) {
      setError("An error occurred while uploading face encoding");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${student?.name}? This will remove all attendance and attentiveness records.`)) return;
    setDeleting(true);
    setError("");
    try {
      const result = await apiFetch<{ message: string }>(`api/students/${studentId}`, { method: "DELETE" }, token);
      if (result.ok) {
        router.push("/dashboard/admin/students");
      } else {
        setError(result.error || "Failed to delete student");
      }
    } catch (err) {
      setError("An error occurred while deleting student");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!student) {
    return (
      <div className="space-y-6">
        <ErrorMessage message={error || "Student not found"} />
        <Link
          href="/dashboard/admin/students"
          className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
        >
          Back to Students
        </Link>
      </div>
    );
  }

  const avgAttentiveness =
    attentiveness.length > 0
      ? attentiveness.reduce((sum, a) => sum + a.score, 0) / attentiveness.length
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/admin/students"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block"
        >
          ← Back to Students
        </Link>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{student.name}</h1>
            <p className="text-slate-600 dark:text-slate-400">Student details and performance</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/admin/students/${studentId}/edit`}
              className="px-4 py-2 text-sm bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Edit Student
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete Student"}
            </button>
          </div>
        </div>
      </div>

      <ErrorMessage message={error} />

      {/* Student Info */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Student Information</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Name</p>
            <p className="font-semibold text-slate-900 dark:text-white">{student.name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Email</p>
            <p className="font-semibold text-slate-900 dark:text-white">{student.email}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Class</p>
            <p className="font-semibold text-slate-900 dark:text-white">{classData?.name || "Unknown"}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Face Encoding</p>
            <div className="flex items-center gap-3 mt-2">
              {student.face_encoding ? (
                <>
                  <span className="px-3 py-1 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                    Encoded
                  </span>
                  <button
                    onClick={() => setViewingFace(true)}
                    className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50"
                  >
                    View
                  </button>
                </>
              ) : (
                <span className="px-3 py-1 text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
                  Not Encoded
                </span>
              )}
              <FileUpload
                endpoint={`/api/students/${studentId}/face-encoding`}
                accept="image/*"
                buttonText="Upload Face"
                token={token}
                onSuccess={() => loadStudentData()}
                onError={(err) => setError(err)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Attendance Records</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{attendance.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Attentiveness Checks</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{attentiveness.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Avg Attentiveness</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{avgAttentiveness.toFixed(1)}%</p>
        </div>
      </div>

      {/* Face Encoding Modal */}
      {viewingFace && student.face_encoding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewingFace(false)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Face Encoding - {student.name}</h2>
                <button
                  onClick={() => setViewingFace(false)}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-green-400 font-mono">
                  {Array.isArray(student.face_encoding)
                    ? `[${student.face_encoding.slice(0, 10).map((v: number) => v.toFixed(6)).join(", ")}${
                        student.face_encoding.length > 10 ? `, ... (${student.face_encoding.length - 10} more)` : ""
                      }]`
                    : JSON.stringify(student.face_encoding, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

