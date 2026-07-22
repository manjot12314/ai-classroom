"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { apiFetch, uploadFile } from "../../../../lib/api";
import { Loading } from "../../../../components/Loading";
import { ErrorMessage } from "../../../../components/ErrorMessage";
import Link from "next/link";

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

export default function AdminStudentsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadingFace, setUploadingFace] = useState<number | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<number | null>(null);

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

  const getClassName = (classId: number) => {
    const cls = classes.find((c) => c.id === classId);
    return cls?.name || "Unknown Class";
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
        await loadData();
      } else {
        setError(result.error || "Failed to upload face encoding");
      }
    } catch (err) {
      setError("An error occurred while uploading face encoding");
    } finally {
      setUploadingFace(null);
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    if (!confirm(`Delete ${student.name}? This will remove all attendance and attentiveness records.`)) return;
    setDeletingStudentId(student.id);
    setError("");
    try {
      const result = await apiFetch<{ message: string }>(`api/students/${student.id}`, { method: "DELETE" }, token);
      if (result.ok) {
        await loadData();
      } else {
        setError(result.error || "Failed to delete student");
      }
    } catch (err) {
      setError("An error occurred while deleting student");
    } finally {
      setDeletingStudentId(null);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">All Students</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage all students in the system</p>
        </div>
        <Link
          href="/dashboard/admin/students/new"
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
        >
          Add New Student
        </Link>
      </div>

      <ErrorMessage message={error} />

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-200 dark:border-slate-700">
        <input
          type="text"
          placeholder="Search students by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Students List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Students ({filteredStudents.length})
          </h2>
          {filteredStudents.length > 0 ? (
            <div className="space-y-3">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{student.name}</h3>
                      {student.face_encoding ? (
                        <span className="px-2 py-1 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                          Face Encoded
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
                          No Face Encoding
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{student.email}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Class: {getClassName(student.class_id)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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
                    <Link
                      href={`/dashboard/admin/students/${student.id}/edit`}
                      className="px-4 py-2 text-sm bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/dashboard/admin/students/${student.id}`}
                      className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      View Details
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteStudent(student)}
                      disabled={deletingStudentId === student.id}
                      className="px-4 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                    >
                      {deletingStudentId === student.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">
                {searchTerm ? "No students found matching your search" : "No students yet. Add your first student!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

