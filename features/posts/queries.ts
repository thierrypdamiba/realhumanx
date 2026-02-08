import { db, schema } from "@/lib/db";
import { desc, eq, sql } from "drizzle-orm";

export async function createPost(data: {
  authorAlienId?: string;
  authorType: string;
  agentName?: string;
  isAnonymous?: boolean;
  content: string;
  postType: string;
  metadata?: Record<string, unknown>;
  parentId?: string;
}) {
  const [post] = await db.insert(schema.posts).values(data).returning();
  if (data.parentId) {
    await db.update(schema.posts)
      .set({ replyCount: sql`${schema.posts.replyCount} + 1` })
      .where(eq(schema.posts.id, data.parentId));
  }
  return post;
}

export async function getPosts(limit = 50, offset = 0) {
  return db.query.posts.findMany({
    orderBy: [desc(schema.posts.createdAt)],
    limit,
    offset,
  });
}

export async function getPostReplies(parentId: string) {
  return db.query.posts.findMany({
    where: eq(schema.posts.parentId, parentId),
    orderBy: [desc(schema.posts.createdAt)],
  });
}

export async function likePost(postId: string) {
  await db.update(schema.posts)
    .set({ likeCount: sql`${schema.posts.likeCount} + 1` })
    .where(eq(schema.posts.id, postId));
}
