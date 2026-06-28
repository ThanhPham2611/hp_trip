import { useEffect, useMemo, useState } from "react";
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

type LocalUser = {
  id: string;
  displayName: string;
};

function readLocalUser(): LocalUser {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    if (!raw) return { id: "guest", displayName: "Ban dong hanh" };
    const parsed = JSON.parse(raw) as LocalUser;
    return { id: parsed.id ?? "guest", displayName: parsed.displayName ?? "Ban dong hanh" };
  } catch {
    return { id: "guest", displayName: "Ban dong hanh" };
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
  const [missionState, setMissionState] = useState<StoredMissionState | null>(() => loadMissionState(user.id));
  const [isDrawing, setIsDrawing] = useState(false);
  const [wheelIndex, setWheelIndex] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [groupCardIndex, setGroupCardIndex] = useState<number | null>(null);

  const mission = missionState ? getMissionById(missionState.missionId) : null;

  useEffect(() => {
    if (missionState) saveMissionState(user.id, missionState);
  }, [missionState, user.id]);

  useEffect(() => {
    return () => setIsDrawing(false);
  }, []);

  const drawMission = (isRedraw = false) => {
    if (isDrawing) return;
    if (isRedraw && (!missionState || missionState.remainingRedraws <= 0)) return;

    setIsDrawing(true);
    window.setTimeout(() => {
      setMissionState(
        createMissionState(
          missionState?.missionId,
          isRedraw && missionState ? missionState.remainingRedraws - 1 : MAX_REDRAWS
        )
      );
      setIsDrawing(false);
    }, 420);
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

        <div className="relative z-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/85">
              <Sparkles size={16} /> HP2026
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/55">San sang kham pha</p>
              <h1 className="mt-3 font-display text-4xl font-black leading-tight md:text-5xl">Thu Thach Hanh Trinh</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">
                Xin chao {user.displayName}. Rut mot the nhiem vu ca nhan, giu lai neu hop vibe hoac doi toi da 2 lan.
              </p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[360px]">
            <div style={{ perspective: 1200 }}>
              <motion.div
                animate={isDrawing ? { y: -70, rotateY: 16, scale: 1.04 } : { y: [0, -8, 0], rotateY: 0, scale: 1 }}
                transition={isDrawing ? { duration: 0.42, ease: "easeOut" } : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative aspect-[2/3] rounded-[22px] bg-[#f8faf7] p-2 text-ink shadow-2xl"
              >
                <div className="flex h-full flex-col justify-between rounded-[18px] border border-[#4a0e0e]/15 bg-[radial-gradient(circle_at_top,#fff7d6,transparent_36%),linear-gradient(145deg,#ffffff,#edf5f2)] p-6">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-[#4a0e0e]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#4a0e0e]">
                      Mission
                    </span>
                    <CircleHelp className="text-teal" size={22} />
                  </div>

                  <AnimatePresence mode="wait">
                    {mission ? (
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
                          <h2 className="font-display text-3xl font-black leading-tight">{mission.title}</h2>
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
                        <h2 className="mt-4 font-display text-3xl font-black">La bai cua ban</h2>
                        <p className="mt-2 text-sm font-semibold text-mist">Mo the de nhan nhiem vu rieng cho chuyen di.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="rounded-[14px] bg-[#4a0e0e]/10 p-3 text-center text-sm font-black text-[#4a0e0e]">
                    {missionState
                      ? missionState.remainingRedraws > 0
                        ? `Con ${missionState.remainingRedraws} luot doi`
                        : "Nhiem vu da khoa"
                      : "Chua rut the"}
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="mt-5 grid gap-3">
              {!missionState ? (
                <Button className="min-h-14 rounded-xl text-base" onClick={() => drawMission()} disabled={isDrawing}>
                  <Sparkles size={18} /> Rut the
                </Button>
              ) : (
                <Button
                  className="min-h-14 rounded-xl text-base"
                  onClick={() => drawMission(true)}
                  disabled={isDrawing || missionState.remainingRedraws <= 0}
                >
                  <RotateCcw size={18} />
                  {missionState.remainingRedraws > 0 ? "Doi nhiem vu" : "Het luot doi"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[20px] border border-border/70 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-coral">An uong vui ve</p>
              <h2 className="mt-1 font-display text-2xl font-black">Vong quay ban an</h2>
            </div>
            <Utensils className="text-coral" />
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr] md:items-center">
            <motion.div
              animate={{ rotate: wheelRotation }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="mx-auto grid aspect-square w-full max-w-[220px] place-items-center rounded-full border-[14px] border-teal-fixed bg-[conic-gradient(#0f766e,#e76f51,#f4b942,#2563eb,#0f766e)] shadow-lift"
            >
              <div className="grid size-24 place-items-center rounded-full bg-white text-center text-sm font-black text-teal shadow-soft">
                SPIN
              </div>
            </motion.div>
            <div className="space-y-4">
              <Button onClick={spinWheel}>
                <RotateCcw size={18} /> Quay ngay
              </Button>
              <div className="rounded-[16px] bg-surface-low p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-mist">Ket qua vong quay</p>
                <p className="mt-2 font-display text-xl font-black leading-tight">
                  {wheelIndex === null ? "Bam quay de chon thu thach." : wheelPrompts[wheelIndex]}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[20px] border border-border/70 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-teal">Rut the chung</p>
              <h2 className="mt-1 font-display text-2xl font-black">Thu thach ca ban</h2>
            </div>
            <BadgeCheck className="text-teal" />
          </div>
          <motion.div
            key={groupCardIndex ?? "empty"}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-[18px] border border-teal/20 bg-teal-fixed/40 p-5"
          >
            <p className="text-xs font-black uppercase tracking-[0.12em] text-teal">Thu thach chung</p>
            <p className="mt-3 font-display text-2xl font-black leading-tight">
              {groupCardIndex === null ? "Rut the de bat dau mot luot moi." : groupCardPrompts[groupCardIndex]}
            </p>
          </motion.div>
          <Button className="mt-5 w-full" variant="secondary" onClick={drawGroupCard}>
            <Sparkles size={18} /> Rut the chung
          </Button>
        </div>
      </section>
    </div>
  );
}
