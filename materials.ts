import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createMaterial, getMaterialById, getMaterials } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

export const materialsRouter = router({
  list: publicProcedure
    .input(z.object({ category: z.string().optional(), search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return getMaterials(input ?? {});
    }),

  get: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const material = await getMaterialById(input.id);
    if (!material) throw new TRPCError({ code: "NOT_FOUND" });
    return material;
  }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(["cards", "worksheets", "routines", "guides", "stories", "other"]),
        fileUrl: z.string().optional(),
        fileKey: z.string().optional(),
        mimeType: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        ageGroups: z.array(z.string()).optional(),
        cognitiveProfiles: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await createMaterial({
        uploadedBy: ctx.user.id,
        title: input.title,
        description: input.description ?? null,
        category: input.category,
        fileUrl: input.fileUrl ?? null,
        fileKey: input.fileKey ?? null,
        mimeType: input.mimeType ?? null,
        thumbnailUrl: input.thumbnailUrl ?? null,
        ageGroups: input.ageGroups ?? null,
        cognitiveProfiles: input.cognitiveProfiles ?? null,
        tags: input.tags ?? null,
        isPremium: false,
      isPublic: input.isPublic ?? true,
        downloadCount: 0,
      });
      return { id };
    }),

  getUploadUrl: protectedProcedure
    .input(z.object({ filename: z.string(), mimeType: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Return a presigned-style key for client to use
      const key = `materials/${ctx.user.id}/${nanoid()}-${input.filename}`;
      return { key };
    }),
});
