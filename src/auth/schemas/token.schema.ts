import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Date, Document } from 'mongoose';

@Schema({
  timestamps: true,
})
export class Token extends Document {
  @Prop({ required: true })
  token: string;
  @Prop({ required: true, type: mongoose.Types.ObjectId, ref: 'User' })
  userId: mongoose.Types.ObjectId;
  @Prop({ required: true, type: Date })
  expiryDate: Date;
  @Prop({ required: true })
  active: boolean;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
