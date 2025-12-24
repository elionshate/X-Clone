import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Get()
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserById(id);
  }

  @Get('username/:username')
  async getUserByUsername(@Param('username') username: string) {
    return this.userService.getUserByUsername(username);
  }

  @Patch(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.deleteUser(id);
  }

  @Post(':followerId/follow/:followingId')
  async followUser(
    @Param('followerId', ParseIntPipe) followerId: number,
    @Param('followingId', ParseIntPipe) followingId: number,
  ) {
    return this.userService.followUser(followerId, followingId);
  }

  @Delete(':followerId/follow/:followingId')
  async unfollowUser(
    @Param('followerId', ParseIntPipe) followerId: number,
    @Param('followingId', ParseIntPipe) followingId: number,
  ) {
    return this.userService.unfollowUser(followerId, followingId);
  }

  @Get(':id/followers')
  async getFollowers(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getFollowers(id);
  }

  @Get(':id/following')
  async getFollowing(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getFollowing(id);
  }

  @Get(':followerId/is-following/:followingId')
  async isFollowing(
    @Param('followerId', ParseIntPipe) followerId: number,
    @Param('followingId', ParseIntPipe) followingId: number,
  ) {
    const isFollowing = await this.userService.isFollowing(
      followerId,
      followingId,
    );
    return { isFollowing };
  }
}
