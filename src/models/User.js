import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    avatarUrl: { type: String, default: '' },
    bio: { type: String, default: '' },
    status: {
      type: String,
      enum: ['available', 'busy', 'away', 'offline'],
      default: 'available'
    },
    statusText: { type: String, default: '' },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: null },
    settings: {
      desktopNotifications: { type: Boolean, default: true },
      enterToSend: { type: Boolean, default: true },
      compactMode: { type: Boolean, default: false },
      themeMode: {
        type: String,
        enum: ['system', 'light', 'dark'],
        default: 'system'
      },
      accentColor: {
        type: String,
        enum: ['sky', 'emerald', 'rose', 'slate'],
        default: 'sky'
      },
      chatAppearance: {
        bubbleStyle: {
          type: String,
          enum: ['rounded', 'compact', 'minimal'],
          default: 'rounded'
        },
        density: {
          type: String,
          enum: ['comfortable', 'compact'],
          default: 'comfortable'
        },
        fontSize: {
          type: String,
          enum: ['small', 'default', 'large'],
          default: 'default'
        }
      }
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
