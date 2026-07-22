"use client";

import { useState, useRef } from "react";
import { uploadFile } from "../../lib/api";

interface FileUploadProps {
  endpoint: string;
  accept?: string;
  fields?: Record<string, string | number>;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  label?: string;
  buttonText?: string;
  token?: string | null;
  disabled?: boolean;
}

export function FileUpload({
  endpoint,
  accept = "*/*",
  fields,
  onSuccess,
  onError,
  label,
  buttonText = "Upload File",
  token,
  disabled = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      const result = await uploadFile(endpoint, file, fields, token);
      if (result.ok) {
        setProgress(100);
        onSuccess?.(result.data);
      } else {
        onError?.(result.error || "Upload failed");
      }
    } catch (error) {
      onError?.((error as Error).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      )}
      <div className="flex items-center gap-3">
        <label
          className={`px-4 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
            disabled || uploading
              ? "bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed"
              : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
          }`}
        >
          {uploading ? "Uploading..." : buttonText}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={disabled || uploading}
            className="hidden"
          />
        </label>
        {uploading && (
          <div className="flex-1 max-w-xs">
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

