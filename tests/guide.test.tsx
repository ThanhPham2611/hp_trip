import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { GuidePage } from "../src/pages/guide";

vi.mock("../src/lib/api-client", () => ({
  api: {
    guide: vi.fn(async () => [
      {
        id: "guide-1",
        type: "place",
        title: "Nhà hát lớn Hải Phòng",
        description: "Điểm hẹn trung tâm, hợp để chụp ảnh nhóm trước bữa tối.",
        imageUrl: "https://example.com/theater.jpg",
        tags: ["Check-in", "Trung tâm"]
      },
      {
        id: "guide-2",
        type: "food",
        title: "Bánh đa cua",
        description: "Món nên thử khi cả nhóm muốn ăn nhanh và đúng vị Hải Phòng.",
        imageUrl: "https://example.com/food.jpg",
        tags: ["Đặc sản", "Bữa trưa"]
      }
    ])
  }
}));

const renderWithQuery = (ui: ReactElement) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

describe("GuidePage", () => {
  it("renders a quick-scan guide surface for trip planning", async () => {
    renderWithQuery(<GuidePage />);

    expect(await screen.findByRole("heading", { name: /Cẩm nang Du lịch/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Địa điểm tham quan/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Hành lý cần thiết/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Quy tắc & Lưu ý/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Ăn uống & Lưu trú/i })).toBeInTheDocument();
  });
  it("lets travelers tick luggage essentials", async () => {
    renderWithQuery(<GuidePage />);

    await screen.findByRole("heading", { name: /H.*nh l.* c.*n thi.*t/i });
    const checkboxes = screen.getAllByRole("checkbox");

    expect(checkboxes[2]).not.toBeChecked();
    await userEvent.click(checkboxes[2]);
    expect(checkboxes[2]).toBeChecked();
  });
});
