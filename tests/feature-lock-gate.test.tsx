import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { FeatureLockGate } from "../src/components/layout/feature-lock-gate";
import { FEATURE_UNLOCK_AT_ISO, FEATURE_UNLOCK_AT_MS } from "../src/lib/feature-lock";

function renderGate(pathname: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[pathname]}>
        <FeatureLockGate>
          <div>Unlocked feature content</div>
        </FeatureLockGate>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("FeatureLockGate", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a full lock screen for locked feature routes using server lock state", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          locked: true,
          message: "Tinh nang nay se mo luc 22:00 ngay 11/07 theo gio Viet Nam.",
          unlockAt: FEATURE_UNLOCK_AT_ISO,
          unlockAtMs: FEATURE_UNLOCK_AT_MS,
          serverNowMs: new Date("2026-07-11T12:00:00+07:00").getTime(),
          remainingMs: 10 * 60 * 60 * 1000
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    );

    renderGate("/games");

    expect(await screen.findByRole("heading", { name: /Chưa đến giờ mở khóa/i })).toBeInTheDocument();
    expect(screen.queryByText("Unlocked feature content")).not.toBeInTheDocument();
  });
});
