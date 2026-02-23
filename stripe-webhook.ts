/**
 * Stripe Webhook Handler
 * Registrado em /api/stripe/webhook com express.raw() antes do express.json()
 * Processa: checkout.session.completed, invoice.paid, invoice.payment_failed,
 *           customer.subscription.deleted, customer.subscription.updated
 *
 * Stripe v20 não tem current_period_end na Subscription.
 * Usamos invoice.period_end para obter o fim do período de cobrança.
 */
import type { Express, Request, Response } from "express";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { subscriptions } from "../drizzle/schema";
import { PLAN_DEFINITIONS } from "./stripe-products";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

/** Calcula a data de fim do período com base no billing_cycle_anchor e intervalo */
function calcPeriodEnd(sub: Stripe.Subscription): Date {
  // Stripe v20: usar cancel_at se disponível, senão calcular 30 ou 365 dias
  if (sub.cancel_at) return new Date(sub.cancel_at * 1000);

  const anchor = sub.billing_cycle_anchor * 1000;
  const now = Date.now();
  const interval = sub.items.data[0]?.plan?.interval ?? "month";
  const intervalCount = sub.items.data[0]?.plan?.interval_count ?? 1;

  // Avançar o anchor até o próximo período futuro
  let periodEnd = anchor;
  const step = interval === "year"
    ? intervalCount * 365 * 24 * 3600 * 1000
    : intervalCount * 30 * 24 * 3600 * 1000;

  while (periodEnd <= now) {
    periodEnd += step;
  }

  return new Date(periodEnd);
}

/** Ativa ou renova a assinatura no banco */
async function activateSubscription(
  userId: number,
  planId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  stripePriceId: string,
  periodEnd: Date
) {
  const db = await getDb();
  if (!db) return;

  const plan = PLAN_DEFINITIONS[planId];
  if (!plan) {
    console.error(`[Webhook] Plano desconhecido: ${planId}`);
    return;
  }

  await db
    .insert(subscriptions)
    .values({
      userId,
      plan: planId as "starter" | "basic" | "professional" | "team_small" | "team_medium" | "enterprise",
      status: "active",
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
      studentsUsed: 0,
      reportsUsedThisMonth: 0,
      llmUsedThisMonth: 0,
    })
    .onDuplicateKeyUpdate({
      set: {
        plan: planId as "starter" | "basic" | "professional" | "team_small" | "team_medium" | "enterprise",
        status: "active",
        stripeCustomerId,
        stripeSubscriptionId,
        stripePriceId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        cancelledAt: null,
      },
    });

  console.log(`[Webhook] Assinatura ativada: userId=${userId} plano=${planId} até=${periodEnd.toISOString()}`);
}

export function registerStripeWebhook(app: Express) {
  app.post(
    "/api/stripe/webhook",
    (req: Request & { rawBody?: Buffer }, _res: Response, next: () => void) => {
      let data = Buffer.alloc(0);
      req.on("data", (chunk: Buffer) => { data = Buffer.concat([data, chunk]); });
      req.on("end", () => { req.rawBody = data; next(); });
    },
    async (req: Request & { rawBody?: Buffer }, res: Response) => {
      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(
          req.rawBody ?? Buffer.alloc(0),
          sig,
          webhookSecret
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error(`[Webhook] Signature verification failed: ${msg}`);
        return res.status(400).send(`Webhook Error: ${msg}`);
      }

      // Evento de teste — retornar verified para passar verificação
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Webhook] Event: ${event.type} | id: ${event.id}`);

      try {
        switch (event.type) {
          // ── Checkout concluído ──────────────────────────────────────────────
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = parseInt(session.metadata?.user_id ?? "0", 10);
            const planId = session.metadata?.planId ?? "starter";
            const stripeCustomerId = session.customer as string;
            const stripeSubscriptionId = session.subscription as string;

            if (!stripeSubscriptionId) break;

            const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
            const periodEnd = calcPeriodEnd(stripeSub);
            const stripePriceId = stripeSub.items.data[0]?.price.id ?? "";

            await activateSubscription(
              userId,
              planId,
              stripeCustomerId,
              stripeSubscriptionId,
              stripePriceId,
              periodEnd
            );
            break;
          }

          // ── Fatura paga (renovação mensal/anual) ───────────────────────────
          case "invoice.paid": {
            const invoice = event.data.object as Stripe.Invoice;
            const subDetails = invoice.parent?.subscription_details;
            const stripeSubId = subDetails?.subscription
              ? (typeof subDetails.subscription === "string" ? subDetails.subscription : subDetails.subscription.id)
              : null;

            if (!stripeSubId) break;

            // Calcular novo período com base na fatura
            const periodEnd = invoice.period_end
              ? new Date(invoice.period_end * 1000)
              : new Date(Date.now() + 30 * 24 * 3600 * 1000);

            const db = await getDb();
            if (db) {
              await db
                .update(subscriptions)
                .set({
                  status: "active",
                  currentPeriodEnd: periodEnd,
                  reportsUsedThisMonth: 0,
                  llmUsedThisMonth: 0,
                  cancelledAt: null,
                })
                .where(eq(subscriptions.stripeSubscriptionId, stripeSubId));
            }
            console.log(`[Webhook] Fatura paga, assinatura renovada até ${periodEnd.toISOString()}`);
            break;
          }

          // ── Falha no pagamento → expirar ───────────────────────────────────
          case "invoice.payment_failed": {
            const invoice = event.data.object as Stripe.Invoice;
            const subDetails2 = invoice.parent?.subscription_details;
            const stripeSubId2 = subDetails2?.subscription
              ? (typeof subDetails2.subscription === "string" ? subDetails2.subscription : subDetails2.subscription.id)
              : null;

            if (!stripeSubId2) break;

            const db = await getDb();
            if (db) {
              await db
                .update(subscriptions)
                .set({ status: "expired" })
                .where(eq(subscriptions.stripeSubscriptionId, stripeSubId2));
            }
            console.log(`[Webhook] Pagamento falhou, assinatura expirada: ${stripeSubId2}`);
            break;
          }

          // ── Assinatura cancelada pelo usuário ──────────────────────────────
          case "customer.subscription.deleted": {
            const sub = event.data.object as Stripe.Subscription;
            const db = await getDb();
            if (db) {
              await db
                .update(subscriptions)
                .set({ status: "cancelled", cancelledAt: new Date() })
                .where(eq(subscriptions.stripeSubscriptionId, sub.id));
            }
            console.log(`[Webhook] Assinatura cancelada: ${sub.id}`);
            break;
          }

          // ── Assinatura atualizada (upgrade/downgrade) ──────────────────────
          case "customer.subscription.updated": {
            const sub = event.data.object as Stripe.Subscription;
            const planId = sub.metadata?.planId;
            if (!planId) break;

            const db = await getDb();
            if (!db) break;

            const periodEnd = calcPeriodEnd(sub);
            await db
              .update(subscriptions)
              .set({
                plan: planId as "starter" | "basic" | "professional" | "team_small" | "team_medium" | "enterprise",
                status: sub.status === "active" ? "active" : "expired",
                currentPeriodEnd: periodEnd,
                stripePriceId: sub.items.data[0]?.price.id ?? undefined,
              })
              .where(eq(subscriptions.stripeSubscriptionId, sub.id));

            console.log(`[Webhook] Assinatura atualizada: ${sub.id} → ${planId}`);
            break;
          }

          default:
            console.log(`[Webhook] Evento não tratado: ${event.type}`);
        }
      } catch (err) {
        console.error(`[Webhook] Erro ao processar evento ${event.type}:`, err);
        return res.status(500).json({ error: "Internal error" });
      }

      res.json({ received: true });
    }
  );
}
