import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { ExpensesPage } from "../src/pages/expenses";

const mocks = vi.hoisted(() => {
  const expenses = [
    { id: "expense-1", title: "Hải sản tối ngày 2", amount: 1200000, paidBy: "user-linh", paidByName: "Linh Nguyen", createdAt: "2026-06-27T10:00:00+07:00" }
  ];

  return {
    expenses,
    addExpense: vi.fn(async (input: { title: string; amount: number; paidBy: string }) => {
      const item = {
        ...input,
        id: "expense-added",
        paidByName: input.paidBy === "user-tuan" ? "Tuấn Phạm" : "Linh Nguyen",
        createdAt: "2026-06-27T11:00:00+07:00"
      };
      expenses.unshift(item);
      return item;
    })
  };
});

vi.mock("../src/lib/api-client", () => ({
  api: {
    expenses: vi.fn(async () => ({
      members: [
        { id: "user-linh", displayName: "Linh Nguyen" },
        { id: "user-tuan", displayName: "Tuấn Phạm" }
      ],
      expenses: mocks.expenses
    })),
    addExpense: mocks.addExpense
  }
}));

const renderWithQuery = (ui: ReactElement) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

describe("ExpensesPage", () => {
  it("adds group expenses and shows split suggestions", async () => {
    renderWithQuery(<ExpensesPage />);

    expect(await screen.findByRole("heading", { name: /Chia tiền nhóm/i })).toBeInTheDocument();
    expect(screen.getByText(/Hải sản tối ngày 2/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Cần chuyển/i).length).toBeGreaterThan(0);

    await userEvent.type(screen.getByLabelText(/Khoản chi/i), "Taxi ra biển");
    await userEvent.clear(screen.getByLabelText(/Số tiền/i));
    await userEvent.type(screen.getByLabelText(/Số tiền/i), "300000");
    await userEvent.selectOptions(screen.getByLabelText(/Người trả/i), "user-tuan");
    await userEvent.click(screen.getByRole("button", { name: /Thêm khoản chi/i }));

    expect(await screen.findByText(/Taxi ra biển/i)).toBeInTheDocument();
    expect(mocks.addExpense.mock.calls[0][0]).toEqual({ title: "Taxi ra biển", amount: 300000, paidBy: "user-tuan" });
  });
});
