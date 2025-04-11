import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { SendMessage } from './dtos/chat.dto';

@UseGuards(AuthGuard)
@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sendMessage')
  @ApiBearerAuth('JWT')
  async sendMessage(@Req() req, @Body() body: SendMessage) {
    return this.chatService.sendMessage(req.userId, body);
  }

  @Get('viewMessages')
  @ApiBearerAuth('JWT')
  async getMessages(
    @Req() req,
    @Query('conversationId') conversationId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.chatService.getMessages(
      req.userId,
      conversationId,
      page,
      limit,
    );
  }
}
