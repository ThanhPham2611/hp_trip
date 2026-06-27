import { useQuery } from "@tanstack/react-query";
import { Armchair, Bell, Camera, CalendarDays, Gamepad2, MapPin, Timer, Users } from "lucide-react";
import { api } from "../lib/api-client";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { categoryLabel } from "../lib/trip-utils";
import { seedUsers } from "../data/seed";

const quickStats = [
  { label: "Thành viên", value: "24", icon: Users, tone: "teal" as const },
  { label: "Ngày đi", value: "3", icon: CalendarDays, tone: "blue" as const },
  { label: "Ghế xe", value: "29", icon: Armchair, tone: "sunflower" as const }
];

export function HomePage() {
  const dashboard = useQuery({ queryKey: ["dashboard"], queryFn: api.dashboard });
  if (dashboard.isLoading) return <Skeleton className="h-[70dvh]" />;
  if (dashboard.isError || !dashboard.data) return <p className="text-coral">Không tải được dashboard.</p>;
  const data = dashboard.data;
  const avatars = seedUsers.slice(0, 4);

  return (
    <div className="space-y-6 pb-10">
      <section className="relative flex h-[400px] items-end overflow-hidden rounded-xl border border-border/60 bg-surface-low shadow-soft">
        <img className="absolute inset-0 h-full w-full object-cover" src={data.trip.coverUrl} alt="Hải Phòng Trip" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="relative z-10 flex w-full flex-col gap-6 p-6 text-white md:flex-row md:items-end md:justify-between md:p-10">
          <div className="max-w-3xl space-y-4">
            <Badge tone="sunflower" className="bg-sunflower text-ink">
              <Timer size={14} /> Còn {data.countdownDays} ngày
            </Badge>
            <div>
              <h1 className="font-display text-4xl font-black leading-tight tracking-tight md:text-6xl">{data.trip.name}</h1>
              <p className="mt-3 max-w-2xl text-base font-medium text-white/85 md:text-lg">
                {data.trip.subtitle} - {data.trip.route} - {data.trip.startDate} đến {data.trip.endDate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-[18px] border border-white/20 bg-white/15 p-4 backdrop-blur-md">
            <div className="flex -space-x-3">
              {avatars.map((user) => (
                <img key={user.id} className="size-11 rounded-full border-2 border-white object-cover" src={user.avatarUrl} alt={user.displayName} />
              ))}
            </div>
            <div>
              <p className="text-sm font-bold">Nhóm đã sẵn sàng</p>
              <p className="text-xs text-white/75">24 người cùng lên đường</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold">Lịch hôm nay</h2>
                <Badge tone="blue">{data.todayItems.length} mục</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.todayItems.slice(0, 4).map((item, index) => (
                <div key={item.id} className="relative flex gap-4 rounded-[14px] border border-border/70 bg-white p-4">
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-sm font-black text-teal">{item.time}</span>
                    {index < data.todayItems.length - 1 && <span className="mt-2 h-full min-h-8 w-px bg-border/70" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-ink">{item.title}</p>
                    <p className="mt-1 flex items-center gap-1 text-sm text-mist">
                      <MapPin size={14} /> {categoryLabel(item.category)} - {item.location}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-teal text-white">
            <CardContent className="space-y-4">
              <Badge tone="teal" className="bg-white/15 text-white">
                <Bell size={14} /> Thông báo mới
              </Badge>
              <div>
                <h3 className="font-display text-2xl font-bold">{data.announcements[0]?.title ?? "Chưa có thông báo"}</h3>
                <p className="mt-2 text-sm leading-6 text-white/80">{data.announcements[0]?.body ?? "Mọi cập nhật của nhóm sẽ xuất hiện tại đây."}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 md:col-span-2">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="overflow-hidden bg-teal text-white">
              <CardContent className="flex min-h-[220px] flex-col justify-between">
                <div className="flex items-center justify-between">
                  <Badge tone="teal" className="bg-white/15 text-white">
                    <Armchair size={14} /> Ghế của tôi
                  </Badge>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">Xe 29 chỗ</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/70">Vị trí hiện tại</p>
                  <p className="mt-1 font-display text-6xl font-black">{data.mySeat?.code ?? "--"}</p>
                  <p className="mt-2 text-sm text-white/75">{data.mySeat ? data.mySeat.occupantName : "Bạn chưa chọn ghế"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex min-h-[220px] flex-col justify-between">
                <div className="flex items-center justify-between">
                  <Badge tone="coral">
                    <Gamepad2 size={14} /> Trò chơi
                  </Badge>
                  <span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-bold text-coral">Live</span>
                </div>
                <div>
                  <h3 className="font-display text-3xl font-black">{data.activeGames[0]?.title ?? "Phòng chơi nhóm"}</h3>
                  <p className="mt-2 text-sm leading-6 text-mist">
                    {data.activeGames.length} phòng đang mở. Vào quiz, bầu chọn hoặc bingo để khuấy động chuyến xe.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {quickStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label}>
                  <CardContent>
                    <Badge tone={stat.tone}>
                      <Icon size={14} /> {stat.label}
                    </Badge>
                    <p className="mt-4 font-display text-4xl font-black">{stat.value}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold">Ảnh mới trong album</h2>
                <Badge tone="coral">
                  <Camera size={14} /> {data.recentPhotos.length} ảnh
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {data.recentPhotos.map((photo, index) => (
                  <div key={photo.id} className={index === 0 ? "col-span-2 row-span-2" : ""}>
                    <img className="aspect-square h-full w-full rounded-[14px] object-cover" src={photo.secureUrl} alt={photo.caption} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
