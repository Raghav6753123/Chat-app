import mongoose, { Schema } from 'mongoose';

const sharedMediaSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      required: true,
      index: true,
    },
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'file'], required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  }
);

const SharedMedia =
  mongoose.models.SharedMedia || mongoose.model('SharedMedia', sharedMediaSchema);

export default SharedMedia;
