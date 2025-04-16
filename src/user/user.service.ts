import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { ProfileDto } from './dtos/profile.dto';
import { Helper } from 'src/common';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private helper: Helper,
  ) {}

  async createProfile(userId: string, profileDto: ProfileDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.display_name = profileDto.display_name || '';
    user.gender = profileDto.gender || '';
    user.birthday = profileDto.birthday || '';
    user.horoscope = profileDto.horoscope || '';
    user.zodiac = profileDto.zodiac || '';
    user.height = profileDto.height || '';
    user.weight = profileDto.weight || '';

    if (profileDto.interests?.length) {
      user.interests = profileDto.interests || [];
    }

    const updatedUser = await user.save();
    const { password, ...userWithoutPassword } = updatedUser.toObject();

    return userWithoutPassword;
  }

  async updateProfile(userId: string, profileDto: ProfileDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (profileDto.display_name !== undefined) {
      user.display_name = profileDto.display_name;
    }
    if (profileDto.gender !== undefined) {
      user.gender = profileDto.gender;
    }
    if (profileDto.birthday !== undefined) {
      user.birthday = profileDto.birthday;
      const horoscope = Helper.getHoroscope(profileDto.birthday);
      user.horoscope = horoscope;
      const zodiac = Helper.getZodiac(profileDto.birthday);
      user.zodiac = zodiac;
    }
    if (profileDto.height !== undefined) {
      user.height = profileDto.height;
    }
    if (profileDto.weight !== undefined) {
      user.weight = profileDto.weight;
    }

    if (profileDto.interests !== undefined) {
      await this.userModel.findByIdAndUpdate(
        userId,
        { $set: { interests: profileDto.interests } },
        { new: true },
      );
      user.interests = profileDto.interests;
    }
    const updatedUser = await user.save();
    const { password, ...userWithoutPassword } = updatedUser.toObject();

    return userWithoutPassword;
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  async removeInterest(userId: string, interest: string) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $pull: { interests: interest } },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  async deleteUser(userId: string) {
    const user = await this.userModel.findByIdAndDelete(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  async oneById(id: string) {
    return this.userModel.findById(id);
  }
}
