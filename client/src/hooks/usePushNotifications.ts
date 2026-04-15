import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// The VAPID public key is injected at build time via Vite
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

export interface UsePushNotificationsReturn {
  permission: PushPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<PushPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const subscribeMutation = (trpc as any).push.subscribe.useMutation({
    onSuccess: () => {
      setIsSubscribed(true);
      toast.success("Notifications push activées", {
        description: "Vous recevrez des alertes même quand l'onglet est fermé.",
      });
    },
    onError: (err: { message: string }) => {
      toast.error("Échec de l'activation push", { description: err.message });
    },
  });

  const unsubscribeMutation = (trpc as any).push.unsubscribe.useMutation({
    onSuccess: () => {
      setIsSubscribed(false);
      toast.success("Notifications push désactivées");
    },
    onError: (err: { message: string }) => {
      toast.error("Échec de la désactivation push", { description: err.message });
    },
  });

  // Register Service Worker and check current subscription state
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported");
      return;
    }

    setPermission(Notification.permission as PushPermission);

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        setSwRegistration(reg);
        return reg.pushManager.getSubscription();
      })
      .then((sub) => {
        setIsSubscribed(!!sub);
      })
      .catch((err) => {
        console.warn("[Push] SW registration failed:", err);
      });
  }, []);

  const subscribe = useCallback(async () => {
    if (!swRegistration || !VAPID_PUBLIC_KEY) return;
    setIsLoading(true);
    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);
      if (perm !== "granted") {
        toast.error("Permission refusée", {
          description: "Autorisez les notifications dans les paramètres de votre navigateur.",
        });
        return;
      }

      // Subscribe via PushManager
      const sub = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      await subscribeMutation.mutateAsync({
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
        userAgent: navigator.userAgent,
      });
    } catch (err) {
      console.error("[Push] Subscribe error:", err);
      toast.error("Erreur lors de l'abonnement push");
    } finally {
      setIsLoading(false);
    }
  }, [swRegistration, subscribeMutation]);

  const unsubscribe = useCallback(async () => {
    if (!swRegistration) return;
    setIsLoading(true);
    try {
      const sub = await swRegistration.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await unsubscribeMutation.mutateAsync({ endpoint: sub.endpoint });
      }
    } catch (err) {
      console.error("[Push] Unsubscribe error:", err);
      toast.error("Erreur lors de la désactivation push");
    } finally {
      setIsLoading(false);
    }
  }, [swRegistration, unsubscribeMutation]);

  return { permission, isSubscribed, isLoading, subscribe, unsubscribe };
}
