import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, CircleHelp, Compass, Flame, Maximize2, RotateCcw, Sparkles, Utensils, X } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  getMissionById,
  groupCardPrompts,
  pickRandomIndex,
  type PersonalMission,
  wheelPrompts
} from "../features/games/challenge-data";
import { api } from "../lib/api-client";
import type { PersonalMissionState } from "../types";

const LOCAL_USER_KEY = "hp_trip_user";
const REVEAL_DELAY_MS = 1000;

type LocalUser = {
  id: string;
  displayName: string;
};

type GamesTab = "personal" | "group-card" | "wheel";

const tabs: Array<{ id: GamesTab; label: string }> = [
  { id: "personal", label: "Nhiệm vụ của tôi" },
  { id: "group-card", label: "Rút thẻ chung" },
  { id: "wheel", label: "Vòng quay" }
];

function readLocalUser(): LocalUser {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    if (!raw) return { id: "guest", displayName: "Bạn đồng hành" };
    const parsed = JSON.parse(raw) as LocalUser;
    return { id: parsed.id ?? "guest", displayName: parsed.displayName ?? "Bạn đồng hành" };
  } catch {
    return { id: "guest", displayName: "Bạn đồng hành" };
  }
}

function toneClass(tone: PersonalMission["tone"]) {
  const tones = {
    teal: "bg-teal-fixed text-teal",
    coral: "bg-coral/15 text-coral",
    sunflower: "bg-sunflower/20 text-[#7a4f00]",
    harbor: "bg-harbor/15 text-harbor"
  };
  return tones[tone];
}

export function GamesPage() {
  const user = useMemo(readLocalUser, []);
  const revealTimerRef = useRef<number | null>(null);
  const hasHydratedMissionRef = useRef(false);
  const [activeTab, setActiveTab] = useState<GamesTab>("personal");
  const [missionState, setMissionState] = useState<PersonalMissionState | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wheelIndex, setWheelIndex] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [groupCardIndex, setGroupCardIndex] = useState<number | null>(null);
  const games = useQuery({ queryKey: ["games"], queryFn: api.games, retry: false });

  const mission = missionState ? getMissionById(missionState.missionId) : null;

  useEffect(() => {
    if (!games.data || hasHydratedMissionRef.current) return;
    setMissionState((current) => current ?? games.data.personalMission);
    hasHydratedMissionRef.current = true;
  }, [games.data]);

  useEffect(() => {
    return () => {
      if (revealTimerRef.current) window.clearTimeout(revealTimerRef.current);
    };
  }, []);

  const drawMission = async (isRedraw = false) => {
    if (isRevealing) return;
    if (isRedraw && (!missionState || missionState.locked || missionState.remainingRedraws <= 0)) return;

    setIsRevealing(true);
    if (revealTimerRef.current) window.clearTimeout(revealTimerRef.current);
    const missionRequest = isRedraw ? api.redrawMission() : api.drawMission();
    revealTimerRef.current = window.setTimeout(async () => {
      try {
        const nextMission = await missionRequest;
        setMissionState(nextMission);
      } finally {
        setIsRevealing(false);
        revealTimerRef.current = null;
      }
    }, REVEAL_DELAY_MS);
  };

  const confirmMission = async () => {
    if (!missionState || missionState.locked || isConfirming) return;
    setIsConfirming(true);
    try {
      setMissionState(await api.confirmMission());
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCardClick = () => {
    setIsModalOpen(true);
  };

  const spinWheel = () => {
    const next = pickRandomIndex(wheelPrompts.length, wheelIndex ?? undefined);
    setWheelIndex(next);
    setWheelRotation((rotation) => rotation + 1080 + next * (360 / wheelPrompts.length));
  };

  const drawGroupCard = () => {
    setGroupCardIndex((current) => pickRandomIndex(groupCardPrompts.length, current ?? undefined));
  };

  const missionCardMotion = isRevealing
    ? { y: -34, rotateX: 9, rotateY: -12, scale: 1.04, filter: "blur(2px)", opacity: 0.68 }
    : mission
    ? { y: 0, rotateX: 0, rotateY: 0, scale: 1, filter: "blur(0px)", opacity: 1 }
    : { y: [0, -8, 0], rotateX: 0, rotateY: 0, scale: 1, filter: "blur(0px)", opacity: 1 };

  const missionCardTransition = isRevealing
    ? { duration: 0.42, ease: "easeOut" }
    : mission
    ? { duration: 0.3, ease: "easeOut" }
    : { duration: 3, repeat: Infinity, ease: "easeInOut" };

  return (
    <div className="space-y-6 pb-10">
      {/* Google Stitch Inspired Fullscreen High-Impact Mission Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            key="stitch-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col justify-between bg-[#3a020d] text-white overflow-hidden select-none"
          >
            {/* Atmospheric Background Effects */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(#bc9656 1px, transparent 1px)",
                backgroundSize: "32px 32px"
              }}
            />
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-rose-900/40 rounded-full blur-[90px] pointer-events-none" />

            {/* Top Bar Header */}
            <header className="relative z-20 flex items-center px-4 py-3 bg-black/40 backdrop-blur-md border-b border-amber-500/20 shrink-0">
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex size-9 items-center justify-center rounded-full bg-white/10 text-amber-200 hover:bg-white/20 hover:text-white transition active:scale-95"
                  title="Đóng"
                >
                  <X size={20} />
                </button>
              </div>

              <h2 className="font-display text-base md:text-lg font-bold tracking-wide text-amber-100 flex items-center justify-center gap-1.5 flex-none">
                <Sparkles className="text-amber-400" size={18} />
                <span className="hidden sm:inline">Thử Thách Hành Trình</span>
                <span className="sm:hidden">Thử Thách</span>
              </h2>

              <div className="flex-1 flex justify-end">
                <div className="flex items-center justify-center gap-2 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] sm:text-xs font-bold text-amber-300 border border-amber-500/20 whitespace-nowrap">
                  {missionState
                    ? missionState.locked
                      ? "Đã khóa"
                      : `${missionState.remainingRedraws} lượt đổi`
                    : "Chưa rút"}
                </div>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 md:p-6 overflow-y-auto">
              <div className="text-center space-y-2 mb-6">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-400/80">SẴN SÀNG KHÁM PHÁ</p>
                <h3 className="font-display text-2xl md:text-3xl font-black text-amber-50">Thẻ Nhiệm Vụ Cá Nhân</h3>
              </div>

              {/* Physical Card with Google Stitch Ornament Design */}
              <div style={{ perspective: 1200 }} className="w-full max-w-[340px] sm:max-w-[360px]">
                <motion.div
                  initial={{ rotateY: 90, scale: 0.8, opacity: 0 }}
                  animate={{
                    rotateY: isRevealing ? [0, 180, 360] : 0,
                    scale: isRevealing ? [1, 1.06, 1] : 1,
                    opacity: 1,
                    y: [-4, 4, -4]
                  }}
                  transition={{
                    y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
                    rotateY: isRevealing ? { repeat: Infinity, duration: 0.8, ease: "linear" } : { type: "spring", stiffness: 120, damping: 14 },
                    default: { type: "spring", stiffness: 120, damping: 14 }
                  }}
                  className="relative w-full aspect-[2/3] rounded-2xl p-4 ornament-border card-revealed-shadow bg-[#fdfbf7] text-[#181c1c] flex flex-col overflow-hidden"
                >
                  {/* Amber Header Category Band */}
                  <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 flex items-center justify-center gap-2 px-4 shadow-md z-10">
                    {mission?.tone === "coral" ? (
                      <Flame size={18} className="text-white" />
                    ) : mission?.tone === "teal" ? (
                      <Utensils size={18} className="text-white" />
                    ) : (
                      <Sparkles size={18} className="text-white" />
                    )}
                    <span className="font-display text-xs md:text-sm font-black uppercase tracking-wider text-white">
                      {mission ? mission.category : "Nhiệm vụ bí mật"}
                    </span>
                  </div>

                  {/* Corner Decorative Elements */}
                  <div className="absolute top-14 left-3 opacity-20 text-amber-900">
                    <Compass size={22} />
                  </div>
                  <div className="absolute top-14 right-3 opacity-20 text-amber-900">
                    <Compass size={22} />
                  </div>
                  <div className="absolute bottom-3 left-3 opacity-20 text-amber-900 rotate-180">
                    <Compass size={22} />
                  </div>
                  <div className="absolute bottom-3 right-3 opacity-20 text-amber-900 rotate-180">
                    <Compass size={22} />
                  </div>

                  {/* Card Main Interior Content */}
                  <div className="mt-10 flex-1 flex flex-col items-center justify-center text-center p-4 z-10">
                    <AnimatePresence mode="wait">
                      {isRevealing ? (
                        <motion.div
                          key="revealing-stitch"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="space-y-3"
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                            className="inline-block rounded-full bg-amber-500/20 p-4 text-amber-700"
                          >
                            <Sparkles size={40} />
                          </motion.div>
                          <h4 className="font-display text-2xl font-black text-[#4a0412]">Đang xoay lá bài...</h4>
                          <p className="text-xs font-semibold text-stone-600">Giữ bí mật thêm một chút nhé!</p>
                        </motion.div>
                      ) : mission ? (
                        <motion.div
                          key={mission.id}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -14 }}
                          className="flex flex-col items-center justify-center h-full space-y-4"
                        >
                          <div className="opacity-75">
                            <Sparkles size={32} className="text-amber-600" />
                          </div>
                          <h4 className="font-display text-2xl md:text-3xl font-black text-[#4a0412] leading-tight">
                            {mission.title}
                          </h4>

                          <div className="flex items-center gap-2 w-full justify-center opacity-40 py-1">
                            <div className="h-[1px] w-12 bg-amber-900" />
                            <Sparkles size={14} className="text-amber-900" />
                            <div className="h-[1px] w-12 bg-amber-900" />
                          </div>

                          <p className="text-sm md:text-base font-semibold text-stone-700 leading-relaxed italic px-2">
                            "{mission.description}"
                          </p>

                          <p className="mt-2 text-[11px] font-bold text-amber-800/80 bg-amber-500/10 rounded-lg px-3 py-1.5">
                            Áp dụng cho bạn trong suốt hành trình Hải Phòng
                          </p>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="empty-stitch"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-4"
                        >
                          <Sparkles size={48} className="mx-auto text-amber-600 animate-bounce" />
                          <h4 className="font-display text-2xl font-black text-[#4a0412]">Lá Bài Bí Ẩn</h4>
                          <p className="text-xs md:text-sm font-semibold text-stone-600 leading-relaxed">
                            Bấm nút bên dưới để rút thử thách riêng dành riêng cho bạn.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            </main>

            {/* Bottom Actions Shell */}
            <footer className="relative z-20 w-full max-w-md mx-auto p-4 md:p-6 flex flex-col gap-3 shrink-0 bg-gradient-to-t from-[#2d020a] via-[#2d020a]/90 to-transparent">
              {!missionState ? (
                <Button
                  onClick={() => drawMission()}
                  disabled={isRevealing}
                  className="h-14 w-full bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-base md:text-lg rounded-xl shadow-lg shadow-amber-500/25 active:scale-95 transition flex items-center justify-center gap-2"
                >
                  <Sparkles size={22} /> Rút thẻ
                </Button>
              ) : (
                <div className="flex flex-col gap-3 w-full">
                  <Button
                    onClick={confirmMission}
                    disabled={isConfirming || missionState.locked}
                    className={`h-14 w-full font-black text-base md:text-lg rounded-xl shadow-lg active:scale-95 transition flex items-center justify-center gap-2 ${
                      missionState.locked
                        ? "bg-emerald-800 text-emerald-200 opacity-90 cursor-default"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                    }`}
                  >
                    <BadgeCheck size={22} />
                    {missionState.locked ? "Đã xác nhận thử thách" : "Xác nhận thử thách"}
                  </Button>
                  
                  {!missionState.locked && (
                    <Button
                      onClick={() => drawMission(true)}
                      disabled={isRevealing || missionState.remainingRedraws <= 0}
                      variant="secondary"
                      className="h-12 w-full border-2 border-amber-400/30 bg-white/5 text-amber-200 hover:bg-amber-400/20 font-bold rounded-xl active:scale-95 transition flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={18} />
                      {missionState.remainingRedraws > 0
                        ? `Đổi nhiệm vụ (${missionState.remainingRedraws} lượt)`
                        : "Hết lượt đổi"}
                    </Button>
                  )}
                </div>
              )}
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legacy/Standard Loading Reveal Modal if triggered outside */}
      <AnimatePresence>
        {isRevealing && !isModalOpen && (
          <motion.div
            key="mission-reveal-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mission-reveal-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] grid place-items-center bg-[#172026]/55 px-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ y: 36, rotateX: 18, rotateY: -14, scale: 0.9 }}
              animate={{ y: 0, rotateX: [18, -8, 0], rotateY: [-14, 10, 0], scale: 1 }}
              exit={{ y: -20, scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.72, ease: "easeOut" }}
              className="relative w-full max-w-[320px]"
              style={{ perspective: 1000 }}
            >
              <div className="absolute -inset-5 rounded-[28px] bg-sunflower/25 blur-2xl" />
              <div className="relative aspect-[2/3] rounded-[24px] border border-white/30 bg-[linear-gradient(145deg,#fffdf5,#dff4ef)] p-3 text-ink shadow-2xl">
                <div className="flex h-full flex-col items-center justify-center rounded-[19px] border border-[#4a0e0e]/15 bg-[radial-gradient(circle_at_top,#fff7d6,transparent_42%),linear-gradient(160deg,#ffffff,#eef7f5)] p-6 text-center">
                  <motion.div
                    animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
                    className="grid size-16 place-items-center rounded-full bg-[#4a0e0e] text-white shadow-lift"
                  >
                    <Sparkles size={30} />
                  </motion.div>
                  <h2 id="mission-reveal-title" className="mt-5 font-display text-3xl font-black leading-tight text-[#4a0e0e]">
                    Đang rút nhiệm vụ
                  </h2>
                  <p className="mt-3 text-sm font-bold leading-6 text-mist">Lá bài đang xoay, chờ một nhịp rồi mở nhé.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="relative -mx-4 overflow-hidden bg-[#4a0e0e] px-4 py-8 text-white shadow-panel lg:mx-0 lg:rounded-[20px] lg:px-8">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute left-8 top-20 size-48 rounded-full border border-white/60" />
          <div className="absolute bottom-10 right-8 size-64 rounded-full border border-white/50" />
        </div>

        <div className="relative z-10 flex flex-col gap-6">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/85">
              <Sparkles size={16} /> Phòng HP2026
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Sẵn sàng khám phá</p>
              <h1 className="mt-3 font-display text-4xl font-black leading-tight md:text-5xl">Thử Thách Hành Trình</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
                Xin chào {user.displayName}. Chọn khu chơi bên dưới để rút nhiệm vụ cá nhân, mở thẻ chung hoặc quay thử thách lúc ăn uống.
              </p>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto rounded-[16px] bg-white/10 p-2" role="tablist" aria-label="Chọn trò chơi">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`min-h-11 shrink-0 rounded-[12px] px-4 text-sm font-black transition ${
                  activeTab === tab.id ? "bg-white text-[#4a0e0e] shadow-soft" : "text-white/80 hover:bg-white/10"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {activeTab === "personal" && (
          <motion.section
            key="personal"
            role="tabpanel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="grid gap-6 rounded-[20px] border border-border/70 bg-white p-5 shadow-soft lg:grid-cols-[0.85fr_1fr] lg:p-8"
          >
            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-teal">Dành riêng cho bạn</p>
              <h2 className="font-display text-3xl font-black leading-tight">Rút nhiệm vụ cá nhân</h2>
              <p className="max-w-xl text-sm leading-6 text-mist">
                Mỗi người rút một thẻ nhiệm vụ riêng. Nếu chưa hợp ý, bạn có thêm 2 lượt đổi trước khi nhiệm vụ được khóa lại.
              </p>
              <div className="rounded-[16px] bg-amber-500/10 border border-amber-500/20 p-4 text-sm font-semibold leading-6 text-amber-900 flex items-center gap-3">
                <Sparkles className="text-amber-600 shrink-0" size={24} />
                <span>Bấm vào lá bài hoặc nút bấm để rút thẻ!</span>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[360px]">
              <div style={{ perspective: 1200 }}>
                <motion.div
                  onClick={handleCardClick}
                  whileHover={{ scale: 1.03, rotateY: 5 }}
                  whileTap={{ scale: 0.97 }}
                  animate={missionCardMotion}
                  transition={missionCardTransition}
                  className="relative aspect-[2/3] rounded-[22px] bg-[#f8faf7] p-2 text-ink shadow-2xl will-change-transform cursor-pointer group"
                >
                  {/* Hover Overlay Badge */}
                  <div className="absolute inset-0 rounded-[22px] bg-amber-900/10 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center pointer-events-none">
                    <span className="bg-[#4a0412] text-amber-200 px-4 py-2 rounded-full font-black text-xs shadow-lg flex items-center gap-2 border border-amber-500/40 transform -translate-y-2 group-hover:translate-y-0 transition-transform">
                      <Maximize2 size={16} /> Mở Giao Diện Stitch Modal
                    </span>
                  </div>

                  <div className="flex h-full flex-col justify-between rounded-[18px] border border-[#4a0e0e]/15 bg-[radial-gradient(circle_at_top,#fff7d6,transparent_36%),linear-gradient(145deg,#ffffff,#edf5f2)] p-6">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-[#4a0e0e]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#4a0e0e]">
                        Nhiệm vụ
                      </span>
                      <CircleHelp className="text-teal" size={22} />
                    </div>

                    <AnimatePresence mode="wait">
                      {isRevealing ? (
                        <motion.div
                          key="revealing"
                          initial={{ opacity: 0, scale: 0.94 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          className="text-center"
                        >
                          <Sparkles className="mx-auto text-sunflower" size={46} />
                          <h3 className="mt-4 font-display text-3xl font-black leading-tight">Đang hé lộ nhiệm vụ...</h3>
                          <p className="mt-3 text-sm font-semibold text-mist">Giữ bí mật thêm một chút nhé.</p>
                        </motion.div>
                      ) : mission ? (
                        <motion.div
                          key={mission.id}
                          initial={{ opacity: 0, y: 18, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -12, scale: 0.96 }}
                          className="space-y-4"
                        >
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${toneClass(mission.tone)}`}>
                            {mission.category}
                          </span>
                          <div>
                            <h3 className="font-display text-3xl font-black leading-tight">{mission.title}</h3>
                            <p className="mt-3 text-sm font-semibold leading-6 text-mist">{mission.description}</p>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="back"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-center"
                        >
                          <Sparkles className="mx-auto text-sunflower" size={46} />
                          <h3 className="mt-4 font-display text-3xl font-black">Lá bài của bạn</h3>
                          <p className="mt-2 text-sm font-semibold text-mist">Mở thẻ để nhận nhiệm vụ riêng cho chuyến đi.</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="rounded-[14px] bg-[#4a0e0e]/10 p-3 text-center text-sm font-black text-[#4a0e0e]">
                      {missionState
                        ? missionState.locked
                          ? "Nhiệm vụ đã khóa"
                          : missionState.remainingRedraws > 0
                          ? `Còn ${missionState.remainingRedraws} lượt đổi`
                          : "Hết lượt đổi"
                        : "Chưa rút thẻ"}
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="mt-5 grid gap-3">
                {/* {!missionState ? (
                  <Button className="min-h-14 rounded-xl text-base" onClick={() => drawMission()} disabled={isRevealing}>
                    <Sparkles size={18} /> Rút thẻ
                  </Button>
                ) : (
                  <>
                    <Button
                      className="min-h-14 rounded-xl text-base"
                      onClick={confirmMission}
                      disabled={isConfirming || missionState.locked}
                    >
                      <BadgeCheck size={18} />
                      {missionState.locked ? "Đã xác nhận thử thách" : "Xác nhận thử thách"}
                    </Button>
                    <Button
                      className="min-h-14 rounded-xl text-base"
                      variant="secondary"
                      onClick={() => drawMission(true)}
                      disabled={isRevealing || missionState.locked || missionState.remainingRedraws <= 0}
                    >
                      <RotateCcw size={18} />
                      {missionState.locked
                        ? "Thử thách đã khóa"
                        : missionState.remainingRedraws > 0
                        ? "Đổi nhiệm vụ"
                        : "Hết lượt đổi"}
                    </Button>
                  </>
                )} */}
                <Button className="min-h-12 rounded-xl text-sm bg-[#4a0412] hover:bg-[#3a020d] text-amber-200 font-bold border border-amber-500/30" onClick={handleCardClick}>
                  <Maximize2 size={16} className="text-amber-400" /> Rút nhiệm vụ
                </Button>
              </div>
            </div>
          </motion.section>
        )}

        {activeTab === "group-card" && (
          <motion.section
            key="group-card"
            role="tabpanel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-[20px] border border-border/70 bg-white p-5 shadow-soft lg:p-8"
          >
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1fr] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-teal">Chơi cùng nhau</p>
                <h2 className="mt-2 font-display text-3xl font-black leading-tight">Rút thẻ chung</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-mist">
                  Dành cho cả bàn hoặc cả nhóm khi đang ăn uống. Có thể mở nhiều lượt, mỗi lượt là một thử thách vui mới.
                </p>
              </div>

              <div>
                <motion.div
                  key={groupCardIndex ?? "empty"}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[18px] border border-teal/20 bg-teal-fixed/40 p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-teal">Thử thách chung</p>
                    <BadgeCheck className="text-teal" size={22} />
                  </div>
                  <p className="mt-4 font-display text-2xl font-black leading-tight">
                    {groupCardIndex === null ? "Mở thẻ để bắt đầu một lượt mới." : groupCardPrompts[groupCardIndex]}
                  </p>
                </motion.div>
                <Button className="mt-5 w-full" variant="secondary" onClick={drawGroupCard}>
                  <Sparkles size={18} /> Mở thẻ chung
                </Button>
              </div>
            </div>
          </motion.section>
        )}

        {activeTab === "wheel" && (
          <motion.section
            key="wheel"
            role="tabpanel"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative rounded-[24px] border-2 border-amber-500/30 bg-gradient-to-br from-[#2b020a] via-[#3a020d] to-[#1a0106] p-6 lg:p-10 text-white shadow-2xl overflow-hidden select-none"
          >
            {/* Atmospheric Stitch Background Details */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(#bc9656 1px, transparent 1px)",
                backgroundSize: "28px 28px"
              }}
            />
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-600/15 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              {/* Left Column: Info & Description */}
              <div className="space-y-4 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-300 border border-amber-500/20 shadow-inner">
                  <Sparkles size={14} className="text-amber-400" />
                  <span className="uppercase tracking-wider">Văn Hóa Bàn Ăn • Stitch Wheel</span>
                </div>
                
                <h2 className="font-display text-3xl sm:text-4xl font-black leading-tight text-amber-50 drop-shadow-md">
                  Vòng Quay Bàn Ăn
                </h2>
                
                <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-lg mx-auto lg:mx-0 font-medium">
                  Trải nghiệm thử thách bất ngờ đầy thú vị cho cả nhóm! Bấm quay để khám phá nhiệm vụ tiếp theo trên bàn ăn Hải Phòng.
                </p>

                {/* Result Card for Spotlight */}
                <div className="pt-2">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={wheelIndex === null ? "empty" : wheelIndex}
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ type: "spring", stiffness: 200, damping: 18 }}
                      className="rounded-2xl border border-amber-500/30 bg-black/40 backdrop-blur-md p-5 text-left shadow-xl relative overflow-hidden group"
                    >
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                          <Compass size={14} /> Kết quả vòng quay
                        </span>
                        {wheelIndex !== null && (
                          <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                            Thử thách active
                          </span>
                        )}
                      </div>
                      
                      <p className="font-display text-lg sm:text-xl font-black text-amber-50 leading-snug">
                        {wheelIndex === null ? "Sẵn sàng! Bấm nút bên dưới để quay ngẫu nhiên." : wheelPrompts[wheelIndex]}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Right Column: Physical Fortune Wheel Showcase */}
              <div className="flex flex-col items-center justify-center gap-6">
                <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square flex items-center justify-center">
                  {/* Golden Needle Pointer */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
                    <div className="w-6 h-7 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-600 [clip-path:polygon(50%_100%,0_0,100%_0)] filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)]" />
                    <div className="w-3 h-3 rounded-full bg-amber-200 -mt-6 shadow-md" />
                  </div>

                  {/* Outer Glowing Metallic Frame */}
                  <div className="w-full h-full rounded-full p-3 bg-gradient-to-b from-amber-600/40 via-amber-900/60 to-amber-950 border-4 border-amber-500/40 shadow-[0_0_35px_rgba(245,158,11,0.25)] relative flex items-center justify-center">
                    
                    {/* Perimeter Lights */}
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_8px_#f59e0b] animate-pulse"
                        style={{
                          transform: `rotate(${i * 30}deg) translateY(-132px)`,
                          animationDelay: `${i * 0.1}s`
                        }}
                      />
                    ))}

                    {/* Rotating Wheel Canvas Disk */}
                    <motion.div
                      animate={{ rotate: wheelRotation }}
                      transition={{ duration: 1.4, ease: [0.15, 0.85, 0.35, 1] }}
                      className="w-full h-full rounded-full overflow-hidden shadow-2xl relative border-2 border-amber-400/30"
                      style={{
                        background: `conic-gradient(
                          #991b1b 0deg 60deg,
                          #0d9488 60deg 120deg,
                          #d97706 120deg 180deg,
                          #6d28d9 180deg 240deg,
                          #047857 240deg 300deg,
                          #be123c 300deg 360deg
                        )`
                      }}
                    >
                      {/* Radial Slice Divider Lines */}
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-0 left-1/2 w-0.5 h-full bg-amber-400/30 -translate-x-1/2 pointer-events-none"
                          style={{ transform: `translateX(-50%) rotate(${i * 60}deg)` }}
                        />
                      ))}

                      {/* Number Markers inside Slices */}
                      {[1, 2, 3, 4, 5, 6].map((num, i) => (
                        <div
                          key={num}
                          className="absolute top-4 left-1/2 -translate-x-1/2 font-black text-amber-100 text-sm tracking-widest drop-shadow"
                          style={{
                            transformOrigin: "center 110px",
                            transform: `translateX(-50%) rotate(${i * 60 + 30}deg)`
                          }}
                        >
                          ★ {num}
                        </div>
                      ))}
                    </motion.div>

                    {/* Center Hub Metallic Spinning Button */}
                    <button
                      type="button"
                      onClick={spinWheel}
                      className="absolute z-20 size-20 rounded-full bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 p-1 shadow-2xl active:scale-95 transition hover:brightness-110 flex items-center justify-center group"
                    >
                      <div className="w-full h-full rounded-full bg-[#3a020d] border-2 border-amber-300/60 flex flex-col items-center justify-center text-center shadow-inner group-hover:bg-[#4a0412] transition">
                        <Sparkles size={16} className="text-amber-400 group-hover:rotate-45 transition" />
                        <span className="text-[11px] font-black text-amber-200 uppercase tracking-wider mt-0.5">
                          QUAY
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Main Action Button */}
                <Button
                  onClick={spinWheel}
                  className="h-14 px-8 w-full max-w-xs bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-amber-950 font-black text-base rounded-xl shadow-lg shadow-amber-500/25 active:scale-95 transition flex items-center justify-center gap-2.5 border border-amber-300/50"
                >
                  <RotateCcw size={20} /> Quay ngay
                </Button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
