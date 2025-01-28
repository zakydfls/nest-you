import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Socket } from 'socket.io';
import { CreateMessageDto } from './dtos/create-message.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private logger = new Logger('ChatGateway');
  private connectedUsers = new Map<string, string>();

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.connectedUsers.set(userId, client.id);
      this.logger.log(`Client connected: ${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = Array.from(this.connectedUsers.entries()).find(
      ([_, socketId]) => socketId === client.id,
    )?.[0];

    if (userId) {
      this.connectedUsers.delete(userId);
      this.logger.log(`Client disconnected: ${userId}`);
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await client.join(conversationId);
      return { status: 'joined', room: conversationId };
    } catch (error) {
      this.logger.error(`Error joining room: ${error.message}`);
      throw new WsException('Could not join room');
    }
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await client.leave(conversationId);
      return { status: 'left', room: conversationId };
    } catch (error) {
      this.logger.error(`Error leaving room: ${error.message}`);
      throw new WsException('Could not leave room');
    }
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const message = await this.chatService.createMessage(data);

      client.to(data.conversation_id).emit('new_message', message);

      const receiverSocketId = this.connectedUsers.get(data.receiver_id);
      if (receiverSocketId) {
        client.to(receiverSocketId).emit('new_message_notification', {
          message,
          conversation_id: data.conversation_id,
        });
      }

      return message;
    } catch (error) {
      this.logger.error('Error sending message:', error);
      throw new WsException('Could not send message');
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { conversation_id: string; user_id: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      client.to(data.conversation_id).emit('user_typing', {
        user_id: data.user_id,
        conversation_id: data.conversation_id,
      });
    } catch (error) {
      this.logger.error('Error handling typing event:', error);
      throw new WsException('Could not handle typing event');
    }
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @MessageBody() data: { conversation_id: string; user_id: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.chatService.markAsRead(data.conversation_id, data.user_id);

      // Notify other participants that messages have been read
      client.to(data.conversation_id).emit('messages_read', {
        conversation_id: data.conversation_id,
        user_id: data.user_id,
      });

      return { status: 'success' };
    } catch (error) {
      this.logger.error('Error marking messages as read:', error);
      throw new WsException('Could not mark messages as read');
    }
  }

  @SubscribeMessage('delete_message')
  async handleDeleteMessage(
    @MessageBody() data: { message_id: string; user_id: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.chatService.deleteMessage(data.message_id, data.user_id);

      const message = await this.chatService.findMessageById(data.message_id);
      if (message) {
        client.to(message.conversation_id.toString()).emit('message_deleted', {
          message_id: data.message_id,
        });
      }

      return { status: 'success' };
    } catch (error) {
      this.logger.error('Error deleting message:', error);
      throw new WsException('Could not delete message');
    }
  }

  // Helper method to get all connected users
  private getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  // Helper method to check if a user is online
  private isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}
