import { Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './schemas/chat.schema';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import {
  Conversation,
  ConversationSchema,
} from './schemas/conversation.schema';
import { Token, TokenSchema } from 'src/auth/schemas/token.schema';
import { UserSchema } from 'src/user/schemas/user.schema';
import { AuthService } from 'src/auth/auth.service';
import { ChatController } from './chat.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: Token.name, schema: TokenSchema },
      { name: 'User', schema: UserSchema },
    ]),
  ],
  providers: [ChatGateway, ChatService, Logger, AuthService],
  controllers: [ChatController],
})
export class ChatModule {}
