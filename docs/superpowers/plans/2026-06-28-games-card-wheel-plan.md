# Games Card Wheel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Games page with a personal mission card flow and repeatable meal-time random games.

**Architecture:** Keep the feature client-only. Put mission decks and local-storage helpers in a focused feature module, then render the new experience from `src/pages/games.tsx` using Framer Motion. Tests cover the draw/redraw limit and repeatable shared games through React Testing Library.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Vitest, React Testing Library.

---

## Revision: Tabbed Vietnamese Experience

User feedback after the first implementation changed the page structure:

- Personal missions live in a separate "Nhiệm vụ của tôi" tab.
- Drawing or redrawing a personal mission shows a 1-second mystery reveal state before the mission appears.
- The random wheel lives in its own "Vòng quay" tab.
- Shared card draw lives in its own "Rút thẻ chung" tab.
- All labels and placeholder data are Vietnamese with accents.

## File Structure

- Create `src/features/games/challenge-data.ts`
  - Owns personal mission deck, wheel prompts, group card prompts, random picker, and local-storage persistence helpers.
- Modify `src/pages/games.tsx`
  - Replaces the old quiz/poll dashboard with the Stitch-inspired mission card and shared games.
- Create `tests/games.test.tsx`
  - Verifies the user-facing draw/redraw and shared game behavior.

## Task 1: Add Games Feature Data And Persistence

**Files:**
- Create: `src/features/games/challenge-data.ts`

- [ ] **Step 1: Create challenge data module**

Create `src/features/games/challenge-data.ts`:

```ts
export type MissionTone = "teal" | "coral" | "sunflower" | "harbor";

export type PersonalMission = {
  id: string;
  title: string;
  description: string;
  category: string;
  tone: MissionTone;
};

export type StoredMissionState = {
  missionId: string;
  remainingRedraws: number;
  updatedAt: string;
};

export const MAX_REDRAWS = 2;

export const personalMissions: PersonalMission[] = [
  {
    id: "story-catcher",
    title: "Nguoi bat chuyen",
    description: "Moi mot nguoi tren xe ke mot ky niem di choi dang nho, roi ghi lai cau noi hay nhat.",
    category: "Ket noi",
    tone: "teal"
  },
  {
    id: "food-scout",
    title: "Tham tu mon ngon",
    description: "Tim mon an la nhat trong ngay va thuyet phuc ca nhom thu it nhat mot mieng.",
    category: "An uong",
    tone: "coral"
  },
  {
    id: "photo-spark",
    title: "Tho san khoanh khac",
    description: "Chup 3 khoanh khac hau truong vui nhat va gui vao album chung truoc khi het ngay.",
    category: "Album",
    tone: "sunflower"
  },
  {
    id: "hype-leader",
    title: "Nguoi khuay dong",
    description: "Bat dau mot mini game hoac mot man dem nguoc chup anh nhom trong luc cho do an.",
    category: "Nang luong",
    tone: "harbor"
  },
  {
    id: "kind-navigator",
    title: "Dai su tinh te",
    description: "Am tham giup mot nguoi trong nhom viec nho: lay nuoc, giu do, nhac lich, hoac goi mon.",
    category: "Cham soc",
    tone: "teal"
  },
  {
    id: "quote-keeper",
    title: "Nguoi giu cau noi",
    description: "San mot cau noi bat hu cua chuyen di va dat ten cho no nhu ten mot bo phim.",
    category: "Vui ve",
    tone: "coral"
  }
];

export const wheelPrompts = [
  "Nguoi vua uong nuoc gan nhat ke mot su that bat ngo.",
  "Ca ban chon mon tiep theo trong 10 giay.",
  "Nguoi mac mau sang nhat duoc chi dinh mot nguoi hat 1 cau.",
  "Moi nguoi noi mot loi khen cho nguoi ben trai.",
  "Nguoi thua o keo bua bao tiep theo phai chup anh check-in ban an.",
  "Ca nhom cung nang ly va noi mot cau khau hieu cua chuyen di."
];

export const groupCardPrompts = [
  "Ca ban cung chon mot biet danh cho chuyen di Hai Phong.",
  "Moi nguoi ke ten mot mon muon thu truoc khi ve.",
  "Chup anh ban an theo phong cach nghiem tuc trong 3 giay.",
  "Binh chon nguoi goi mon co tam nhat hom nay.",
  "Ca nhom tao mot cau chuc ngan cho ngay tiep theo."
];

export function missionStorageKey(userId: string) {
  return `hp_trip_personal_mission:${userId}`;
}

export function pickRandomIndex(length: number, excludeIndex?: number) {
  if (length <= 1) return 0;
  let next = Math.floor(Math.random() * length);
  if (excludeIndex !== undefined) {
    while (next === excludeIndex) next = Math.floor(Math.random() * length);
  }
  return next;
}

export function getMissionById(missionId: string) {
  return personalMissions.find((mission) => mission.id === missionId) ?? personalMissions[0];
}

export function loadMissionState(userId: string): StoredMissionState | null {
  try {
    const raw = localStorage.getItem(missionStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredMissionState;
    if (!parsed.missionId || typeof parsed.remainingRedraws !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveMissionState(userId: string, state: StoredMissionState) {
  try {
    localStorage.setItem(missionStorageKey(userId), JSON.stringify(state));
  } catch {
    return;
  }
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS. The new module should compile without imports.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/features/games/challenge-data.ts
git commit -m "feat: add games challenge data"
```

## Task 2: Add Failing Games Page Tests

**Files:**
- Create: `tests/games.test.tsx`

- [ ] **Step 1: Write tests for the new user behavior**

Create `tests/games.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GamesPage } from "../src/pages/games";

vi.mock("framer-motion", async () => {
  const React = await import("react");
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: new Proxy(
      {},
      {
        get: (_target, element: string) =>
          React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(({ children, ...props }, ref) =>
            React.createElement(element, { ...props, ref }, children)
          )
      }
    )
  };
});

const renderWithProviders = (ui: ReactElement) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

const signInLocally = () => {
  localStorage.setItem(
    "hp_trip_user",
    JSON.stringify({
      id: "user-linh",
      username: "linh",
      displayName: "Linh Nguyen",
      avatarUrl: "https://i.pravatar.cc/120?img=47",
      tripId: "trip-hai-phong-2026"
    })
  );
};

describe("GamesPage", () => {
  beforeEach(() => {
    localStorage.clear();
    signInLocally();
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  it("draws a personal mission with two redraws remaining", async () => {
    renderWithProviders(<GamesPage />);

    await userEvent.click(screen.getByRole("button", { name: /^Rut the$/i }));

    expect(screen.getByText(/Con 2 luot doi/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Doi nhiem vu/i })).toBeEnabled();
  });

  it("uses both redraws and then locks the mission", async () => {
    renderWithProviders(<GamesPage />);

    await userEvent.click(screen.getByRole("button", { name: /^Rut the$/i }));
    await userEvent.click(screen.getByRole("button", { name: /Doi nhiem vu/i }));
    expect(screen.getByText(/Con 1 luot doi/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Doi nhiem vu/i }));
    expect(screen.getByText(/Nhiem vu da khoa/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Het luot doi/i })).toBeDisabled();
  });

  it("lets shared games run repeatedly", async () => {
    renderWithProviders(<GamesPage />);

    const spinButton = screen.getByRole("button", { name: /Quay ngay/i });
    await userEvent.click(spinButton);
    await userEvent.click(spinButton);
    expect(screen.getByText(/Ket qua vong quay/i)).toBeInTheDocument();

    const groupCardButton = screen.getByRole("button", { name: /Rut the chung/i });
    await userEvent.click(groupCardButton);
    await userEvent.click(groupCardButton);
    expect(screen.getByText(/Thu thach chung/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm run test -- tests/games.test.tsx`

Expected: FAIL because the current Games page does not render "Rut the", "Doi nhiem vu", "Quay ngay", or "Rut the chung".

## Task 3: Replace Games Page UI

**Files:**
- Modify: `src/pages/games.tsx`

- [ ] **Step 1: Replace imports and remove old query/poll implementation**

Replace the file with a self-contained client experience:

```tsx
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
```

- [ ] **Step 2: Add component state and actions**

Continue in `src/pages/games.tsx`:

```tsx
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
```

- [ ] **Step 3: Add page markup**

Finish the return in `src/pages/games.tsx`:

```tsx
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
            <div className="perspective-[1200px]">
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

                  <div className="rounded-[14px] bg-[#4a0e0e]/8 p-3 text-center text-sm font-black text-[#4a0e0e]">
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
```

- [ ] **Step 4: Run Games tests**

Run: `npm run test -- tests/games.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/pages/games.tsx tests/games.test.tsx
git commit -m "feat: rebuild games challenge page"
```

## Task 4: Final Verification

**Files:**
- No edits expected.

- [ ] **Step 1: Run typecheck**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 2: Run full tests**

Run: `npm run test`

Expected: PASS.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: PASS and `dist/` generated.

## Self-Review

- Spec coverage: personal mission card, 2 redraws, local persistence, repeatable wheel, repeatable shared card, Stitch-inspired burgundy/card visual direction, and focused tests are all covered.
- Placeholder scan: no TBD/TODO/fill-in placeholders.
- Type consistency: `StoredMissionState`, `PersonalMission`, `MAX_REDRAWS`, and helper names are defined in Task 1 and reused consistently in Task 3.
