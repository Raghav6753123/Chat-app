import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import ConversationMember from '@/models/ConversationMember';
import Message from '@/models/Message';

export async function GET(request, context) {
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
  const membership = await ConversationMember.findOne({
    conversationId,
    userId: authUser._id,
  }).lean();

  if (!membership) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = Number.parseInt(searchParams.get('limit') || '24', 10);
  const skipParam = Number.parseInt(searchParams.get('skip') || '0', 10);
  const limit = Number.isNaN(limitParam) ? 24 : Math.min(Math.max(limitParam, 1), 100);
  const skip = Number.isNaN(skipParam) ? 0 : Math.max(skipParam, 0);

  const sharedMessages = await Message.find({
    conversationId,
    type: { $in: ['image', 'file'] },
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalCount = await Message.countDocuments({
    conversationId,
    type: { $in: ['image', 'file'] },
  });

  const media = sharedMessages
    .filter((item) => item.type === 'image')
    .map((item) => ({
      id: item._id.toString(),
      url: item.fileUrl || '',
      alt: item.fileName || 'Shared image',
      uploadedAt: item.createdAt,
    }))
    .filter((item) => item.url);

  const files = sharedMessages
    .filter((item) => item.type === 'file')
    .map((item) => ({
      id: item._id.toString(),
      name: item.fileName || 'Attachment',
      size: item.fileSize || '',
      url: item.fileUrl || '',
      date: new Date(item.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    }));

  return NextResponse.json({
    media,
    files,
    pagination: {
      totalCount,
      limit,
      skip,
      hasMore: skip + sharedMessages.length < totalCount,
    },
  });
}
