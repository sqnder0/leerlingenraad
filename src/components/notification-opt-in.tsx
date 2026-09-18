"use client";

import { useEffect, useState } from "react";
import { subscribeToPush, unsubscribeFromPush } from "@/actions/push";

type Support = "checking" | "unsupported" | "needs-install" | "ready";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// Web Push wants the VAPID key as a raw Uint8Array, browsers hand it to us
// base64url-encoded — this is the standard conversion for that.
function urlBase64ToUint8Array(base64Url: string) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function NotificationOptIn() {
  const [support, setSupport] = useState<Support>("checking");
  const [subscribed, setSubscribed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function detect(): Promise<Support> {
      if (!VAPID_PUBLIC_KEY || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        return "unsupported";
      }
      if (isIos() && !isStandalone()) {
        return "needs-install";
      }
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const existing = await registration.pushManager.getSubscription();
        if (!cancelled) setSubscribed(existing !== null);
        return "ready";
      } catch {
        return "unsupported";
      }
    }

    detect().then((result) => {
      if (!cancelled) setSupport(result);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setPending(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Toestemming voor meldingen werd niet gegeven.");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
      });
      await subscribeToPush(subscription.toJSON());
      setSubscribed(true);
    } catch {
      setError("Inschakelen van meldingen is mislukt.");
    } finally {
      setPending(false);
    }
  }

  async function disable() {
    setPending(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await unsubscribeFromPush(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setSubscribed(false);
    } catch {
      setError("Uitschakelen van meldingen is mislukt.");
    } finally {
      setPending(false);
    }
  }

  if (support === "checking" || support === "unsupported") return null;

  if (support === "needs-install") {
    return (
      <p className="rounded border border-brand-600/25 bg-brand-50 px-3 py-2 text-sm text-brand-900 dark:border-brand-400/25 dark:bg-brand-950 dark:text-brand-50">
        Voeg deze app toe aan je beginscherm (deelknop → &quot;Voeg toe aan beginscherm&quot;) om
        herinneringen 24u op voorhand te kunnen ontvangen.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={subscribed ? disable : enable}
        disabled={pending}
        className="rounded border border-brand-600/25 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-brand-400/25"
      >
        {subscribed ? "Herinneringen uitschakelen" : "Herinneringen inschakelen (24u op voorhand)"}
      </button>
      {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
