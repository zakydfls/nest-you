import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';
import { RegisterUserDto } from './dtos/requests/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dtos/requests/login.dto';
import { JwtService } from '@nestjs/jwt';
import { Token } from './schemas/token.schema';
import { v4 as uuidv4 } from 'uuid';
import { RefreshDto } from './dtos/requests/refresh.dto';
import { TokenPayload } from './dtos/interface/token.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Token.name) private tokenModel: Model<Token>,
    private jwtService: JwtService,
  ) {}
  async register(registerDto: RegisterUserDto) {
    // check email and username is unique
    const inUse = await this.userModel.exists({
      $or: [{ email: registerDto.email }, { username: registerDto.username }],
    });
    if (inUse) {
      return {
        errors: 'Email or username already in use',
      };
    }

    // hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    if (registerDto.password !== registerDto.password_confirmation) {
      return {
        errors: 'Password and password confirmation must match',
      };
    }

    // create user
    const user = await this.userModel.create({
      ...registerDto,
      password: hashedPassword,
    });

    const { password, ...userWithoutPassword } = user.toObject();

    return userWithoutPassword;
  }

  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async login(loginDto: LoginUserDto) {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({
      email,
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.generateUserToken(user.id);
    const refreshToken = uuidv4();
    const socketToken = uuidv4();

    const token = await this.tokenModel.create({
      token: refreshToken,
      userId: user.id,
      type: 'refresh',
      expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      active: true,
    });
    const wsToken = await this.tokenModel.create({
      token: socketToken,
      userId: user.id,
      type: 'ws',
      expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      active: true,
    });

    return { accessToken, refreshToken, socketToken, userId: user.id };
  }

  async generateUserToken(userId: string) {
    const TokenPayload: TokenPayload = {
      userId: userId,
    };
    const accessToken = this.jwtService.sign(TokenPayload, { expiresIn: '1d' });
    return accessToken;
  }

  async refreshToken(refreshToken: RefreshDto) {
    const token = await this.tokenModel.findOne({
      token: refreshToken.refreshToken,
      expiryDate: { $gte: new Date() },
    });
    if (!token) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.userModel.findById(token.userId);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    const accessToken = await this.generateUserToken(user.id);
    return { accessToken };
  }

  async logout(userId: string) {
    await this.tokenModel.deleteMany({
      userId: userId,
      type: 'refresh',
    });

    await this.tokenModel.deleteMany({
      userId: userId,
      type: 'ws',
    });

    return { message: 'Logged out successfully' };
  }
}
