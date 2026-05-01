import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import { getPusherServer } from '@/lib/pusher-server';
import CallLog from '@/models/CallLog';
import Conversation from '@/models/Conversation';
import ConversationMember from '@/models/ConversationMember';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function durationFrom(call) {
  if (call.durationSeconds) {
    return call.durationSeconds;
  }

  if (!call.answeredAt || !call.endedAt) {
    return 0;
  }

  return Math.max(0, Math.round((new Date(call.endedAt) - new Date(call.answeredAt)) / 1000));
}

function formatDuration(seconds) {
  if (!seconds) {
    return '0:00';
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function serializeCall(call, authUserId, usersById = new Map(), conversation = null) {
  const caller = usersById.get(call.callerId.toString());
  const peerIds = call.participantIds
    .map((id) => id.toString())
    .filter((id) => id !== authUserId.toString());
  const peerNames = peerIds
    .map((id) => usersById.get(id)?.name)
    .filter(Boolean);
  const isOutgoing = call.callerId.toString() === authUserId.toString();
  const durationSeconds = durationFrom(call);

  return {
    id: call._id.toString(),
    conversationId: call.conversationId.toString(),
    conversationName: conversation?.name || '',
    type: call.type,
    status: call.status,
    isOutgoing,
    callerId: call.callerId.toString(),
    callerName: caller?.name || 'Unknown',
    participantIds: call.participantIds.map((id) => id.toString()),
    peerNames,
    startedAt: call.startedAt,
    answeredAt: call.answeredAt,
    endedAt: call.endedAt,
    durationSeconds,
    durationLabel: formatDuration(durationSeconds),
  };
}

async function getConversationContext(conversationId, authUserId) {
  const [conversation, members, membership] = await Promise.all([
    Conversation.findById(conversationId).lean(),
    ConversationMember.find({ conversationId }).lean(),
    ConversationMember.findOne({ conversationId, userId: authUserId }).lean(),
  ]);

  return { conversation, members, membership };
}

async function fanoutCallEvent(call, eventName, payload) {
  const pusherServer = getPusherServer();
  if (!pusherServer) {
    return;
  }

  await Promise.all(
    call.participantIds.map((userId) =>
      pusherServer.trigger(`private-user-${userId.toString()}`, eventName, payload)
    )
  );
}

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
  const { conversation, membership } = await getConversationContext(conversationId, authUser._id);
  if (!conversation || !membership) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const calls = await CallLog.find({
    conversationId,
    participantIds: authUser._id,
  })
    .sort({ startedAt: -1 })
    .limit(30)
    .lean();

  const userIds = [
    ...new Set(calls.flatMap((call) => [
      call.callerId.toString(),
      ...call.participantIds.map((id) => id.toString()),
    ])),
  ].map((userId) => new mongoose.Types.ObjectId(userId));
  const users = userIds.length ? await User.find({ _id: { $in: userIds } }).lean() : [];
  const usersById = new Map(users.map((user) => [user._id.toString(), user]));

  return NextResponse.json({
    calls: calls.map((call) => serializeCall(call, authUser._id, usersById, conversation)),
  });
}

export async function POST(request, context) {
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
  const { conversation, members, membership } = await getConversationContext(conversationId, authUser._id);
  if (!conversation || !membership) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const type = body.type === 'video' ? 'video' : 'audio';
  const participantIds = members.map((member) => member.userId);
  const recipientIds = participantIds.filter(
    (userId) => userId.toString() !== authUser._id.toString()
  );

  if (!recipientIds.length) {
    return NextResponse.json({ error: 'No other participant is available to call' }, { status: 400 });
  }

  const call = await CallLog.create({
    conversationId,
    callerId: authUser._id,
    participantIds,
    type,
    status: 'ringing',
    startedAt: new Date(),
  });

  const serialized = serializeCall(call.toObject(), authUser._id, new Map([[authUser._id.toString(), authUser]]), conversation);
  const payload = {
    call: {
      ...serialized,
      conversationName: conversation.isGroup
        ? conversation.name || 'Group call'
        : authUser.name,
    },
  };

  await fanoutCallEvent(
    { ...call.toObject(), participantIds: recipientIds },
    'incoming-call',
    payload
  ).catch(() => {});

  return NextResponse.json({ call: serialized }, { status: 201 });
}

export async function PATCH(request, context) {
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
  const { conversation, membership } = await getConversationContext(conversationId, authUser._id);
  if (!conversation || !membership) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const callId = body.callId;
  if (!callId || !mongoose.Types.ObjectId.isValid(callId)) {
    return NextResponse.json({ error: 'Valid callId is required' }, { status: 400 });
  }

  const call = await CallLog.findOne({
    _id: new mongoose.Types.ObjectId(callId),
    conversationId,
    participantIds: authUser._id,
  });

  if (!call) {
    return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  }

  const action = body.action;
  const now = new Date();

  if (action === 'accept') {
    if (call.status !== 'ringing') {
      return NextResponse.json({ error: 'This call is no longer ringing' }, { status: 409 });
    }
    call.status = 'active';
    call.answeredAt = now;
  } else if (action === 'decline') {
    if (call.status === 'completed') {
      return NextResponse.json({ error: 'This call has already ended' }, { status: 409 });
    }
    call.status = 'declined';
    call.endedAt = now;
    call.endedBy = authUser._id;
  } else if (action === 'missed') {
    if (call.status === 'ringing') {
      call.status = 'missed';
      call.endedAt = now;
    }
  } else if (action === 'end') {
    if (call.status === 'completed') {
      return NextResponse.json({ error: 'This call has already ended' }, { status: 409 });
    }
    call.status = call.answeredAt ? 'completed' : 'missed';
    call.endedAt = now;
    call.endedBy = authUser._id;
    call.durationSeconds = durationFrom(call);
  } else {
    return NextResponse.json({ error: 'Unsupported call action' }, { status: 400 });
  }

  await call.save();

  const users = await User.find({ _id: { $in: call.participantIds } }).lean();
  const usersById = new Map(users.map((user) => [user._id.toString(), user]));
  const serializedForUser = serializeCall(call.toObject(), authUser._id, usersById, conversation);

  const pusherServer = getPusherServer();
  if (pusherServer) {
    await Promise.all(
      call.participantIds.map(async (userId) => {
        const serialized = serializeCall(call.toObject(), userId, usersById, conversation);
        await pusherServer.trigger(`private-user-${userId.toString()}`, 'call-updated', {
          call: serialized,
          action,
          actorId: authUser._id.toString(),
        });
      })
    ).catch(() => {});
  }

  return NextResponse.json({ call: serializedForUser });
}
