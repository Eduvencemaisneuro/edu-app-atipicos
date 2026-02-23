import { z } from "zod";
import { getProfessionalByUserId, upsertProfessional } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

export const professionalsRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    return getProfessionalByUserId(ctx.user.id);
  }),

  update: protectedProcedure
    .input(
      z.object({
        specialty: z.string().optional(),
        institution: z.string().optional(),
        bio: z.string().optional(),
        avatarUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await upsertProfessional({ userId: ctx.user.id, ...input });
      return { success: true };
    }),

  uploadAvatar: protectedProcedure
    .input(z.object({ base64: z.string(), mimeType: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const ext = input.mimeType.split("/")[1] ?? "jpg";
      const key = `avatars/${ctx.user.id}/${nanoid()}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      await upsertProfessional({ userId: ctx.user.id, avatarUrl: url });
      return { url };
    }),
});
