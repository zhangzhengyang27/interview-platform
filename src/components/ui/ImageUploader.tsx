"use client";

import { useRef, useState } from "react";
import { uploadToOSS } from "@/lib/oss-upload";

interface ImageUploaderProps {
  value?: string;
  onChange?: (url: string) => void;
  accept?: string;
  className?: string;
}

export function ImageUploader({
  value,
  onChange,
  accept = "image/*",
  className = "",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("只支持图片文件");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("文件大小不能超过 10MB");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const url = await uploadToOSS(file);
      onChange?.(url);
    } catch (e) {
      console.error(e);
      setError("上传失败，请重试");
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleInputChange}
      />

      {value ? (
        <div className="relative group inline-block">
          <img
            src={value}
            alt="Uploaded"
            className="max-w-xs max-h-40 rounded border border-outline-variant object-cover"
          />
          <button
            type="button"
            onClick={() => onChange?.("")}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-error text-on-error text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            title="移除"
            aria-label="移除图片"
          >
            ✕
          </button>
        </div>
      ) : (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${dragging ? "border-primary bg-primary/5" : "border-outline-variant hover:border-primary/50"}
          `}
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-on-surface-variant">上传中...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-8 h-8 text-on-surface-variant" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-sm text-on-surface-variant">
                点击或拖拽上传图片
              </span>
              <span className="text-xs text-on-surface-variant/60">支持 JPG、PNG、GIF、WebP，最大 10MB</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-error mt-1">{error}</p>
      )}
    </div>
  );
}
