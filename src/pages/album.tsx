import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CloudUpload, Download, Heart, Upload, UserPlus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../lib/api-client";
import { uploadSchema, type UploadInput } from "../lib/schemas";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { useUiStore } from "../store/ui-store";
import { formatFileSize, isAllowedImageType, MAX_UPLOAD_BYTES } from "../lib/upload";
import type { Photo } from "../types";

const filterOptions = ["Tất cả", "Ngày", "Người đăng"] as const;

function photoHeight(index: number) {
  const heights = ["h-auto", "aspect-[4/5]", "h-auto", "h-auto", "aspect-square"];
  return heights[index % heights.length];
}

export function AlbumPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const queryClient = useQueryClient();
  const photos = useQuery({ queryKey: ["photos"], queryFn: api.photos });
  const filter = useUiStore((state) => state.albumFilter);
  const setFilter = useUiStore((state) => state.setAlbumFilter);
  const form = useForm<UploadInput>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { caption: "", tripDay: 1, tags: [] }
  });
  const addPhoto = useMutation({
    mutationFn: (input: UploadInput) => {
      if (!selectedFile) throw new Error("Chon anh truoc khi tai len");
      return api.uploadPhoto({ file: selectedFile, caption: input.caption, tripDay: input.tripDay });
    },
    onSuccess: () => {
      form.reset();
      setSelectedFile(null);
      setFileError("");
      setPreviewUrl("");
      setIsUploadOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["photos"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const resetUpload = () => {
    form.reset();
    setSelectedFile(null);
    setFileError("");
    setPreviewUrl("");
    setIsUploadOpen(false);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setFileError("");
    setSelectedFile(null);
    setPreviewUrl("");
    if (!file) return;
    if (!isAllowedImageType(file.type)) {
      setFileError("Chi ho tro JPG, PNG, WEBP hoac GIF");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setFileError("File toi da 8 MB");
      event.target.value = "";
      return;
    }
    setSelectedFile(file);
    if (typeof URL.createObjectURL === "function") {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    if (!previewPhoto) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewPhoto(null);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [previewPhoto]);

  useEffect(() => {
    return () => {
      if (previewUrl && typeof URL.revokeObjectURL === "function") URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (photos.isLoading) return <Skeleton className="h-[70dvh]" />;
  if (photos.isError || !photos.data) return <p className="text-coral">Không tải được album.</p>;

  const filtered = photos.data.filter((photo) => filter === "all" || photo.tripDay === Number(filter.replace("day", "")));

  return (
    <div className="pb-24">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold leading-8 text-ink">Album ảnh</h1>
          <p className="mt-2 text-sm leading-5 text-mist">Lưu giữ những khoảnh khắc tuyệt vời tại Hải Phòng.</p>
        </div>

        <div className="flex w-full flex-wrap gap-3 md:w-auto">
          <div className="flex rounded-[10px] border border-border/50 bg-surface-low p-1">
            {filterOptions.map((label, index) => (
              <button
                key={label}
                className={`rounded-[8px] px-4 py-1.5 text-sm font-semibold transition ${
                  index === 0 ? "bg-white text-teal shadow-sm" : "text-mist hover:bg-surface-container"
                }`}
                onClick={() => {
                  if (index === 0) setFilter("all");
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-coral px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-coral/90 active:translate-y-px md:ml-4"
            onClick={() => setIsUploadOpen(true)}
          >
            <Upload size={18} />
            Upload ảnh
          </button>
        </div>
      </div>

      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
        {filtered.map((photo, index) => (
          <button
            key={photo.id}
            className="group relative mb-5 block w-full break-inside-avoid cursor-pointer overflow-hidden rounded-[14px] border border-border bg-white text-left"
            onClick={() => setPreviewPhoto(photo)}
          >
            <img
              className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${photoHeight(index)}`}
              src={photo.secureUrl}
              alt={photo.caption}
            />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/10 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <p className="font-semibold text-white">{photo.caption}</p>
              <p className="mt-1 text-xs text-white/80">
                {photo.uploadedByName} <span className="mx-1">•</span> Ngày {photo.tripDay}
              </p>
            </div>
            <div className="absolute right-3 top-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="grid size-8 place-items-center rounded-full bg-white/90 text-ink backdrop-blur transition hover:bg-surface-container">
                <Heart size={18} />
              </span>
            </div>
          </button>
        ))}
      </div>

      {isUploadOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            aria-label="Đóng upload"
            onClick={resetUpload}
          />
          <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-[14px] border border-border bg-white shadow-panel">
            <div className="flex items-center justify-between border-b border-border/50 p-4">
              <h2 className="font-display text-xl font-semibold leading-7 text-ink">Upload ảnh mới</h2>
              <button className="rounded-full p-1 text-mist transition hover:bg-surface-low" aria-label="Đóng" onClick={resetUpload}>
                <X size={20} />
              </button>
            </div>

            <form className="space-y-4 p-4" onSubmit={form.handleSubmit((values) => addPhoto.mutate(values))}>
              <label className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-coral/40 bg-surface-low p-5 text-center transition hover:bg-surface-container">
                <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileChange} />
                <span className="mb-3 grid size-12 place-items-center rounded-full bg-coral/15 text-coral transition group-hover:scale-110">
                  <CloudUpload size={24} />
                </span>
                <span className="font-semibold text-ink">Kéo thả ảnh vào đây</span>
                <span className="mt-1 text-sm text-mist">
                  hoặc <span className="font-semibold text-coral">chọn file từ máy</span>
                </span>
                {selectedFile ? (
                  <span className="mt-3 rounded-[10px] bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm">
                    {selectedFile.name} <span className="text-mist">({formatFileSize(selectedFile.size)})</span>
                  </span>
                ) : null}
              </label>
              {previewUrl ? <img className="h-28 w-full rounded-[10px] object-cover" src={previewUrl} alt={selectedFile?.name ?? "Preview"} /> : null}
              {fileError ? <p className="rounded-[10px] bg-coral/10 p-3 text-sm font-semibold text-coral">{fileError}</p> : null}

              <div>
                <label className="mb-1 block text-sm font-semibold text-ink" htmlFor="caption">
                  Caption (Mô tả)
                </label>
                <Input id="caption" {...form.register("caption")} placeholder="Nhập mô tả cho bức ảnh..." />
                {form.formState.errors.caption ? (
                  <span className="mt-1 block text-xs font-semibold text-coral">{form.formState.errors.caption.message}</span>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-ink" htmlFor="trip-day">
                    Ngày đi
                  </label>
                  <select
                    id="trip-day"
                    className="min-h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm text-ink outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/15"
                    {...form.register("tripDay")}
                  >
                    <option value={1}>Ngày 1</option>
                    <option value={2}>Ngày 2</option>
                    <option value={3}>Ngày 3</option>
                  </select>
                </div>

                <div>
                  <span className="mb-1 block text-sm font-semibold text-ink">Gắn thẻ</span>
                  <button
                    type="button"
                    className="flex min-h-11 w-full items-center gap-2 rounded-[10px] border border-border bg-white px-3 text-sm text-mist transition hover:bg-surface-low"
                  >
                    <UserPlus size={18} />
                    Chọn thành viên
                  </button>
                </div>
              </div>
            </form>

            <div className="flex justify-end gap-3 border-t border-border/50 bg-surface-low p-4">
              <button
                className="rounded-[10px] border border-border px-5 py-2 text-sm font-semibold text-mist transition hover:bg-surface-container"
                onClick={resetUpload}
              >
                Hủy
              </button>
              <Button
                variant="coral"
                className="px-5"
                disabled={!selectedFile || Boolean(fileError) || addPhoto.isPending}
                onClick={form.handleSubmit((values) => addPhoto.mutate(values))}
              >
                {addPhoto.isPending ? "Đang tải..." : "Tải lên"}
              </Button>
            </div>
            {addPhoto.error ? <p className="px-4 pb-4 text-sm font-semibold text-coral">{addPhoto.error.message}</p> : null}
          </div>
        </div>
      ) : null}

      {previewPhoto ? (
        <div
          className="fixed inset-0 z-[110] flex flex-col bg-black/95 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh"
        >
          <button className="absolute inset-0" aria-label="Đóng xem ảnh" onClick={() => setPreviewPhoto(null)} />
          <div className="absolute top-0 z-20 flex w-full items-center justify-between p-4 text-white">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-surface-container text-mist">{previewPhoto.uploadedByName.charAt(0)}</span>
              <div>
                <p className="font-semibold">{previewPhoto.uploadedByName}</p>
                <p className="text-xs text-white/60">Ngày {previewPhoto.tripDay}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="transition hover:text-coral" aria-label="Tải ảnh">
                <Download size={22} />
              </button>
              <button className="transition hover:text-coral" aria-label="Đóng" onClick={() => setPreviewPhoto(null)}>
                <X size={28} />
              </button>
            </div>
          </div>

          <div className="relative z-10 flex h-full flex-1 items-center justify-center p-4 md:p-12">
            <img className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" src={previewPhoto.secureUrl} alt={previewPhoto.caption} />
          </div>

          <div className="absolute bottom-0 z-20 w-full bg-gradient-to-t from-black/80 to-transparent p-6 text-center">
            <p className="mx-auto max-w-2xl text-white">{previewPhoto.caption}</p>
            <div className="mt-4 flex justify-center gap-2">
              <span className="rounded-full border border-coral bg-coral/30 px-3 py-1 text-xs font-semibold text-white">#album</span>
              <span className="rounded-full border border-white/20 bg-white/20 px-3 py-1 text-xs font-semibold text-white">Ngày {previewPhoto.tripDay}</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
