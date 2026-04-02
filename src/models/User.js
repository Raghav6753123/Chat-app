import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    avatarUrl: { type: String, default: '' },
    bio: { type: String, default: '' },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: null },
    settings: {
      desktopNotifications: { type: Boolean, default: true },
      enterToSend: { type: Boolean, default: true },
      compactMode: { type: Boolean, default: false },
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
