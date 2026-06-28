import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
    vi.useFakeTimers();
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

    expect(screen.getByText(/Đang hé lộ nhiệm vụ/i)).toBeInTheDocument();
    expect(screen.queryByText(/Còn 2 lượt đổi/i)).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/Còn 2 lượt đổi/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Đổi nhiệm vụ/i })).toBeEnabled();
  });

  it("uses both redraws and then locks the mission", async () => {
    renderWithProviders(<GamesPage />);

    fireEvent.click(screen.getByRole("button", { name: /^Rút thẻ$/i }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    screen.getByText(/Còn 2 lượt đổi/i);

    fireEvent.click(screen.getByRole("button", { name: /Đổi nhiệm vụ/i }));
    expect(screen.getByText(/Đang hé lộ nhiệm vụ/i)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/Còn 1 lượt đổi/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Đổi nhiệm vụ/i }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/Nhiệm vụ đã khóa/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hết lượt đổi/i })).toBeDisabled();
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
