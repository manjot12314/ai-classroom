"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { Loading } from "../../components/Loading";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const role = user.role;
  const dashboardPath = `/dashboard/${role}`;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Top Navigation */}
        <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href={dashboardPath} className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CV</span>
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">ClassVision AI</span>
              </Link>

              <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center space-x-4">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{user.email}</span>
                  <span className="px-3 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex">
          {/* Sidebar */}
          <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 min-h-[calc(100vh-4rem)]">
            <nav className="p-4 space-y-2">
              <Link
                href={dashboardPath}
                className="block px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Dashboard
              </Link>
              
              {(role === "admin" || role === "teacher") && (
                <>
                  <Link
                    href={`${dashboardPath}/classes`}
                    className="block px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Classes
                  </Link>
                  <Link
                    href={`${dashboardPath}/students`}
                    className="block px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Students
                  </Link>
                  <Link
                    href={`${dashboardPath}/sessions`}
                    className="block px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Sessions
                  </Link>
                  <Link
                    href={`${dashboardPath}/reports`}
                    className="block px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Reports
                  </Link>
                </>
              )}

              {role === "student" && (
                <>
                  <Link
                    href={`${dashboardPath}/attendance`}
                    className="block px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    My Attendance
                  </Link>
                  <Link
                    href={`${dashboardPath}/performance`}
                    className="block px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    My Performance
                  </Link>
                </>
              )}

              {role === "admin" && (
                <Link
                  href={`${dashboardPath}/analytics`}
                  className="block px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Analytics
                </Link>
              )}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

