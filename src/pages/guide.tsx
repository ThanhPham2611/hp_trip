import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckSquare, Hotel, Info, MapPin, ShieldCheck, Utensils } from "lucide-react";
import { api } from "../lib/api-client";
import { Skeleton } from "../components/ui/skeleton";
import type { GuideItem } from "../types";

const typeMeta = {
  place: { label: "Địa điểm", icon: MapPin, tone: "bg-harbor/10 text-harbor" },
  food: { label: "Đặc sản", icon: Utensils, tone: "bg-coral/10 text-coral" },
  stay: { label: "Lưu trú", icon: Hotel, tone: "bg-harbor/10 text-harbor" },
  note: { label: "Lưu ý", icon: ShieldCheck, tone: "bg-sunflower/20 text-amber-800" }
};

const essentials = [
  { label: "CCCD / giấy tờ tùy thân", checked: true },
  { label: "Sạc dự phòng", checked: true },
  { label: "Quần áo bơi cho Đồ Sơn / Cát Bà", checked: false },
  { label: "Kem chống nắng, thuốc cá nhân", checked: false }
];

const rules = [
  {
    title: "Thuê xe máy",
    body: "Kiểm tra phanh, lốp và đèn trước khi nhận xe. Giờ tan tầm trong trung tâm khá đông."
  },
  {
    title: "Hỏi giá trước",
    body: "Khi mua hải sản hoặc quà lưu niệm ở khu du lịch, hỏi kỹ giá rồi mới quyết định."
  },
  {
    title: "Foodtour",
    body: "Đi theo nhóm nhỏ để gọi được nhiều món hơn. Các quán ngon thường nằm trong ngõ."
  }
];

function SmallGuideCard({ item, highlight }: { item: GuideItem; highlight?: string }) {
  const meta = typeMeta[item.type];
  return (
    <article className="overflow-hidden rounded-[14px] border border-border/50 bg-white shadow-soft transition-shadow duration-300 hover:shadow-hover">
      <div className="relative h-40 bg-surface-container">
        <img className="h-full w-full object-cover" src={item.imageUrl} alt={item.title} />
        {highlight && (
          <span className="absolute left-3 top-3 rounded-full bg-teal-container px-2.5 py-1 text-xs font-bold uppercase tracking-[0.05em] text-teal-fixed">
            {highlight}
          </span>
        )}
      </div>
      <div className="p-5">
        <span className={`inline-flex rounded px-2 py-1 text-xs font-bold uppercase tracking-[0.05em] ${meta.tone}`}>{meta.label}</span>
        <h3 className="mt-3 font-display text-base font-bold leading-6 text-ink">{item.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm leading-5 text-mist">{item.description}</p>
      </div>
    </article>
  );
}

function WidePlaceCard({ item }: { item: GuideItem }) {
  return (
    <article className="overflow-hidden rounded-[14px] border border-border/50 bg-white shadow-soft sm:col-span-2">
      <div className="relative h-52 bg-surface-container">
        <img className="h-full w-full object-cover" src={item.imageUrl} alt={item.title} />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-5 pt-12 text-white">
          <h3 className="font-display text-2xl font-black leading-tight">{item.title}</h3>
          <p className="mt-1 max-w-xl text-sm leading-5 text-white/90">{item.description}</p>
        </div>
      </div>
    </article>
  );
}

function HorizontalGuideCard({ item }: { item: GuideItem }) {
  const meta = typeMeta[item.type];
  return (
    <article className="min-w-[240px] flex-1 overflow-hidden rounded-[14px] border border-border/50 bg-white shadow-soft md:min-w-0">
      <div className="h-32 bg-surface-container">
        <img className="h-full w-full object-cover" src={item.imageUrl} alt={item.title} />
      </div>
      <div className="p-4">
        <span className={`inline-flex rounded px-2 py-1 text-xs font-bold uppercase tracking-[0.05em] ${meta.tone}`}>{meta.label}</span>
        <h3 className="mt-3 font-display text-base font-bold leading-6 text-ink">{item.title}</h3>
        <p className="mt-1 text-sm leading-5 text-mist">{item.description}</p>
      </div>
    </article>
  );
}

export function GuidePage() {
  const guide = useQuery({ queryKey: ["guide"], queryFn: api.guide });
  const [checkedEssentials, setCheckedEssentials] = useState<Record<string, boolean>>(() => {
    const defaults = Object.fromEntries(essentials.map((item) => [item.label, item.checked]));
    try {
      const stored = localStorage.getItem("hp_trip_essentials");
      return stored ? { ...defaults, ...(JSON.parse(stored) as Record<string, boolean>) } : defaults;
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    localStorage.setItem("hp_trip_essentials", JSON.stringify(checkedEssentials));
  }, [checkedEssentials]);

  if (guide.isLoading) return <Skeleton className="h-[70dvh]" />;
  if (guide.isError || !guide.data) return <p className="text-coral">Không tải được cẩm nang.</p>;

  const places = guide.data.filter((item) => item.type === "place");
  const foodAndStay = guide.data.filter((item) => item.type === "food" || item.type === "stay");
  const notes = guide.data.filter((item) => item.type === "note");
  const heroPlaces = places.length > 0 ? places : guide.data;
  const smallPlaces = heroPlaces.slice(0, 2);
  const widePlace = heroPlaces[2] ?? heroPlaces[1] ?? heroPlaces[0];
  const lowerCards = foodAndStay.length > 0 ? foodAndStay : guide.data.filter((item) => item.id !== widePlace?.id).slice(0, 3);

  return (
    <div className="pb-10">
      <header className="mb-6 flex flex-col justify-between gap-3 md:mb-10 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-4xl font-black leading-tight text-teal md:text-5xl">Cẩm nang Du lịch</h1>
          <p className="mt-2 max-w-3xl text-lg leading-7 text-mist">
            Tất tần tật những gì bạn cần biết cho chuyến đi Hải Phòng hoàn hảo.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <section className="md:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="text-teal" size={22} />
            <h2 className="font-display text-xl font-bold text-ink">Địa điểm tham quan</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {smallPlaces.map((item, index) => (
              <SmallGuideCard key={item.id} item={item} highlight={index === 0 ? "Must see" : undefined} />
            ))}
            {widePlace && <WidePlaceCard item={widePlace} />}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="rounded-[14px] bg-teal-container p-5 text-teal-fixed shadow-lift">
            <div className="mb-4 flex items-center gap-2">
              <CheckSquare size={22} />
              <h2 className="font-display text-xl font-bold">Hành lý cần thiết</h2>
            </div>
            <ul className="space-y-3 text-base leading-6">
              {essentials.map((item) => (
                <li key={item.label} className="flex items-center gap-3">
                  <input
                    checked={checkedEssentials[item.label] ?? false}
                    onChange={() =>
                      setCheckedEssentials((current) => ({
                        ...current,
                        [item.label]: !(current[item.label] ?? false)
                      }))
                    }
                    className="size-5 rounded border-0 bg-white text-teal focus:ring-teal-fixed"
                    type="checkbox"
                  />
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex-1 rounded-[14px] border border-border/50 bg-white p-5 shadow-soft">
            <div className="mb-4 flex items-center gap-2">
              <Info className="text-harbor" size={22} />
              <h2 className="font-display text-xl font-bold text-ink">Quy tắc & Lưu ý</h2>
            </div>
            <div className="space-y-4 text-sm leading-5 text-mist">
              {rules.map((rule, index) => (
                <div key={rule.title} className="flex gap-3">
                  <div className="grid size-8 shrink-0 place-items-center rounded-full bg-harbor text-sm font-bold text-white">{index + 1}</div>
                  <div>
                    <strong className="mb-1 block text-base text-ink">{rule.title}</strong>
                    {rule.body}
                  </div>
                </div>
              ))}
              {notes.slice(0, 1).map((item) => (
                <div key={item.id} className="rounded-[12px] bg-sunflower/20 p-3 text-amber-800">
                  <strong className="block text-ink">{item.title}</strong>
                  <span>{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="md:col-span-3">
          <div className="mb-4 flex items-center gap-2">
            <Utensils className="text-coral" size={22} />
            <h2 className="font-display text-xl font-bold text-ink">Ăn uống & Lưu trú</h2>
          </div>
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
            {lowerCards.map((item) => (
              <HorizontalGuideCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
