import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RabbitmqService } from './rabbitmq.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'CHAT_SERVICE',
        imports: [ConfigModule],
        useFactory: async () => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              process.env.RABBITMQ_URL ||
                'amqp://admin:admin123@localhost:5672',
            ],
            queue: process.env.RABBITMQ_QUEUE || 'chat_queue',
            queueOptions: {
              durable: true,
            },
            exchanges: [
              {
                name: 'chat_exchange',
                type: 'topic',
              },
            ],
          },
        }),
        // inject: [ConfigService],
      },
    ]),
  ],
  providers: [RabbitmqService],
  exports: [RabbitmqService],
})
export class RabbitmqModule {}
