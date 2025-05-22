// client/src/api.ts
import { useQuery } from "@tanstack/react-query";
import { MINUTE } from "../config/constants";

const api = {
  useContests: () =>
    useQuery({
      queryKey: ["contests"],
      queryFn: async () => {
        const res = await fetch("/api/contests");
        if (!res.ok) throw new Error("Failed to fetch contests");
        const data = await res.json();
        return data;
      },
      staleTime: 10 * MINUTE,
    }),

  useMatches: () =>
    useQuery({
      queryKey: ["matches"],
      queryFn: async () => {
        const res = await fetch("/api/matches");
        if (!res.ok) throw new Error("Failed to fetch matches");
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      },
      staleTime: 10 * MINUTE,
    }),

  useMatchData: () =>
    useQuery({
      queryKey: ["matchData"],
      queryFn: async () => {
        const res = await fetch("/api/match-data");
        if (!res.ok) throw new Error("Failed to fetch match data");
        const data = await res.json();
        return data;
      },
      staleTime: 10 * MINUTE,
    }),
};

export default api;