import { z } from "zod";
import { getNotificationsByUser, markAllNotificationsRead, markNotificationRead } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const notificationsRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return getNotificationsByUser(ctx.user.id, input?.limit ?? 30);
    }),

  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await markNotificationRead(input.id);
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await markAllNotificationsRead(ctx.user.id);
    return { success: true };
  }),
});
