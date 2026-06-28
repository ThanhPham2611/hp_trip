import { describe, expect, it } from "vitest";
import {
  confirmPersonalMission,
  drawPersonalMission,
  getPersonalMission,
  redrawPersonalMission
} from "../api/_lib/repository";

describe("personal mission state", () => {
  it("keeps redraw and lock state on the server", async () => {
    const userId = `mission-user-${Date.now()}-${Math.random()}`;

    expect(await getPersonalMission(userId)).toBeNull();

    const first = await drawPersonalMission(userId);
    expect(first).toMatchObject({ remainingRedraws: 2, locked: false });

    const redrawn = await redrawPersonalMission(userId);
    expect(redrawn.remainingRedraws).toBe(1);
    expect(redrawn.missionId).not.toBe(first.missionId);

    const locked = await confirmPersonalMission(userId);
    expect(locked).toMatchObject({ missionId: redrawn.missionId, remainingRedraws: 1, locked: true });

    await expect(redrawPersonalMission(userId)).rejects.toThrow("Nhiem vu da khoa");
  });
});
