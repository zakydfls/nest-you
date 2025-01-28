import { Controller, Delete, Get, Param, Post, Request } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  getConversations(@Request() req) {
    return this.chatService.getConversations(req.user.id);
  }

  @Post('conversations/:id/read')
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.chatService.markAsRead(id, req.user.id);
  }

  @Delete('messages/:id')
  deleteMessage(@Param('id') id: string, @Request() req) {
    return this.chatService.deleteMessage(id, req.user.id);
  }
}
