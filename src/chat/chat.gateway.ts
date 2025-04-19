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
import { error } from 'console';
import { UserDocument } from 'src/user/schemas/user.schema';

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
  // private handleError(
  //   client: Socket,
  //   type: ErrorResponse['type'],
  //   message: string,
  //   details?: any,
  // ): { error: ErrorResponse } {
  //   const error: ErrorResponse = { type, message, details };
  //   client.emit('error', error);
  //   return { error };
  // }

  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Token.name)
    private tokenModel: Model<TokenDocument>,
    @InjectModel('User') private userModel: Model<UserDocument>,
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

      console.log(`Client connected: ${client.id} (user: ${tokenDoc})`);
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
  async handleStartConversation(
    client: Socket,
    payload: { receiverId: string },
  ) {
    try {
      const senderId = this.connectedUsers.get(client.id);
      if (!senderId) {
        return { error: 'User not registered' };
      }

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

      return { conversationId: conversation._id };
    } catch (error) {
      console.error('Error starting conversation:', error);
      return {
        error: 'Failed to start conversation',
      };
    }
  }

  async newMessage(
    message: MessageDocument,
    conversation: ConversationDocument,
  ) {
    conversation.participants.forEach((participantId) => {
      this.server.to(participantId).emit('newMessage', {
        message,
      });
    });
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    client: Socket,
    payload: { conversationId: string; content: string; messageType?: string },
  ) {
    try {
      const senderId = this.connectedUsers.get(client.id);
      if (!senderId) {
        return { error: 'User not registered' };
      }
      const conversation = await this.conversationModel.findById(
        payload.conversationId,
      );
      if (!conversation) {
        return { error: 'Conversation not found' };
      }

      if (!conversation.participants.includes(senderId)) {
        return { error: 'User not part of the conversation' };
      }

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

      await this.newMessage(message, conversation);

      client.emit('messageSent', {
        message,
        conversationId: payload.conversationId,
      });

      console.log(
        `Message sent from ${senderId} to ${receiverId} in conversation ${payload.conversationId}`,
      );

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        error: 'Failed to send message',
      };
    }
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
    try {
      const senderId = this.connectedUsers.get(client.id);
      if (!senderId) return { error: 'User not registered' };

      const conversation = await this.conversationModel.findById(
        payload.conversationId,
      );

      if (!conversation) return { error: 'Conversation not found' };

      if (!conversation.participants.includes(senderId)) {
        return { error: 'User not part of the conversation' };
      }

      const page = payload.page || 1;
      const limit = payload.limit || 20;
      const skip = (page - 1) * limit;

      const messages = await this.messageModel
        .find({ conversationId: payload.conversationId })
        .skip(skip)
        .limit(limit)
        .exec();

      console.log(messages.reverse());
      return messages.reverse();
    } catch (error) {
      return {
        error: 'Failed to fetch messages',
      };
    }
  }

  @SubscribeMessage('getConversations')
  async handleGetConversations(
    client: Socket,
    payload: { page?: number; limit?: number; search?: string },
  ) {
    try {
      const userId = this.connectedUsers.get(client.id);
      if (!userId) return { error: 'User not registered' };

      const page = payload?.page || 1;
      const limit = payload?.limit || 20;
      const skip = (page - 1) * limit;

      let query: any = {
        participants: userId,
        isActive: true,
      };

      if (payload?.search) {
        query.lastMessage = { $regex: payload.search, $options: 'i' };
      }

      const totalCount = await this.conversationModel.countDocuments(query);

      const conversations = await this.conversationModel
        .find(query)
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'lastMessage',
          select: 'content messageType createdAt',
        })
        .lean()
        .exec();

      const unreadCounts = await this.messageModel.aggregate([
        {
          $match: {
            conversationId: {
              $in: conversations.map((c) => c._id.toString()),
            },
            sender: { $ne: userId },
            isRead: false,
          },
        },
        {
          $group: {
            _id: '$conversationId',
            count: { $sum: 1 },
          },
        },
      ]);

      const opponentIds = conversations
        .map((c) => c.participants.find((id) => id !== userId))
        .filter(Boolean);

      const users = await this.userModel
        .find({ _id: { $in: opponentIds } })
        .select('_id username')
        .lean();

      const userMap = new Map(users.map((u) => [u._id.toString(), u.username]));

      const formattedConversations = conversations.map((conversation) => {
        const opponentId = conversation.participants.find(
          (id) => id !== userId,
        );
        const opponentUsername =
          userMap.get(opponentId?.toString() || '') || 'Unknown';

        const unreadCount =
          unreadCounts.find(
            (uc) => uc._id.toString() === conversation._id.toString(),
          )?.count || 0;

        return {
          ...conversation,
          opponentId,
          opponentUsername,
          unreadCount,
          isOnline: opponentId ? this.connectedUsers.has(opponentId) : false,
        };
      });

      return {
        conversations: formattedConversations,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit),
          hasMore: page * limit < totalCount,
        },
      };
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return {
        error: 'Failed to fetch conversations',
      };
    }
  }

  // @SubscribeMessage('getConversations')
  // async handleGetConversations(client: Socket) {
  //   const userId = this.connectedUsers.get(client.id);
  //   if (!userId) return { error: 'User not registered' };

  //   const conversations = await this.conversationModel
  //     .find({
  //       participants: userId,
  //       isActive: true,
  //     })
  //     .sort({ lastMessageAt: -1 })
  //     .exec();

  //   console.log(conversations);
  //   return conversations;
  // }

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

  private typingUsers = new Map<string, NodeJS.Timeout>(); // Track typing timeouts
  private readonly TYPING_TIMEOUT = 3000; // 3 seconds timeout

  // Helper method to generate typing key
  private getTypingKey(userId: string, conversationId: string): string {
    return `${userId}-${conversationId}`;
  }

  // Helper to clear typing timeout
  private clearTypingTimeout(userId: string, conversationId: string) {
    const key = this.getTypingKey(userId, conversationId);
    if (this.typingUsers.has(key)) {
      clearTimeout(this.typingUsers.get(key));
      this.typingUsers.delete(key);
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(client: Socket, payload: { conversationId: string }) {
    try {
      const senderId = this.connectedUsers.get(client.id);
      if (!senderId) {
        return { error: 'User not registered' };
      }

      const conversation = await this.conversationModel.findById(
        payload.conversationId,
      );

      if (!conversation) {
        return { error: 'Conversation not found' };
      }

      if (!conversation.participants.includes(senderId)) {
        return { error: 'User not part of the conversation' };
      }

      // Clear existing timeout if any
      this.clearTypingTimeout(senderId, payload.conversationId);

      // Set new timeout
      const timeout = setTimeout(() => {
        this.handleStopTyping(client, payload);
      }, this.TYPING_TIMEOUT);

      // Store the timeout
      const key = this.getTypingKey(senderId, payload.conversationId);
      this.typingUsers.set(key, timeout);

      // Notify other participants
      conversation.participants.forEach((participantId) => {
        if (participantId !== senderId) {
          this.server.to(participantId).emit('userTyping', {
            conversationId: payload.conversationId,
            userId: senderId,
            timestamp: new Date(),
          });
        }
      });
    } catch (error) {
      console.error('Error handling typing event:', error);
      return { error: 'Failed to handle typing event' };
    }
  }

  // @SubscribeMessage('typing')
  // async handleTyping(client: Socket, payload: { conversationId: string }) {
  //   const senderId = this.connectedUsers.get(client.id);
  //   if (!senderId) return;

  //   const conversation = await this.conversationModel.findById(
  //     payload.conversationId,
  //   );
  //   if (!conversation) return;

  //   console.log(
  //     `User ${senderId} is typing in conversation ${payload.conversationId}`,
  //   );
  //   conversation?.participants?.forEach((participantId) => {
  //     if (participantId !== senderId) {
  //       this.server.to(participantId).emit('userTyping', {
  //         conversationId: payload.conversationId,
  //         userId: senderId,
  //       });
  //     }
  //   });
  // }

  @SubscribeMessage('stopTyping')
  async handleStopTyping(client: Socket, payload: { conversationId: string }) {
    try {
      const senderId = this.connectedUsers.get(client.id);
      if (!senderId) return;

      const conversation = await this.conversationModel.findById(
        payload.conversationId,
      );
      if (!conversation) return;

      // Clear the typing timeout
      this.clearTypingTimeout(senderId, payload.conversationId);

      // Notify other participants
      conversation.participants.forEach((participantId) => {
        if (participantId !== senderId) {
          this.server.to(participantId).emit('userStopTyping', {
            conversationId: payload.conversationId,
            userId: senderId,
            timestamp: new Date(),
          });
        }
      });
    } catch (error) {
      console.error('Error handling stop typing event:', error);
    }
  }

  // @SubscribeMessage('stopTyping')
  // async handleStopTyping(client: Socket, payload: { conversationId: string }) {
  //   const senderId = this.connectedUsers.get(client.id);
  //   if (!senderId) return;

  //   const conversation = await this.conversationModel.findById(
  //     payload.conversationId,
  //   );
  //   if (!conversation) return;

  //   console.log(
  //     `User ${senderId} stopped typing in conversation ${payload.conversationId}`,
  //   );
  //   conversation.participants.forEach((participantId) => {
  //     if (participantId !== senderId) {
  //       this.server.to(participantId).emit('userStopTyping', {
  //         conversationId: payload.conversationId.toString(),
  //         userId: senderId,
  //       });
  //     }
  //   });
  // }
}
