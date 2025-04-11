import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './schemas/chat.schema';
import {
  Conversation,
  ConversationDocument,
} from './schemas/conversation.schema';
import { UseGuards } from '@nestjs/common';
import { WsGuard } from 'src/guards/websocket.guard';
import { User } from 'src/user/schemas/user.schema';

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
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
  ) {}

  handleConnection(client: Socket) {
    try {
      const userId = client['userId'];
      if (userId) {
        this.connectedUsers.set(client.id, userId);
        console.log(`Client connected: ${client.id} (User: ${userId})`);
        client.emit('connectionSuccess', { userId });
      } else {
        // console.log('No userId found, disconnecting client');
        client.disconnect();
      }
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    try {
      const userId = this.connectedUsers.get(client.id);
      if (userId) {
        console.log(`Client disconnected: ${client.id} (User: ${userId})`);
        this.server.emit('userOffline', userId);
      }
      this.connectedUsers.delete(client.id);
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  @SubscribeMessage('register')
  handleRegister(client: Socket, userId: string) {
    this.connectedUsers.set(client.id, userId);
    this.server.emit('userOnline', userId);
    client.join(userId);
  }

  @SubscribeMessage('startConversation')
  async handleStartConversation(
    client: Socket,
    payload: { receiverId: string },
  ) {
    try {
      const senderId = client['userId']; // Gunakan userId dari WsGuard
      if (!senderId) return { error: 'User not authenticated' };
      if (senderId === payload.receiverId)
        return { error: 'Cannot start conversation with yourself' };

      // Check if receiver exists
      const receiverExists = await this.userModel.exists({
        _id: payload.receiverId,
      });
      if (!receiverExists) return { error: 'Receiver not found' };

      // Check for existing conversation
      let conversation = await this.conversationModel.findOne({
        participants: { $all: [senderId, payload.receiverId] },
        isActive: true,
      });

      if (!conversation) {
        conversation = await this.conversationModel.create({
          participants: [senderId, payload.receiverId],
          unreadCount: { [senderId]: 0, [payload.receiverId]: 0 },
          lastMessageAt: new Date(),
        });
      }

      // Emit to both participants
      this.server
        .to(senderId)
        .emit('conversationStarted', { conversationId: conversation._id });
      this.server
        .to(payload.receiverId)
        .emit('conversationStarted', { conversationId: conversation._id });

      return { conversationId: conversation._id };
    } catch (error) {
      console.error('Error starting conversation:', error);
      return { error: 'Failed to start conversation' };
    }
  }
  // @SubscribeMessage('startConversation')
  // async handleStartConversation(client: Socket, receiverId: string) {
  //   const senderId = this.connectedUsers.get(client.id);
  //   if (!senderId) return { error: 'User not registered' };

  //   let conversation = await this.conversationModel.findOne({
  //     participants: { $all: [senderId, receiverId] },
  //     isActive: true,
  //   });

  //   if (!conversation) {
  //     conversation = await this.conversationModel.create({
  //       participants: [senderId, receiverId],
  //       unreadCount: { [senderId]: 0, [receiverId]: 0 },
  //       lastMessageAt: new Date(),
  //     });
  //   }

  //   return { conversationId: conversation._id };
  // }

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

    // Create and save message
    const message = await this.messageModel.create({
      conversationId: payload.conversationId,
      sender: senderId,
      content: payload.content,
      messageType: payload.messageType || 'text',
    });

    // Update conversation
    const receiverId = conversation.participants.find((p) => p !== senderId);
    await this.conversationModel.findByIdAndUpdate(payload.conversationId, {
      lastMessage: payload.content,
      lastSender: senderId,
      lastMessageAt: new Date(),
      $inc: { [`unreadCount.${receiverId}`]: 1 },
    });

    // Emit to all participants
    conversation?.participants?.forEach((participantId) => {
      this.server.to(participantId).emit('newMessage', {
        message,
        conversationId: payload.conversationId,
      });
    });

    return message;
  }

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

    return conversations;
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(client: Socket, conversationId: string) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) return { error: 'User not registered' };

    // Mark messages as read
    await this.messageModel.updateMany(
      {
        conversationId,
        sender: { $ne: userId },
        isRead: false,
      },
      { isRead: true },
    );

    // Reset unread count
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
  async handleTyping(client: Socket, conversationId: string) {
    const senderId = this.connectedUsers.get(client.id);
    if (!senderId) return;

    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) return;

    conversation?.participants?.forEach((participantId) => {
      if (participantId !== senderId) {
        this.server.to(participantId).emit('userTyping', {
          conversationId,
          userId: senderId,
        });
      }
    });
  }

  @SubscribeMessage('stopTyping')
  async handleStopTyping(client: Socket, conversationId: string) {
    const senderId = this.connectedUsers.get(client.id);
    if (!senderId) return;

    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) return;

    conversation.participants.forEach((participantId) => {
      if (participantId !== senderId) {
        this.server.to(participantId).emit('userStopTyping', {
          conversationId,
          userId: senderId,
        });
      }
    });
  }
}
