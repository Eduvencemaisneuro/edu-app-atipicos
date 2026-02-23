import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createStudent,
  getStudentById,
  getStudentsByProfessional,
  getStudentStats,
  getProfessionalByUserId,
  updateStudent,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const studentSchema = z.object({
  name: z.string().min(1),
  birthDate: z.string().optional(),
  gender: z.enum(["male", "female", "other", "not_informed"]).optional(),
  avatarUrl: z.string().optional(),
  diagnosis: z.array(z.string()).optional(),
  cognitiveProfile: z.enum(["tea", "tdah", "di", "down", "dyslexia", "language", "typical", "other"]).optional(),
  ageGroup: z.enum(["0-3", "4-6", "7-10", "11-14", "15-18"]).optional(),
  specificNeeds: z.string().optional(),
  adaptations: z.string().optional(),
  communicationLevel: z.enum(["non_verbal", "emerging", "functional", "verbal"]).optional(),
  reducedStimulus: z.boolean().optional(),
  visualSupport: z.boolean().optional(),
  difficultyLevel: z.enum(["basic", "intermediate", "advanced"]).optional(),
  notes: z.string().optional(),
});

export const studentsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const prof = await getProfessionalByUserId(ctx.user.id);
    if (!prof) return [];
    return getStudentsByProfessional(prof.id);
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const student = await getStudentById(input.id);
    if (!student) throw new TRPCError({ code: "NOT_FOUND" });
    const prof = await getProfessionalByUserId(ctx.user.id);
    if (!prof || student.professionalId !== prof.id) throw new TRPCError({ code: "FORBIDDEN" });
    return student;
  }),

  create: protectedProcedure.input(studentSchema).mutation(async ({ ctx, input }) => {
    const prof = await getProfessionalByUserId(ctx.user.id);
    if (!prof) throw new TRPCError({ code: "FORBIDDEN", message: "Perfil profissional não encontrado" });
    const id = await createStudent({
      professionalId: prof.id,
      name: input.name,
      birthDate: input.birthDate ? new Date(input.birthDate) : null,
      gender: input.gender ?? "not_informed",
      avatarUrl: input.avatarUrl ?? null,
      diagnosis: input.diagnosis ?? null,
      cognitiveProfile: input.cognitiveProfile ?? "typical",
      ageGroup: input.ageGroup ?? "4-6",
      specificNeeds: input.specificNeeds ?? null,
      adaptations: input.adaptations ?? null,
      communicationLevel: input.communicationLevel ?? "verbal",
      reducedStimulus: input.reducedStimulus ?? false,
      visualSupport: input.visualSupport ?? true,
      difficultyLevel: input.difficultyLevel ?? "basic",
      notes: input.notes ?? null,
      isActive: true,
    });
    return { id };
  }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: studentSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      const student = await getStudentById(input.id);
      if (!student) throw new TRPCError({ code: "NOT_FOUND" });
      const prof = await getProfessionalByUserId(ctx.user.id);
      if (!prof || student.professionalId !== prof.id) throw new TRPCError({ code: "FORBIDDEN" });
      const updateData: any = { ...input.data };
      if (input.data.birthDate) updateData.birthDate = new Date(input.data.birthDate);
      await updateStudent(input.id, updateData);
      return { success: true };
    }),

  deactivate: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const student = await getStudentById(input.id);
    if (!student) throw new TRPCError({ code: "NOT_FOUND" });
    const prof = await getProfessionalByUserId(ctx.user.id);
    if (!prof || student.professionalId !== prof.id) throw new TRPCError({ code: "FORBIDDEN" });
    await updateStudent(input.id, { isActive: false });
    return { success: true };
  }),

  stats: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const student = await getStudentById(input.id);
    if (!student) throw new TRPCError({ code: "NOT_FOUND" });
    const prof = await getProfessionalByUserId(ctx.user.id);
    if (!prof || student.professionalId !== prof.id) throw new TRPCError({ code: "FORBIDDEN" });
    return getStudentStats(input.id);
  }),
});
