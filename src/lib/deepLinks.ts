import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

let listenerRegistered = false;

let onDeepLink: ((path: string) => void) | null = null;
export function setOnDeepLink(fn: ((path: string) => void) | null) {
  onDeepLink = fn;
}

// Called once at app start (native platforms only). When an App Link
// (Android) or Universal Link (iOS) opens the app — e.g. a shared tournament
// URL — Capacitor's native side already intercepts it (AppDelegate.swift
// forwards to ApplicationDelegateProxy); this turns that raw URL into an
// in-app route change instead of just opening to the default screen.
export function initDeepLinks() {
  if (!Capacitor.isNativePlatform() || listenerRegistered) return;
  listenerRegistered = true;

  App.addListener('appUrlOpen', ({ url }) => {
    try {
      const { pathname, search, hash } = new URL(url);
      if (onDeepLink) onDeepLink(pathname + search + hash);
    } catch (error) {
      console.error('Failed to parse deep link URL:', error);
    }
  });
}
