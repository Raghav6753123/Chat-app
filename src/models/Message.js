import mongoose, { Schema } from 'mongoose';

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: { type: String, default: '' },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'voice', 'call_log'],
      default: 'text',
    },
    callType: { type: String, enum: ['voice', 'video'], default: null },
    callStatus: { type: String, enum: ['missed', 'completed', 'cancelled'], default: null },
    status: {
      type: String,
      enum: ['sending', 'sent', 'delivered', 'read'],
      default: 'sent',
    },
    fileUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },
    fileSize: { type: String, default: '' },
    duration: { type: String, default: '' },
    hiddenFor: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    replyToId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
    reactions: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    minimize: false, // Ensures empty reaction objects are saved
  }
);

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

export default Message;
