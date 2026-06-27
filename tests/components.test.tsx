import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { SeatGrid } from "../src/features/seats/seat-grid";
import { AlbumPage } from "../src/pages/album";
import { LoginPage } from "../src/pages/login";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

const renderWithProviders = (ui: ReactElement) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe("LoginPage", () => {
  it("renders the private trip login form", () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByRole("heading", { name: /Hải Phòng Trip/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Tên đăng nhập/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mật khẩu/i)).toBeInTheDocument();
  });
});

describe("SeatGrid", () => {
  it("shows the selected seat and disabled occupied seats", () => {
    render(
      <SeatGrid
        seats={[
          { id: "seat-1", code: "A01", row: 1, col: 1, occupantId: "user-2", occupantName: "Minh Anh" },
          { id: "seat-2", code: "B04", row: 2, col: 2, occupantId: null, occupantName: null }
        ]}
        currentUserId="user-1"
        selectedSeat="B04"
        onSelect={() => undefined}
      />
    );

    expect(screen.getByRole("button", { name: /B04 đang chọn/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /A01 đã có Minh Anh/i })).toBeDisabled();
  });
});

describe("AlbumPage", () => {
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

  it("matches the Stitch gallery controls and upload modal", async () => {
    signInLocally();

    renderWithProviders(<AlbumPage />);

    expect(await screen.findByRole("heading", { name: /^Album ảnh$/i })).toBeInTheDocument();
    expect(screen.getByText(/Lưu giữ những khoảnh khắc tuyệt vời tại Hải Phòng/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Tất cả$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Ngày$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Người đăng$/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^Upload ảnh$/i }));

    expect(screen.getByRole("heading", { name: /Upload ảnh mới/i })).toBeInTheDocument();
    expect(screen.getByText(/Kéo thả ảnh vào đây/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Caption \(Mô tả\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ngày đi/i)).toBeInTheDocument();
    expect(screen.getByText(/Chọn thành viên/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Hủy$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Tải lên$/i })).toBeInTheDocument();
  });

  it("lets users exit the photo lightbox with Escape and backdrop click", async () => {
    signInLocally();

    renderWithProviders(<AlbumPage />);

    const firstPhoto = await screen.findByRole("button", { name: /Moodboard check-in/i });
    await userEvent.click(firstPhoto);

    expect(screen.getByRole("dialog", { name: /Xem ảnh/i })).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: /Xem ảnh/i })).not.toBeInTheDocument();

    await userEvent.click(firstPhoto);
    await userEvent.click(screen.getByLabelText(/Đóng xem ảnh/i));
    expect(screen.queryByRole("dialog", { name: /Xem ảnh/i })).not.toBeInTheDocument();
  });
});
