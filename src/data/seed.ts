import type {
  Announcement,
  AppUser,
  GameRoom,
  GuideItem,
  ItineraryItem,
  Photo,
  Poll,
  Seat,
  Trip
} from "../types.js";

export const seedTrip: Trip = {
  id: "trip-hai-phong-2026",
  name: "Hải Phòng Trip",
  subtitle: "Chuyến đi 3 ngày 2 đêm",
  startDate: "2026-07-10",
  endDate: "2026-07-12",
  route: "Hà Nội -> Hải Phòng",
  coverUrl:
    "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1600&q=85"
};

export const seedUsers: AppUser[] = [
  {
    id: "user-linh",
    username: "linh",
    displayName: "Linh Nguyễn",
    avatarUrl: "https://i.pravatar.cc/120?img=47",
    tripId: seedTrip.id,
    passwordHash: "pbkdf2_sha256$100000$seed-linh$zRljYil8Z90XCcmOwekZhAPIXB80XKFjqqpWealOKCo="
  },
  {
    id: "user-minhanh",
    username: "minhanh",
    displayName: "Minh Anh",
    avatarUrl: "https://i.pravatar.cc/120?img=32",
    tripId: seedTrip.id,
    passwordHash: "pbkdf2_sha256$100000$seed-minhanh$deJvLe9wfl0favmOqVCqP2ckR40HecIzQimHT2plOSI="
  },
  {
    id: "user-tuan",
    username: "tuan",
    displayName: "Tuấn Phạm",
    avatarUrl: "https://i.pravatar.cc/120?img=12",
    tripId: seedTrip.id,
    passwordHash: "pbkdf2_sha256$100000$seed-tuan$tObzduv+BYslIcTuMHF36gaE+oI+aQ+I3EOhfdiZ1Js="
  },
  {
    id: "user-admin",
    username: "admin",
    displayName: "Trưởng nhóm",
    avatarUrl: "https://i.pravatar.cc/120?img=5",
    tripId: seedTrip.id,
    passwordHash: "pbkdf2_sha256$100000$seed-admin$LMCfSy0+wxARXjEUTjyHgJjhZiBmc+IIOfcocnuyO7Q="
  }
];

export const seedAnnouncements: Announcement[] = [
  {
    id: "ann-1",
    title: "Chốt giờ tập trung",
    body: "Có mặt tại cổng công ty lúc 06:30, xe xuất phát đúng 07:00.",
    createdAt: "2026-06-26T09:30:00+07:00"
  },
  {
    id: "ann-2",
    title: "Mang giấy tờ cá nhân",
    body: "Mọi người nhớ mang căn cước công dân để check-in khách sạn.",
    createdAt: "2026-06-25T18:20:00+07:00"
  }
];

export const seedGuideItems: GuideItem[] = [
  {
    id: "guide-1",
    type: "place",
    title: "Nhà hát Lớn Hải Phòng",
    description: "Điểm check-in trung tâm thành phố, hợp chụp ảnh nhóm buổi sáng.",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    tags: ["Tham quan", "Check-in"]
  },
  {
    id: "guide-2",
    type: "place",
    title: "Đồ Sơn",
    description: "Bãi biển gần trung tâm, phù hợp đi chiều ngày 2.",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    tags: ["Biển", "Ngày 2"]
  },
  {
    id: "guide-3",
    type: "food",
    title: "Bánh đa cua",
    description: "Món nhất định phải thử, ưu tiên quán gần trung tâm để cả nhóm di chuyển dễ.",
    imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=80",
    tags: ["Ăn uống", "Đặc sản"]
  },
  {
    id: "guide-4",
    type: "food",
    title: "Nem cua bể",
    description: "Gợi ý gọi theo mâm để chia nhóm, đặt trước nếu đi đông.",
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
    tags: ["Ăn uống", "Nhóm đông"]
  },
  {
    id: "guide-5",
    type: "stay",
    title: "Khách sạn trung tâm",
    description: "Check-in sau 14:00, phòng chia theo danh sách trưởng nhóm gửi.",
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
    tags: ["Lưu trú", "Check-in"]
  },
  {
    id: "guide-6",
    type: "note",
    title: "Quy tắc lên xe",
    description: "Có mặt trước giờ hẹn 10 phút, giữ chỗ đúng sơ đồ, báo nhóm nếu đổi ghế.",
    imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=900&q=80",
    tags: ["Lưu ý", "Xe"]
  }
];

export const seedItinerary: ItineraryItem[] = [
  { id: "it-1", day: 1, time: "07:00", title: "Xuất phát từ Hà Nội", category: "move", location: "Cổng công ty", note: "Có mặt trước 06:30" },
  { id: "it-2", day: 1, time: "10:30", title: "Check-in Nhà hát Lớn", category: "visit", location: "Trung tâm Hải Phòng" },
  { id: "it-3", day: 1, time: "12:00", title: "Ăn bánh đa cua", category: "food", location: "Quán trung tâm" },
  { id: "it-4", day: 1, time: "14:00", title: "Nhận phòng khách sạn", category: "stay", location: "Khách sạn trung tâm" },
  { id: "it-5", day: 2, time: "08:30", title: "Đi Đồ Sơn", category: "visit", location: "Đồ Sơn" },
  { id: "it-6", day: 2, time: "18:30", title: "Ăn tối hải sản", category: "food", location: "Nhà hàng ven biển" },
  { id: "it-7", day: 3, time: "09:00", title: "Mua quà và trả phòng", category: "move", location: "Chợ địa phương" },
  { id: "it-8", day: 3, time: "14:00", title: "Về Hà Nội", category: "move", location: "Khách sạn" }
];

export const seedSeats: Seat[] = Array.from({ length: 24 }, (_, index) => {
  const row = Math.floor(index / 4) + 1;
  const col = (index % 4) + 1;
  const code = `${String.fromCharCode(64 + row)}${String(col).padStart(2, "0")}`;
  const occupied: Record<string, Pick<Seat, "occupantId" | "occupantName">> = {
    A01: { occupantId: "user-minhanh", occupantName: "Minh Anh" },
    A02: { occupantId: "user-tuan", occupantName: "Tuấn Phạm" },
    B04: { occupantId: "user-linh", occupantName: "Linh Nguyễn" }
  };
  return {
    id: `seat-${code}`,
    code,
    row,
    col,
    occupantId: occupied[code]?.occupantId ?? null,
    occupantName: occupied[code]?.occupantName ?? null
  };
});

export const seedPhotos: Photo[] = [
  {
    id: "photo-1",
    publicId: "hai-phong-trip/nha-hat-lon",
    secureUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80",
    caption: "Moodboard check-in trung tâm thành phố",
    tripDay: 1,
    uploadedBy: "user-linh",
    uploadedByName: "Linh Nguyễn",
    createdAt: "2026-06-26T10:00:00+07:00"
  },
  {
    id: "photo-2",
    publicId: "hai-phong-trip/do-son",
    secureUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
    caption: "Biển Đồ Sơn trong lịch trình ngày 2",
    tripDay: 2,
    uploadedBy: "user-minhanh",
    uploadedByName: "Minh Anh",
    createdAt: "2026-06-26T10:10:00+07:00"
  },
  {
    id: "photo-3",
    publicId: "hai-phong-trip/food",
    secureUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
    caption: "Danh sách món nên thử",
    tripDay: 1,
    uploadedBy: "user-tuan",
    uploadedByName: "Tuấn Phạm",
    createdAt: "2026-06-26T10:30:00+07:00"
  }
];

export const seedGameRooms: GameRoom[] = [
  { id: "game-quiz", type: "quiz", title: "Ai hiểu Hải Phòng nhất?", status: "active", participants: ["Linh", "Minh Anh", "Tuấn"] },
  { id: "game-poll", type: "poll", title: "Ăn gì tối nay?", status: "active", participants: ["Linh", "Minh Anh"] },
  { id: "game-bingo", type: "bingo", title: "Bingo trên xe", status: "waiting", participants: ["Cả nhóm"] }
];

export const seedPoll: Poll = {
  id: "poll-sleep",
  question: "Ai ngủ nhiều nhất trên xe?",
  options: [
    { id: "linh", label: "Linh", votes: 3 },
    { id: "minhanh", label: "Minh Anh", votes: 5 },
    { id: "tuan", label: "Tuấn", votes: 2 }
  ]
};
