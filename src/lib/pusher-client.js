import Pusher from 'pusher-js';

let pusherClientInstance;

function hasPusherClientConfig() {
  return Boolean(process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER);
}

export function getPusherClient() {
  if (typeof window === 'undefined' || !hasPusherClientConfig()) {
    return null;
  }

  if (!pusherClientInstance) {
    pusherClientInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      forceTLS: true,
      authEndpoint: '/api/pusher/auth',
    });
  }

  return pusherClientInstance;
}
