import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUserFromRequest } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await connectDB();
    const currentUser = await getAuthUserFromRequest(request);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, targetUserId, signalType, sdp, candidate, callType, callId } = await request.json();

    if (!conversationId || !signalType) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Forward the signal to the target user via a user-specific private channel or conversation channel.
    // We'll use the private-conversation channel to broadcast to participants, 
    // and the client will check targetUserId or senderId.
    await pusherServer.trigger(`private-conversation-${conversationId}`, 'call-signal', {
      senderId: currentUser._id.toString(),
      senderName: currentUser.name,
      senderAvatar: currentUser.avatarUrl,
      targetUserId, // if null, it's for anyone in the 1-on-1
      conversationId,
      signalType, // 'offer', 'answer', 'ice-candidate', 'end', 'reject'
      sdp,
      candidate,
      callType, // 'audio', 'video'
      callId, // unique ID for this call session
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Call Signal Error]:', error);
    return NextResponse.json({ error: 'Failed to send signal' }, { status: 500 });
  }
}
