import { eq } from "drizzle-orm";
import { z } from "zod";
import { subscriptions } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

// ─── Definição dos planos ─────────────────────────────────────────────────────
//
// GRATUITO: 1 aluno, 1 profissional (individual), ferramentas básicas
// NÍVEL 1:  até 10 alunos, 1 profissional (individual)
// NÍVEL 2:  até 30 alunos, 1 profissional (individual)
// NÍVEL 3:  ilimitado alunos, 1 profissional (individual)
// NÍVEL 4:  até 10 alunos, até 10 profissionais
// NÍVEL 5:  até 30 alunos, até 50 profissionais
// NÍVEL 6:  ilimitado alunos, profissionais ilimitados
// ─────────────────────────────────────────────────────────────────────────────

export type PlanId =
  | "free"
  | "starter"
  | "basic"
  | "professional"
  | "team_small"
  | "team_medium"
  | "enterprise";

export interface PlanConfig {
  id: PlanId;
  name: string;
  description: string;
  priceMonthly: number; // BRL
  priceAnnual: number;  // BRL (por mês, cobrado anualmente)
  maxStudents: number;  // -1 = ilimitado
  maxProfessionals: number; // -1 = ilimitado
  maxReportsPerMonth: number;
  maxLlmPerMonth: number;
  features: {
    premiumGames: boolean;
    premiumMaterials: boolean;
    premiumVideos: boolean;
    aiAssistant: boolean;
    exportReports: boolean;
    aacModule: boolean; // Comunicação Alternativa e Aumentativa
    prioritySupport: boolean;
  };
  highlight?: boolean;
  badge?: string;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Gratuito",
    description: "Para conhecer a plataforma",
    priceMonthly: 0,
    priceAnnual: 0,
    maxStudents: 1,
    maxProfessionals: 1,
    maxReportsPerMonth: 2,
    maxLlmPerMonth: 0,
    features: {
      premiumGames: false,
      premiumMaterials: false,
      premiumVideos: false,
      aiAssistant: false,
      exportReports: false,
      aacModule: false,
      prioritySupport: false,
    },
  },
  starter: {
    id: "starter",
    name: "Iniciante",
    description: "Profissional individual — até 10 alunos",
    priceMonthly: 49.90,
    priceAnnual: 39.90,
    maxStudents: 10,
    maxProfessionals: 1,
    maxReportsPerMonth: 30,
    maxLlmPerMonth: 50,
    features: {
      premiumGames: true,
      premiumMaterials: true,
      premiumVideos: true,
      aiAssistant: true,
      exportReports: true,
      aacModule: true,
      prioritySupport: false,
    },
  },
  basic: {
    id: "basic",
    name: "Básico",
    description: "Profissional individual — até 30 alunos",
    priceMonthly: 89.90,
    priceAnnual: 71.90,
    maxStudents: 30,
    maxProfessionals: 1,
    maxReportsPerMonth: 100,
    maxLlmPerMonth: 150,
    features: {
      premiumGames: true,
      premiumMaterials: true,
      premiumVideos: true,
      aiAssistant: true,
      exportReports: true,
      aacModule: true,
      prioritySupport: false,
    },
    highlight: true,
    badge: "Mais popular",
  },
  professional: {
    id: "professional",
    name: "Profissional",
    description: "Profissional individual — alunos ilimitados",
    priceMonthly: 149.90,
    priceAnnual: 119.90,
    maxStudents: -1,
    maxProfessionals: 1,
    maxReportsPerMonth: -1,
    maxLlmPerMonth: -1,
    features: {
      premiumGames: true,
      premiumMaterials: true,
      premiumVideos: true,
      aiAssistant: true,
      exportReports: true,
      aacModule: true,
      prioritySupport: true,
    },
  },
  team_small: {
    id: "team_small",
    name: "Equipe Pequena",
    description: "Até 10 profissionais — até 10 alunos cada",
    priceMonthly: 299.90,
    priceAnnual: 239.90,
    maxStudents: 10,
    maxProfessionals: 10,
    maxReportsPerMonth: 200,
    maxLlmPerMonth: 300,
    features: {
      premiumGames: true,
      premiumMaterials: true,
      premiumVideos: true,
      aiAssistant: true,
      exportReports: true,
      aacModule: true,
      prioritySupport: false,
    },
  },
  team_medium: {
    id: "team_medium",
    name: "Equipe Média",
    description: "Até 50 profissionais — até 30 alunos cada",
    priceMonthly: 599.90,
    priceAnnual: 479.90,
    maxStudents: 30,
    maxProfessionals: 50,
    maxReportsPerMonth: -1,
    maxLlmPerMonth: -1,
    features: {
      premiumGames: true,
      premiumMaterials: true,
      premiumVideos: true,
      aiAssistant: true,
      exportReports: true,
      aacModule: true,
      prioritySupport: true,
    },
    badge: "Clínicas e escolas",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "Profissionais e alunos ilimitados",
    priceMonthly: 999.90,
    priceAnnual: 799.90,
    maxStudents: -1,
    maxProfessionals: -1,
    maxReportsPerMonth: -1,
    maxLlmPerMonth: -1,
    features: {
      premiumGames: true,
      premiumMaterials: true,
      premiumVideos: true,
      aiAssistant: true,
      exportReports: true,
      aacModule: true,
      prioritySupport: true,
    },
    badge: "Institucional",
  },
};

export const PAID_PLAN_IDS: PlanId[] = [
  "starter", "basic", "professional", "team_small", "team_medium", "enterprise"
];

// ─── Helper: get or create subscription ──────────────────────────────────────
export async function getOrCreateSubscription(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (existing.length > 0) return existing[0]!;

  await db.insert(subscriptions).values({
    userId,
    plan: "free",
    status: "active",
    studentsUsed: 0,
    reportsUsedThisMonth: 0,
    llmUsedThisMonth: 0,
  });

  const created = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  return created[0]!;
}

// ─── Helper: check premium access ────────────────────────────────────────────
export async function hasPremiumAccess(userId: number): Promise<boolean> {
  const sub = await getOrCreateSubscription(userId);
  return sub.plan !== "free" && sub.status === "active";
}

// ─── Helper: get plan config ──────────────────────────────────────────────────
export function getPlanConfig(planId: string): PlanConfig {
  return PLANS[planId as PlanId] ?? PLANS.free;
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const subscriptionRouter = router({

  // Retorna todos os planos disponíveis (público)
  listPlans: protectedProcedure.query(() => {
    return Object.values(PLANS);
  }),

  // Status da assinatura atual + limites
  status: protectedProcedure.query(async ({ ctx }) => {
    const sub = await getOrCreateSubscription(ctx.user.id);
    const planConfig = getPlanConfig(sub.plan);
    const isPremium = sub.plan !== "free" && sub.status === "active";

    return {
      ...sub,
      isPremium,
      planConfig,
      canAddStudent: planConfig.maxStudents === -1 || sub.studentsUsed < planConfig.maxStudents,
      canUseAI: planConfig.features.aiAssistant,
      canUseAAC: planConfig.features.aacModule,
      studentsRemaining: planConfig.maxStudents === -1 ? -1 : planConfig.maxStudents - sub.studentsUsed,
    };
  }),

  // Fazer upgrade (sem trial — cobrança imediata)
  upgrade: protectedProcedure
    .input(z.object({
      plan: z.enum(["starter", "basic", "professional", "team_small", "team_medium", "enterprise"]),
      billing: z.enum(["monthly", "annual"]).default("monthly"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const sub = await getOrCreateSubscription(ctx.user.id);
      const planConfig = PLANS[input.plan];
      const now = new Date();
      const periodEnd = new Date(now);

      if (input.billing === "monthly") {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }

      await db
        .update(subscriptions)
        .set({
          plan: input.plan,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelledAt: null,
        })
        .where(eq(subscriptions.id, sub.id));

      return {
        success: true,
        plan: input.plan,
        planName: planConfig.name,
        billing: input.billing,
        price: input.billing === "monthly" ? planConfig.priceMonthly : planConfig.priceAnnual,
        periodEnd,
      };
    }),

  // Cancelar assinatura (reverte para free imediatamente)
  cancel: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const sub = await getOrCreateSubscription(ctx.user.id);
    await db
      .update(subscriptions)
      .set({ plan: "free", status: "active", cancelledAt: new Date() })
      .where(eq(subscriptions.id, sub.id));

    return { success: true };
  }),

  // Incrementar contadores de uso
  incrementUsage: protectedProcedure
    .input(z.object({ type: z.enum(["report", "llm", "student"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const sub = await getOrCreateSubscription(ctx.user.id);

      if (input.type === "report") {
        await db
          .update(subscriptions)
          .set({ reportsUsedThisMonth: sub.reportsUsedThisMonth + 1 })
          .where(eq(subscriptions.id, sub.id));
      } else if (input.type === "llm") {
        await db
          .update(subscriptions)
          .set({ llmUsedThisMonth: sub.llmUsedThisMonth + 1 })
          .where(eq(subscriptions.id, sub.id));
      } else if (input.type === "student") {
        await db
          .update(subscriptions)
          .set({ studentsUsed: sub.studentsUsed + 1 })
          .where(eq(subscriptions.id, sub.id));
      }

      return { success: true };
    }),
});
