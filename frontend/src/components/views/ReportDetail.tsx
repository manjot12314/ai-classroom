"use client";

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

interface ReportDetailProps {
  report: Report;
}

export function ReportDetail({ report }: ReportDetailProps) {
  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Report for Session #{report.session_id}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Generated: {new Date(report.generated_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Attendance Summary */}
      {report.attendance_summary && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Attendance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Students</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {report.attendance_summary.total_students || 0}
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">Present</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {report.attendance_summary.present || 0}
              </p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">Absent</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                {report.attendance_summary.absent || 0}
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">Attendance Rate</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {report.attendance_summary.attendance_rate?.toFixed(1) || 0}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Engagement Metrics */}
      {report.engagement_metrics && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Engagement Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">Avg Attentiveness</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {report.engagement_metrics.avg_attentiveness?.toFixed(1) || 0}%
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Checks</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {report.engagement_metrics.total_checks || 0}
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">High Engagement</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {report.engagement_metrics.high_engagement || 0}
              </p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">Low Engagement</p>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                {report.engagement_metrics.low_engagement || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Report Data */}
      {report.report_data && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Additional Information</h3>
          <div className="space-y-2">
            {report.report_data.summary && (
              <p className="text-slate-700 dark:text-slate-300">{report.report_data.summary}</p>
            )}
            {report.report_data.duration_minutes && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Duration: {report.report_data.duration_minutes} minutes
              </p>
            )}
            {report.report_data.class_name && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Class: {report.report_data.class_name}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

