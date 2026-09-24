"use client";

import { useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface AvatarCropperProps {
  value?: string;
  onChange?: (url: string) => void;
}

const OUTPUT_SIZE = 320; // 输出正方形头像边长(px)

function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas 不可用"));
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE
      );
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("导出失败"))),
        "image/jpeg",
        0.92
      );
    };
    image.onerror = () => reject(new Error("图片加载失败"));
    image.src = imageSrc;
  });
}

export function AvatarCropper({ value, onChange }: AvatarCropperProps) {
  const [editing, setEditing] = useState(false);
  const [src, setSrc] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const openFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("仅支持图片文件");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("图片不能超过 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setEditing(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleConfirm = async () => {
    if (!areaPixels) return;
    setUploading(true);
    try {
      const blob = await getCroppedBlob(src, areaPixels);
      const form = new FormData();
      form.append("file", blob, "avatar.jpg");
      const res = await fetch("/api/upload/avatar", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "上传失败");
      onChange?.(data.url);
      toast.success("头像已更新");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = () => {
    onChange?.("");
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        {value ? (
          <img
            src={value}
            alt="头像"
            className="w-20 h-20 rounded-full object-cover border-2"
            style={{ borderColor: "var(--outline-variant)" }}
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold"
            style={{
              backgroundColor: "var(--surface-high)",
              color: "var(--on-surface-variant)",
            }}
          >
            ?
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            选择图片
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={removeAvatar}>
              移除
            </Button>
          )}
        </div>
        <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
          支持 JPG/PNG/WebP，上传后可裁剪为正方形
        </p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={openFile}
      />

      <Modal
        open={editing}
        onClose={() => !uploading && setEditing(false)}
        title="裁剪头像"
        width={420}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(false)} disabled={uploading}>
              取消
            </Button>
            <Button onClick={handleConfirm} loading={uploading}>
              确认
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div
            className="relative w-full rounded-lg overflow-hidden bg-surface-high"
            style={{ aspectRatio: "1 / 1" }}
          >
            {src && (
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, areaPixels) => setAreaPixels(areaPixels)}
              />
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs shrink-0" style={{ color: "var(--on-surface-variant)" }}>
              缩放
            </span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-[var(--primary)]"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
