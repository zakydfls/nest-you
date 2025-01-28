import { Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class RabbitmqService {
  constructor(@Inject('CHAT_SERVICE') private readonly client: ClientProxy) {}

  async publish(
    exchange: string,
    routingKey: string,
    data: any,
  ): Promise<void> {
    const pattern = { exchange, routingKey };
    try {
      await lastValueFrom(this.client.emit(pattern, data));
    } catch (error) {
      console.error('Error publishing to RabbitMQ:', error);
      throw error;
    }
  }

  async onApplicationBootstrap() {
    try {
      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }
}
