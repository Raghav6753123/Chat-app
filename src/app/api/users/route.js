import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import User from '@/models/User';

export async function GET(request) {
  const authUser = await getAuthUserFromRequest(request);
  if (!authUser) {
    return unauthorizedResponse();
  }

  await connectDB();

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('query') || '').trim();

  const filter = {
    _id: { $ne: authUser._id },
  };

  if (query) {
    filter.$or = [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
    ];
  }

  const users = await User.find(filter)
    .sort({ name: 1 })
    .limit(20)
    .lean();

  return NextResponse.json({
    users: users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      isOnline: Boolean(user.isOnline),
    })),
  });
}
