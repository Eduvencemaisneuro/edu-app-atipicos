import { and, desc, eq, inArray, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Badge,
  GameSession,
  InsertUser,
  LlmContent,
  Material,
  Notification,
  ProgressRecord,
  Professional,
  Report,
  Student,
  Video,
  badges,
  gameSessions,
  games,
  llmContent,
  materials,
  notifications,
  professionals,
  progressRecords,
  reports,
  studentBadges,
  students,
  users,
  videos,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Professionals ────────────────────────────────────────────────────────────
export async function getProfessionalByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(professionals).where(eq(professionals.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertProfessional(data: Partial<Professional> & { userId: number }) {
  const db = await getDb();
  if (!db) return;
  const existing = await getProfessionalByUserId(data.userId);
  if (existing) {
    await db.update(professionals).set(data).where(eq(professionals.userId, data.userId));
    return existing.id;
  } else {
    const result = await db.insert(professionals).values(data as any);
    return (result[0] as any).insertId as number;
  }
}

// ─── Students ─────────────────────────────────────────────────────────────────
export async function getStudentsByProfessional(professionalId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(students).where(and(eq(students.professionalId, professionalId), eq(students.isActive, true))).orderBy(desc(students.createdAt));
}

export async function getStudentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(students).where(eq(students.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createStudent(data: Omit<Student, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(students).values(data);
  return (result[0] as any).insertId as number;
}

export async function updateStudent(id: number, data: Partial<Student>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(students).set(data).where(eq(students.id, id));
}

// ─── Games ────────────────────────────────────────────────────────────────────
export async function getAllGames() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(games).where(eq(games.isActive, true)).orderBy(games.title);
}

export async function getGameById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(games).where(eq(games.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Game Sessions ────────────────────────────────────────────────────────────
export async function createGameSession(data: Omit<GameSession, "id" | "playedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(gameSessions).values(data);
  return (result[0] as any).insertId as number;
}

export async function getGameSessionsByStudent(studentId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(gameSessions).where(eq(gameSessions.studentId, studentId)).orderBy(desc(gameSessions.playedAt)).limit(limit);
}

export async function getStudentStats(studentId: number) {
  const db = await getDb();
  if (!db) return { totalSessions: 0, totalStars: 0, completedGames: 0 };
  const sessions = await db.select().from(gameSessions).where(eq(gameSessions.studentId, studentId));
  return {
    totalSessions: sessions.length,
    totalStars: sessions.reduce((sum, s) => sum + (s.starsEarned ?? 0), 0),
    completedGames: sessions.filter((s) => s.completed).length,
  };
}

// ─── Materials ────────────────────────────────────────────────────────────────
export async function getMaterials(filters?: { category?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(materials.isPublic, true)];
  if (filters?.category) conditions.push(eq(materials.category, filters.category as any));
  if (filters?.search) conditions.push(like(materials.title, `%${filters.search}%`));
  return db.select().from(materials).where(and(...conditions)).orderBy(desc(materials.createdAt));
}

export async function getMaterialById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(materials).where(eq(materials.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createMaterial(data: Omit<Material, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(materials).values(data);
  return (result[0] as any).insertId as number;
}

// ─── Videos ───────────────────────────────────────────────────────────────────
export async function getVideos(filters?: { category?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(videos.isPublic, true)];
  if (filters?.category) conditions.push(eq(videos.category, filters.category as any));
  if (filters?.search) conditions.push(like(videos.title, `%${filters.search}%`));
  return db.select().from(videos).where(and(...conditions)).orderBy(desc(videos.createdAt));
}

export async function createVideo(data: Omit<Video, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(videos).values(data);
  return (result[0] as any).insertId as number;
}

// ─── Progress Records ─────────────────────────────────────────────────────────
export async function getProgressByStudent(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(progressRecords).where(eq(progressRecords.studentId, studentId)).orderBy(desc(progressRecords.sessionDate));
}

export async function createProgressRecord(data: Omit<ProgressRecord, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(progressRecords).values(data);
  return (result[0] as any).insertId as number;
}

// ─── Badges ───────────────────────────────────────────────────────────────────
export async function getAllBadges() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(badges).orderBy(badges.name);
}

export async function getStudentBadges(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({ badge: badges, earnedAt: studentBadges.earnedAt })
    .from(studentBadges)
    .innerJoin(badges, eq(studentBadges.badgeId, badges.id))
    .where(eq(studentBadges.studentId, studentId));
  return result;
}

export async function awardBadge(studentId: number, badgeId: number, awardedBy?: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(studentBadges).where(and(eq(studentBadges.studentId, studentId), eq(studentBadges.badgeId, badgeId))).limit(1);
  if (existing.length > 0) return existing[0].id;
  const result = await db.insert(studentBadges).values({ studentId, badgeId, awardedBy });
  return (result[0] as any).insertId as number;
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function getNotificationsByUser(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function createNotification(data: Omit<Notification, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export async function getReportsByStudent(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reports).where(eq(reports.studentId, studentId)).orderBy(desc(reports.createdAt));
}

export async function createReport(data: Omit<Report, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(reports).values(data);
  return (result[0] as any).insertId as number;
}

export async function getReportById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── LLM Content ─────────────────────────────────────────────────────────────
export async function saveLlmContent(data: Omit<LlmContent, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(llmContent).values(data);
  return (result[0] as any).insertId as number;
}

export async function getLlmContentByStudent(studentId: number, contentType?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(llmContent.studentId, studentId)];
  if (contentType) conditions.push(eq(llmContent.contentType, contentType as any));
  return db.select().from(llmContent).where(and(...conditions)).orderBy(desc(llmContent.createdAt)).limit(10);
}
