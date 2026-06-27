import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bus, CalendarDays, CircleDot, Hotel, Map, MapPin, Navigation, PlusCircle, Route, Star, Utensils } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../lib/api-client";
import { itineraryInputSchema, type ItineraryInput } from "../lib/schemas";
import { categoryLabel, groupItineraryByDay } from "../lib/trip-utils";
import { useUiStore } from "../store/ui-store";
import type { ItineraryItem } from "../types";

const dayMeta: Record<number, { label: string; title: string; summary: string }> = {
  1: {
    label: "Thứ Sáu, 10 tháng 7",
    title: "Di chuyển & Khám phá",
    summary: "Khởi hành từ Hà Nội, check-in trung tâm Hải Phòng và mở màn bằng các điểm ăn uống chính."
  },
  2: {
    label: "Thứ Bảy, 11 tháng 7",
    title: "Biển & Hải sản",
    summary: "Dành ngày thứ hai cho Đồ Sơn, không khí biển và bữa tối hải sản của cả nhóm."
  },
  3: {
    label: "Chủ Nhật, 12 tháng 7",
    title: "Mua quà & Trở về",
    summary: "Hoàn tất trả phòng, mua quà địa phương và di chuyển về Hà Nội."
  }
};

const categoryStyles: Record<
  ItineraryItem["category"],
  {
    Icon: typeof Bus;
    dot: string;
    panel: string;
    label: string;
  }
> = {
  move: { Icon: Bus, dot: "bg-harbor text-white", panel: "border-harbor/30 bg-harbor/5", label: "bg-harbor/10 text-harbor" },
  visit: { Icon: MapPin, dot: "bg-teal-container text-teal-fixed", panel: "border-teal/30 bg-teal/5", label: "bg-teal/10 text-teal" },
  food: { Icon: Utensils, dot: "bg-coral text-white", panel: "border-coral/30 bg-coral/5", label: "bg-coral/10 text-coral" },
  stay: { Icon: Hotel, dot: "bg-teal-fixed text-teal", panel: "border-teal/30 bg-teal/5", label: "bg-teal/10 text-teal" },
  game: { Icon: Star, dot: "bg-sunflower text-ink", panel: "border-sunflower/50 bg-sunflower/10", label: "bg-sunflower/20 text-amber-800" }
};

function TimelineItem({ item, featured }: { item: ItineraryItem; featured: boolean }) {
  const style = categoryStyles[item.category];
  const Icon = style.Icon;

  return (
    <article className="group relative">
      <div className={`absolute -left-[35px] top-1 z-10 grid size-8 place-items-center rounded-full ring-4 ring-white transition-transform group-hover:scale-110 ${style.dot}`}>
        <Icon size={16} />
      </div>
      <div
        className={`relative overflow-hidden rounded-xl border p-4 shadow-sm transition-all duration-300 hover:shadow-hover md:p-5 ${
          featured ? style.panel : "border-border/50 bg-white hover:border-teal/30"
        }`}
      >
        {featured && <div className="absolute right-0 top-0 size-16 rounded-bl-full bg-teal/10" />}
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <h3 className={`font-display text-lg font-bold leading-6 ${featured ? "text-teal-container" : "text-ink"}`}>{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-mist">
              {item.note ?? item.location ?? "Thông tin chi tiết sẽ được trưởng nhóm cập nhật."}
            </p>
          </div>
          <span className="shrink-0 rounded-md bg-white px-2.5 py-1 font-mono text-xs font-black text-teal shadow-sm">{item.time}</span>
        </div>
        <div className="relative mt-3 flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ${style.label}`}>
            <CircleDot size={13} />
            {categoryLabel(item.category)}
          </span>
          {item.location && (
            <span className="inline-flex items-center gap-1 rounded-md bg-surface-container px-2 py-1 text-xs font-semibold text-mist">
              <MapPin size={13} />
              {item.location}
            </span>
          )}
          {item.addedByName && (
            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-mist shadow-sm">
              Được thêm bởi {item.addedByName}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function SchedulePage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const itinerary = useQuery({ queryKey: ["itinerary"], queryFn: api.itinerary });
  const activeDay = useUiStore((state) => state.activeDay);
  const setActiveDay = useUiStore((state) => state.setActiveDay);
  const form = useForm<ItineraryInput>({
    resolver: zodResolver(itineraryInputSchema),
    defaultValues: { day: activeDay, time: "16:00", title: "", category: "visit", location: "", note: "" }
  });
  const addActivity = useMutation({
    mutationFn: api.addItineraryItem,
    onSuccess: () => {
      form.reset({ day: activeDay, time: "16:00", title: "", category: "visit", location: "", note: "" });
      setIsAdding(false);
      void queryClient.invalidateQueries({ queryKey: ["itinerary"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  useEffect(() => {
    form.setValue("day", activeDay);
  }, [activeDay, form]);

  if (itinerary.isLoading) return <Skeleton className="h-[70dvh]" />;
  if (itinerary.isError || !itinerary.data) return <p className="text-coral">Không tải được lịch trình.</p>;

  const grouped = groupItineraryByDay(itinerary.data);
  const items = grouped[activeDay] ?? [];
  const activeMeta = dayMeta[activeDay] ?? dayMeta[1];
  const featuredIndex = items.length > 1 ? 1 : 0;
  const featuredItem = items[featuredIndex];

  return (
    <div className="pb-10">
      <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-3xl font-black leading-tight text-ink md:text-4xl">Lịch trình chi tiết</h1>
          <p className="mt-2 max-w-2xl text-base leading-7 text-mist">Chuyến đi 3 ngày 2 đêm khám phá ẩm thực Hải Phòng.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3].map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`whitespace-nowrap rounded-full border px-5 py-2 text-sm font-bold transition active:scale-95 ${
                activeDay === day
                  ? "border-teal-container bg-teal-container text-teal-fixed shadow-sm"
                  : "border-border/50 bg-surface-container text-mist hover:bg-surface-container"
              }`}
            >
              Ngày {day}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
        <section className="lg:col-span-7">
          <div className="rounded-[20px] border border-border/50 bg-white p-6 shadow-soft">
            <h2 className="mb-6 flex items-center gap-2 font-display text-xl font-bold text-ink">
              <CalendarDays className="text-teal" size={22} />
              {activeMeta.label}
            </h2>
            <div className="relative space-y-8 pl-8 before:absolute before:inset-y-0 before:left-[15px] before:w-px before:bg-border/70">
              {items.map((item, index) => (
                <TimelineItem key={item.id} item={item} featured={index === featuredIndex} />
              ))}
            </div>
          </div>

          <div className="py-5">
            {isAdding ? (
              <form
                className="rounded-[14px] border border-teal/20 bg-white p-4 shadow-soft"
                onSubmit={form.handleSubmit((values) =>
                  addActivity.mutate({
                    ...values,
                    day: activeDay,
                    location: values.location?.trim() || undefined,
                    note: values.note?.trim() || undefined
                  })
                )}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="text-sm font-semibold text-ink">Giờ</span>
                    <Input type="time" {...form.register("time")} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-semibold text-ink">Loại</span>
                    <select
                      className="min-h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm text-ink outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/15"
                      {...form.register("category")}
                    >
                      <option value="visit">Tham quan</option>
                      <option value="food">Ăn uống</option>
                      <option value="move">Di chuyển</option>
                      <option value="stay">Lưu trú</option>
                      <option value="game">Trò chơi</option>
                    </select>
                  </label>
                  <label className="block space-y-1 sm:col-span-2">
                    <span className="text-sm font-semibold text-ink">Tên hoạt động</span>
                    <Input placeholder="Cafe bờ biển" {...form.register("title")} />
                    {form.formState.errors.title ? <span className="text-xs font-semibold text-coral">{form.formState.errors.title.message}</span> : null}
                  </label>
                  <label className="block space-y-1 sm:col-span-2">
                    <span className="text-sm font-semibold text-ink">Địa điểm</span>
                    <Input placeholder="Nhà hát, Đồ Sơn, khách sạn..." {...form.register("location")} />
                  </label>
                </div>
                {addActivity.error ? <p className="mt-3 text-sm font-semibold text-coral">{addActivity.error.message}</p> : null}
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-[10px] border border-border px-4 py-2 text-sm font-semibold text-mist transition hover:bg-surface-low"
                    onClick={() => setIsAdding(false)}
                  >
                    Hủy
                  </button>
                  <Button type="submit" disabled={addActivity.isPending}>
                    <PlusCircle size={18} />
                    Lưu hoạt động
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center">
                <button
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-teal transition hover:bg-teal/5 active:scale-95"
                  onClick={() => setIsAdding(true)}
                >
                  <PlusCircle size={18} />
                  Thêm hoạt động
                </button>
              </div>
            )}
          </div>
        </section>

        <aside className="lg:sticky lg:top-28 lg:col-span-5">
          <div className="overflow-hidden rounded-[24px] border border-border/40 bg-white shadow-panel">
            <div className="relative h-48 w-full bg-surface-container">
              <img
                className="h-full w-full object-cover"
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85"
                alt="Lịch trình Hải Phòng"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <span className="rounded bg-teal/90 px-2 py-1 text-xs font-bold uppercase tracking-[0.05em] text-white">Ngày {activeDay}</span>
                <h2 className="mt-2 font-display text-2xl font-black leading-tight text-white">{activeMeta.title}</h2>
                <p className="mt-1 text-sm leading-5 text-white/85">{activeMeta.summary}</p>
              </div>
            </div>

            <div className="p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-harbor">
                <Route size={16} />
                <span>Route mini-map</span>
              </div>
              <div className="relative mb-6 h-36 overflow-hidden rounded-xl border border-border/50 bg-harbor/10">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(37,99,235,0.10)_25%,transparent_25%),linear-gradient(225deg,rgba(15,118,110,0.10)_25%,transparent_25%)] bg-[length:36px_36px]" />
                <div className="absolute left-5 top-5 rounded-lg bg-white/90 p-2 text-harbor shadow-sm">
                  <Map size={20} />
                </div>
                <div className="absolute inset-x-10 top-1/2 h-1 -translate-y-1/2 rounded-full bg-harbor/30" />
                <div className="absolute left-10 top-1/2 size-4 -translate-y-1/2 rounded-full bg-harbor ring-4 ring-white" />
                <div className="absolute right-10 top-1/2 size-4 -translate-y-1/2 rounded-full bg-teal ring-4 ring-white" />
                <div className="absolute bottom-4 left-5 right-5 flex justify-between text-sm font-bold text-ink">
                  <span>Hà Nội</span>
                  <span>Hải Phòng</span>
                </div>
              </div>

              <h3 className="mb-4 text-xs font-black uppercase tracking-[0.12em] text-mist">Chi tiết thời gian</h3>
              <div className="space-y-3">
                {items.map((item) => {
                  const isFeatured = item.id === featuredItem?.id;
                  return (
                    <div key={item.id} className={`flex gap-4 rounded-lg p-3 ${isFeatured ? "border border-teal/20 bg-teal/5" : "hover:bg-surface-low"}`}>
                      <div className="w-12 shrink-0 text-center">
                        <span className={`block font-mono text-sm font-black ${isFeatured ? "text-teal" : "text-ink"}`}>{item.time}</span>
                        {isFeatured && <span className="text-[10px] font-bold text-teal/70">now</span>}
                      </div>
                      <div className="flex-1">
                        <p className="font-display text-base font-bold leading-6 text-ink">{item.title}</p>
                        <p className="mt-1 text-sm leading-5 text-mist">{item.location ?? item.note ?? "Đang cập nhật"}</p>
                        {item.addedByName ? <p className="mt-1 text-xs font-semibold text-teal">Thêm bởi {item.addedByName}</p> : null}
                        {isFeatured && (
                          <button className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-harbor hover:underline">
                            <Navigation size={13} />
                            Xem đường đi
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
