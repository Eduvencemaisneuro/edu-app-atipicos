import Stripe from "stripe";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { subscriptions } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { PLAN_DEFINITIONS, PAID_PLAN_IDS } from "../stripe-products";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

// Helper: mapear planId → limites
function getPlanLimits(planId: string) {
  const plan = PLAN_DEFINITIONS[planId];
  if (!plan) return null;
  return {
    maxStudents: plan.maxStudents,
    maxProfessionals: plan.maxProfessionals,
    maxReportsPerMonth: plan.maxReportsPerMonth,
    maxLlmPerMonth: plan.maxLlmPerMonth,
    features: plan.features,
  };
}

export const paymentRouter = router({
  // Criar sessão de checkout Stripe
  createCheckout: protectedProcedure
    .input(
      z.object({
        planId: z.enum(["starter", "basic", "professional", "team_small", "team_medium", "enterprise"]),
        billingCycle: z.enum(["monthly", "annual"]).default("monthly"),
        origin: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const plan = PLAN_DEFINITIONS[input.planId];
      if (!plan) throw new Error("Plano inválido");

      const priceAmount = input.billingCycle === "annual"
        ? Math.round(plan.annualPriceBRL * 100)
        : Math.round(plan.monthlyPriceBRL * 100);

      const interval = input.billingCycle === "annual" ? "year" : "month";

      // Criar sessão de checkout com assinatura recorrente
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer_email: ctx.user.email ?? undefined,
        allow_promotion_codes: true,
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: `Plataforma Inclusiva — ${plan.name}`,
                description: plan.description,
                metadata: { planId: input.planId },
              },
              unit_amount: priceAmount,
              recurring: { interval },
            },
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: {
            planId: input.planId,
            userId: ctx.user.id.toString(),
            billingCycle: input.billingCycle,
          },
        },
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email ?? "",
          customer_name: ctx.user.name ?? "",
          planId: input.planId,
          billingCycle: input.billingCycle,
        },
        success_url: `${input.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${input.origin}/payment/cancel`,
      });

      return { url: session.url };
    }),

  // Criar portal do cliente para gerenciar assinatura
  createPortal: protectedProcedure
    .input(z.object({ origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB indisponível");

      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, ctx.user.id))
        .limit(1);

      if (!sub?.stripeCustomerId) {
        throw new Error("Nenhuma assinatura ativa encontrada");
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: sub.stripeCustomerId,
        return_url: `${input.origin}/plans`,
      });

      return { url: session.url };
    }),

  // Verificar sessão de checkout (página de sucesso)
  verifySession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const session = await stripe.checkout.sessions.retrieve(input.sessionId, {
        expand: ["subscription"],
      });

      return {
        status: session.status,
        planId: session.metadata?.planId ?? null,
        billingCycle: session.metadata?.billingCycle ?? null,
      };
    }),

  // Listar histórico de pagamentos
  paymentHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.user.id))
      .limit(1);

    if (!sub?.stripeCustomerId) return [];

    const invoices = await stripe.invoices.list({
      customer: sub.stripeCustomerId,
      limit: 20,
    });

    return invoices.data.map((inv: Stripe.Invoice) => ({
      id: inv.id,
      date: inv.created * 1000,
      amount: (inv.amount_paid ?? 0) / 100,
      currency: inv.currency.toUpperCase(),
      status: inv.status,
      pdfUrl: inv.invoice_pdf,
      description: inv.lines.data[0]?.description ?? "Assinatura",
    }));
  }),
});
