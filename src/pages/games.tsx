import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleHelp, Gamepad2, Radio, Trophy, Users, Vote } from "lucide-react";
import { api } from "../lib/api-client";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import type { GameRoom } from "../types";

const roomTone: Record<GameRoom["type"], "teal" | "coral" | "sunflower"> = {
  quiz: "teal",
  poll: "coral",
  bingo: "sunflower"
};

const roomIcon: Record<GameRoom["type"], typeof CircleHelp> = {
  quiz: CircleHelp,
  poll: Vote,
  bingo: Gamepad2
};

function statusLabel(status: GameRoom["status"]) {
  return status === "active" ? "Đang mở" : status === "waiting" ? "Chờ vào" : "Đã xong";
}

export function GamesPage() {
  const queryClient = useQueryClient();
  const games = useQuery({ queryKey: ["games"], queryFn: api.games, refetchInterval: 15000 });
  const vote = useMutation({
    mutationFn: ({ pollId, optionId }: { pollId: string; optionId: string }) => api.votePoll(pollId, optionId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["games"] })
  });
  if (games.isLoading) return <Skeleton className="h-[70dvh]" />;
  if (games.isError || !games.data) return <p className="text-coral">Không tải được trò chơi.</p>;
  const totalVotes = games.data.poll.options.reduce((sum, item) => sum + item.votes, 0);

  return (
    <div className="space-y-6 pb-10">
      <section className="overflow-hidden rounded-[20px] border border-border/70 bg-white p-6 shadow-soft md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-5">
            <div className="grid size-16 shrink-0 place-items-center rounded-[18px] bg-teal text-white shadow-lift">
              <Gamepad2 size={30} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="sunflower">
                  <Radio size={14} /> Live room
                </Badge>
                <Badge tone="teal">Mã phòng HP2026</Badge>
              </div>
              <h1 className="mt-4 font-display text-4xl font-black leading-tight md:text-5xl">Phòng Trò Chơi</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-mist">
                Quiz, bầu chọn và bingo cho chuyến xe. Trạng thái được cập nhật tự động để cả nhóm cùng theo dõi.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 md:w-[320px]">
            <div className="rounded-[14px] bg-surface-low p-4 text-center">
              <p className="font-display text-3xl font-black">{games.data.rooms.length}</p>
              <p className="text-xs font-bold text-mist">Phòng</p>
            </div>
            <div className="rounded-[14px] bg-surface-low p-4 text-center">
              <p className="font-display text-3xl font-black">{totalVotes}</p>
              <p className="text-xs font-bold text-mist">Vote</p>
            </div>
            <div className="rounded-[14px] bg-surface-low p-4 text-center">
              <p className="font-display text-3xl font-black">15s</p>
              <p className="text-xs font-bold text-mist">Refetch</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          {games.data.rooms.map((room) => {
            const Icon = roomIcon[room.type];
            return (
              <Card key={room.id} className={room.status === "active" ? "border-teal/40" : ""}>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-surface-low text-teal">
                      <Icon size={22} />
                    </div>
                    <div className="min-w-0">
                      <Badge tone={roomTone[room.type]}>{statusLabel(room.status)}</Badge>
                      <h2 className="mt-3 font-display text-xl font-bold leading-tight">{room.title}</h2>
                      <p className="mt-2 flex items-center gap-1 text-sm text-mist">
                        <Users size={14} /> {room.participants.join(", ")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </aside>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.78fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge tone="teal">
                  <CircleHelp size={14} /> Câu 1 / 5
                </Badge>
                <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">20 giây</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h2 className="font-display text-3xl font-black leading-tight md:text-4xl">Món ăn đặc sản Hải Phòng là gì?</h2>
                <p className="mt-2 text-sm text-mist">Chọn nhanh, điểm cộng cho người trả lời đúng sớm nhất.</p>
              </div>
              <div className="grid gap-3">
                {["Bánh đa cua", "Bún bò Huế", "Cơm tấm", "Mì Quảng"].map((answer, index) => (
                  <button
                    key={answer}
                    className="flex min-h-14 w-full items-center justify-between rounded-[14px] border border-border/80 bg-white px-4 text-left font-bold transition hover:border-teal hover:bg-teal/5"
                  >
                    <span>{answer}</span>
                    {index === 0 && <CheckCircle2 className="text-teal" size={20} />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold">Bầu chọn</h2>
                <Badge tone="coral">
                  <Vote size={14} /> {totalVotes} vote
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-bold leading-6">{games.data.poll.question}</p>
              {games.data.poll.options.map((option) => {
                const percent = totalVotes ? Math.round((option.votes / totalVotes) * 100) : 0;
                return (
                  <button
                    key={option.id}
                    className="w-full rounded-[14px] border border-border/70 bg-white p-4 text-left transition hover:border-coral hover:bg-coral/5"
                    onClick={() => vote.mutate({ pollId: games.data.poll.id, optionId: option.id })}
                  >
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span>{option.label}</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface-low">
                      <span className="block h-full rounded-full bg-coral" style={{ width: `${percent}%` }} />
                    </div>
                  </button>
                );
              })}
              {vote.error && <p className="text-sm font-semibold text-coral">{vote.error.message}</p>}
            </CardContent>
          </Card>
        </div>
      </section>

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge tone="sunflower">
              <Trophy size={14} /> Bảng xếp hạng
            </Badge>
            <p className="mt-3 font-display text-2xl font-bold">Minh Anh đang dẫn đầu với 120 điểm</p>
          </div>
          <Button variant="secondary">Vào phòng HP2026</Button>
        </CardContent>
      </Card>
    </div>
  );
}
