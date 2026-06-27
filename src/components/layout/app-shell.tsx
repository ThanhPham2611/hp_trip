import { Bell, Camera, Car, Gamepad2, Home, LogOut, Map, Menu, NotebookTabs, UserCircle, Wallet } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api-client";
import { Button } from "../ui/button";

const navItems = [
  { to: "/", label: "Trang chủ", icon: Home },
  { to: "/guide", label: "Cẩm nang", icon: NotebookTabs },
  { to: "/schedule", label: "Lịch trình", icon: Map },
  { to: "/seats", label: "Ghế xe", icon: Car },
  { to: "/album", label: "Album", icon: Camera },
  { to: "/expenses", label: "Chia tiền", icon: Wallet },
  { to: "/games", label: "Trò chơi", icon: Gamepad2 }
];

export function AppShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logout = useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      queryClient.clear();
      navigate("/login");
    }
  });

  return (
    <div className="min-h-[100dvh] bg-canvas pb-24 pt-24 text-ink lg:pb-0">
      <header className="fixed left-0 top-0 z-50 w-full border-b border-border/30 bg-canvas/80 shadow-sm backdrop-blur-md transition-all">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-6 lg:px-16">
          <NavLink to="/" className="flex items-center gap-3">
            <div>
              <p className="font-display text-2xl font-bold leading-tight text-teal">Hải Phòng Trip</p>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-mist/75">Group dashboard</p>
            </div>
          </NavLink>
          <nav className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition active:scale-95 ${
                    isActive ? "bg-teal-container text-teal-fixed" : "text-mist hover:bg-surface-low hover:text-teal"
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            <button className="grid size-10 place-items-center rounded-lg text-mist transition hover:bg-surface-low hover:text-teal" aria-label="Thông báo">
              <Bell size={20} />
            </button>
            <button className="grid size-10 place-items-center rounded-lg text-mist transition hover:bg-surface-low hover:text-teal" aria-label="Tài khoản">
              <UserCircle size={21} />
            </button>
            <Button className="px-6" onClick={() => logout.mutate()}>
              <LogOut size={18} />
              Đăng xuất
            </Button>
          </div>
          <Button variant="secondary" className="lg:hidden" aria-label="Mở menu">
            <Menu size={18} />
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-[1280px] px-4 lg:px-16">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-7 rounded-t-[18px] bg-white/95 px-2 py-3 shadow-[0_-4px_12px_rgba(23,32,38,0.05)] backdrop-blur lg:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition active:scale-90 ${
                isActive ? "bg-teal-container text-teal-fixed" : "text-mist"
              }`
            }
          >
            <item.icon size={18} />
            <span className="max-w-full truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
