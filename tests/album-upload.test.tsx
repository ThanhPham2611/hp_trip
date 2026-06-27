import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { MAX_UPLOAD_BYTES } from "../src/lib/upload";
import { AlbumPage } from "../src/pages/album";

const mocks = vi.hoisted(() => ({
  photos: vi.fn(async () => []),
  uploadPhoto: vi.fn(async () => ({
    id: "photo-uploaded",
    publicId: "hai-phong-trip/do-son",
    secureUrl: "https://res.cloudinary.com/demo/image/upload/v1/hai-phong-trip/do-son.png",
    caption: "Do Son",
    tripDay: 1,
    uploadedBy: "user-linh",
    uploadedByName: "Linh Nguyen",
    createdAt: "2026-06-27T10:00:00+07:00"
  }))
}));

vi.mock("../src/lib/api-client", () => ({
  api: {
    photos: mocks.photos,
    uploadPhoto: mocks.uploadPhoto
  }
}));

function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

async function openUploadModal() {
  renderWithQuery(<AlbumPage />);
  await screen.findByRole("heading", { name: /Album/i });
  await userEvent.click(screen.getByRole("button", { name: /Upload/i }));
}

function fileInput() {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("file input not found");
  return input;
}

describe("Album upload", () => {
  it("shows the selected file name and size", async () => {
    await openUploadModal();

    const file = new File(["hello"], "do-son.png", { type: "image/png" });
    await userEvent.upload(fileInput(), file);

    expect(screen.getByText(/do-son.png/i)).toBeInTheDocument();
    expect(screen.getByText(/5 B/i)).toBeInTheDocument();
  });

  it("rejects oversized files before upload", async () => {
    await openUploadModal();

    const file = new File(["x"], "huge.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: MAX_UPLOAD_BYTES + 1 });
    await userEvent.upload(fileInput(), file);

    expect(screen.getByText(/File toi da 8 MB/i)).toBeInTheDocument();
    expect(mocks.uploadPhoto).not.toHaveBeenCalled();
  });

  it("uploads a valid selected image", async () => {
    await openUploadModal();

    const file = new File(["hello"], "do-son.png", { type: "image/png" });
    await userEvent.upload(fileInput(), file);
    await userEvent.type(screen.getByLabelText(/Caption/i), "Do Son");
    await userEvent.click(screen.getByRole("button", { name: /Tai len|Tải lên|Táº£i lÃªn/i }));

    await waitFor(() =>
      expect(mocks.uploadPhoto).toHaveBeenCalledWith({
        file,
        caption: "Do Son",
        tripDay: 1
      })
    );
  });
});
