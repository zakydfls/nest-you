import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './schemas/chat.schema';
import {
  Conversation,
  ConversationDocument,
} from './schemas/conversation.schema';
import { SendMessage } from './dtos/chat.dto';
import { UserDocument } from 'src/user/schemas/user.schema';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel('User') private userModel: Model<UserDocument>,
    private readonly chatGateway: ChatGateway,
  ) {}

  async sendMessage(senderId: string, messageReq: SendMessage) {
    let conversation = await this.conversationModel.findById(
      messageReq.conversationId,
    );

    if (!conversation) {
      const receiverId = messageReq.payload.receiverId;
      if (!receiverId)
        throw new Error('Receiver ID is required to start conversation');

      conversation = await this.conversationModel.create({
        participants: [senderId, receiverId],
        unreadCount: { [senderId]: 0, [receiverId]: 0 },
        lastMessageAt: new Date(),
      });
    }

    if (!conversation.participants.includes(senderId)) {
      throw new Error('Sender is not part of the conversation');
    }

    const receiverId = conversation.participants.find((p) => p !== senderId);
    const message = await this.messageModel.create({
      conversationId: conversation.id,
      sender: senderId,
      content: messageReq.payload.content,
      messageType: 'text',
    });

    await this.conversationModel.findByIdAndUpdate(conversation._id, {
      lastMessage: messageReq.payload.content,
      lastSender: senderId,
      lastMessageAt: new Date(),
      $inc: { [`unreadCount.${receiverId}`]: 1 },
    });

    this.chatGateway.newMessage(message, conversation);

    return message;
  }

  async getMessages(
    userId: string,
    conversationId: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;
    const messages = await this.messageModel
      .find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return messages.reverse();
  }
}
