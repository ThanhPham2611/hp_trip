import { createClient } from "@supabase/supabase-js";
import {
  seedAnnouncements,
  seedGameRooms,
  seedGuideItems,
  seedItinerary,
  seedPhotos,
  seedPoll,
  seedSeats,
  seedTrip,
  seedUsers
} from "../../src/data/seed";
import { countdownDays } from "../../src/lib/trip-utils";
import {
  MAX_REDRAWS,
  personalMissions,
  pickRandomIndex
} from "../../src/features/games/challenge-data";
import type { AppUser, DashboardData, Expense, GamesResponse, ItineraryItem, PersonalMissionState, Photo, Seat } from "../../src/types";

type UploadEventStatus = "signature_issued" | "metadata_saved" | "rate_limited" | "rejected";

type UploadEvent = {
  id: string;
  userId: string;
  publicId?: string;
  fileSize?: number;
  status: UploadEventStatus;
  createdAt: string;
};

const mutableSeats: Seat[] = seedSeats.map((seat) => ({ ...seat }));
const mutableItinerary: ItineraryItem[] = seedItinerary.map((item) => ({
  ...item,
  addedBy: "system",
  addedByName: "Ban to chuc"
}));
const mutablePhotos: Photo[] = [...seedPhotos];
const mutableExpenses: Expense[] = [
  {
    id: "expense-1",
    title: "Hai san toi ngay 2",
    amount: 1200000,
    paidBy: "user-linh",
    paidByName: "Linh Nguyen",
    createdAt: "2026-06-27T10:00:00+07:00"
  },
  {
    id: "expense-2",
    title: "Taxi ra Do Son",
    amount: 420000,
    paidBy: "user-tuan",
    paidByName: "Tuan Pham",
    createdAt: "2026-06-27T11:00:00+07:00"
  }
];
const pollVotes = new Map<string, string>();
const localUploadEvents: UploadEvent[] = [];
const localPersonalMissions = new Map<string, PersonalMissionState>();

function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function stripPassword(user: AppUser) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

function mapUserRow(data: Record<string, unknown>): AppUser {
  return {
    id: String(data.id),
    username: String(data.username),
    displayName: String(data.display_name),
    avatarUrl: String(data.avatar_url),
    tripId: String(data.trip_id),
    passwordHash: String(data.password_hash)
  };
}

function mapPhotoRow(data: Record<string, unknown>): Photo {
  return {
    id: String(data.id),
    publicId: String(data.public_id),
    secureUrl: String(data.secure_url),
    caption: String(data.caption),
    tripDay: Number(data.trip_day),
    uploadedBy: String(data.uploaded_by),
    uploadedByName: String(data.uploaded_by_name),
    createdAt: String(data.created_at)
  };
}

function mapMissionRow(data: Record<string, unknown>): PersonalMissionState {
  return {
    missionId: String(data.mission_id),
    remainingRedraws: Number(data.remaining_redraws),
    locked: Boolean(data.locked),
    updatedAt: String(data.updated_at)
  };
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isNotFoundError(error: { code?: string } | null) {
  return error?.code === "PGRST116";
}

export async function findUserByUsername(username: string) {
  const client = supabase();
  if (client) {
    const { data, error } = await client.from("app_users").select("*").eq("username", username).single();
    if (error) {
      if (isNotFoundError(error)) return null;
      throw new Error("Khong tai duoc nguoi dung");
    }
    return data ? mapUserRow(data) : null;
  }
  return seedUsers.find((user) => user.username.toLowerCase() === username.toLowerCase()) ?? null;
}

export async function findUserById(userId: string) {
  const client = supabase();
  if (client) {
    const { data, error } = await client.from("app_users").select("*").eq("id", userId).single();
    if (error) {
      if (isNotFoundError(error)) return null;
      throw new Error("Khong tai duoc nguoi dung");
    }
    return data ? mapUserRow(data) : null;
  }
  return seedUsers.find((user) => user.id === userId) ?? null;
}

export async function getPublicUser(userId: string) {
  const user = await findUserById(userId);
  return user ? stripPassword(user) : null;
}

export async function getDashboard(userId: string): Promise<DashboardData> {
  const user = await findUserById(userId);
  if (!user) throw new Error("Khong tai duoc nguoi dung");
  const photos = await getPhotos();
  const mySeat = mutableSeats.find((seat) => seat.occupantId === user.id) ?? null;
  return {
    trip: seedTrip,
    user: stripPassword(user),
    countdownDays: countdownDays(seedTrip.startDate),
    todayItems: mutableItinerary.filter((item) => item.day === 1),
    mySeat,
    announcements: seedAnnouncements,
    recentPhotos: photos.slice(0, 3),
    activeGames: seedGameRooms.filter((game) => game.status === "active")
  };
}

export async function getGuide() {
  return seedGuideItems;
}

export async function getItinerary() {
  return mutableItinerary;
}

export async function addItineraryItem(input: Omit<ItineraryItem, "id" | "addedBy" | "addedByName">, userId: string) {
  const user = await findUserById(userId);
  const item: ItineraryItem = {
    ...input,
    id: `it-${Date.now()}`,
    addedBy: userId,
    addedByName: user?.displayName ?? "Ban"
  };
  mutableItinerary.push(item);
  mutableItinerary.sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  return item;
}

export async function getSeats() {
  return mutableSeats;
}

export async function selectSeat(userId: string, code: string) {
  const target = mutableSeats.find((seat) => seat.code === code);
  if (!target) throw new Error("Khong tim thay ghe");
  if (target.occupantId && target.occupantId !== userId) throw new Error("Ghe da co nguoi chon");
  const user = await findUserById(userId);
  mutableSeats.forEach((seat) => {
    if (seat.occupantId === userId) {
      seat.occupantId = null;
      seat.occupantName = null;
    }
  });
  target.occupantId = userId;
  target.occupantName = user?.displayName ?? "Ban";
  return target;
}

export async function randomSeat(userId: string) {
  const available = mutableSeats.find((seat) => !seat.occupantId);
  if (!available) throw new Error("Xe da het ghe trong");
  return selectSeat(userId, available.code);
}

export async function getPhotos() {
  const client = supabase();
  if (client) {
    const { data, error } = await client.from("photos").select("*").order("created_at", { ascending: false });
    if (error) throw new Error("Khong tai duoc album");
    return (data ?? []).map(mapPhotoRow);
  }
  return mutablePhotos;
}

export async function addPhoto(input: Omit<Photo, "id" | "createdAt">) {
  const client = supabase();
  const id = `photo-${Date.now()}`;
  if (client) {
    const row = {
      id,
      public_id: input.publicId,
      secure_url: input.secureUrl,
      caption: input.caption,
      trip_day: input.tripDay,
      uploaded_by: input.uploadedBy,
      uploaded_by_name: input.uploadedByName
    };
    const { data, error } = await client.from("photos").insert(row).select("*").single();
    if (error) {
      if (error.code === "23505") throw new Error("Anh nay da duoc luu");
      throw new Error("Khong luu duoc anh");
    }
    return mapPhotoRow(data);
  }
  if (mutablePhotos.some((photo) => photo.publicId === input.publicId)) throw new Error("Anh nay da duoc luu");
  const photo: Photo = {
    ...input,
    id,
    createdAt: new Date().toISOString()
  };
  mutablePhotos.unshift(photo);
  return photo;
}

export async function recordUploadEvent(input: { userId: string; publicId?: string; fileSize?: number; status: UploadEventStatus }) {
  const client = supabase();
  const createdAt = new Date().toISOString();
  if (client) {
    const { error } = await client.from("upload_events").insert({
      id: newId("upload"),
      user_id: input.userId,
      public_id: input.publicId ?? null,
      file_size: input.fileSize ?? null,
      status: input.status,
      created_at: createdAt
    });
    if (error) throw new Error("Khong ghi duoc lich su upload");
    return;
  }
  localUploadEvents.push({
    id: newId("upload"),
    userId: input.userId,
    publicId: input.publicId,
    fileSize: input.fileSize,
    status: input.status,
    createdAt
  });
}

export async function getUploadCounts(userId: string, now = new Date()) {
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const countedStatuses: UploadEventStatus[] = ["signature_issued", "metadata_saved"];
  const client = supabase();
  if (client) {
    const recent = await client
      .from("upload_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", tenMinutesAgo)
      .in("status", countedStatuses);
    const daily = await client
      .from("upload_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", oneDayAgo)
      .in("status", countedStatuses);
    if (recent.error || daily.error) throw new Error("Khong kiem tra duoc gioi han upload");
    return { recent: recent.count ?? 0, daily: daily.count ?? 0 };
  }
  const localEvents = localUploadEvents.filter((event) => event.userId === userId && countedStatuses.includes(event.status));
  return {
    recent: localEvents.filter((event) => event.createdAt >= tenMinutesAgo).length,
    daily: localEvents.filter((event) => event.createdAt >= oneDayAgo).length
  };
}

export function repositoryMode() {
  return isSupabaseConfigured() ? "supabase" : "local";
}

function createMissionState(currentMissionId?: string, remainingRedraws = MAX_REDRAWS, locked = false): PersonalMissionState {
  const currentIndex = currentMissionId ? personalMissions.findIndex((mission) => mission.id === currentMissionId) : undefined;
  const missionIndex = pickRandomIndex(personalMissions.length, currentIndex === -1 ? undefined : currentIndex);
  return {
    missionId: personalMissions[missionIndex].id,
    remainingRedraws,
    locked,
    updatedAt: new Date().toISOString()
  };
}

async function saveSupabaseMission(userId: string, state: PersonalMissionState) {
  const client = supabase();
  if (!client) return null;
  const row = {
    user_id: userId,
    mission_id: state.missionId,
    remaining_redraws: state.remainingRedraws,
    locked: state.locked,
    updated_at: state.updatedAt
  };
  const { data, error } = await client.from("user_missions").upsert(row, { onConflict: "user_id" }).select("*").single();
  if (error) throw new Error("Khong luu duoc nhiem vu");
  return mapMissionRow(data);
}

export async function getPersonalMission(userId: string): Promise<PersonalMissionState | null> {
  const client = supabase();
  if (client) {
    const { data, error } = await client.from("user_missions").select("*").eq("user_id", userId).single();
    if (error) {
      if (isNotFoundError(error)) return null;
      throw new Error("Khong tai duoc nhiem vu");
    }
    return data ? mapMissionRow(data) : null;
  }
  return localPersonalMissions.get(userId) ?? null;
}

export async function drawPersonalMission(userId: string): Promise<PersonalMissionState> {
  const existing = await getPersonalMission(userId);
  if (existing) return existing;

  const state = createMissionState();
  const saved = await saveSupabaseMission(userId, state);
  if (saved) return saved;
  localPersonalMissions.set(userId, state);
  return state;
}

export async function redrawPersonalMission(userId: string): Promise<PersonalMissionState> {
  const existing = await getPersonalMission(userId);
  if (!existing) throw new Error("Chua rut nhiem vu");
  if (existing.locked) throw new Error("Nhiem vu da khoa");
  if (existing.remainingRedraws <= 0) throw new Error("Da het luot doi");

  const state = createMissionState(existing.missionId, existing.remainingRedraws - 1);
  const saved = await saveSupabaseMission(userId, state);
  if (saved) return saved;
  localPersonalMissions.set(userId, state);
  return state;
}

export async function confirmPersonalMission(userId: string): Promise<PersonalMissionState> {
  const existing = await getPersonalMission(userId);
  if (!existing) throw new Error("Chua rut nhiem vu");
  const state = { ...existing, locked: true, updatedAt: new Date().toISOString() };
  const saved = await saveSupabaseMission(userId, state);
  if (saved) return saved;
  localPersonalMissions.set(userId, state);
  return state;
}

export async function getGames(userId?: string): Promise<GamesResponse> {
  return {
    rooms: seedGameRooms,
    poll: seedPoll,
    personalMission: userId ? await getPersonalMission(userId) : null
  };
}

export async function votePoll(userId: string, pollId: string, optionId: string) {
  if (pollVotes.has(`${pollId}:${userId}`)) throw new Error("Ban da binh chon roi");
  pollVotes.set(`${pollId}:${userId}`, optionId);
  const option = seedPoll.options.find((item) => item.id === optionId);
  if (option) option.votes += 1;
  return seedPoll;
}

export async function getExpenses() {
  return {
    members: seedUsers.map((user) => ({ id: user.id, displayName: user.displayName })),
    expenses: mutableExpenses
  };
}

export async function addExpense(input: Pick<Expense, "title" | "amount" | "paidBy">) {
  const payer = seedUsers.find((user) => user.id === input.paidBy);
  const expense: Expense = {
    ...input,
    id: `expense-${Date.now()}`,
    paidByName: payer?.displayName ?? "Ban",
    createdAt: new Date().toISOString()
  };
  mutableExpenses.unshift(expense);
  return expense;
}
