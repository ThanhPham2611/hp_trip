import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { SchedulePage } from "../src/pages/schedule";
import type { ItineraryItem } from "../src/types";

const mocks = vi.hoisted(() => {
  const itineraryItems: ItineraryItem[] = [
    { id: "it-1", day: 1, time: "07:00", title: "Xuất phát từ Hà Nội", category: "move", location: "Cổng công ty", note: "Có mặt trước 06:30" },
    { id: "it-2", day: 1, time: "10:30", title: "Check-in Nhà hát Lớn", category: "visit", location: "Trung tâm Hải Phòng" },
    { id: "it-3", day: 1, time: "12:00", title: "Ăn bánh đa cua", category: "food", location: "Quán trung tâm" },
    { id: "it-4", day: 2, time: "08:30", title: "Đi Đồ Sơn", category: "visit", location: "Đồ Sơn" }
  ];
  return {
    itineraryItems,
    addItineraryItem: vi.fn(
      async (input: { day: number; time: string; title: string; category: ItineraryItem["category"]; location?: string; note?: string }) => {
      const item = {
        ...input,
        id: "it-added",
        addedBy: "user-linh",
        addedByName: "Linh Nguyen"
      };
      itineraryItems.push(item);
      return item;
      }
    )
  };
});

vi.mock("../src/lib/api-client", () => ({
  api: {
    itinerary: vi.fn(async () => mocks.itineraryItems),
    addItineraryItem: mocks.addItineraryItem
  }
}));

const renderWithQuery = (ui: ReactElement) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

describe("SchedulePage", () => {
  it("renders the Stitch-style itinerary timeline and detail panel", async () => {
    renderWithQuery(<SchedulePage />);

    expect(await screen.findByRole("heading", { name: /Lịch trình chi tiết/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Thứ Sáu, 10 tháng 7/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Di chuyển & Khám phá/i })).toBeInTheDocument();
    expect(screen.getByText(/Route mini-map/i)).toBeInTheDocument();
    expect(screen.getByText(/Chi tiết thời gian/i)).toBeInTheDocument();
  });

  it("adds a new activity and shows who added it", async () => {
    renderWithQuery(<SchedulePage />);

    await screen.findByRole("heading", { name: /Lịch trình chi tiết/i });
    await userEvent.click(screen.getByRole("button", { name: /Thêm hoạt động/i }));
    await userEvent.clear(screen.getByLabelText(/Giờ/i));
    await userEvent.type(screen.getByLabelText(/Giờ/i), "16:30");
    await userEvent.type(screen.getByPlaceholderText(/Cafe/i), "Cafe bờ biển");
    await userEvent.type(screen.getByPlaceholderText(/Nhà hát|Đồ Sơn|khách sạn/i), "Đồ Sơn");
    await userEvent.click(screen.getByRole("button", { name: /Lưu hoạt động/i }));

    await waitFor(() => expect(mocks.addItineraryItem).toHaveBeenCalled());
    expect((await screen.findAllByText(/Cafe bờ biển/i)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Linh Nguyen/i).length).toBeGreaterThan(0);
  });
});
