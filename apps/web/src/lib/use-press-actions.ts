"use client";

import { useCallback, useEffect, useRef } from "react";

export type PressActionHandlers = {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
};

export function usePressActions({
  onPress,
  onLongPress,
  longPressMs = 400,
  disabled = false,
}: {
  onPress: () => void;
  onLongPress: () => void;
  longPressMs?: number;
  disabled?: boolean;
}): PressActionHandlers {
  const timerRef = useRef<number | null>(null);
  const consumedRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clear, [clear]);

  return {
    onPointerDown: (e) => {
      if (disabled) return;
      if (e.button === 2) return;
      consumedRef.current = false;
      clear();
      timerRef.current = window.setTimeout(() => {
        consumedRef.current = true;
        timerRef.current = null;
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          try {
            navigator.vibrate?.(30);
          } catch {}
        }
        onLongPress();
      }, longPressMs);
    },
    onPointerUp: (e) => {
      if (disabled) return;
      if (e.button === 2) return;
      const wasLongPress = consumedRef.current;
      consumedRef.current = false;
      clear();
      if (!wasLongPress) onPress();
    },
    onPointerLeave: () => {
      clear();
      consumedRef.current = false;
    },
    onPointerCancel: () => {
      clear();
      consumedRef.current = false;
    },
    onContextMenu: (e) => {
      e.preventDefault();
      if (disabled) return;
      clear();
      consumedRef.current = true;
      onLongPress();
    },
  };
}
