import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Conversation extends Document {
  @Prop([{ type: String, required: true }])
  participants: string[];

  @Prop({ type: String })
  lastMessage: string;

  @Prop({ type: String })
  lastSender: string;

  @Prop({ type: Date })
  lastMessageAt: Date;

  @Prop({ type: Object, default: {} })
  unreadCount: {
    [userId: string]: number;
  };

  @Prop({ default: true })
  isActive: boolean;
}
export type ConversationDocument = Conversation & Document;
export const ConversationSchema = SchemaFactory.createForClass(Conversation);
