import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './schemas/chat.schema';
import { CreateMessageDto } from './dtos/chat.dto';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      client.join(userId);
      console.log(`User ${userId} connected`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`User ${client.id} disconnected`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() createMessageDto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { content, senderId, receiverId } = createMessageDto;

    const message = new this.messageModel({ content, senderId, receiverId });
    await message.save();

    this.server.to(receiverId).to(senderId).emit('message', message);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(userId);
    console.log(`User ${userId} joined room`);
  }
}
