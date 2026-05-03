import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const file = path.join(process.cwd(), 'src/app/chatDashboard/components/chatDash.jsx');
  if (!fs.existsSync(file)) return NextResponse.json({ error: 'file not found' });
  
  let content = fs.readFileSync(file, 'utf8');
  const target = `isArchived:
                typeof preferences.isArchived === 'boolean'
                  ? preferences.isArchived
                  : conversation.isArchived,`;
  
  const replacement = `isArchived:
                typeof preferences.isArchived === 'boolean'
                  ? preferences.isArchived
                  : conversation.isArchived,
              wallpaper:
                typeof preferences.wallpaper === 'string'
                  ? preferences.wallpaper
                  : conversation.wallpaper,`;
                  
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content, 'utf8');
  
  return NextResponse.json({ success: true });
}
