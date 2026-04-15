import webpush from "web-push";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { pushSubscriptions } from "../drizzle/schema";
import { eq, inArray } from "drizzle-orm";
import type { PushSubscription as DbPushSubscription } from "../drizzle/schema";

// ─── Initialise VAPID once ────────────────────────────────────────────────────
let vapidInitialised = false;

function ensureVapid() {
  if (vapidInitialised) return;
  if (!ENV.vapidPublicKey || !ENV.vapidPrivateKey) {
    console.warn("[WebPush] VAPID keys not configured — push notifications disabled");
    return;
  }
  webpush.setVapidDetails(
    "mailto:noreply@headcheck.app",
    ENV.vapidPublicKey,
    ENV.vapidPrivateKey
  );
  vapidInitialised = true;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
}

// ─── Save a subscription ──────────────────────────────────────────────────────
export async function savePushSubscription(
  userId: number,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  userAgent?: string
) {
  const db = await getDb();
  if (!db) return;
  // Upsert: delete any existing subscription with the same endpoint, then insert
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, subscription.endpoint));

  await db.insert(pushSubscriptions).values({
    userId,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    userAgent: userAgent ?? null,
  });
}

// ─── Delete a subscription ────────────────────────────────────────────────────
export async function deletePushSubscription(endpoint: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}

// ─── Get subscriptions for a list of user IDs ─────────────────────────────────
export async function getPushSubscriptionsForUsers(userIds: number[]): Promise<DbPushSubscription[]> {
  if (userIds.length === 0) return [];
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(pushSubscriptions)
    .where(inArray(pushSubscriptions.userId, userIds));
}

// ─── Send a push notification to a list of user IDs ──────────────────────────
export async function sendPushToUsers(userIds: number[], payload: PushPayload) {
  ensureVapid();
  if (!vapidInitialised) return;

  const subs = await getPushSubscriptionsForUsers(userIds);
  if (subs.length === 0) return;

  const payloadStr = JSON.stringify(payload);

  const results = await Promise.allSettled(
    subs.map((sub: DbPushSubscription) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payloadStr
        )
        .catch(async (err: { statusCode?: number }) => {
          // 410 Gone = subscription expired → remove it
          if (err.statusCode === 410 || err.statusCode === 404) {
            await deletePushSubscription(sub.endpoint);
          }
          throw err;
        })
    )
  );

  const failed = results.filter((r: PromiseSettledResult<unknown>) => r.status === "rejected").length;
  if (failed > 0) {
    console.warn(`[WebPush] ${failed}/${subs.length} push(es) failed`);
  }
}
