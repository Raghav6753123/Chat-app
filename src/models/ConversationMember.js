import mongoose, { Schema } from 'mongoose';

const conversationMemberSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
    isMuted: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    unreadCount: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

conversationMemberSchema.index({ conversationId: 1, userId: 1 }, { unique: true });

const ConversationMember =
  mongoose.models.ConversationMember ||
  mongoose.model('ConversationMember', conversationMemberSchema);

export default ConversationMember;
