import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock3, LockKeyhole, ShieldCheck } from "lucide-react";
import { useLocation } from "react-router-dom";
import { api } from "../../lib/api-client";
import { getCountdownParts, getFeatureLockState, isLockedFeaturePath, type FeatureLockState } from "../../lib/feature-lock";

type FeatureLockGateProps = {
  children: ReactNode;
};

type ClockSync = {
  serverNowMs: number;
  performanceNow: number;
};

const refetchIntervalMs = 30_000;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function estimateServerState(serverState: FeatureLockState | undefined, sync: ClockSync | null) {
  if (!serverState || !sync) return getFeatureLockState();
  const elapsedMs = Math.max(0, performance.now() - sync.performanceNow);
  return getFeatureLockState(sync.serverNowMs + elapsedMs);
}

export function FeatureLockGate({ children }: FeatureLockGateProps) {
  const location = useLocation();
  const shouldCheckLock = isLockedFeaturePath(location.pathname);
  const [, setTick] = useState(0);
  const [sync, setSync] = useState<ClockSync | null>(null);
  const featureLock = useQuery({
    queryKey: ["feature-lock"],
    queryFn: api.featureLock,
    enabled: shouldCheckLock,
    retry: false,
    refetchInterval: shouldCheckLock ? refetchIntervalMs : false
  });

  useEffect(() => {
    if (!featureLock.data) return;
    setSync({ serverNowMs: featureLock.data.serverNowMs, performanceNow: performance.now() });
  }, [featureLock.data]);

  useEffect(() => {
    if (!shouldCheckLock) return;
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [shouldCheckLock]);

  const displayState = estimateServerState(featureLock.data, sync);

  if (!shouldCheckLock) return children;
  if (featureLock.data && !displayState.locked) return children;

  return <FeatureLockScreen state={displayState} isSyncing={featureLock.isLoading || featureLock.isError} />;
}

type FeatureLockScreenProps = {
  state: FeatureLockState;
  isSyncing?: boolean;
};

function FeatureLockScreen({ state, isSyncing = false }: FeatureLockScreenProps) {
  const countdown = getCountdownParts(state.remainingMs);

  return (
    <section
      className="fixed inset-0 z-[90] flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#101817] px-4 py-8 text-white"
      aria-live="polite"
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,118,110,0.22),transparent_34%,rgba(231,111,81,0.20)_70%,rgba(244,185,66,0.16))]" />
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
          backgroundSize: "44px 44px"
        }}
      />

      <div className="relative w-full max-w-4xl overflow-hidden rounded-[22px] border border-white/15 bg-white/[0.08] shadow-2xl backdrop-blur-xl">
        <div className="grid gap-0 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="border-b border-white/10 bg-black/20 p-6 lg:border-b-0 lg:border-r lg:p-8">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-sunflower text-[#172026] shadow-lift">
                <LockKeyhole size={24} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-fixed">Feature gate</p>
                <h1 className="font-display text-3xl font-black leading-tight md:text-4xl">Chưa đến giờ mở khóa</h1>
              </div>
            </div>

            <p className="mt-6 text-sm font-semibold leading-6 text-white/72">
              Album, trò chơi, ghế xe và chia tiền đang được giữ lại để cả nhóm mở cùng lúc.
            </p>

            <div className="mt-6 rounded-2xl border border-teal-fixed/25 bg-teal/20 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 shrink-0 text-teal-fixed" size={20} />
                <p className="text-sm font-semibold leading-6 text-teal-fixed">
                  Mốc mở khóa được kiểm tra bằng giờ máy chủ. Đổi giờ thiết bị hoặc gọi API trực tiếp sẽ không mở được trước thời điểm này.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-white/60">
              <Clock3 size={18} />
              Mở lúc 22:00, 11/07, giờ Việt Nam
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <CountdownTile label="Ngày" value={countdown.days} />
              <CountdownTile label="Giờ" value={countdown.hours} />
              <CountdownTile label="Phút" value={countdown.minutes} />
              <CountdownTile label="Giây" value={countdown.seconds} />
            </div>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#9CF2E8,#F4B942,#E76F51)] transition-all duration-700"
                style={{ width: `${Math.max(4, Math.min(100, 100 - (state.remainingMs / (10 * 24 * 60 * 60 * 1000)) * 100))}%` }}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white/45">Trạng thái</p>
              <p className="mt-2 text-lg font-black text-white">
                {isSyncing ? "Đang đồng bộ giờ máy chủ" : `Còn ${countdown.days} ngày ${pad(countdown.hours)}:${pad(countdown.minutes)}:${pad(countdown.seconds)}`}
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/60">
                Khi đồng hồ về 0, màn hình này tự biến mất và các chức năng sẽ hoạt động lại.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type CountdownTileProps = {
  label: string;
  value: number;
};

function CountdownTile({ label, value }: CountdownTileProps) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/[0.07] p-4 text-center shadow-soft">
      <p className="font-mono text-4xl font-black leading-none text-white md:text-5xl">{pad(value)}</p>
      <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-white/55">{label}</p>
    </div>
  );
}
