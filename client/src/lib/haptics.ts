import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

/**
 * Trigger tactile impact feedback on native device (iOS/Android)
 */
export async function hapticTap(style: ImpactStyle = ImpactStyle.Light) {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.impact({ style });
    } catch {
      // Haptics optional or unsupported on some devices
    }
  }
}

/**
 * Trigger success/warning/error vibration pattern
 */
export async function hapticNotification(type: NotificationType = NotificationType.Success) {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.notification({ type });
    } catch {
      // Haptics optional
    }
  }
}

/**
 * Trigger timed vibration pulse (e.g. for Level-Up or Rank Awakening)
 */
export async function hapticVibrate(duration: number = 200) {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.vibrate({ duration });
    } catch {
      // Vibration fallback
    }
  } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(duration);
  }
}

/**
 * Game specific haptic triggers
 */
export const hapticSuccess = () => hapticNotification(NotificationType.Success);
export const hapticShield = () => hapticTap(ImpactStyle.Medium);
export const hapticLevelUp = async () => {
  await hapticNotification(NotificationType.Success);
  await hapticVibrate(300);
};

