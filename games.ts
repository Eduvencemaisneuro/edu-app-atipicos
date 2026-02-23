import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createGameSession,
  getAllGames,
  getGameById,
  getGameSessionsByStudent,
  getStudentById,
  getProfessionalByUserId,
  awardBadge,
  createNotification,
  getAllBadges,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const gamesRouter = router({
  list: publicProcedure
    .input(
      z.object({
        ageGroup: z.string().optional(),
        cognitiveProfile: z.string().optional(),
        category: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const allGames = await getAllGames();
      // Filter in memory for JSON array fields
      return allGames.filter((g) => {
        if (input?.ageGroup && g.ageGroups && !g.ageGroups.includes(input.ageGroup)) return false;
        if (input?.cognitiveProfile && g.cognitiveProfiles && !g.cognitiveProfiles.includes(input.cognitiveProfile) && !g.cognitiveProfiles.includes("all")) return false;
        if (input?.category && g.category !== input.category) return false;
        return true;
      });
    }),

  get: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const game = await getGameById(input.id);
    if (!game) throw new TRPCError({ code: "NOT_FOUND" });
    return game;
  }),

  submitSession: protectedProcedure
    .input(
      z.object({
        studentId: z.number(),
        gameId: z.number(),
        score: z.number(),
        maxScore: z.number(),
        duration: z.number(),
        completed: z.boolean(),
        starsEarned: z.number().min(0).max(3),
        sessionData: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prof = await getProfessionalByUserId(ctx.user.id);
      if (!prof) throw new TRPCError({ code: "FORBIDDEN" });

      const student = await getStudentById(input.studentId);
      if (!student || student.professionalId !== prof.id) throw new TRPCError({ code: "FORBIDDEN" });

      const sessionId = await createGameSession({
        studentId: input.studentId,
        gameId: input.gameId,
        professionalId: prof.id,
        score: input.score,
        maxScore: input.maxScore,
        duration: input.duration,
        completed: input.completed,
        starsEarned: input.starsEarned,
        sessionData: input.sessionData ?? null,
      });

      // Notify professional if activity completed
      if (input.completed) {
        await createNotification({
          userId: ctx.user.id,
          studentId: input.studentId,
          type: "activity_completed",
          title: "Atividade Concluída!",
          message: `${student.name} completou uma atividade com ${input.starsEarned} estrela(s)!`,
          isRead: false,
          data: { sessionId, gameId: input.gameId, starsEarned: input.starsEarned },
        });
      }

      // Auto-award badges based on performance
      const allBadges = await getAllBadges();
      const awardedBadges: number[] = [];

      if (input.starsEarned === 3) {
        const perfectBadge = allBadges.find((b) => b.name === "Estrela Perfeita");
        if (perfectBadge) {
          await awardBadge(input.studentId, perfectBadge.id, prof.id);
          awardedBadges.push(perfectBadge.id);
        }
      }

      return { sessionId, awardedBadges };
    }),

  sessionsByStudent: protectedProcedure
    .input(z.object({ studentId: z.number(), limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const prof = await getProfessionalByUserId(ctx.user.id);
      if (!prof) throw new TRPCError({ code: "FORBIDDEN" });
      const student = await getStudentById(input.studentId);
      if (!student || student.professionalId !== prof.id) throw new TRPCError({ code: "FORBIDDEN" });
      return getGameSessionsByStudent(input.studentId, input.limit ?? 20);
    }),
});
