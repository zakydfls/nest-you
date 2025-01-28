import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Types } from 'mongoose';

export type ConversationDocument = Message & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Message {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Conversation' })
  conversation_id: Types.ObjectId;

  @Prop({ required: true })
  sender_id: string;

  @Prop({ required: true })
  receiver_id: string;

  @Prop({ required: true, default: 'text' })
  type: string;

  @Prop()
  text: string;

  @Prop()
  media: string;

  @Prop({ type: Object })
  data: Record<string, any>;

  @Prop({ default: 'sent' })
  status: string;

  @Prop()
  deleted_at: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
