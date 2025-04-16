import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectModel } from '@nestjs/mongoose';
import { Message, MessageDocument } from './schemas/chat.schema';
import {
  Conversation,
  ConversationDocument,
} from './schemas/conversation.schema';
import { UseGuards } from '@nestjs/common';
import { WsGuard } from 'src/guards/websocket.guard';
import { Token, TokenDocument } from 'src/auth/schemas/token.schema';
import { Model } from 'mongoose';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
@UseGuards(WsGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private connectedUsers = new Map<string, string>();

  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Token.name)
    private tokenModel: Model<TokenDocument>,
  ) {}

  // handleConnection(client: Socket) {
  //   console.log(`Client connected: ${client.id}`);
  // }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token || client.handshake.headers.authorization;

      if (!token) {
        client.disconnect();
        console.log(`Client connection rejected (no token): ${client.id}`);
        return;
      }

      const tokenDoc = await this.tokenModel
        .findOne({
          token,
          active: true,
          type: 'ws',
          expiryDate: { $gt: new Date() },
        })
        .exec();

      if (!tokenDoc) {
        client.disconnect();
        console.log(`Client connection rejected (invalid token): ${client.id}`);
        return;
      }

      client['userId'] = tokenDoc.userId;
      this.connectedUsers.set(client.id, tokenDoc.userId.toString());

      client.join(tokenDoc.userId.toString());

      client.emit('connectionSuccess', {
        userId: tokenDoc.userId.toString(),
        socketId: client.id,
        message: 'Successfully connected to chat server',
      });

      console.log(`Client connected: ${client.id} (user: ${tokenDoc.userId})`);
    } catch (err) {
      console.error('Connection error during token validation:', err);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      this.server.emit('userOffline', userId);
    }
    this.connectedUsers.delete(client.id);
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('register')
  handleRegister(client: Socket, userId: string) {
    this.connectedUsers.set(client.id, userId);
    this.server.emit('userOnline', userId);
    client.join(userId);
  }

  @SubscribeMessage('startConversation')
  async handleStartConversation(client: Socket, receiverId: string) {
    const senderId = this.connectedUsers.get(client.id);
    if (!senderId) return { error: 'User not registered' };

    let conversation = await this.conversationModel.findOne({
      participants: { $all: [senderId, receiverId.toString()] },
      isActive: true,
    });

    if (!conversation) {
      conversation = await this.conversationModel.create({
        participants: [senderId, receiverId.toString()],
        unreadCount: { [senderId]: 0, [receiverId]: 0 },
        lastMessageAt: new Date(),
      });
    }

    return { conversationId: conversation._id };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    client: Socket,
    payload: { conversationId: string; content: string; messageType?: string },
  ) {
    const senderId = this.connectedUsers.get(client.id);
    if (!senderId) return { error: 'User not registered' };

    const conversation = await this.conversationModel.findById(
      payload.conversationId,
    );
    if (!conversation) return { error: 'Conversation not found' };

    const message = await this.messageModel.create({
      conversationId: payload.conversationId,
      sender: senderId,
      content: payload.content,
      messageType: payload.messageType || 'text',
    });

    const receiverId = conversation.participants.find((p) => p !== senderId);
    await this.conversationModel.findByIdAndUpdate(payload.conversationId, {
      lastMessage: payload.content,
      lastSender: senderId,
      lastMessageAt: new Date(),
      $inc: { [`unreadCount.${receiverId}`]: 1 },
    });

    conversation.participants.forEach((participantId) => {
      this.server.to(participantId).emit('newMessage', {
        message,
        conversationId: payload.conversationId,
      });
    });

    client.emit('messageSent', {
      message,
      conversationId: payload.conversationId,
    });

    return message;
  }

  // @SubscribeMessage('sendMessage')
  // async handleMessage(
  //   client: Socket,
  //   payload: { conversationId: string; content: string; messageType?: string },
  // ) {
  //   const senderId = this.connectedUsers.get(client.id);
  //   if (!senderId) return { error: 'User not registered' };

  //   const conversation = await this.conversationModel.findById(
  //     payload.conversationId,
  //   );
  //   if (!conversation) return { error: 'Conversation not found' };

  //   const message = await this.messageModel.create({
  //     conversationId: payload.conversationId,
  //     sender: senderId,
  //     content: payload.content,
  //     messageType: payload.messageType || 'text',
  //   });

  //   const receiverId = conversation.participants.find((p) => p !== senderId);
  //   await this.conversationModel.findByIdAndUpdate(payload.conversationId, {
  //     lastMessage: payload.content,
  //     lastSender: senderId,
  //     lastMessageAt: new Date(),
  //     $inc: { [`unreadCount.${receiverId}`]: 1 },
  //   });

  //   conversation?.participants?.forEach((participantId) => {
  //     this.server.to(participantId).emit('newMessage', {
  //       message,
  //       conversationId: payload.conversationId,
  //     });
  //   });

  //   return message;
  // }

  @SubscribeMessage('getMessages')
  async handleGetMessages(
    client: Socket,
    payload: { conversationId: string; page?: number; limit?: number },
  ) {
    const senderId = this.connectedUsers.get(client.id);
    if (!senderId) return { error: 'User not registered' };

    const page = payload.page || 1;
    const limit = payload.limit || 20;
    const skip = (page - 1) * limit;

    const messages = await this.messageModel
      .find({ conversationId: payload.conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    console.log(messages.reverse());
    return messages.reverse();
  }

  @SubscribeMessage('getConversations')
  async handleGetConversations(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) return { error: 'User not registered' };

    const conversations = await this.conversationModel
      .find({
        participants: userId,
        isActive: true,
      })
      .sort({ lastMessageAt: -1 })
      .exec();

    console.log(conversations);
    return conversations;
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(client: Socket, conversationId: string) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) return { error: 'User not registered' };

    await this.messageModel.updateMany(
      {
        conversationId,
        sender: { $ne: userId },
        isRead: false,
      },
      { isRead: true },
    );

    await this.conversationModel.findByIdAndUpdate(conversationId, {
      $set: { [`unreadCount.${userId}`]: 0 },
    });

    const conversation = await this.conversationModel.findById(conversationId);
    conversation?.participants?.forEach((participantId) => {
      if (participantId !== userId) {
        this.server.to(participantId).emit('messagesRead', {
          conversationId,
          by: userId,
        });
      }
    });
  }

  @SubscribeMessage('typing')
  async handleTyping(client: Socket, payload: { conversationId: string }) {
    const senderId = this.connectedUsers.get(client.id);
    if (!senderId) return;

    const conversation = await this.conversationModel.findById(
      payload.conversationId,
    );
    if (!conversation) return;

    console.log(
      `User ${senderId} is typing in conversation ${payload.conversationId}`,
    );
    conversation?.participants?.forEach((participantId) => {
      if (participantId !== senderId) {
        this.server.to(participantId).emit('userTyping', {
          conversationId: payload.conversationId.toString(),
          userId: senderId,
        });
      }
    });
  }

  @SubscribeMessage('stopTyping')
  async handleStopTyping(client: Socket, payload: { conversationId: string }) {
    const senderId = this.connectedUsers.get(client.id);
    if (!senderId) return;

    const conversation = await this.conversationModel.findById(
      payload.conversationId,
    );
    if (!conversation) return;

    console.log(
      `User ${senderId} stopped typing in conversation ${payload.conversationId}`,
    );
    conversation.participants.forEach((participantId) => {
      if (participantId !== senderId) {
        this.server.to(participantId).emit('userStopTyping', {
          conversationId: payload.conversationId.toString(),
          userId: senderId,
        });
      }
    });
  }
}
