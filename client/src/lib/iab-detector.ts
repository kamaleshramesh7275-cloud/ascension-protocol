/**
 * In-App Browser (IAB) Detection & Breakout Utility
 * Identifies embedded webviews (Instagram, TikTok, Discord, LinkedIn, etc.)
 * where Google OAuth fails with 403 disallowed_useragent.
 */

export interface IABDetectionResult {
  isInApp: boolean;
  appName?: string;
  isAndroid: boolean;
  isIOS: boolean;
  intentUrl?: string;
}

export function detectInAppBrowser(): IABDetectionResult {
  if (typeof window === "undefined" || !navigator) {
    return { isInApp: false, isAndroid: false, isIOS: false };
  }

  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.userAgent.includes("Mac") && "ontouchend" in document);

  let appName: string | undefined;

  if (/Instagram/i.test(ua)) {
    appName = "Instagram";
  } else if (/FBAN|FBAV/i.test(ua)) {
    appName = "Facebook";
  } else if (/musical_ly|bytedance|tiktok/i.test(ua)) {
    appName = "TikTok";
  } else if (/LinkedInApp/i.test(ua)) {
    appName = "LinkedIn";
  } else if (/Twitter|TwitterAndroid/i.test(ua)) {
    appName = "X (Twitter)";
  } else if (/Discord/i.test(ua)) {
    appName = "Discord";
  } else if (/Line\//i.test(ua)) {
    appName = "Line";
  } else if (/MicroMessenger/i.test(ua)) {
    appName = "WeChat";
  } else if (/Snapchat/i.test(ua)) {
    appName = "Snapchat";
  } else if (/WebView/i.test(ua) || (isAndroid && /wv/i.test(ua))) {
    appName = "In-App Browser";
  }

  const isInApp = Boolean(appName);

  // Generate Chrome Intent URL for Android devices
  let intentUrl: string | undefined;
  if (isInApp && isAndroid) {
    const currentUrl = window.location.href.replace(/https?:\/\//, "");
    intentUrl = `intent://${currentUrl}#Intent;scheme=https;package=com.android.chrome;end`;
  }

  return {
    isInApp,
    appName,
    isAndroid,
    isIOS,
    intentUrl,
  };
}

/**
 * Attempts to breakout of the in-app browser on Android
 */
export function breakoutToNativeBrowser(): boolean {
  const { isInApp, isAndroid, intentUrl } = detectInAppBrowser();
  if (isInApp && isAndroid && intentUrl) {
    window.location.href = intentUrl;
    return true;
  }
  return false;
}

