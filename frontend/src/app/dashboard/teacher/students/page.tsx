"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { apiFetch, uploadFile } from "../../../../lib/api";
import { Loading } from "../../../../components/Loading";
import { ErrorMessage } from "../../../../components/ErrorMessage";

interface Student {
  id: number;
  name: string;
  email: string;
  class_id: number;
  face_encoding: any | null;
  created_at?: string;
}

interface Class {
  id: number;
  name: string;
}

export default function TeacherStudentsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", class_id: "" });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFace, setUploadingFace] = useState<number | null>(null);
  const [viewingFace, setViewingFace] = useState<Student | null>(null);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [studentsRes, classesRes] = await Promise.all([
        apiFetch<Student[]>("api/students", { method: "GET" }, token),
        apiFetch<Class[]>("api/classes", { method: "GET" }, token),
      ]);

      if (studentsRes.ok && classesRes.ok) {
        setStudents(studentsRes.data);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const result = await apiFetch("api/students", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          class_id: parseInt(formData.class_id),
        }),
      }, token);

      if (result.ok) {
        setShowAddForm(false);
        setFormData({ name: "", email: "", class_id: "" });
        await loadData();
      } else {
        setError(result.error || "Failed to add student");
      }
    } catch (err) {
      setError("An error occurred while adding student");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFaceUpload = async (studentId: number, file: File) => {
    setUploadingFace(studentId);
    setError("");

    try {
      const result = await uploadFile(
        `/api/students/${studentId}/face-encoding`,
        file,
        undefined,
        token
      );

      if (result.ok) {
        alert("Face encoding uploaded successfully!");
        await loadData(); // Reload to show updated face encoding status
      } else {
        setError(result.error || "Failed to upload face encoding");
      }
    } catch (err) {
      setError("An error occurred while uploading face encoding");
    } finally {
      setUploadingFace(null);
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">My Students</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage students in your classes</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
        >
          {showAddForm ? "Cancel" : "Add New Student"}
        </button>
      </div>

      <ErrorMessage message={error} />

      {/* Add Student Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Add New Student</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Student Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Class *
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
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
              >
                {submitting ? "Adding..." : "Add Student"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ name: "", email: "", class_id: "" });
                }}
                className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Students List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Students ({students.length})</h2>
          {students.length > 0 ? (
            <div className="space-y-3">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{student.name}</h3>
                      {student.face_encoding ? (
                        <span className="px-2 py-1 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Face Encoded
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          No Face Encoding
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{student.email}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Class: {getClassName(student.class_id)}
                    </p>
                    {student.face_encoding && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        Face encoding available
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {student.face_encoding && (
                      <button
                        onClick={() => setViewingFace(student)}
                        className="px-4 py-2 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Show Face
                      </button>
                    )}
                    <label className={`px-4 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                      student.face_encoding
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                        : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50"
                    }`}>
                      {uploadingFace === student.id ? "Uploading..." : student.face_encoding ? "Replace Face" : "Upload Face"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFaceUpload(student.id, file);
                        }}
                        disabled={uploadingFace === student.id}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">No students yet. Add your first student!</p>
            </div>
          )}
        </div>
      </div>

      {/* Face Encoding View Modal */}
      {viewingFace && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewingFace(null)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Face Encoding Details - {viewingFace.name}
                </h2>
                <button
                  onClick={() => setViewingFace(null)}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold text-green-800 dark:text-green-300">Face Encoding Status</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-400">
                  This student has a face encoding registered. The encoding is a 128-dimensional vector used for face recognition.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">Encoding Information</h3>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Encoding Dimensions:</span>
                    <span className="text-sm font-mono text-slate-900 dark:text-white">
                      {Array.isArray(viewingFace.face_encoding) ? viewingFace.face_encoding.length : "N/A"} dimensions
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Data Type:</span>
                    <span className="text-sm font-mono text-slate-900 dark:text-white">
                      {Array.isArray(viewingFace.face_encoding) ? "Array of floats" : typeof viewingFace.face_encoding}
                    </span>
                  </div>
                  {viewingFace.created_at && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Student Created:</span>
                      <span className="text-sm text-slate-900 dark:text-white">
                        {new Date(viewingFace.created_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">Encoding Data (Preview)</h3>
                <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-green-400 font-mono">
                    {Array.isArray(viewingFace.face_encoding)
                      ? `[${viewingFace.face_encoding.slice(0, 10).map((v: number) => v.toFixed(6)).join(", ")}${
                          viewingFace.face_encoding.length > 10 ? `, ... (${viewingFace.face_encoding.length - 10} more values)` : ""
                        }]`
                      : JSON.stringify(viewingFace.face_encoding, null, 2)}
                  </pre>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Showing first 10 values. Full encoding contains {Array.isArray(viewingFace.face_encoding) ? viewingFace.face_encoding.length : "unknown"} values.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(viewingFace.face_encoding, null, 2);
                    const dataBlob = new Blob([dataStr], { type: "application/json" });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `${viewingFace.name}_face_encoding.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm"
                >
                  Download JSON
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(viewingFace.face_encoding, null, 2));
                    alert("Face encoding data copied to clipboard!");
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
                >
                  Copy to Clipboard
                </button>
                <button
                  onClick={() => setViewingFace(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm ml-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

