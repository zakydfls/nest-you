import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageDocument = Conversation & Document;

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
export class Conversation {
  @Prop({ required: true })
  receiver_id: string;

  @Prop({ required: true })
  owner_id: string;

  @Prop({ default: 0 })
  unread_count: number;

  @Prop()
  first_message_at: Date;

  @Prop()
  last_message: string;

  @Prop()
  last_message_at: Date;

  @Prop({ default: 'active' })
  status: string;

  @Prop({ type: [Number], default: [] })
  participants: number[];
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
