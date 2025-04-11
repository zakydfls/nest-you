import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Token } from '../auth/schemas/token.schema';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsGuard implements CanActivate {
  constructor(
    @InjectModel(Token.name) private tokenModel: Model<Token>,
    private readonly logger: Logger = new Logger('WsGuard'),
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient<Socket>();
      const token =
        client.handshake.auth?.token || client.handshake.headers.authorization;

      this.logger.debug(`Validating socket connection for client ${client.id}`);

      if (!token) {
        this.logger.error('No token provided');
        throw new WsException('Unauthorized missing WStoken');
      }

      const tokenDoc = await this.tokenModel
        .findOne({
          token: token,
          active: true,
          expiryDate: { $gt: new Date() },
        })
        .exec();

      if (!tokenDoc) {
        this.logger.error(`Invalid token for client ${client.id}`);
        throw new WsException('Invalid token');
      }

      client['userId'] = tokenDoc.userId;
      this.logger.debug(`Socket authenticated for user: ${tokenDoc.userId}`);

      return true;
    } catch (error) {
      this.logger.error('Authentication failed:', error);
      throw new WsException('Unauthorized');
    }
  }
}
