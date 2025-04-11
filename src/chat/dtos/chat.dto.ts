import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

interface MessagePayload {
  content: string;
  messageType?: string;
  receiverId?: string;
}

export class SendMessage {
  @IsString()
  // nullable
  @IsOptional()
  conversationId: string;
  // content: string;
  @IsNotEmpty()
  payload: MessagePayload;
}
