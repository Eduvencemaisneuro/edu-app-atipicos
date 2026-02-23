/**
 * Definição centralizada dos planos e preços da plataforma.
 * Os IDs do Stripe são criados dinamicamente na primeira execução
 * e armazenados como variáveis de ambiente para reutilização.
 *
 * Preços em BRL (centavos para Stripe).
 */

export interface PlanDefinition {
  id: string;
  name: string;
  description: string;
  monthlyPriceBRL: number; // em reais (ex: 49.90)
  annualPriceBRL: number;  // em reais (desconto 20%)
  maxStudents: number;     // -1 = ilimitado
  maxProfessionals: number;
  maxReportsPerMonth: number;
  maxLlmPerMonth: number;
  features: {
    premiumGames: boolean;
    premiumMaterials: boolean;
    premiumVideos: boolean;
    aiAssistant: boolean;
    exportReports: boolean;
    aacModule: boolean;
    prioritySupport: boolean;
  };
}

export const PLAN_DEFINITIONS: Record<string, PlanDefinition> = {
  starter: {
    id: "starter",
    name: "Iniciante",
    description: "Para profissionais autônomos com poucos alunos",
    monthlyPriceBRL: 49.90,
    annualPriceBRL: 39.90,
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
    description: "Para profissionais com carteira de alunos em crescimento",
    monthlyPriceBRL: 89.90,
    annualPriceBRL: 71.90,
    maxStudents: 30,
    maxProfessionals: 1,
    maxReportsPerMonth: 100,
    maxLlmPerMonth: 200,
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
  professional: {
    id: "professional",
    name: "Profissional",
    description: "Para profissionais com grande volume de atendimentos",
    monthlyPriceBRL: 149.90,
    annualPriceBRL: 119.90,
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
    description: "Para clínicas e escolas com até 10 profissionais",
    monthlyPriceBRL: 299.90,
    annualPriceBRL: 239.90,
    maxStudents: -1,
    maxProfessionals: 10,
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
  team_medium: {
    id: "team_medium",
    name: "Equipe Média",
    description: "Para instituições com até 50 profissionais",
    monthlyPriceBRL: 599.90,
    annualPriceBRL: 479.90,
    maxStudents: -1,
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
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "Para grandes instituições sem limite de profissionais",
    monthlyPriceBRL: 999.90,
    annualPriceBRL: 799.90,
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
  },
};

export type PaidPlanId = keyof typeof PLAN_DEFINITIONS;
export const PAID_PLAN_IDS = Object.keys(PLAN_DEFINITIONS) as PaidPlanId[];
