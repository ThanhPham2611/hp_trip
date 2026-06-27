import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleDollarSign, ReceiptText, Scale, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../lib/api-client";
import { expenseInputSchema, type ExpenseInput } from "../lib/schemas";
import type { Expense, ExpenseMember } from "../types";

type Transfer = {
  from: string;
  to: string;
  amount: number;
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);
}

function splitExpenses(members: ExpenseMember[], expenses: Expense[]) {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const share = members.length > 0 ? total / members.length : 0;
  const paidByMember = new Map(members.map((member) => [member.id, 0]));

  expenses.forEach((expense) => {
    paidByMember.set(expense.paidBy, (paidByMember.get(expense.paidBy) ?? 0) + expense.amount);
  });

  const balances = members.map((member) => ({
    ...member,
    paid: paidByMember.get(member.id) ?? 0,
    balance: (paidByMember.get(member.id) ?? 0) - share
  }));
  const debtors = balances.filter((item) => item.balance < -1).map((item) => ({ ...item, owes: Math.abs(item.balance) }));
  const creditors = balances.filter((item) => item.balance > 1).map((item) => ({ ...item, receives: item.balance }));
  const transfers: Transfer[] = [];

  debtors.forEach((debtor) => {
    creditors.forEach((creditor) => {
      if (debtor.owes <= 1 || creditor.receives <= 1) return;
      const amount = Math.min(debtor.owes, creditor.receives);
      transfers.push({ from: debtor.displayName, to: creditor.displayName, amount });
      debtor.owes -= amount;
      creditor.receives -= amount;
    });
  });

  return { total, share, balances, transfers };
}

export function ExpensesPage() {
  const queryClient = useQueryClient();
  const expenses = useQuery({ queryKey: ["expenses"], queryFn: api.expenses });
  const form = useForm<ExpenseInput>({
    resolver: zodResolver(expenseInputSchema),
    defaultValues: { title: "", amount: 0, paidBy: "" }
  });
  const addExpense = useMutation({
    mutationFn: api.addExpense,
    onSuccess: () => {
      form.reset({ title: "", amount: 0, paidBy: form.getValues("paidBy") });
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
    }
  });

  if (expenses.isLoading) return <Skeleton className="h-[70dvh]" />;
  if (expenses.isError || !expenses.data) return <p className="text-coral">Không tải được chia tiền nhóm.</p>;

  const members = expenses.data.members;
  const data = splitExpenses(members, expenses.data.expenses);

  return (
    <div className="pb-10">
      <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-3xl font-black leading-tight text-ink md:text-4xl">Chia tiền nhóm</h1>
          <p className="mt-2 max-w-2xl text-base leading-7 text-mist">Ghi lại ai đã trả, app tự chia đều và gợi ý cần chuyển cho ai.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-5">
          <form
            className="rounded-[18px] border border-border/50 bg-white p-5 shadow-soft"
            onSubmit={form.handleSubmit((values) => addExpense.mutate(values))}
          >
            <div className="mb-5 flex items-center gap-2">
              <ReceiptText className="text-coral" size={22} />
              <h2 className="font-display text-xl font-bold text-ink">Thêm khoản chi</h2>
            </div>

            <div className="space-y-4">
              <label className="block space-y-1">
                <span className="text-sm font-semibold text-ink">Khoản chi</span>
                <Input placeholder="Taxi ra biển" {...form.register("title")} />
                {form.formState.errors.title ? <span className="text-xs font-semibold text-coral">{form.formState.errors.title.message}</span> : null}
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-semibold text-ink">Số tiền</span>
                <Input type="number" min={0} step={10000} {...form.register("amount")} />
                {form.formState.errors.amount ? <span className="text-xs font-semibold text-coral">{form.formState.errors.amount.message}</span> : null}
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-semibold text-ink">Người trả</span>
                <select
                  className="min-h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm text-ink outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/15"
                  {...form.register("paidBy")}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Chọn thành viên
                  </option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.displayName}
                    </option>
                  ))}
                </select>
                {form.formState.errors.paidBy ? <span className="text-xs font-semibold text-coral">{form.formState.errors.paidBy.message}</span> : null}
              </label>
            </div>

            {addExpense.error ? <p className="mt-3 text-sm font-semibold text-coral">{addExpense.error.message}</p> : null}
            <Button className="mt-5 w-full" type="submit" disabled={addExpense.isPending}>
              <CircleDollarSign size={18} />
              Thêm khoản chi
            </Button>
          </form>
        </section>

        <section className="space-y-6 lg:col-span-7">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-[14px] border border-border/50 bg-white p-4 shadow-soft">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-mist">Tổng chi</p>
              <p className="mt-2 font-display text-2xl font-black text-ink">{formatMoney(data.total)}</p>
            </div>
            <div className="rounded-[14px] border border-border/50 bg-white p-4 shadow-soft">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-mist">Mỗi người</p>
              <p className="mt-2 font-display text-2xl font-black text-teal">{formatMoney(data.share)}</p>
            </div>
            <div className="rounded-[14px] border border-border/50 bg-white p-4 shadow-soft">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-mist">Thành viên</p>
              <p className="mt-2 font-display text-2xl font-black text-coral">{members.length}</p>
            </div>
          </div>

          <div className="rounded-[18px] border border-border/50 bg-white p-5 shadow-soft">
            <div className="mb-4 flex items-center gap-2">
              <Scale className="text-teal" size={22} />
              <h2 className="font-display text-xl font-bold text-ink">Cần chuyển</h2>
            </div>
            <div className="space-y-3">
              {data.transfers.length > 0 ? (
                data.transfers.map((transfer) => (
                  <div key={`${transfer.from}-${transfer.to}`} className="flex items-center justify-between gap-4 rounded-[12px] bg-surface-low p-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-full bg-teal-container text-teal-fixed">
                        <Send size={16} />
                      </span>
                      <p className="text-sm font-semibold text-ink">
                        {transfer.from} chuyển cho {transfer.to}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-black text-coral">{formatMoney(transfer.amount)}</span>
                  </div>
                ))
              ) : (
                <p className="rounded-[12px] bg-surface-low p-3 text-sm font-semibold text-mist">Nhóm đang cân bằng, chưa cần chuyển thêm.</p>
              )}
            </div>
          </div>

          <div className="rounded-[18px] border border-border/50 bg-white p-5 shadow-soft">
            <h2 className="mb-4 font-display text-xl font-bold text-ink">Khoản đã ghi</h2>
            <div className="space-y-3">
              {expenses.data.expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between gap-4 rounded-[12px] border border-border/40 p-3">
                  <div>
                    <p className="font-semibold text-ink">{expense.title}</p>
                    <p className="mt-1 text-xs font-semibold text-mist">Người trả: {expense.paidByName}</p>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-black text-teal">{formatMoney(expense.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
