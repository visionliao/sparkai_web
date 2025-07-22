import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { messages } = data;
    if (!messages) return NextResponse.json({ error: 'No messages' }, { status: 400 });

    const conversationsDir = path.join(process.cwd(), 'conversations');
    await mkdir(conversationsDir, { recursive: true });

    const filename = `conversation_${Date.now()}.json`;
    const filepath = path.join(conversationsDir, filename);

    await writeFile(filepath, JSON.stringify(messages, null, 2), 'utf-8');
    return NextResponse.json({ success: true, filename });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 