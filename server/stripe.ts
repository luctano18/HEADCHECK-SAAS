/**
 * Stripe Integration for HeadCheck AI
 * Handles subscriptions, payments, and webhooks
 */
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

export interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId: string;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: [
      'Up to 30 check-ins per month',
      'Basic AI responses',
      'Self Trust Compass (limited)',
      'Personal dashboard',
    ],
    stripePriceId: '',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9,
    interval: 'month',
    features: [
      'Unlimited check-ins',
      'Advanced AI responses (Coach mode)',
      'Full Self Trust Compass',
      'Weekly insights & reports',
      'Priority support',
    ],
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || '',
  },
  {
    id: 'institution',
    name: 'Institution',
    price: 49,
    interval: 'month',
    features: [
      'Everything in Pro',
      'Facilitator dashboard',
      'Group management & invites',
      'Risk alerts & analytics',
      'Monthly PDF reports',
      'Up to 200 students',
      'Priority support',
    ],
    stripePriceId: process.env.STRIPE_INSTITUTION_PRICE_ID || '',
  },
];

export async function createCheckoutSession(userId: number, priceId: string, successUrl: string, cancelUrl: string) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId: userId.toString() },
  });
  return session;
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session;
}

export async function handleWebhookEvent(event: any) {
  const { getDb } = await import('./db');
  const { users } = await import('../drizzle/schema');
  const { eq } = await import('drizzle-orm');
  const db = await getDb();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = parseInt(session.metadata?.userId || '0');
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (userId && db) {
        await db.update(users).set({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          subscriptionStatus: 'pro', // Default to pro for now
        }).where(eq(users.id, userId));
        console.log(`[Stripe] User ${userId} subscribed successfully`);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;
      const status = subscription.status === 'active' ? 'pro' : 'cancelled';

      if (db) {
        await db.update(users).set({
          subscriptionStatus: status,
          subscriptionEndsAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
        }).where(eq(users.stripeCustomerId, customerId));
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;

      if (db) {
        await db.update(users).set({
          subscriptionStatus: 'cancelled',
          stripeSubscriptionId: null,
        }).where(eq(users.stripeCustomerId, customerId));
        console.log(`[Stripe] Subscription cancelled for customer ${customerId}`);
      }
      break;
    }

    default:
      console.log(`[Stripe] Unhandled event type: ${event.type}`);
  }
}

export default stripe;