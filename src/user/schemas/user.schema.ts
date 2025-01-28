import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum Role {
  ADMIN = 'admin',
  USER = 'user',
}

@Schema({
  timestamps: true,
})
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ default: '' })
  about: string;

  @Prop({ default: '' })
  avatar: string;

  @Prop({ type: [String], default: [] })
  interests: string[];

  @Prop({ default: '' })
  display_name: string;

  @Prop({ default: '' })
  gender: Gender;

  @Prop({ default: Role.USER })
  role: Role;

  @Prop({ type: Date, default: null })
  birthday: Date | null;

  @Prop({ default: '' })
  horoscope: string;

  @Prop({ default: '' })
  zodiac: string;

  @Prop({ default: '' })
  weight: string;

  @Prop({ default: '' })
  height: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
