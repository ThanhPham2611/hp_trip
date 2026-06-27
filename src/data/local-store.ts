import { seedItinerary, seedPhotos, seedPoll, seedSeats, seedUsers } from "./seed";
import type { Expense, ItineraryItem, Photo, Seat } from "../types";

export const localSeats: Seat[] = seedSeats.map((seat) => ({ ...seat }));
export const localItinerary: ItineraryItem[] = seedItinerary.map((item) => ({
  ...item,
  addedBy: "system",
  addedByName: "Ban tổ chức"
}));
export const localPhotos: Photo[] = [...seedPhotos];
export const localExpenses: Expense[] = [
  {
    id: "expense-1",
    title: "Hải sản tối ngày 2",
    amount: 1200000,
    paidBy: "user-linh",
    paidByName: "Linh Nguyễn",
    createdAt: "2026-06-27T10:00:00+07:00"
  },
  {
    id: "expense-2",
    title: "Taxi ra Đồ Sơn",
    amount: 420000,
    paidBy: "user-tuan",
    paidByName: "Tuấn Phạm",
    createdAt: "2026-06-27T11:00:00+07:00"
  }
];
export const localPoll = {
  ...seedPoll,
  options: seedPoll.options.map((option) => ({ ...option }))
};
const localVotes = new Set<string>();

export function updateLocalSeat(userId: string, code: string) {
  const target = localSeats.find((seat) => seat.code === code);
  if (!target) throw new Error("Không tìm thấy ghế");
  if (target.occupantId && target.occupantId !== userId) throw new Error("Ghế đã có người chọn");
  const user = seedUsers.find((item) => item.id === userId);
  localSeats.forEach((seat) => {
    if (seat.occupantId === userId) {
      seat.occupantId = null;
      seat.occupantName = null;
    }
  });
  target.occupantId = userId;
  target.occupantName = user?.displayName ?? "Bạn";
  return target;
}

export function randomLocalSeat(userId: string) {
  const available = localSeats.find((seat) => !seat.occupantId);
  if (!available) throw new Error("Xe đã hết ghế trống");
  return updateLocalSeat(userId, available.code);
}

export function addLocalPhoto(input: Omit<Photo, "id" | "createdAt">) {
  const photo = { ...input, id: `photo-${Date.now()}`, createdAt: new Date().toISOString() };
  localPhotos.unshift(photo);
  return photo;
}

export function addLocalItineraryItem(
  input: Omit<ItineraryItem, "id" | "addedBy" | "addedByName">,
  userId: string
) {
  const user = seedUsers.find((item) => item.id === userId);
  const item: ItineraryItem = {
    ...input,
    id: `it-local-${Date.now()}`,
    addedBy: userId,
    addedByName: user?.displayName ?? "Bạn"
  };
  localItinerary.push(item);
  localItinerary.sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  return item;
}

export function addLocalExpense(input: Pick<Expense, "title" | "amount" | "paidBy">) {
  const payer = seedUsers.find((item) => item.id === input.paidBy);
  const expense: Expense = {
    ...input,
    id: `expense-${Date.now()}`,
    paidByName: payer?.displayName ?? "Bạn",
    createdAt: new Date().toISOString()
  };
  localExpenses.unshift(expense);
  return expense;
}

export function voteLocalPoll(userId: string, pollId: string, optionId: string) {
  const voteKey = `${pollId}:${userId}`;
  if (localVotes.has(voteKey)) throw new Error("Bạn đã bình chọn rồi");
  localVotes.add(voteKey);
  const option = localPoll.options.find((item) => item.id === optionId);
  if (option) option.votes += 1;
  return localPoll;
}
