import { Armchair, Car } from "lucide-react";
import type { Seat } from "../../types";
import { mapSeatStatus } from "../../lib/trip-utils";
import { cn } from "../../lib/utils";

type SeatGridProps = {
  seats: Seat[];
  currentUserId: string;
  selectedSeat?: string | null;
  onSelect: (code: string) => void;
};

export function SeatGrid({ seats, currentUserId, selectedSeat, onSelect }: SeatGridProps) {
  const rows = Array.from(new Set(seats.map((seat) => seat.row))).sort((a, b) => a - b);

  return (
    <div className="mx-auto w-full max-w-[400px] rounded-[24px] border border-border/70 bg-white p-6 shadow-soft">
      <div className="relative mb-8 flex h-16 items-end justify-center border-b-2 border-border/30 pb-2">
        <span className="absolute top-0 text-xs font-bold uppercase tracking-[0.14em] text-mist">Tài xế</span>
        <div className="grid size-12 place-items-center rounded-full bg-surface-container text-mist">
          <Car size={24} />
        </div>
      </div>

      <div className="grid justify-center gap-x-2 gap-y-4 [grid-template-columns:48px_48px_32px_48px_48px]">
        {rows.map((row) => {
          const rowSeats = seats.filter((seat) => seat.row === row).sort((a, b) => a.col - b.col);
          return rowSeats.map((seat, index) => {
            const status = mapSeatStatus(seat, currentUserId, seat.code, selectedSeat);
            const label =
              status === "occupied"
                ? `${seat.code} đã có ${seat.occupantName}`
                : status === "mine"
                  ? `${seat.code} ghế của tôi`
                  : status === "selected"
                    ? `${seat.code} đang chọn`
                    : `${seat.code} còn trống`;

            return (
              <SeatButton
                key={seat.id}
                seat={seat}
                status={status}
                label={label}
                onSelect={onSelect}
                className={index === 2 ? "col-start-4" : undefined}
              />
            );
          });
        })}
      </div>
    </div>
  );
}

type SeatButtonProps = {
  seat: Seat;
  status: ReturnType<typeof mapSeatStatus>;
  label: string;
  onSelect: (code: string) => void;
  className?: string;
};

function SeatButton({ seat, status, label, onSelect, className }: SeatButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn(
        "group relative flex h-14 w-12 items-center justify-center overflow-hidden rounded border text-xs font-bold transition active:scale-95",
        status === "available" && "border-border bg-white text-ink hover:border-teal hover:text-teal",
        status === "occupied" && "cursor-not-allowed border-border bg-surface-container text-mist",
        status === "mine" && "border-teal-container bg-teal-container text-teal-fixed shadow-[0_4px_12px_rgba(15,118,110,0.3)]",
        status === "selected" && "border-yellow-400 bg-yellow-200 text-ink",
        className
      )}
      disabled={status === "occupied"}
      onClick={() => onSelect(seat.code)}
      title={seat.occupantName ?? seat.code}
    >
      {status === "occupied" && seat.occupantName ? (
        <span className="absolute inset-0 flex items-center justify-center bg-black/5 px-1 text-[10px] opacity-0 transition-opacity group-hover:opacity-100">
          {seat.occupantName.split(" ")[0]}
        </span>
      ) : null}
      <span className="flex flex-col items-center gap-0.5">
        <Armchair size={14} />
        {seat.code}
      </span>
    </button>
  );
}
