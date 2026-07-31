"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";

const actions = [
  ["PRESENT", "Presente"],
  ["ABSENT", "Nao veio"],
  ["JUSTIFIED_ABSENCE", "Justificada"],
] as const;

type AttendanceStatus = (typeof actions)[number][0];

export function AttendanceButtons({
  bookingId,
  compact = false,
}: {
  bookingId: string;
  compact?: boolean;
}) {
  const queryClient = useQueryClient();
  const [pendingStatus, setPendingStatus] = useState<AttendanceStatus | null>(
    null,
  );
  const [justification, setJustification] = useState("");
  const mutation = useMutation({
    mutationFn: async (status: AttendanceStatus) => {
      const result = await apiRequest("/attendance/mark", {
        method: "POST",
        body: JSON.stringify({
          classBookingId: bookingId,
          status,
          justification:
            status === "JUSTIFIED_ABSENCE"
              ? justification || undefined
              : undefined,
        }),
      });
      if (!result.ok) throw new Error(result.error.message);
    },
    onSuccess: () => {
      setPendingStatus(null);
      setJustification("");
      void queryClient.invalidateQueries({ queryKey: ["class-sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });

  const visibleActions = compact ? actions.slice(0, 2) : actions;
  const pendingLabel =
    actions.find(([status]) => status === pendingStatus)?.[1] ?? "";

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        {visibleActions.map(([status, label]) => (
          <Button
            key={status}
            className="min-h-9 bg-white px-3 text-xs text-foreground ring-1 ring-border hover:bg-background"
            disabled={mutation.isPending}
            onClick={() => setPendingStatus(status)}
          >
            {label}
          </Button>
        ))}
      </div>
      {pendingStatus ? (
        <div className="rounded-md border border-border bg-background p-3">
          <p className="text-sm font-semibold">Confirmar: {pendingLabel}</p>
          {pendingStatus === "JUSTIFIED_ABSENCE" ? (
            <textarea
              className="mt-2 min-h-20 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              onChange={(event) => setJustification(event.target.value)}
              placeholder="Justificativa"
              value={justification}
            />
          ) : null}
          {mutation.isError ? (
            <p className="mt-2 text-sm text-danger">{mutation.error.message}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(pendingStatus)}
            >
              {mutation.isPending ? "Salvando..." : "Confirmar"}
            </Button>
            <Button
              className="bg-white text-foreground ring-1 ring-border hover:bg-background"
              disabled={mutation.isPending}
              onClick={() => setPendingStatus(null)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
