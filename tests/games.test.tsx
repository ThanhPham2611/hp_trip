import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    localStorage.clear();
    signInLocally();
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("draws a personal mission with two redraws remaining", async () => {
    renderWithProviders(<GamesPage />);

    await userEvent.click(screen.getByRole("button", { name: /^Rut the$/i }));

    expect(await screen.findByText(/Con 2 luot doi/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Doi nhiem vu/i })).toBeEnabled();
  });

  it("uses both redraws and then locks the mission", async () => {
    renderWithProviders(<GamesPage />);

    await userEvent.click(screen.getByRole("button", { name: /^Rut the$/i }));
    await screen.findByText(/Con 2 luot doi/i);

    await userEvent.click(screen.getByRole("button", { name: /Doi nhiem vu/i }));
    expect(await screen.findByText(/Con 1 luot doi/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Doi nhiem vu/i }));
    expect(await screen.findByText(/Nhiem vu da khoa/i)).toBeInTheDocument();
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
