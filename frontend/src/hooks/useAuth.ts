"use client";

import { useState, useCallback } from "react";
import {
  getIdentityId,
  setIdentityId,
  clearIdentityId,
  migrateIdentity,
} from "@/lib/api";
import { useMutation } from "@tanstack/react-query";

export function useAuth() {
  const [tick, setTick] = useState(0);
  const bump = useCallback(() => setTick((v) => v + 1), []);

  const identityId = typeof window !== "undefined" ? getIdentityId() : null;
  const isGuest = identityId?.startsWith("guest_") ?? true;

  void tick;

  const login = useCallback(
    (userId: string) => {
      setIdentityId(userId);
      bump();
    },
    [bump],
  );

  const logout = useCallback(() => {
    clearIdentityId();
    bump();
  }, [bump]);

  const migrateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const guestId = getIdentityId();
      if (!guestId || !guestId.startsWith("guest_")) {
        throw new Error("No guest identity to migrate");
      }
      const result = await migrateIdentity(guestId, userId);
      setIdentityId(userId);
      bump();
      return result;
    },
  });

  return {
    identityId,
    isGuest,
    login,
    logout,
    migrate: migrateMutation.mutateAsync,
    isMigrating: migrateMutation.isPending,
  };
}
