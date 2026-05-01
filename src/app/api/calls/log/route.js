import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUserFromRequest } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher-server';
import Conversation from '@/models/Conversation';
import ConversationMember from '@/models/ConversationMember';
import Message from '@/models/Message';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await connectDB();
    const currentUser = await getAuthUserFromRequest(request);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, callType, callStatus, durationText } = await request.json();

    if (!conversationId || !callType || !callStatus) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const isMember = await ConversationMember.exists({
      conversationId,
      userId: currentUser._id,
    });

    if (!isMember) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    let summaryText = '';
    if (callStatus === 'missed') {
      summaryText = `Missed ${callType} call`;
    } else if (callStatus === 'cancelled') {
      summaryText = `Cancelled ${callType} call`;
    } else {
      summaryText = `${callType === 'video' ? 'Video' : 'Voice'} call - ${durationText}`;
    }

    const newMessage = await Message.create({
      conversationId,
      senderId: currentUser._id,
      text: summaryText,
      type: 'call_log',
      callType,
      callStatus,
      duration: durationText || '',
      status: 'sent',
    });

    await Conversation.updateOne(
      { _id: conversationId },
      {
        $set: {
          lastMessage: summaryText,
          lastMessageTime: new Date(),
        },
      }
    );

    const serializedMessage = {
      id: newMessage._id.toString(),
      conversationId: newMessage.conversationId.toString(),
      senderId: newMessage.senderId.toString(),
      text: newMessage.text,
      type: newMessage.type,
      callType: newMessage.callType,
      callStatus: newMessage.callStatus,
      duration: newMessage.duration,
      status: newMessage.status,
      timestamp: new Date(newMessage.createdAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
      createdAt: newMessage.createdAt,
    };

    // Broadcast new message
    await pusherServer.trigger(`private-conversation-${conversationId}`, 'new-message', {
      conversationId,
      message: serializedMessage,
    });

    return NextResponse.json({ message: serializedMessage });
  } catch (error) {
    console.error('[Call Log Error]:', error);
    return NextResponse.json({ error: 'Failed to log call' }, { status: 500 });
  }
}
