import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const files = [
    path.join(process.cwd(), 'src/app/chatDashboard/components/convoList.jsx'),
    path.join(process.cwd(), 'src/app/chatDashboard/components/chatWindow.jsx'),
    path.join(process.cwd(), 'src/app/chatDashboard/components/contactInfoPAge.jsx'),
  ];

  const replacements = [
    { search: /bg-white/g, replace: 'bg-[var(--app-surface)]' },
    { search: /text-slate-900/g, replace: 'text-[var(--app-text)]' },
    { search: /text-gray-900/g, replace: 'text-[var(--app-text)]' },
    { search: /text-slate-800/g, replace: 'text-[var(--app-text)]' },
    { search: /text-gray-800/g, replace: 'text-[var(--app-text)]' },
    { search: /text-slate-700/g, replace: 'text-[var(--app-text)]' },
    { search: /text-gray-700/g, replace: 'text-[var(--app-text)]' },
    { search: /border-slate-100/g, replace: 'border-[var(--app-border)]' },
    { search: /border-slate-200/g, replace: 'border-[var(--app-border)]' },
    { search: /border-gray-100/g, replace: 'border-[var(--app-border)]' },
    { search: /border-gray-200/g, replace: 'border-[var(--app-border)]' },
    { search: /border-slate-300/g, replace: 'border-[var(--app-border)]' },
    { search: /border-gray-300/g, replace: 'border-[var(--app-border)]' },
    { search: /hover:bg-slate-50/g, replace: 'hover:bg-[var(--app-border)]' },
    { search: /hover:bg-gray-50/g, replace: 'hover:bg-[var(--app-border)]' },
    { search: /hover:bg-slate-100/g, replace: 'hover:bg-[var(--app-border)]' },
    { search: /hover:bg-gray-100/g, replace: 'hover:bg-[var(--app-border)]' },
    { search: /bg-slate-50([^/])/g, replace: 'bg-[var(--app-bg)]$1' },
    { search: /bg-gray-50([^/])/g, replace: 'bg-[var(--app-bg)]$1' },
    { search: /bg-slate-100([^/])/g, replace: 'bg-[var(--app-bg)]$1' },
    { search: /bg-gray-100([^/])/g, replace: 'bg-[var(--app-bg)]$1' },
    { search: /text-slate-600/g, replace: 'text-[var(--app-muted)]' },
    { search: /text-slate-500/g, replace: 'text-[var(--app-muted)]' },
    { search: /text-gray-600/g, replace: 'text-[var(--app-muted)]' },
    { search: /text-gray-500/g, replace: 'text-[var(--app-muted)]' },
    // Fix any potential duplicates if the script runs twice
    { search: /bg-\[var\(--app-surface\)\]([^/])var\(--app-surface\)\]/g, replace: 'bg-[var(--app-surface)]' },
  ];

  let results = [];
  files.forEach(file => {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      replacements.forEach(({ search, replace }) => {
        content = content.replace(search, replace);
      });
      fs.writeFileSync(file, content, 'utf8');
      results.push(`Updated ${file}`);
    } else {
      results.push(`File not found: ${file}`);
    }
  });

  return NextResponse.json({ success: true, results });
}
