import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ required: true, type: String })
  conversationId: string;

  @Prop({ required: true })
  sender: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: 'text' })
  messageType: string;

  @Prop({ default: false })
  isRead: boolean;
}
export type MessageDocument = Message & Document;
export const MessageSchema = SchemaFactory.createForClass(Message);
