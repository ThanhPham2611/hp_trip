import { describe, expect, it } from "vitest";
import { countdownDays, groupItineraryByDay, mapSeatStatus } from "../src/lib/trip-utils";

describe("countdownDays", () => {
  it("returns whole days until departure without going negative", () => {
    expect(countdownDays("2026-07-10", new Date("2026-07-01T08:00:00+07:00"))).toBe(9);
    expect(countdownDays("2026-06-01", new Date("2026-07-01T08:00:00+07:00"))).toBe(0);
  });
});

describe("groupItineraryByDay", () => {
  it("groups itinerary items by trip day", () => {
    const grouped = groupItineraryByDay([
      { id: "1", day: 1, time: "07:00", title: "Xuất phát", category: "move" },
      { id: "2", day: 2, time: "09:00", title: "Đồ Sơn", category: "visit" }
    ]);

    expect(grouped).toEqual({
      1: [{ id: "1", day: 1, time: "07:00", title: "Xuất phát", category: "move" }],
      2: [{ id: "2", day: 2, time: "09:00", title: "Đồ Sơn", category: "visit" }]
    });
  });
});

describe("mapSeatStatus", () => {
  it("marks my seat before occupied seats", () => {
    expect(mapSeatStatus({ occupantId: "user-1" }, "user-1", "A01")).toBe("mine");
  });

  it("marks selected and available seats", () => {
    expect(mapSeatStatus({ occupantId: null }, "user-1", "B04", "B04")).toBe("selected");
    expect(mapSeatStatus({ occupantId: null }, "user-1", "B05", "B04")).toBe("available");
  });
});
