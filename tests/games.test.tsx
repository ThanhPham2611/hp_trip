import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => {
  type MissionState = {
    missionId: string;
    remainingRedraws: number;
    locked: boolean;
    updatedAt: string;
  };

  let mission: MissionState | null = null;
  const now = "2026-06-28T00:00:00.000Z";
  const api = {
    games: vi.fn(async () => ({
      rooms: [],
      poll: { id: "poll-food", question: "Poll", options: [] },
      personalMission: mission
    })),
    drawMission: vi.fn(async () => {
      mission = { missionId: "story-catcher", remainingRedraws: 2, locked: false, updatedAt: now };
      return mission;
    }),
    redrawMission: vi.fn(async () => {
      mission = { missionId: "food-scout", remainingRedraws: Math.max((mission?.remainingRedraws ?? 2) - 1, 0), locked: false, updatedAt: now };
      return mission;
    }),
    confirmMission: vi.fn(async () => {
      mission = { ...(mission ?? { missionId: "story-catcher", remainingRedraws: 2, updatedAt: now }), locked: true };
      return mission;
    }),
    reset: () => {
      mission = null;
      api.games.mockClear();
      api.drawMission.mockClear();
      api.redrawMission.mockClear();
      api.confirmMission.mockClear();
    }
  };

  return api;
});

vi.mock("../src/lib/api-client", () => ({ api: apiMocks }));

import { GamesPage } from "../src/pages/games";

vi.mock("framer-motion", async () => {
  const React = await import("react");
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: new Proxy(
      {},
      {
        get: (_target, element: string) =>
          React.forwardRef<HTMLElement, any>((props, ref) => {
            const domProps = { ...props };
            const children = domProps.children;
            delete domProps.children;
            delete domProps.animate;
            delete domProps.initial;
            delete domProps.exit;
            delete domProps.transition;
            delete domProps.whileHover;
            delete domProps.whileTap;
            return React.createElement(element, { ...domProps, ref }, children);
          })
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

let userCounter = 0;

const signInLocally = () => {
  localStorage.setItem(
    "hp_trip_user",
    JSON.stringify({
      id: `user-linh-${++userCounter}`,
      username: "linh",
      displayName: "Linh Nguyen",
      avatarUrl: "https://i.pravatar.cc/120?img=47",
      tripId: "trip-hai-phong-2026"
    })
  );
};

describe("GamesPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    apiMocks.reset();
    localStorage.clear();
    signInLocally();
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("reveals a personal mission after a one second mystery state", async () => {
    renderWithProviders(<GamesPage />);

    expect(screen.getByRole("tab", { name: /Nhiệm vụ của tôi/i })).toHaveAttribute("aria-selected", "true");

    fireEvent.click(screen.getByRole("button", { name: /^Rút thẻ$/i }));
    await act(async () => {});

    expect(screen.getByRole("dialog", { name: /Đang rút nhiệm vụ/i })).toBeInTheDocument();
    expect(screen.getByText(/Đang hé lộ nhiệm vụ/i)).toBeInTheDocument();
    expect(screen.queryByText(/Còn 2 lượt đổi/i)).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(screen.queryByRole("dialog", { name: /Đang rút nhiệm vụ/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Còn 2 lượt đổi/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Đổi nhiệm vụ/i })).toBeEnabled();
  });

  it("locks the mission after confirming the challenge", async () => {
    renderWithProviders(<GamesPage />);

    fireEvent.click(screen.getByRole("button", { name: /^Rút thẻ$/i }));
    await act(async () => {});
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    screen.getByText(/Còn 2 lượt đổi/i);

    fireEvent.click(screen.getByRole("button", { name: /Đổi nhiệm vụ/i }));
    expect(screen.getByText(/Đang hé lộ nhiệm vụ/i)).toBeInTheDocument();
    await act(async () => {});
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByText(/Còn 1 lượt đổi/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Xác nhận thử thách/i }));
    await act(async () => {});

    expect(screen.getByText(/Nhiệm vụ đã khóa/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Đã xác nhận thử thách/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Thử thách đã khóa/i })).toBeDisabled();
  });

  it("keeps shared card and wheel games in separate Vietnamese tabs", async () => {
    renderWithProviders(<GamesPage />);

    fireEvent.click(screen.getByRole("tab", { name: /Rút thẻ chung/i }));
    const groupCardButton = screen.getByRole("button", { name: /Mở thẻ chung/i });
    fireEvent.click(groupCardButton);
    fireEvent.click(groupCardButton);
    expect(screen.getByText(/Thử thách chung/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Vòng quay/i }));
    const spinButton = screen.getByRole("button", { name: /Quay ngay/i });
    fireEvent.click(spinButton);
    fireEvent.click(spinButton);
    expect(screen.getByText(/Kết quả vòng quay/i)).toBeInTheDocument();

    expect(screen.queryByText(/SPIN/i)).not.toBeInTheDocument();
  });
});
