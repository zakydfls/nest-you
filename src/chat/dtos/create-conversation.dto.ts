import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateConversationDto {
  @IsNotEmpty()
  receiver_id: string;

  @IsNotEmpty()
  owner_id: string;
}
