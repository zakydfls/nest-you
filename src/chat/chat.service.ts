import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Conversation } from './schemas/conversation.schema';
import { Message } from './schemas/message.schema';
import { Model } from 'mongoose';
import { CreateMessageDto } from './dtos/create-message.dto';
import { CreateConversationDto } from './dtos/create-conversation.dto';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<Conversation>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    private readonly rabbitmqService: RabbitmqService,
  ) {}

  async createConversation(
    createConversationDto: CreateConversationDto,
  ): Promise<Conversation> {
    const existingConversation = await this.conversationModel.findOne({
      $or: [
        {
          owner_id: createConversationDto.owner_id,
          receiver_id: createConversationDto.receiver_id,
        },
        {
          owner_id: createConversationDto.receiver_id,
          receiver_id: createConversationDto.owner_id,
        },
      ],
      status: 'active',
    });

    if (existingConversation) {
      return existingConversation;
    }

    const conversation = new this.conversationModel({
      ...createConversationDto,
      participants: [
        createConversationDto.owner_id,
        createConversationDto.receiver_id,
      ],
    });
    return conversation.save();
  }

  async createMessage(createMessageDto: CreateMessageDto): Promise<Message> {
    const conversation = await this.conversationModel.findById(
      createMessageDto.conversation_id,
    );
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const message = new this.messageModel(createMessageDto);
    await message.save();

    // Update conversation
    const updateData: any = {
      last_message: createMessageDto.text || 'Media message',
      last_message_at: new Date(),
    };

    if (!conversation.first_message_at) {
      updateData.first_message_at = new Date();
    }

    if (conversation.owner_id !== createMessageDto.sender_id) {
      updateData.$inc = { unread_count: 1 };
    }

    await this.conversationModel.findByIdAndUpdate(
      createMessageDto.conversation_id,
      updateData,
    );

    // Publish to RabbitMQ for notifications
    await this.rabbitmqService.publish('chat_exchange', 'new_message', {
      message,
      conversation_id: createMessageDto.conversation_id,
    });

    return message;
  }

  async getConversations(userId: number): Promise<Conversation[]> {
    return this.conversationModel
      .find({
        participants: userId,
        status: 'active',
      })
      .sort({ last_message_at: -1, created_at: -1 });
  }

  async getMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ messages: Message[]; total: number }> {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.messageModel
        .find({
          conversation_id: conversationId,
          deleted_at: null,
        })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      this.messageModel.countDocuments({
        conversation_id: conversationId,
        deleted_at: null,
      }),
    ]);

    return { messages, total };
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    await this.conversationModel.findOneAndUpdate(
      {
        _id: conversationId,
        receiver_id: userId,
      },
      {
        unread_count: 0,
      },
    );
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.messageModel.findById(messageId);
    if (!message || message.sender_id !== userId) {
      throw new NotFoundException('Message not found or unauthorized');
    }

    await this.messageModel.findByIdAndUpdate(messageId, {
      deleted_at: new Date(),
    });
  }

  async findMessageById(messageId: string): Promise<Message | null> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      return null;
    }
    return message;
  }
}
