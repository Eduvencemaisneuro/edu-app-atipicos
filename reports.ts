import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createReport,
  getReportById,
  getReportsByStudent,
  getStudentById,
  getProfessionalByUserId,
  getProgressByStudent,
  getStudentStats,
  getGameSessionsByStudent,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

export const reportsRouter = router({
  list: protectedProcedure
    .input(z.object({ studentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const prof = await getProfessionalByUserId(ctx.user.id);
      if (!prof) throw new TRPCError({ code: "FORBIDDEN" });
      const student = await getStudentById(input.studentId);
      if (!student || student.professionalId !== prof.id) throw new TRPCError({ code: "FORBIDDEN" });
      return getReportsByStudent(input.studentId);
    }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const prof = await getProfessionalByUserId(ctx.user.id);
    if (!prof) throw new TRPCError({ code: "FORBIDDEN" });
    const report = await getReportById(input.id);
    if (!report) throw new TRPCError({ code: "NOT_FOUND" });
    const student = await getStudentById(report.studentId);
    if (!student || student.professionalId !== prof.id) throw new TRPCError({ code: "FORBIDDEN" });
    return report;
  }),

  create: protectedProcedure
    .input(
      z.object({
        studentId: z.number(),
        title: z.string().min(1),
        content: z.string().min(1),
        period: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prof = await getProfessionalByUserId(ctx.user.id);
      if (!prof) throw new TRPCError({ code: "FORBIDDEN" });
      const student = await getStudentById(input.studentId);
      if (!student || student.professionalId !== prof.id) throw new TRPCError({ code: "FORBIDDEN" });

      const id = await createReport({
        studentId: input.studentId,
        professionalId: prof.id,
        title: input.title,
        content: input.content,
        period: input.period ?? null,
        fileUrl: null,
        fileKey: null,
        isShared: false,
        sharedWith: null,
      });
      return { id };
    }),

  generateWithLLM: protectedProcedure
    .input(z.object({ studentId: z.number(), period: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const prof = await getProfessionalByUserId(ctx.user.id);
      if (!prof) throw new TRPCError({ code: "FORBIDDEN" });
      const student = await getStudentById(input.studentId);
      if (!student || student.professionalId !== prof.id) throw new TRPCError({ code: "FORBIDDEN" });

      const [progressRecords, stats, sessions] = await Promise.all([
        getProgressByStudent(input.studentId),
        getStudentStats(input.studentId),
        getGameSessionsByStudent(input.studentId, 10),
      ]);

      const recentProgress = progressRecords.slice(0, 5).map((r) => `[${r.recordType}] ${r.title ?? ""}: ${r.content}`).join("\n");
      const period = input.period ?? "período recente";

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Você é um especialista em educação inclusiva e neuropsicopedagogia. Gere relatórios profissionais, detalhados e empáticos sobre o desenvolvimento de alunos atípicos. Use linguagem técnica mas acessível. Responda em português brasileiro.`,
          },
          {
            role: "user",
            content: `Gere um relatório de evolução para o aluno "${student.name}" referente ao ${period}.

Perfil do aluno:
- Perfil cognitivo: ${student.cognitiveProfile}
- Faixa etária: ${student.ageGroup} anos
- Nível de comunicação: ${student.communicationLevel}
- Necessidades específicas: ${student.specificNeeds ?? "Não informado"}
- Adaptações: ${student.adaptations ?? "Não informado"}

Estatísticas de atividades:
- Total de sessões: ${stats.totalSessions}
- Jogos completados: ${stats.completedGames}
- Total de estrelas: ${stats.totalStars}

Registros recentes do profissional:
${recentProgress || "Nenhum registro recente."}

Por favor, gere um relatório estruturado com:
1. Resumo executivo
2. Desenvolvimento cognitivo
3. Desenvolvimento socioemocional
4. Progresso nas atividades
5. Pontos de atenção
6. Recomendações para próximas intervenções`,
          },
        ],
      });

      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : "Não foi possível gerar o relatório.";
      const title = `Relatório de Evolução — ${student.name} — ${period}`;

      const id = await createReport({
        studentId: input.studentId,
        professionalId: prof.id,
        title,
        content,
        period: input.period ?? null,
        fileUrl: null,
        fileKey: null,
        isShared: false,
        sharedWith: null,
      });

      return { id, title, content };
    }),
});
