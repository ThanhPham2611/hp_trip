import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet } from "react-router-dom";
import { api } from "../../lib/api-client";
import { Skeleton } from "../ui/skeleton";

export function ProtectedRoute() {
  const me = useQuery({ queryKey: ["me"], queryFn: api.me, retry: false });

  if (me.isLoading) return <Skeleton className="m-6 h-[70dvh]" />;
  if (me.isError) return <Navigate to="/login" replace />;
  return <Outlet />;
}
