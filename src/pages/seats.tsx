import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Shuffle } from "lucide-react";
import { api } from "../lib/api-client";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { SeatGrid } from "../features/seats/seat-grid";
import { useUiStore } from "../store/ui-store";

export function SeatsPage() {
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: api.me });
  const seats = useQuery({ queryKey: ["seats"], queryFn: api.seats });
  const selectedSeat = useUiStore((state) => state.selectedSeat);
  const setSelectedSeat = useUiStore((state) => state.setSelectedSeat);
  const selectSeat = useMutation({
    mutationFn: api.selectSeat,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["seats"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
  const randomSeat = useMutation({
    mutationFn: api.randomSeat,
    onSuccess: (seat) => {
      setSelectedSeat(seat.code);
      void queryClient.invalidateQueries({ queryKey: ["seats"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  if (seats.isLoading || me.isLoading) return <Skeleton className="h-[70dvh]" />;
  if (seats.isError || me.isError || !seats.data || !me.data) return <p className="text-coral">Không tải được sơ đồ ghế.</p>;

  const mySeat = seats.data.find((seat) => seat.occupantId === me.data.user.id);
  const displaySeat = selectedSeat ?? mySeat?.code;
  const neighbor = displaySeat
    ? seats.data.find((seat) => {
        const current = seats.data.find((item) => item.code === displaySeat);
        return current && seat.row === current.row && seat.occupantName && seat.code !== displaySeat;
      })
    : null;

  return (
    <div className="pb-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink">Chọn chỗ ngồi</h1>
        <p className="mt-2 text-mist">Sắp xếp chỗ ngồi cho chuyến xe Hà Nội - Hải Phòng</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="space-y-6 lg:col-span-4">
          <Card>
            <CardContent>
              <h2 className="font-display text-xl font-bold">Chú thích</h2>
              <div className="mt-5 space-y-4">
                <LegendItem label="Trống" className="border-border bg-white" />
                <LegendItem label="Đã có người" className="border-border bg-surface-container" />
                <LegendItem label="Ghế của tôi" labelClassName="font-bold text-teal" className="border-teal-container bg-teal-container" />
                <LegendItem label="Đang chọn" className="border-yellow-400 bg-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-2 bg-teal-container" />
            <CardContent className="pl-9">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-mist">Kết quả chọn</p>
              <p className="mt-3 font-display text-xl font-bold leading-7 text-ink">
                {displaySeat ? (
                  <>
                    Bạn {selectedSeat ? "đang chọn" : "ngồi"} ghế <span className="text-teal-container">{displaySeat}</span>
                    {neighbor?.occupantName ? (
                      <>
                        {" "}
                        cạnh <span className="text-teal">{neighbor.occupantName}</span>
                      </>
                    ) : null}
                  </>
                ) : (
                  "Bạn chưa chọn ghế"
                )}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button variant="secondary" className="w-full border-teal-container text-teal-container" disabled={randomSeat.isPending} onClick={() => randomSeat.mutate()}>
              <Shuffle size={18} />
              Random chỗ ngồi
            </Button>
            <Button className="w-full" disabled={!selectedSeat || selectSeat.isPending} onClick={() => selectedSeat && selectSeat.mutate(selectedSeat)}>
              <Check size={18} />
              Xác nhận
            </Button>
            {(selectSeat.error || randomSeat.error) && <p className="text-sm font-semibold text-coral">{(selectSeat.error ?? randomSeat.error)?.message}</p>}
          </div>
        </aside>

        <section className="flex justify-center lg:col-span-8">
          <SeatGrid
            seats={seats.data}
            currentUserId={me.data.user.id}
            selectedSeat={selectedSeat}
            onSelect={(code) => setSelectedSeat(code)}
          />
        </section>
      </div>
    </div>
  );
}

type LegendItemProps = {
  label: string;
  className: string;
  labelClassName?: string;
};

function LegendItem({ label, className, labelClassName }: LegendItemProps) {
  return (
    <div className="flex items-center gap-3">
      <span className={`size-8 rounded border ${className}`} />
      <span className={`text-base text-ink ${labelClassName ?? ""}`}>{label}</span>
    </div>
  );
}
