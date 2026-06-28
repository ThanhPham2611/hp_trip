export type MissionTone = "teal" | "coral" | "sunflower" | "harbor";

export type PersonalMission = {
  id: string;
  title: string;
  description: string;
  category: string;
  tone: MissionTone;
};

export const MAX_REDRAWS = 2;

export const personalMissions: PersonalMission[] = [
  {
    id: "story-catcher",
    title: "Người bắt chuyện",
    description: "Mời một người trong nhóm kể một kỷ niệm đi chơi đáng nhớ, rồi ghi lại câu nói hay nhất.",
    category: "Kết nối",
    tone: "teal"
  },
  {
    id: "food-scout",
    title: "Thám tử món ngon",
    description: "Tìm món ăn lạ nhất trong ngày và thuyết phục cả nhóm thử ít nhất một miếng.",
    category: "Ăn uống",
    tone: "coral"
  },
  {
    id: "photo-spark",
    title: "Thợ săn khoảnh khắc",
    description: "Chụp 3 khoảnh khắc hậu trường vui nhất và gửi vào album chung trước khi hết ngày.",
    category: "Album",
    tone: "sunflower"
  },
  {
    id: "hype-leader",
    title: "Người khuấy động",
    description: "Bắt đầu một mini game hoặc một màn đếm ngược chụp ảnh nhóm trong lúc chờ đồ ăn.",
    category: "Năng lượng",
    tone: "harbor"
  },
  {
    id: "kind-navigator",
    title: "Đại sứ tinh tế",
    description: "Âm thầm giúp một người trong nhóm việc nhỏ: lấy nước, giữ đồ, nhắc lịch, hoặc gọi món.",
    category: "Chăm sóc",
    tone: "teal"
  },
  {
    id: "quote-keeper",
    title: "Người giữ câu nói",
    description: "Săn một câu nói bất hủ của chuyến đi và đặt tên cho nó như tên một bộ phim.",
    category: "Vui vẻ",
    tone: "coral"
  }
];

export const wheelPrompts = [
  "Người vừa uống nước gần nhất kể một sự thật bất ngờ.",
  "Cả bàn chọn món tiếp theo trong 10 giây.",
  "Người mặc màu sáng nhất được chỉ định một người hát 1 câu.",
  "Mỗi người nói một lời khen cho người bên trái.",
  "Người thua ở kéo búa bao tiếp theo phải chụp ảnh check-in bàn ăn.",
  "Cả nhóm cùng nâng ly và nói một câu khẩu hiệu của chuyến đi."
];

export const groupCardPrompts = [
  "Cả bàn cùng chọn một biệt danh cho chuyến đi Hải Phòng.",
  "Mỗi người kể tên một món muốn thử trước khi về.",
  "Chụp ảnh bàn ăn theo phong cách nghiêm túc trong 3 giây.",
  "Bình chọn người gọi món có tâm nhất hôm nay.",
  "Cả nhóm tạo một câu chúc ngắn cho ngày tiếp theo."
];

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
