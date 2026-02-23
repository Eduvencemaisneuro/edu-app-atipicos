import { and, asc, eq, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

// ─── Raw DB helpers (sem Drizzle ORM para tabelas criadas via SQL direto) ─────
async function queryBoards(professionalId: number, studentId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Use raw query via drizzle execute
  const conn = (db as any).session?.client ?? (db as any).$client;
  if (!conn) throw new Error("No DB connection");
  
  let sql = `SELECT * FROM aac_boards WHERE isActive = 1 AND (isTemplate = 1 OR professionalId = ?)`;
  const params: unknown[] = [professionalId];
  if (studentId) {
    sql += ` AND (studentId IS NULL OR studentId = ?)`;
    params.push(studentId);
  }
  sql += ` ORDER BY isTemplate DESC, createdAt DESC`;
  
  const [rows] = await conn.execute(sql, params);
  return rows as any[];
}

async function queryCards(boardId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conn = (db as any).session?.client ?? (db as any).$client;
  if (!conn) throw new Error("No DB connection");
  const [rows] = await conn.execute(
    `SELECT * FROM aac_cards WHERE boardId = ? AND isActive = 1 ORDER BY position ASC`,
    [boardId]
  );
  return rows as any[];
}

async function execSQL(sql: string, params: unknown[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conn = (db as any).session?.client ?? (db as any).$client;
  if (!conn) throw new Error("No DB connection");
  const [result] = await conn.execute(sql, params);
  return result as any;
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const aacRouter = router({

  // Listar pranchas (templates + do profissional)
  listBoards: protectedProcedure
    .input(z.object({ studentId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const prof = await execSQL(
        `SELECT id FROM professionals WHERE userId = ? LIMIT 1`,
        [ctx.user.id]
      );
      const profId = prof[0]?.id ?? 0;
      return queryBoards(profId, input.studentId);
    }),

  // Buscar prancha com cartões
  getBoard: protectedProcedure
    .input(z.object({ boardId: z.number() }))
    .query(async ({ ctx, input }) => {
      const board = await execSQL(
        `SELECT * FROM aac_boards WHERE id = ? AND isActive = 1 LIMIT 1`,
        [input.boardId]
      );
      if (!board[0]) throw new Error("Prancha não encontrada");
      const cards = await queryCards(input.boardId);
      return { ...board[0], cards };
    }),

  // Criar nova prancha
  createBoard: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      context: z.enum(["escola", "clinica", "casa", "biblioteca", "lazer", "alimentacao", "higiene", "transporte", "personalizado"]),
      description: z.string().optional(),
      studentId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const prof = await execSQL(
        `SELECT id FROM professionals WHERE userId = ? LIMIT 1`,
        [ctx.user.id]
      );
      const profId = prof[0]?.id ?? ctx.user.id;
      const result = await execSQL(
        `INSERT INTO aac_boards (professionalId, studentId, name, context, description, isTemplate) VALUES (?, ?, ?, ?, ?, 0)`,
        [profId, input.studentId ?? null, input.name, input.context, input.description ?? null]
      );
      return { id: result.insertId, success: true };
    }),

  // Clonar prancha template para o profissional
  cloneBoard: protectedProcedure
    .input(z.object({ boardId: z.number(), studentId: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const prof = await execSQL(
        `SELECT id FROM professionals WHERE userId = ? LIMIT 1`,
        [ctx.user.id]
      );
      const profId = prof[0]?.id ?? ctx.user.id;

      const board = await execSQL(
        `SELECT * FROM aac_boards WHERE id = ? LIMIT 1`,
        [input.boardId]
      );
      if (!board[0]) throw new Error("Prancha não encontrada");

      const newBoard = await execSQL(
        `INSERT INTO aac_boards (professionalId, studentId, name, context, description, isTemplate) VALUES (?, ?, ?, ?, ?, 0)`,
        [profId, input.studentId ?? null, `${board[0].name} (cópia)`, board[0].context, board[0].description]
      );
      const newBoardId = newBoard.insertId;

      const cards = await queryCards(input.boardId);
      for (const card of cards) {
        await execSQL(
          `INSERT INTO aac_cards (boardId, label, emoji, imageUrl, audioUrl, category, color, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [newBoardId, card.label, card.emoji, card.imageUrl, card.audioUrl, card.category, card.color, card.position]
        );
      }

      return { id: newBoardId, success: true };
    }),

  // Atualizar prancha
  updateBoard: protectedProcedure
    .input(z.object({
      boardId: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      context: z.enum(["escola", "clinica", "casa", "biblioteca", "lazer", "alimentacao", "higiene", "transporte", "personalizado"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const sets: string[] = [];
      const params: unknown[] = [];
      if (input.name) { sets.push("name = ?"); params.push(input.name); }
      if (input.description !== undefined) { sets.push("description = ?"); params.push(input.description); }
      if (input.context) { sets.push("context = ?"); params.push(input.context); }
      if (sets.length === 0) return { success: true };
      params.push(input.boardId);
      await execSQL(`UPDATE aac_boards SET ${sets.join(", ")} WHERE id = ?`, params);
      return { success: true };
    }),

  // Deletar prancha
  deleteBoard: protectedProcedure
    .input(z.object({ boardId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await execSQL(`UPDATE aac_boards SET isActive = 0 WHERE id = ?`, [input.boardId]);
      return { success: true };
    }),

  // Listar cartões de uma prancha
  listCards: protectedProcedure
    .input(z.object({ boardId: z.number() }))
    .query(async ({ ctx, input }) => {
      return queryCards(input.boardId);
    }),

  // Adicionar cartão
  addCard: protectedProcedure
    .input(z.object({
      boardId: z.number(),
      label: z.string().min(1),
      emoji: z.string().optional(),
      category: z.string().optional(),
      color: z.string().optional(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const maxPos = await execSQL(
        `SELECT MAX(position) as maxPos FROM aac_cards WHERE boardId = ?`,
        [input.boardId]
      );
      const nextPos = (maxPos[0]?.maxPos ?? 0) + 1;
      const result = await execSQL(
        `INSERT INTO aac_cards (boardId, label, emoji, imageUrl, category, color, position) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [input.boardId, input.label, input.emoji ?? null, input.imageUrl ?? null, input.category ?? "geral", input.color ?? "#6366f1", nextPos]
      );
      return { id: result.insertId, success: true };
    }),

  // Atualizar cartão
  updateCard: protectedProcedure
    .input(z.object({
      cardId: z.number(),
      label: z.string().optional(),
      emoji: z.string().optional(),
      category: z.string().optional(),
      color: z.string().optional(),
      imageUrl: z.string().optional(),
      audioUrl: z.string().optional(),
      position: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const sets: string[] = [];
      const params: unknown[] = [];
      if (input.label !== undefined) { sets.push("label = ?"); params.push(input.label); }
      if (input.emoji !== undefined) { sets.push("emoji = ?"); params.push(input.emoji); }
      if (input.category !== undefined) { sets.push("category = ?"); params.push(input.category); }
      if (input.color !== undefined) { sets.push("color = ?"); params.push(input.color); }
      if (input.imageUrl !== undefined) { sets.push("imageUrl = ?"); params.push(input.imageUrl); }
      if (input.audioUrl !== undefined) { sets.push("audioUrl = ?"); params.push(input.audioUrl); }
      if (input.position !== undefined) { sets.push("position = ?"); params.push(input.position); }
      if (sets.length === 0) return { success: true };
      params.push(input.cardId);
      await execSQL(`UPDATE aac_cards SET ${sets.join(", ")} WHERE id = ?`, params);
      return { success: true };
    }),

  // Deletar cartão
  deleteCard: protectedProcedure
    .input(z.object({ cardId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await execSQL(`UPDATE aac_cards SET isActive = 0 WHERE id = ?`, [input.cardId]);
      return { success: true };
    }),

  // Reordenar cartões
  reorderCards: protectedProcedure
    .input(z.object({
      boardId: z.number(),
      cardIds: z.array(z.number()),
    }))
    .mutation(async ({ ctx, input }) => {
      for (let i = 0; i < input.cardIds.length; i++) {
        await execSQL(`UPDATE aac_cards SET position = ? WHERE id = ?`, [i + 1, input.cardIds[i]]);
      }
      return { success: true };
    }),

  // Upload de áudio para cartão (base64 → S3)
  uploadCardAudio: protectedProcedure
    .input(z.object({
      cardId: z.number(),
      audioBase64: z.string(),
      mimeType: z.string().default("audio/webm"),
    }))
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.audioBase64, "base64");
      const ext = input.mimeType.includes("mp3") ? "mp3" : "webm";
      const key = `aac-audio/${ctx.user.id}-card-${input.cardId}-${nanoid(8)}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      await execSQL(`UPDATE aac_cards SET audioUrl = ? WHERE id = ?`, [url, input.cardId]);
      return { url, success: true };
    }),

  // Upload de imagem para cartão (base64 → S3)
  uploadCardImage: protectedProcedure
    .input(z.object({
      cardId: z.number(),
      imageBase64: z.string(),
      mimeType: z.string().default("image/jpeg"),
    }))
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.imageBase64, "base64");
      const ext = input.mimeType.includes("png") ? "png" : "jpg";
      const key = `aac-images/${ctx.user.id}-card-${input.cardId}-${nanoid(8)}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      await execSQL(`UPDATE aac_cards SET imageUrl = ? WHERE id = ?`, [url, input.cardId]);
      return { url, success: true };
    }),
});
