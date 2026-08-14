"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Transacting gate: the UNVERIFIED profile has
 * Send / Convert / Deposit blocked until KYB is verified. `gated` stays false
 * while loading so the gate never flashes for the verified profile.
 */
export function useGating() {
  const kyb = useQuery({
    queryKey: ["kybStatus"],
    queryFn: () => api.getKybStatus(),
  });
  const level = kyb.data?.level;
  const verified = level === "verified";
  return {
    isLoading: kyb.isLoading,
    level,
    verified,
    gated: kyb.data ? !verified : false,
  };
}
