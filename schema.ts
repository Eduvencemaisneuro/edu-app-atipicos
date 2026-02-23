import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  profileType: mysqlEnum("profileType", ["professional", "student", "guardian"]).default("professional"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Professionals ────────────────────────────────────────────────────────────
export const professionals = mysqlTable("professionals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  specialty: varchar("specialty", { length: 128 }),
  institution: varchar("institution", { length: 256 }),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Professional = typeof professionals.$inferSelect;

// ─── Students ─────────────────────────────────────────────────────────────────
export const students = mysqlTable("students", {
  id: int("id").autoincrement().primaryKey(),
  professionalId: int("professionalId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  birthDate: timestamp("birthDate"),
  gender: mysqlEnum("gender", ["male", "female", "other", "not_informed"]).default("not_informed"),
  avatarUrl: text("avatarUrl"),
  // Diagnóstico e perfil cognitivo
  diagnosis: json("diagnosis").$type<string[]>(),
  cognitiveProfile: mysqlEnum("cognitiveProfile", ["tea", "tdah", "di", "down", "dyslexia", "language", "typical", "other"]).default("typical"),
  ageGroup: mysqlEnum("ageGroup", ["0-3", "4-6", "7-10", "11-14", "15-18"]).default("4-6"),
  // Necessidades e adaptações
  specificNeeds: text("specificNeeds"),
  adaptations: text("adaptations"),
  communicationLevel: mysqlEnum("communicationLevel", ["non_verbal", "emerging", "functional", "verbal"]).default("verbal"),
  // Configurações de interface
  reducedStimulus: boolean("reducedStimulus").default(false),
  visualSupport: boolean("visualSupport").default(true),
  difficultyLevel: mysqlEnum("difficultyLevel", ["basic", "intermediate", "advanced"]).default("basic"),
  // Observações gerais
  notes: text("notes"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

// ─── Games ────────────────────────────────────────────────────────────────────
export const games = mysqlTable("games", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["cognitive", "language", "socioemotional", "sensory", "motor", "math"]).notNull(),
  ageGroups: json("ageGroups").$type<string[]>(),
  cognitiveProfiles: json("cognitiveProfiles").$type<string[]>(),
  difficultyLevel: mysqlEnum("difficultyLevel", ["basic", "intermediate", "advanced"]).default("basic"),
  gameType: varchar("gameType", { length: 64 }).notNull(), // memory, emotion, sequence, attention, words, numbers, etc.
  thumbnailUrl: text("thumbnailUrl"),
  isPremium: boolean("isPremium").default(false),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Game = typeof games.$inferSelect;

// ─── Game Sessions ────────────────────────────────────────────────────────────
export const gameSessions = mysqlTable("game_sessions", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  gameId: int("gameId").notNull(),
  professionalId: int("professionalId"),
  score: int("score").default(0),
  maxScore: int("maxScore").default(100),
  duration: int("duration").default(0), // segundos
  completed: boolean("completed").default(false),
  starsEarned: int("starsEarned").default(0),
  sessionData: json("sessionData").$type<Record<string, unknown>>(),
  playedAt: timestamp("playedAt").defaultNow().notNull(),
});

export type GameSession = typeof gameSessions.$inferSelect;

// ─── Materials ────────────────────────────────────────────────────────────────
export const materials = mysqlTable("materials", {
  id: int("id").autoincrement().primaryKey(),
  uploadedBy: int("uploadedBy").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["cards", "worksheets", "routines", "guides", "stories", "other"]).notNull(),
  fileUrl: text("fileUrl"),
  fileKey: text("fileKey"),
  mimeType: varchar("mimeType", { length: 128 }),
  thumbnailUrl: text("thumbnailUrl"),
  ageGroups: json("ageGroups").$type<string[]>(),
  cognitiveProfiles: json("cognitiveProfiles").$type<string[]>(),
  tags: json("tags").$type<string[]>(),
  isPremium: boolean("isPremium").default(false),
  isPublic: boolean("isPublic").default(true),
  downloadCount: int("downloadCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Material = typeof materials.$inferSelect;

// ─── Videos ───────────────────────────────────────────────────────────────────
export const videos = mysqlTable("videos", {
  id: int("id").autoincrement().primaryKey(),
  uploadedBy: int("uploadedBy").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["lecture", "activity", "social_story", "tutorial", "therapy", "other"]).notNull(),
  videoType: mysqlEnum("videoType", ["youtube", "upload"]).default("youtube"),
  youtubeUrl: text("youtubeUrl"),
  fileUrl: text("fileUrl"),
  fileKey: text("fileKey"),
  thumbnailUrl: text("thumbnailUrl"),
  duration: int("duration").default(0), // segundos
  ageGroups: json("ageGroups").$type<string[]>(),
  cognitiveProfiles: json("cognitiveProfiles").$type<string[]>(),
  tags: json("tags").$type<string[]>(),
  isPremium: boolean("isPremium").default(false),
  isPublic: boolean("isPublic").default(true),
  viewCount: int("viewCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Video = typeof videos.$inferSelect;

// ─── Progress Records ─────────────────────────────────────────────────────────
export const progressRecords = mysqlTable("progress_records", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  professionalId: int("professionalId").notNull(),
  recordType: mysqlEnum("recordType", ["observation", "evolution", "behavior", "development", "session"]).notNull(),
  title: varchar("title", { length: 256 }),
  content: text("content").notNull(),
  attachmentUrl: text("attachmentUrl"),
  attachmentKey: text("attachmentKey"),
  sessionDate: timestamp("sessionDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProgressRecord = typeof progressRecords.$inferSelect;

// ─── Badges ───────────────────────────────────────────────────────────────────
export const badges = mysqlTable("badges", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 64 }).notNull(),
  color: varchar("color", { length: 32 }).notNull(),
  category: mysqlEnum("category", ["games", "progress", "streak", "milestone", "special"]).notNull(),
  requirement: text("requirement"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Badge = typeof badges.$inferSelect;

export const studentBadges = mysqlTable("student_badges", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  badgeId: int("badgeId").notNull(),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
  awardedBy: int("awardedBy"),
});

export type StudentBadge = typeof studentBadges.$inferSelect;

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  professionalId: int("professionalId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  content: text("content").notNull(),
  period: varchar("period", { length: 64 }),
  fileUrl: text("fileUrl"),
  fileKey: text("fileKey"),
  isShared: boolean("isShared").default(false),
  sharedWith: json("sharedWith").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Report = typeof reports.$inferSelect;

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  studentId: int("studentId"),
  type: mysqlEnum("type", ["activity_completed", "milestone_reached", "attention_needed", "badge_earned", "report_ready", "system"]).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false),
  data: json("data").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;

// ─── Subscriptions ──────────────────────────────────────────────────────────────
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  plan: mysqlEnum("plan", ["free", "starter", "basic", "professional", "team_small", "team_medium", "enterprise"]).default("free").notNull(),
  status: mysqlEnum("status", ["active", "cancelled", "expired", "trialing"]).default("active").notNull(),
  // Limites do plano gratuito
  studentsUsed: int("studentsUsed").default(0).notNull(),
  reportsUsedThisMonth: int("reportsUsedThisMonth").default(0).notNull(),
  llmUsedThisMonth: int("llmUsedThisMonth").default(0).notNull(),
  // Datas
  trialEndsAt: timestamp("trialEndsAt"),
  currentPeriodStart: timestamp("currentPeriodStart").defaultNow(),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelledAt: timestamp("cancelledAt"),
  // Stripe identifiers
  stripeCustomerId: varchar("stripeCustomerId", { length: 64 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 64 }),
  stripePriceId: varchar("stripePriceId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Subscription = typeof subscriptions.$inferSelect;;

// ─── LLM Generated Content ────────────────────────────────────────────────────
export const llmContent = mysqlTable("llm_content", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  professionalId: int("professionalId").notNull(),
  contentType: mysqlEnum("contentType", ["activity_sheet", "game_suggestion", "educational_content", "progress_summary"]).notNull(),
  prompt: text("prompt"),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LlmContent = typeof llmContent.$inferSelect;
