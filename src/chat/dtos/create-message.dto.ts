import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsObject,
  IsNumber,
} from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsString()
  conversation_id: string;

  @IsNotEmpty()
  sender_id: string;

  @IsNotEmpty()
  receiver_id: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  media?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}
