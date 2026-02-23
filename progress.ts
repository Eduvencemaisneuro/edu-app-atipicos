import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createProgressRecord,
  getProgressByStudent,
  getStudentById,
  getProfessionalByUserId,
  getStudentBadges,
  awardBadge,
  getAllBadges,
  createNotification,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const progressRouter = router({
  list: protectedProcedure
    .input(z.object({ studentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const prof = await getProfessionalByUserId(ctx.user.id);
      if (!prof) throw new TRPCError({ code: "FORBIDDEN" });
      const student = await getStudentById(input.studentId);
      if (!student || student.professionalId !== prof.id) throw new TRPCError({ code: "FORBIDDEN" });
      return getProgressByStudent(input.studentId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        studentId: z.number(),
        recordType: z.enum(["observation", "evolution", "behavior", "development", "session"]),
        title: z.string().optional(),
        content: z.string().min(1),
        sessionDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prof = await getProfessionalByUserId(ctx.user.id);
      if (!prof) throw new TRPCError({ code: "FORBIDDEN" });
      const student = await getStudentById(input.studentId);
      if (!student || student.professionalId !== prof.id) throw new TRPCError({ code: "FORBIDDEN" });

      const id = await createProgressRecord({
        studentId: input.studentId,
        professionalId: prof.id,
        recordType: input.recordType,
        title: input.title ?? null,
        content: input.content,
        attachmentUrl: null,
        attachmentKey: null,
        sessionDate: input.sessionDate ? new Date(input.sessionDate) : new Date(),
      });
      return { id };
    }),

  badges: protectedProcedure
    .input(z.object({ studentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const prof = await getProfessionalByUserId(ctx.user.id);
      if (!prof) throw new TRPCError({ code: "FORBIDDEN" });
      const student = await getStudentById(input.studentId);
      if (!student || student.professionalId !== prof.id) throw new TRPCError({ code: "FORBIDDEN" });
      return getStudentBadges(input.studentId);
    }),

  awardBadge: protectedProcedure
    .input(z.object({ studentId: z.number(), badgeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const prof = await getProfessionalByUserId(ctx.user.id);
      if (!prof) throw new TRPCError({ code: "FORBIDDEN" });
      const student = await getStudentById(input.studentId);
      if (!student || student.professionalId !== prof.id) throw new TRPCError({ code: "FORBIDDEN" });

      const id = await awardBadge(input.studentId, input.badgeId, prof.id);

      const allBadges = await getAllBadges();
      const badge = allBadges.find((b) => b.id === input.badgeId);
      if (badge) {
        await createNotification({
          userId: ctx.user.id,
          studentId: input.studentId,
          type: "badge_earned",
          title: "Conquista Desbloqueada!",
          message: `${student.name} ganhou a conquista "${badge.name}"!`,
          isRead: false,
          data: { badgeId: input.badgeId, badgeName: badge.name },
        });
      }

      return { id };
    }),

  allBadges: protectedProcedure.query(async () => {
    return getAllBadges();
  }),
});
