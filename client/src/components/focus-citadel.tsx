import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CitadelGrid } from "./citadel-grid";

interface Building {
  id: string;
  userId: string;
  type: string;
  buildingName: string;
  x: number;
  y: number;
  status: "building" | "completed" | "ruined";
  wager: number;
}

interface FocusCitadelProps {
  className?: string;
  theme?: any;
  userId?: string;
  readonly?: boolean;
}

export function FocusCitadel({ className = "", theme, userId, readonly = false }: FocusCitadelProps) {
  const { toast } = useToast();
  const queryUrl = userId ? `/api/citadel/public/${userId}` : "/api/citadel";

  const { data: buildings = [] } = useQuery<Building[]>({ queryKey: [queryUrl] });

  const clearRuinMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/citadel/${id}/clear`, { method: "POST" });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/citadel"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Ruins cleared! ✨" });
    },
    onError: (e: any) => toast({ title: "Cannot clear", description: e.message, variant: "destructive" }),
  });

  return (
    <div className={`relative ${className}`}>
      <CitadelGrid
        buildings={buildings}
        gridSize={5}
        onClearRuin={(id) => clearRuinMutation.mutate(id)}
        readonly={readonly}
      />
      <div className="absolute bottom-[-48px] left-0 right-0 text-center pointer-events-none">
        <p className="text-white/30 text-[11px] uppercase tracking-[0.3em] font-semibold">
          {userId ? "Inner Citadel" : "Your Inner Citadel"}
        </p>
      </div>
    </div>
  );
}
