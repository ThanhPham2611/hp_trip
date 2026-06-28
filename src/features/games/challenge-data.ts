export type MissionTone = "teal" | "coral" | "sunflower" | "harbor";

export type PersonalMission = {
  id: string;
  title: string;
  description: string;
  category: string;
  tone: MissionTone;
};

export type StoredMissionState = {
  missionId: string;
  remainingRedraws: number;
  updatedAt: string;
};

export const MAX_REDRAWS = 2;

export const personalMissions: PersonalMission[] = [
  {
    id: "story-catcher",
    title: "Nguoi bat chuyen",
    description: "Moi mot nguoi tren xe ke mot ky niem di choi dang nho, roi ghi lai cau noi hay nhat.",
    category: "Ket noi",
    tone: "teal"
  },
  {
    id: "food-scout",
    title: "Tham tu mon ngon",
    description: "Tim mon an la nhat trong ngay va thuyet phuc ca nhom thu it nhat mot mieng.",
    category: "An uong",
    tone: "coral"
  },
  {
    id: "photo-spark",
    title: "Tho san khoanh khac",
    description: "Chup 3 khoanh khac hau truong vui nhat va gui vao album chung truoc khi het ngay.",
    category: "Album",
    tone: "sunflower"
  },
  {
    id: "hype-leader",
    title: "Nguoi khuay dong",
    description: "Bat dau mot mini game hoac mot man dem nguoc chup anh nhom trong luc cho do an.",
    category: "Nang luong",
    tone: "harbor"
  },
  {
    id: "kind-navigator",
    title: "Dai su tinh te",
    description: "Am tham giup mot nguoi trong nhom viec nho: lay nuoc, giu do, nhac lich, hoac goi mon.",
    category: "Cham soc",
    tone: "teal"
  },
  {
    id: "quote-keeper",
    title: "Nguoi giu cau noi",
    description: "San mot cau noi bat hu cua chuyen di va dat ten cho no nhu ten mot bo phim.",
    category: "Vui ve",
    tone: "coral"
  }
];

export const wheelPrompts = [
  "Nguoi vua uong nuoc gan nhat ke mot su that bat ngo.",
  "Ca ban chon mon tiep theo trong 10 giay.",
  "Nguoi mac mau sang nhat duoc chi dinh mot nguoi hat 1 cau.",
  "Moi nguoi noi mot loi khen cho nguoi ben trai.",
  "Nguoi thua o keo bua bao tiep theo phai chup anh check-in ban an.",
  "Ca nhom cung nang ly va noi mot cau khau hieu cua chuyen di."
];

export const groupCardPrompts = [
  "Ca ban cung chon mot biet danh cho chuyen di Hai Phong.",
  "Moi nguoi ke ten mot mon muon thu truoc khi ve.",
  "Chup anh ban an theo phong cach nghiem tuc trong 3 giay.",
  "Binh chon nguoi goi mon co tam nhat hom nay.",
  "Ca nhom tao mot cau chuc ngan cho ngay tiep theo."
];

export function missionStorageKey(userId: string) {
  return `hp_trip_personal_mission:${userId}`;
}

export function pickRandomIndex(length: number, excludeIndex?: number) {
  if (length <= 1) return 0;
  let next = Math.floor(Math.random() * length);
  if (excludeIndex !== undefined && next === excludeIndex) {
    next = (next + 1) % length;
  }
  return next;
}

export function getMissionById(missionId: string) {
  return personalMissions.find((mission) => mission.id === missionId) ?? personalMissions[0];
}

export function loadMissionState(userId: string): StoredMissionState | null {
  try {
    const raw = localStorage.getItem(missionStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredMissionState;
    if (!parsed.missionId || typeof parsed.remainingRedraws !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveMissionState(userId: string, state: StoredMissionState) {
  try {
    localStorage.setItem(missionStorageKey(userId), JSON.stringify(state));
  } catch {
    return;
  }
}
