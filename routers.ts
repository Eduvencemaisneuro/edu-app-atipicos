import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { studentsRouter } from "./routers/students";
import { gamesRouter } from "./routers/games";
import { materialsRouter } from "./routers/materials";
import { videosRouter } from "./routers/videos";
import { progressRouter } from "./routers/progress";
import { reportsRouter } from "./routers/reports";
import { notificationsRouter } from "./routers/notifications";
import { llmRouter } from "./routers/llm";
import { professionalsRouter } from "./routers/professionals";
import { subscriptionRouter } from "./routers/subscription";
import { aacRouter } from "./routers/aac";
import { paymentRouter } from "./routers/payment";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  students: studentsRouter,
  games: gamesRouter,
  materials: materialsRouter,
  videos: videosRouter,
  progress: progressRouter,
  reports: reportsRouter,
  notifications: notificationsRouter,
  llm: llmRouter,
  professionals: professionalsRouter,
  subscription: subscriptionRouter,
  aac: aacRouter,
  payment: paymentRouter,
});

export type AppRouter = typeof appRouter;
