import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Car, Lock, MapPin, UserRound, Users } from "lucide-react";
import { api } from "../lib/api-client";
import { loginSchema, type LoginInput } from "../lib/schemas";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { seedUsers } from "../data/seed";

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" }
  });
  const login = useMutation({
    mutationFn: async (input: LoginInput) => {
      const result = await api.login(input.username, input.password);
      try {
        await api.randomSeat();
      } catch {
        // Seat assignment should not block login if every seat is already taken.
      }
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      void queryClient.invalidateQueries({ queryKey: ["seats"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      navigate("/");
    }
  });

  return (
    <main className="flex min-h-[100dvh] items-center justify-center overflow-hidden bg-canvas p-4 text-ink md:p-6">
      <section className="flex min-h-[720px] w-full max-w-[1200px] overflow-hidden rounded-[24px] border border-border/60 bg-white shadow-panel">
        <div className="flex w-full flex-col justify-center px-6 py-10 md:px-10 lg:w-[43%] lg:px-14">
          <div className="mb-10">
            <Badge tone="teal">Tài khoản được cấp sẵn</Badge>
            <h1 className="mt-5 font-display text-4xl font-black leading-tight tracking-tight md:text-5xl">Hải Phòng Trip</h1>
            <p className="mt-3 max-w-sm text-sm leading-6 text-mist">
              Đăng nhập để xem lịch trình, ghế xe, album ảnh và mini game riêng của nhóm.
            </p>
          </div>

          <form className="space-y-5" onSubmit={form.handleSubmit((values) => login.mutate(values))}>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-ink">Tên đăng nhập</span>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mist" size={18} />
                <Input className="min-h-14 rounded-[14px] bg-surface-low pl-12" autoComplete="username" placeholder="linh" {...form.register("username")} />
              </div>
              {form.formState.errors.username && <span className="text-sm text-coral">{form.formState.errors.username.message}</span>}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-bold text-ink">Mật khẩu</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mist" size={18} />
                <Input
                  className="min-h-14 rounded-[14px] bg-surface-low pl-12"
                  type="password"
                  autoComplete="current-password"
                  placeholder="hp2026"
                  {...form.register("password")}
                />
              </div>
              {form.formState.errors.password && <span className="text-sm text-coral">{form.formState.errors.password.message}</span>}
            </label>

            {login.error && <p className="rounded-[12px] bg-coral/10 p-3 text-sm font-semibold text-coral">{login.error.message}</p>}

            <Button className="min-h-14 w-full rounded-[14px] text-base" disabled={login.isPending}>
              <Lock size={18} />
              Vào cẩm nang
            </Button>
          </form>

          <p className="mt-6 text-sm text-mist">Liên hệ trưởng nhóm nếu quên mật khẩu.</p>
        </div>

        <div className="relative hidden flex-1 p-4 lg:block">
          <div className="relative h-full overflow-hidden rounded-[20px] bg-ink">
            <img
              className="absolute inset-0 h-full w-full object-cover"
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85"
              alt="Biển Đồ Sơn"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

            <div className="absolute left-8 top-8 rounded-[18px] border border-white/20 bg-white/15 p-4 text-white shadow-soft backdrop-blur-md">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">Countdown</p>
              <p className="mt-1 font-display text-4xl font-black">13 ngày</p>
            </div>

            <div className="absolute right-8 top-8 flex -space-x-3">
              {seedUsers.slice(0, 4).map((user) => (
                <img key={user.id} className="size-11 rounded-full border-2 border-white object-cover" src={user.avatarUrl} alt={user.displayName} />
              ))}
            </div>

            <div className="absolute bottom-0 left-0 right-0 space-y-6 p-8 text-white">
              <div>
                <Badge tone="sunflower" className="bg-sunflower text-ink">
                  Chuyến đi 3 ngày 2 đêm
                </Badge>
                <h2 className="mt-4 max-w-xl font-display text-5xl font-black leading-tight">Cả nhóm lên đường tới thành phố hoa phượng đỏ</h2>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-[16px] border border-white/15 bg-white/14 p-4 backdrop-blur">
                  <MapPin size={20} />
                  <p className="mt-3 text-sm font-bold">Hà Nội đến Hải Phòng</p>
                </div>
                <div className="rounded-[16px] border border-white/15 bg-white/14 p-4 backdrop-blur">
                  <Users size={20} />
                  <p className="mt-3 text-sm font-bold">24 thành viên</p>
                </div>
                <div className="rounded-[16px] border border-white/15 bg-white/14 p-4 backdrop-blur">
                  <Car size={20} />
                  <p className="mt-3 text-sm font-bold">Sơ đồ ghế xe</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-[18px] border border-white/15 bg-white/14 p-4 backdrop-blur">
                <CalendarDays size={22} />
                <div>
                  <p className="text-sm font-bold">10/07/2026 - 12/07/2026</p>
                  <p className="text-xs text-white/70">Lịch trình, ảnh và trò chơi trong một dashboard.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
