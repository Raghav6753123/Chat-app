import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import ConversationMember from '@/models/ConversationMember';
import Message from '@/models/Message';
import User from '@/models/User';
import { analyzeChatWithAI } from '@/lib/chat-analyzer';

export async function POST(request, context) {
  try {
    const authUser = await getAuthUserFromRequest(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    await connectDB();

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid conversation id' }, { status: 400 });
    }

    const conversationId = new mongoose.Types.ObjectId(id);
    const membership = await ConversationMember.findOne({ conversationId, userId: authUser._id }).lean();
    if (!membership) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const mode = body.mode || 'analyze';
    const tone = body.tone || 'friendly';

    const messages = await Message.find({
      conversationId,
      hiddenFor: { $ne: authUser._id },
    })
      .sort({ createdAt: -1 })
      .limit(40)
      .lean();

    if (!messages || messages.length < 2) {
      return NextResponse.json({ error: 'Not enough conversation yet. Send a few messages first.' }, { status: 400 });
    }

    messages.reverse();

    const senderIds = [...new Set(messages.map((message) => message.senderId.toString()))].map(
      (senderId) => new mongoose.Types.ObjectId(senderId)
    );
    const users = await User.find({ _id: { $in: senderIds } }).lean();
    const usersById = new Map(users.map((user) => [user._id.toString(), user]));

    const currentUserObj = await User.findById(authUser._id).lean();
    const currentUserName = currentUserObj?.name || 'Current User';

    const transcriptLines = messages.map(msg => {
      const senderName = msg.senderId.toString() === authUser._id.toString() 
        ? currentUserName 
        : (usersById.get(msg.senderId.toString())?.name || 'Unknown');
      
      const content = msg.type === 'text' ? msg.text : `[Shared ${msg.type}]`;
      return `${senderName}: ${content}`;
    });

    const chatText = transcriptLines.join('\n');

    const analysis = await analyzeChatWithAI({
      chatText,
      currentUserName,
      mode,
      tone
    });

    return NextResponse.json(analysis);

  } catch (error) {
    if (error.message === 'AI analyzer is not configured yet.') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Couldn't analyze this chat right now." }, { status: 500 });
  }
}
