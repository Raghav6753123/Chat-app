import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Conversation from '@/models/Conversation';
import ConversationMember from '@/models/ConversationMember';
import Message from '@/models/Message';
import User from '@/models/User';
import { getPusherServer } from '@/lib/pusher-server';
import { toClockTime } from '@/lib/formatters';

export async function POST(request) {
  try {
    await connectDB();
    const now = new Date();
    
    const messagesToProcess = await Message.find({
      status: 'scheduled',
      scheduledFor: { $lte: now }
    }).lean();

    if (!messagesToProcess.length) {
      return NextResponse.json({ success: true, processed: 0 });
    }

    const pusherServer = getPusherServer();

    for (const msg of messagesToProcess) {
      // update message status
      await Message.updateOne({ _id: msg._id }, { $set: { status: 'sent', createdAt: now } });
      
      const text = (msg.text || '').trim();
      const type = msg.type || 'text';

      // Update conversation
      await Conversation.updateOne(
        { _id: msg.conversationId },
        { $set: { lastMessage: text || type, lastMessageTime: now } }
      );

      // Update unread count
      await ConversationMember.updateMany(
        {
          conversationId: msg.conversationId,
          userId: { $ne: msg.senderId },
        },
        { $inc: { unreadCount: 1 } }
      );

      if (pusherServer) {
        // We need sender details for serialize
        const sender = await User.findById(msg.senderId).lean();
        
        const serializedMessage = {
          id: msg._id.toString(),
          senderId: msg.senderId.toString(),
          senderName: sender?.name || 'Unknown',
          text: msg.text,
          timestamp: toClockTime(now),
          status: 'sent',
          type: msg.type,
          fileUrl: msg.fileUrl || undefined,
          fileName: msg.fileName || undefined,
          fileSize: msg.fileSize || undefined,
          duration: msg.duration || undefined,
          replyTo: msg.replyToId?.toString() || undefined,
          createdAt: now,
          isEdited: false,
          reactions: msg.reactions || {},
        };

        try {
          await pusherServer.trigger(`private-conversation-${msg.conversationId.toString()}`, 'new-message', {
            conversationId: msg.conversationId.toString(),
            message: serializedMessage,
          });
        } catch {}
      }
    }

    return NextResponse.json({ success: true, processed: messagesToProcess.length });
  } catch (error) {
    console.error('Failed to process scheduled messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
