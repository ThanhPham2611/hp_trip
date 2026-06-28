import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, CircleHelp, RotateCcw, Sparkles, Utensils } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  MAX_REDRAWS,
  getMissionById,
  groupCardPrompts,
  loadMissionState,
  personalMissions,
  pickRandomIndex,
  saveMissionState,
  type PersonalMission,
  type StoredMissionState,
  wheelPrompts
} from "../features/games/challenge-data";

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

function createMissionState(currentMissionId?: string, remainingRedraws = MAX_REDRAWS): StoredMissionState {
  const currentIndex = currentMissionId ? personalMissions.findIndex((mission) => mission.id === currentMissionId) : undefined;
  const missionIndex = pickRandomIndex(personalMissions.length, currentIndex === -1 ? undefined : currentIndex);
  return {
    missionId: personalMissions[missionIndex].id,
    remainingRedraws,
    updatedAt: new Date().toISOString()
  };
}

export function GamesPage() {
  const user = useMemo(readLocalUser, []);
  const revealTimerRef = useRef<number | null>(null);
  const [activeTab, setActiveTab] = useState<GamesTab>("personal");
  const [missionState, setMissionState] = useState<StoredMissionState | null>(() => loadMissionState(user.id));
  const [isRevealing, setIsRevealing] = useState(false);
  const [wheelIndex, setWheelIndex] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [groupCardIndex, setGroupCardIndex] = useState<number | null>(null);

  const mission = missionState ? getMissionById(missionState.missionId) : null;

  useEffect(() => {
    if (missionState) saveMissionState(user.id, missionState);
  }, [missionState, user.id]);

  useEffect(() => {
    return () => {
      if (revealTimerRef.current) window.clearTimeout(revealTimerRef.current);
    };
  }, []);

  const drawMission = (isRedraw = false) => {
    if (isRevealing) return;
    if (isRedraw && (!missionState || missionState.remainingRedraws <= 0)) return;

    setIsRevealing(true);
    if (revealTimerRef.current) window.clearTimeout(revealTimerRef.current);
    revealTimerRef.current = window.setTimeout(() => {
      setMissionState(
        createMissionState(
          missionState?.missionId,
          isRedraw && missionState ? missionState.remainingRedraws - 1 : MAX_REDRAWS
        )
      );
      setIsRevealing(false);
      revealTimerRef.current = null;
    }, REVEAL_DELAY_MS);
  };

  const spinWheel = () => {
    const next = pickRandomIndex(wheelPrompts.length, wheelIndex ?? undefined);
    setWheelIndex(next);
    setWheelRotation((rotation) => rotation + 1080 + next * (360 / wheelPrompts.length));
  };

  const drawGroupCard = () => {
    setGroupCardIndex((current) => pickRandomIndex(groupCardPrompts.length, current ?? undefined));
  };

  return (
    <div className="space-y-6 pb-10">
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
              <div className="rounded-[16px] bg-surface-low p-4 text-sm font-semibold leading-6 text-mist">
                Nội dung nhiệm vụ sẽ được hé lộ sau 1 giây để giữ cảm giác bí ẩn trước khi thẻ xuất hiện.
              </div>
            </div>

            <div className="mx-auto w-full max-w-[360px]">
              <div style={{ perspective: 1200 }}>
                <motion.div
                  animate={isRevealing ? { y: -58, rotateY: 16, scale: 1.04 } : { y: [0, -8, 0], rotateY: 0, scale: 1 }}
                  transition={isRevealing ? { duration: 0.42, ease: "easeOut" } : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="relative aspect-[2/3] rounded-[22px] bg-[#f8faf7] p-2 text-ink shadow-2xl"
                >
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
                        ? missionState.remainingRedraws > 0
                          ? `Còn ${missionState.remainingRedraws} lượt đổi`
                          : "Nhiệm vụ đã khóa"
                        : "Chưa rút thẻ"}
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="mt-5 grid gap-3">
                {!missionState ? (
                  <Button className="min-h-14 rounded-xl text-base" onClick={() => drawMission()} disabled={isRevealing}>
                    <Sparkles size={18} /> Rút thẻ
                  </Button>
                ) : (
                  <Button
                    className="min-h-14 rounded-xl text-base"
                    onClick={() => drawMission(true)}
                    disabled={isRevealing || missionState.remainingRedraws <= 0}
                  >
                    <RotateCcw size={18} />
                    {missionState.remainingRedraws > 0 ? "Đổi nhiệm vụ" : "Hết lượt đổi"}
                  </Button>
                )}
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
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-[20px] border border-border/70 bg-white p-5 shadow-soft lg:p-8"
          >
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1fr] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-coral">Ăn uống vui vẻ</p>
                <h2 className="mt-2 font-display text-3xl font-black leading-tight">Vòng quay bàn ăn</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-mist">
                  Vòng quay dùng cho nhiều lượt chơi. Bấm quay, chờ vòng dừng, rồi cả nhóm làm theo kết quả.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-center">
                <motion.div
                  animate={{ rotate: wheelRotation }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="mx-auto grid aspect-square w-full max-w-[220px] place-items-center rounded-full border-[14px] border-teal-fixed bg-[conic-gradient(#0f766e,#e76f51,#f4b942,#2563eb,#0f766e)] shadow-lift"
                >
                  <div className="grid size-24 place-items-center rounded-full bg-white text-center text-sm font-black text-teal shadow-soft">
                    Quay
                  </div>
                </motion.div>
                <div className="space-y-4">
                  <Button onClick={spinWheel}>
                    <RotateCcw size={18} /> Quay ngay
                  </Button>
                  <div className="rounded-[16px] bg-surface-low p-4">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-mist">Kết quả vòng quay</p>
                    <p className="mt-2 font-display text-xl font-black leading-tight">
                      {wheelIndex === null ? "Bấm quay để chọn thử thách." : wheelPrompts[wheelIndex]}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
