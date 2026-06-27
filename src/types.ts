export type AppUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  tripId: string;
  passwordHash?: string;
};

export type Trip = {
  id: string;
  name: string;
  subtitle: string;
  startDate: string;
  endDate: string;
  route: string;
  coverUrl: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

export type GuideItem = {
  id: string;
  type: "place" | "food" | "stay" | "note";
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
};

export type ItineraryItem = {
  id: string;
  day: number;
  time: string;
  title: string;
  category: "move" | "visit" | "food" | "stay" | "game";
  location?: string;
  note?: string;
  addedBy?: string;
  addedByName?: string;
};

export type Seat = {
  id: string;
  code: string;
  row: number;
  col: number;
  occupantId: string | null;
  occupantName: string | null;
};

export type Photo = {
  id: string;
  publicId: string;
  secureUrl: string;
  caption: string;
  tripDay: number;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
};

export type GameRoom = {
  id: string;
  type: "quiz" | "poll" | "bingo";
  title: string;
  status: "waiting" | "active" | "complete";
  participants: string[];
};

export type Poll = {
  id: string;
  question: string;
  options: Array<{ id: string; label: string; votes: number }>;
};

export type Expense = {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  paidByName: string;
  createdAt: string;
};

export type ExpenseMember = {
  id: string;
  displayName: string;
};

export type ExpensesData = {
  members: ExpenseMember[];
  expenses: Expense[];
};

export type DashboardData = {
  trip: Trip;
  user: AppUser;
  countdownDays: number;
  todayItems: ItineraryItem[];
  mySeat: Seat | null;
  announcements: Announcement[];
  recentPhotos: Photo[];
  activeGames: GameRoom[];
};
