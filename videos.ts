import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createVideo, getVideos } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const videosRouter = router({
  list: publicProcedure
    .input(z.object({ category: z.string().optional(), search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return getVideos(input ?? {});
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(["lecture", "activity", "social_story", "tutorial", "therapy", "other"]),
        videoType: z.enum(["youtube", "upload"]),
        youtubeUrl: z.string().optional(),
        fileUrl: z.string().optional(),
        fileKey: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        duration: z.number().optional(),
        ageGroups: z.array(z.string()).optional(),
        cognitiveProfiles: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await createVideo({
        uploadedBy: ctx.user.id,
        title: input.title,
        description: input.description ?? null,
        category: input.category,
        videoType: input.videoType,
        youtubeUrl: input.youtubeUrl ?? null,
        fileUrl: input.fileUrl ?? null,
        fileKey: input.fileKey ?? null,
        thumbnailUrl: input.thumbnailUrl ?? null,
        duration: input.duration ?? 0,
        ageGroups: input.ageGroups ?? null,
        cognitiveProfiles: input.cognitiveProfiles ?? null,
        tags: input.tags ?? null,
        isPremium: false,
      isPublic: input.isPublic ?? true,
        viewCount: 0,
      });
      return { id };
    }),
});
