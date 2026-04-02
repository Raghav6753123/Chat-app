import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { getPusherServer } from '@/lib/pusher-server';
import ConversationMember from '@/models/ConversationMember';

const CHANNEL_PREFIX = 'private-conversation-';

export async function POST(request) {
  const authUser = await getAuthUserFromRequest(request);
  if (!authUser) {
    return unauthorizedResponse();
  }

  const pusherServer = getPusherServer();
  if (!pusherServer) {
    return NextResponse.json({ error: 'Realtime is not configured on the server' }, { status: 500 });
  }

  const body = await request.formData();
  const socketId = String(body.get('socket_id') || '');
  const channelName = String(body.get('channel_name') || '');

  if (!socketId || !channelName) {
    return NextResponse.json({ error: 'Missing socket_id or channel_name' }, { status: 400 });
  }

  if (!channelName.startsWith(CHANNEL_PREFIX)) {
    return NextResponse.json({ error: 'Invalid channel name' }, { status: 400 });
  }

  const conversationId = channelName.slice(CHANNEL_PREFIX.length);
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return NextResponse.json({ error: 'Invalid conversation id' }, { status: 400 });
  }

  await connectDB();

  const membership = await ConversationMember.findOne({
    conversationId: new mongoose.Types.ObjectId(conversationId),
    userId: authUser._id,
  }).lean();

  if (!membership) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const authResponse = typeof pusherServer.authorizeChannel === 'function'
    ? pusherServer.authorizeChannel(socketId, channelName)
    : pusherServer.authenticate(socketId, channelName);

  return NextResponse.json(authResponse);
}
