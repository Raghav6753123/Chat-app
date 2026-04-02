import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import Conversation from '@/models/Conversation';
import ConversationMember from '@/models/ConversationMember';
import Message from '@/models/Message';

async function getMembership(conversationId, userId) {
  return ConversationMember.findOne({ conversationId, userId }).lean();
}

export async function DELETE(request, context) {
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
  const membership = await getMembership(conversationId, authUser._id);
  if (!membership) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  if (conversation.isGroup) {
    await ConversationMember.deleteOne({
      conversationId,
      userId: authUser._id,
    });

    const remainingMembers = await ConversationMember.countDocuments({ conversationId });

    if (!remainingMembers) {
      await Promise.all([
        Conversation.deleteOne({ _id: conversationId }),
        Message.deleteMany({ conversationId }),
      ]);
    } else {
      conversation.memberCount = remainingMembers;
      await conversation.save();
    }

    return NextResponse.json({
      ok: true,
      action: 'left-group',
      removedConversationId: conversationId.toString(),
    });
  }

  await ConversationMember.deleteOne({
    conversationId,
    userId: authUser._id,
  });

  return NextResponse.json({
    ok: true,
    action: 'hidden-direct',
    removedConversationId: conversationId.toString(),
  });
}
