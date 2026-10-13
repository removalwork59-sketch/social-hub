import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
export type Platform = Database["public"]["Enums"]["social_platform"];

export const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "twitter", label: "X (Twitter)" },
  { id: "google_business", label: "Google Business" },
];

export const platformLabel = (p: Platform) => PLATFORMS.find((x) => x.id === p)?.label ?? p;

type Ctx = {
  workspaces: Workspace[];
  current: Workspace | null;
  setCurrentId: (id: string) => void;
  loading: boolean;
  role: "owner" | "admin" | "member" | null;
  userId: string | null;
  refresh: () => void;
};

const WorkspaceContext = createContext<Ctx | null>(null);
const KEY = "socialos.workspace";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [currentId, setId] = useState<string | null>(null);
  const { data = [], isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const { data, error } = await supabase.from("workspaces").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    setId(localStorage.getItem(KEY));
  }, []);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null,
  });
  const { data: memberships = [] } = useQuery({
    queryKey: ["memberships", me],
    enabled: !!me,
    queryFn: async () => (await supabase.from("workspace_members").select("workspace_id, role").eq("user_id", me!)).data ?? [],
  });

  const current = data.find((w) => w.id === currentId) ?? data[0] ?? null;
  const setCurrentId = (id: string) => {
    localStorage.setItem(KEY, id);
    setId(id);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces: data,
        current,
        setCurrentId,
        loading: isLoading,
        role: memberships.find((m) => m.workspace_id === current?.id)?.role ?? null,
        userId: me ?? null,
        refresh: () => qc.invalidateQueries({ queryKey: ["workspaces"] }),
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace outside provider");
  return ctx;
}
