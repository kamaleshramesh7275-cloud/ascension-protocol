/**
 * Tactile Haptic Vibration System
 * Emulates physical gamepad/mobile rumble feedback during quest events,
 * level-ups, and System notifications.
 */

export function isHapticSupported(): boolean {
  return typeof window !== "undefined" && "vibrate" in navigator;
}

export function hapticLight(): void {
  if (isHapticSupported()) {
    try {
      navigator.vibrate(30);
    } catch {
      // safe fallback
    }
  }
}

export function hapticSuccess(): void {
  if (isHapticSupported()) {
    try {
      navigator.vibrate([40, 30, 60]);
    } catch {
      // safe fallback
    }
  }
}

export function hapticLevelUp(): void {
  if (isHapticSupported()) {
    try {
      navigator.vibrate([70, 40, 100, 50, 200]);
    } catch {
      // safe fallback
    }
  }
}

export function hapticWarning(): void {
  if (isHapticSupported()) {
    try {
      navigator.vibrate([100, 40, 100]);
    } catch {
      // safe fallback
    }
  }
}

export function hapticShield(): void {
  if (isHapticSupported()) {
    try {
      navigator.vibrate([30, 20, 30, 20, 40]);
    } catch {
      // safe fallback
    }
  }
}

