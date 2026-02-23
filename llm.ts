import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getStudentById, getProfessionalByUserId, saveLlmContent, getLlmContentByStudent } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

export const llmRouter = router({
  generateActivitySheet: protectedProcedure
    .input(z.object({ studentId: z.number(), topic: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const prof = await getProfessionalByUserId(ctx.user.id);
      if (!prof) throw new TRPCError({ code: "FORBIDDEN" });
      const student = await getStudentById(input.studentId);
      if (!student || student.professionalId !== prof.id) throw new TRPCError({ code: "FORBIDDEN" });

      const topic = input.topic ?? "desenvolvimento geral";
      const prompt = `Crie uma ficha de atividade pedagógica personalizada para o aluno "${student.name}".

Perfil:
- Faixa etária: ${student.ageGroup} anos
- Perfil cognitivo: ${student.cognitiveProfile}
- Nível de comunicação: ${student.communicationLevel}
- Nível de dificuldade: ${student.difficultyLevel}
- Necessidades específicas: ${student.specificNeeds ?? "não informado"}
- Adaptações necessárias: ${student.adaptations ?? "não informado"}
- Suporte visual: ${student.visualSupport ? "sim" : "não"}

Tema da atividade: ${topic}

Crie uma ficha estruturada com:
1. Título da atividade
2. Objetivo pedagógico
3. Materiais necessários
4. Passo a passo detalhado (adaptado ao perfil)
5. Dicas de adaptação para o perfil cognitivo
6. Critérios de avaliação
7. Variações para diferentes níveis de dificuldade`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "Você é um especialista em educação inclusiva e intervenção pedagógica para pessoas atípicas. Crie fichas de atividades detalhadas, práticas e adaptadas. Responda em português brasileiro.",
          },
          { role: "user", content: prompt },
        ],
      });

      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : "Não foi possível gerar a ficha.";

      await saveLlmContent({
        studentId: input.studentId,
        professionalId: prof.id,
        contentType: "activity_sheet",
        prompt,
        content,
      });

      return { content };
    }),

  suggestGames: protectedProcedure
    .input(z.object({ studentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const prof = await getProfessionalByUserId(ctx.user.id);
      if (!prof) throw new TRPCError({ code: "FORBIDDEN" });
      const student = await getStudentById(input.studentId);
      if (!student || student.professionalId !== prof.id) throw new TRPCError({ code: "FORBIDDEN" });

      const prompt = `Sugira 5 jogos educacionais adaptados para o aluno "${student.name}".

Perfil:
- Faixa etária: ${student.ageGroup} anos
- Perfil cognitivo: ${student.cognitiveProfile}
- Nível de comunicação: ${student.communicationLevel}
- Nível de dificuldade: ${student.difficultyLevel}
- Necessidades específicas: ${student.specificNeeds ?? "não informado"}

Para cada jogo, inclua:
1. Nome do jogo
2. Área de desenvolvimento trabalhada
3. Como adaptar para o perfil do aluno
4. Benefícios esperados
5. Duração recomendada`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "Você é um especialista em jogos educacionais para pessoas atípicas. Sugira jogos práticos, engajantes e terapeuticamente relevantes. Responda em português brasileiro.",
          },
          { role: "user", content: prompt },
        ],
      });

      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : "Não foi possível gerar sugestões.";

      await saveLlmContent({
        studentId: input.studentId,
        professionalId: prof.id,
        contentType: "game_suggestion",
        prompt,
        content,
      });

      return { content };
    }),

  generateEducationalContent: protectedProcedure
    .input(z.object({ studentId: z.number(), area: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const prof = await getProfessionalByUserId(ctx.user.id);
      if (!prof) throw new TRPCError({ code: "FORBIDDEN" });
      const student = await getStudentById(input.studentId);
      if (!student || student.professionalId !== prof.id) throw new TRPCError({ code: "FORBIDDEN" });

      const prompt = `Crie conteúdo educacional personalizado para a área de "${input.area}" para o aluno "${student.name}".

Perfil:
- Faixa etária: ${student.ageGroup} anos
- Perfil cognitivo: ${student.cognitiveProfile}
- Nível de comunicação: ${student.communicationLevel}
- Nível de dificuldade: ${student.difficultyLevel}
- Suporte visual: ${student.visualSupport ? "sim" : "não"}

Inclua:
1. Conceitos-chave adaptados ao perfil
2. Estratégias de ensino recomendadas
3. Recursos visuais sugeridos
4. Sequência de aprendizagem progressiva
5. Formas de avaliar a compreensão`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "Você é um especialista em educação inclusiva e neuropsicopedagogia. Crie conteúdo educacional adaptado e progressivo para pessoas atípicas. Responda em português brasileiro.",
          },
          { role: "user", content: prompt },
        ],
      });

      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : "Não foi possível gerar o conteúdo.";

      await saveLlmContent({
        studentId: input.studentId,
        professionalId: prof.id,
        contentType: "educational_content",
        prompt,
        content,
      });

      return { content };
    }),

  history: protectedProcedure
    .input(z.object({ studentId: z.number(), contentType: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const prof = await getProfessionalByUserId(ctx.user.id);
      if (!prof) throw new TRPCError({ code: "FORBIDDEN" });
      const student = await getStudentById(input.studentId);
      if (!student || student.professionalId !== prof.id) throw new TRPCError({ code: "FORBIDDEN" });
      return getLlmContentByStudent(input.studentId, input.contentType);
    }),
});
