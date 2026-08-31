import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";

export const listMyLikes = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const user = await getSessionUser();
    if (!user) return [] as string[];
    const sql = await getSql();
    const rows = await sql<{ clip_id: string }>`
      select clip_id from clip_likes where user_id = ${user.id}
    `;
    return rows.map((row) => row.clip_id);
  },
);

export const likeClip = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((clipId: string) => clipId)
  .handler(async ({ context, data: clipId }) => {
    const sql = await getSql();
    await sql`
      insert into clip_likes (user_id, clip_id)
      values (${context.userId}, ${clipId})
      on conflict (user_id, clip_id) do nothing
    `;
    return { ok: true as const };
  });

export const unlikeClip = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((clipId: string) => clipId)
  .handler(async ({ context, data: clipId }) => {
    const sql = await getSql();
    await sql`
      delete from clip_likes
      where user_id = ${context.userId} and clip_id = ${clipId}
    `;
    return { ok: true as const };
  });
