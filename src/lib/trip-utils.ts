import type { ItineraryItem, Seat } from "../types.js";

export type SeatUiStatus = "available" | "occupied" | "mine" | "selected";

export function countdownDays(targetDate: string, now = new Date()) {
  const target = new Date(`${targetDate}T00:00:00+07:00`);
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function groupItineraryByDay(items: ItineraryItem[]) {
  return items.reduce<Record<number, ItineraryItem[]>>((acc, item) => {
    acc[item.day] = [...(acc[item.day] ?? []), item];
    return acc;
  }, {});
}

export function mapSeatStatus(
  seat: Pick<Seat, "occupantId">,
  currentUserId: string,
  seatCode: string,
  selectedSeat?: string | null
): SeatUiStatus {
  if (seat.occupantId === currentUserId) return "mine";
  if (seat.occupantId) return "occupied";
  if (selectedSeat === seatCode) return "selected";
  return "available";
}

export function categoryLabel(category: ItineraryItem["category"]) {
  const labels: Record<ItineraryItem["category"], string> = {
    move: "Di chuyển",
    visit: "Tham quan",
    food: "Ăn uống",
    stay: "Lưu trú",
    game: "Trò chơi"
  };
  return labels[category];
}
