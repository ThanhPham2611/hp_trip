import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LoginPage } from "../src/pages/login";

const mocks = vi.hoisted(() => ({
  login: vi.fn(async () => ({
    user: {
      id: "user-linh",
      username: "linh",
      displayName: "Linh Nguyen",
      avatarUrl: "https://example.com/avatar.jpg",
      tripId: "trip-hai-phong-2026"
    }
  })),
  randomSeat: vi.fn(async () => ({ id: "seat-C01", code: "C01", row: 3, col: 1, occupantId: "user-linh", occupantName: "Linh Nguyen" }))
}));

vi.mock("../src/lib/api-client", () => ({
  api: {
    login: mocks.login,
    randomSeat: mocks.randomSeat
  }
}));

const renderWithProviders = (ui: ReactElement) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe("LoginPage", () => {
  it("assigns a random seat after a successful login", async () => {
    renderWithProviders(<LoginPage />);

    await userEvent.type(screen.getByPlaceholderText("linh"), "linh");
    await userEvent.type(screen.getByPlaceholderText("hp2026"), "hp2026");
    await userEvent.click(screen.getByRole("button", { name: /Vào cẩm nang/i }));

    await waitFor(() => expect(mocks.login).toHaveBeenCalledWith("linh", "hp2026"));
    expect(mocks.randomSeat).toHaveBeenCalledTimes(1);
  });
});
