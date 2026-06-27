import type { VercelRequest, VercelResponse } from "@vercel/node";
import { methodNotAllowed, requireSession } from "./_lib/http";
import { addExpense, getExpenses } from "./_lib/repository";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireSession(req, res)) return;

  if (req.method === "GET") return res.status(200).json(await getExpenses());
  if (req.method !== "POST") return methodNotAllowed(res);

  const expense = await addExpense({
    title: String(req.body?.title ?? ""),
    amount: Number(req.body?.amount ?? 0),
    paidBy: String(req.body?.paidBy ?? "")
  });
  return res.status(201).json(expense);
}
