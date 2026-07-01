import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export type CommentRecord = {
  id: string;
  slideRel: string;
  email: string;
  body: string;
  createdAt: number;
};

type CommentStore = { comments: CommentRecord[] };

export function getCommentsPath(): string {
  return (
    process.env.KIND_COMMENTS_PATH?.trim() ||
    path.resolve(process.cwd(), 'data', 'kind-comments.json')
  );
}

async function readStore(filePath: string): Promise<CommentStore> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as CommentStore;
    if (Array.isArray(parsed.comments)) return parsed;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
  }
  return { comments: [] };
}

async function writeStore(filePath: string, store: CommentStore): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}

export async function listComments(slideRel?: string): Promise<CommentRecord[]> {
  const filePath = getCommentsPath();
  const store = await readStore(filePath);
  const list = store.comments.sort((a, b) => b.createdAt - a.createdAt);
  if (!slideRel) return list;
  return list.filter((c) => c.slideRel === slideRel);
}

export async function addComment(
  slideRel: string,
  email: string,
  body: string,
): Promise<CommentRecord> {
  const trimmed = body.trim();
  if (!trimmed || trimmed.length > 4000) {
    throw new Error('invalid body');
  }
  if (!slideRel || slideRel.includes('..')) {
    throw new Error('invalid slide');
  }
  const filePath = getCommentsPath();
  const store = await readStore(filePath);
  const record: CommentRecord = {
    id: randomUUID(),
    slideRel,
    email: email.trim().toLowerCase(),
    body: trimmed,
    createdAt: Date.now(),
  };
  store.comments.push(record);
  await writeStore(filePath, store);
  return record;
}
