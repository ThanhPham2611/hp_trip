import { seedAnnouncements, seedGameRooms, seedGuideItems, seedTrip, seedUsers } from "../data/seed";
import {
  addLocalExpense,
  addLocalItineraryItem,
  addLocalPhoto,
  confirmLocalMission,
  drawLocalMission,
  getLocalMission,
  localExpenses,
  localItinerary,
  localPhotos,
  localPoll,
  localSeats,
  randomLocalSeat,
  redrawLocalMission,
  updateLocalSeat,
  voteLocalPoll
} from "../data/local-store";
import type {
  AppUser,
  DashboardData,
  Expense,
  ExpensesData,
  GamesResponse,
  GuideItem,
  ItineraryItem,
  PersonalMissionState,
  Photo,
  Poll,
  Seat
} from "../types";
import type { ExpenseInput, ItineraryInput, PhotoMetadataInput } from "./schemas";
import { verifyBrowserPassword } from "./browser-password";
import type { FeatureLockState } from "./feature-lock";
import { countdownDays } from "./trip-utils";

const LOCAL_USER_KEY = "hp_trip_user";

type CloudinaryUploadResponse = {
  public_id: string;
  secure_url: string;
  error?: { message?: string };
};

class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init
  });
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) throw new Error("API unavailable");
  const data = await response.json();
  if (!response.ok) throw new ApiError(data?.message ?? "Request failed", response.status);
  return data as T;
}

function shouldUseLocalFallback(error: unknown) {
  // Chỉ fallback sang local khi API không khả dụng (network error, không phải lỗi API)
  // Nếu API trả về lỗi có status (4xx, 5xx), không fallback
  if (isApiError(error)) return false;
  // Nếu là lỗi network/fetch → API không chạy → dùng local fallback
  return true;
}


function safeUser(user: AppUser) {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

function localUser() {
  const raw = localStorage.getItem(LOCAL_USER_KEY);
  return raw ? (JSON.parse(raw) as Omit<AppUser, "passwordHash">) : null;
}

function requireLocalUser() {
  const user = localUser();
  if (!user) throw new Error("Ban can dang nhap");
  return user;
}

export const api = {
  async featureLock(): Promise<FeatureLockState> {
    return request<FeatureLockState>("/api/feature-lock");
  },
  async login(username: string, password: string) {
    try {
      const result = await request<{ user: Omit<AppUser, "passwordHash"> }>("/api/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(result.user));
      return result;
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
      const user = seedUsers.find((item) => item.username.toLowerCase() === username.toLowerCase());
      if (!user?.passwordHash || !(await verifyBrowserPassword(password, user.passwordHash))) {
        throw new Error("Ten dang nhap hoac mat khau khong dung");
      }
      const safe = safeUser(user);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(safe));
      return { user: safe };
    }
  },
  async logout() {
    localStorage.removeItem(LOCAL_USER_KEY);
    try {
      await request("/api/logout", { method: "POST" });
    } catch {
      return { ok: true };
    }
    return { ok: true };
  },
  async me() {
    try {
      return await request<{ user: Omit<AppUser, "passwordHash"> }>("/api/me");
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
      const user = localUser();
      if (!user) throw new Error("Ban can dang nhap");
      return { user };
    }
  },
  async dashboard(): Promise<DashboardData> {
    try {
      return await request<DashboardData>("/api/dashboard");
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
      const user = requireLocalUser();
      return {
        trip: seedTrip,
        user,
        countdownDays: countdownDays(seedTrip.startDate),
        todayItems: localItinerary.filter((item) => item.day === 1),
        mySeat: localSeats.find((seat) => seat.occupantId === user.id) ?? null,
        announcements: seedAnnouncements,
        recentPhotos: localPhotos.slice(0, 3),
        activeGames: seedGameRooms.filter((game) => game.status === "active")
      };
    }
  },
  async guide(): Promise<GuideItem[]> {
    try {
      return await request<GuideItem[]>("/api/guide");
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
      requireLocalUser();
      return seedGuideItems;
    }
  },
  async itinerary(): Promise<ItineraryItem[]> {
    try {
      return await request<ItineraryItem[]>("/api/itinerary");
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
      requireLocalUser();
      return localItinerary;
    }
  },
  async addItineraryItem(input: ItineraryInput): Promise<ItineraryItem> {
    try {
      return await request<ItineraryItem>("/api/itinerary", { method: "POST", body: JSON.stringify(input) });
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
      const user = requireLocalUser();
      return addLocalItineraryItem(input, user.id);
    }
  },
  async seats(): Promise<Seat[]> {
    try {
      return await request<Seat[]>("/api/seats");
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
      requireLocalUser();
      return localSeats;
    }
  },
  async selectSeat(code: string) {
    try {
      return await request<Seat>("/api/seats/select", { method: "POST", body: JSON.stringify({ code }) });
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
      const user = requireLocalUser();
      return updateLocalSeat(user.id, code);
    }
  },
  async randomSeat() {
    try {
      return await request<Seat>("/api/seats/random", { method: "POST" });
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
      const user = requireLocalUser();
      return randomLocalSeat(user.id);
    }
  },
  async photos(): Promise<Photo[]> {
    try {
      return await request<Photo[]>("/api/photos");
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
      requireLocalUser();
      return localPhotos;
    }
  },
  async addPhoto(input: PhotoMetadataInput) {
    try {
      return await request<Photo>("/api/photos", { method: "POST", body: JSON.stringify(input) });
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
      const user = requireLocalUser();
      return addLocalPhoto({
        ...input,
        uploadedBy: user.id,
        uploadedByName: user.displayName
      });
    }
  },
  async uploadPhoto(input: { file: File; caption: string; tripDay: number }) {
    const signature = await api.cloudinarySignature();
    const formData = new FormData();
    formData.append("file", input.file);
    formData.append("api_key", signature.apiKey);
    formData.append("timestamp", String(signature.timestamp));
    formData.append("signature", signature.signature);
    formData.append("folder", signature.folder);

    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
      method: "POST",
      body: formData
    });
    const uploaded = (await uploadResponse.json()) as CloudinaryUploadResponse;
    if (!uploadResponse.ok) throw new Error(uploaded.error?.message ?? "Khong tai duoc anh len Cloudinary");

    return api.addPhoto({
      publicId: uploaded.public_id,
      secureUrl: uploaded.secure_url,
      caption: input.caption,
      tripDay: input.tripDay,
      fileSize: input.file.size
    });
  },
  async games(): Promise<GamesResponse> {
    try {
      return await request<GamesResponse>("/api/games");
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
      const user = requireLocalUser();
      return { rooms: seedGameRooms, poll: localPoll, personalMission: getLocalMission(user.id) };
    }
  },
  async drawMission(): Promise<PersonalMissionState> {
    try {
      return await request<PersonalMissionState>("/api/games/mission/draw", { method: "POST" });
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
      const user = requireLocalUser();
      return drawLocalMission(user.id);
    }
  },
  async redrawMission(): Promise<PersonalMissionState> {
    try {
      return await request<PersonalMissionState>("/api/games/mission/redraw", { method: "POST" });
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
      const user = requireLocalUser();
      return redrawLocalMission(user.id);
    }
  },
  async confirmMission(): Promise<PersonalMissionState> {
    try {
      return await request<PersonalMissionState>("/api/games/mission/confirm", { method: "POST" });
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
      const user = requireLocalUser();
      return confirmLocalMission(user.id);
    }
  },
  async votePoll(pollId: string, optionId: string) {
    try {
      return await request<Poll>("/api/polls/vote", { method: "POST", body: JSON.stringify({ pollId, optionId }) });
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
      const user = requireLocalUser();
      return voteLocalPoll(user.id, pollId, optionId);
    }
  },
  async expenses(): Promise<ExpensesData> {
    try {
      return await request<ExpensesData>("/api/expenses");
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
      requireLocalUser();
      return {
        members: seedUsers.map((user) => ({ id: user.id, displayName: user.displayName })),
        expenses: localExpenses
      };
    }
  },
  async addExpense(input: ExpenseInput): Promise<Expense> {
    try {
      return await request<Expense>("/api/expenses", { method: "POST", body: JSON.stringify(input) });
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
      requireLocalUser();
      return addLocalExpense(input);
    }
  },
  async cloudinarySignature() {
    return request<{
      cloudName: string;
      apiKey: string;
      folder: string;
      timestamp: number;
      signature: string;
    }>("/api/cloudinary-signature", { method: "POST" });
  }
};
