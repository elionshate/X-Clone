import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, DeleteUserDto } from './dto/user.dto';

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
  async getUserByUsername(
    @Param('username') username: string,
    @Query('requestingUserId') requestingUserId?: string,
  ) {
    const reqUserId = requestingUserId ? parseInt(requestingUserId) : undefined;
    const user = await this.userService.getUserByUsername(username, reqUserId);
    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
    }
    return user;
  }

  @Patch(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() deleteUserDto?: DeleteUserDto,
  ) {
    return this.userService.deleteUser(id, deleteUserDto?.clerkUserId);
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

  // Block endpoints
  @Post(':blockerId/block/:blockedId')
  async blockUser(
    @Param('blockerId', ParseIntPipe) blockerId: number,
    @Param('blockedId', ParseIntPipe) blockedId: number,
  ) {
    return this.userService.blockUser(blockerId, blockedId);
  }

  @Delete(':blockerId/block/:blockedId')
  async unblockUser(
    @Param('blockerId', ParseIntPipe) blockerId: number,
    @Param('blockedId', ParseIntPipe) blockedId: number,
  ) {
    return this.userService.unblockUser(blockerId, blockedId);
  }

  @Get(':blockerId/is-blocked/:blockedId')
  async isBlocked(
    @Param('blockerId', ParseIntPipe) blockerId: number,
    @Param('blockedId', ParseIntPipe) blockedId: number,
  ) {
    const isBlocked = await this.userService.isBlocked(blockerId, blockedId);
    return { isBlocked };
  }

  @Get(':id/blocked')
  async getBlockedUsers(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getBlockedUsers(id);
  }

  // Mute endpoints
  @Post(':muterId/mute/:mutedId')
  async muteUser(
    @Param('muterId', ParseIntPipe) muterId: number,
    @Param('mutedId', ParseIntPipe) mutedId: number,
  ) {
    return this.userService.muteUser(muterId, mutedId);
  }

  @Delete(':muterId/mute/:mutedId')
  async unmuteUser(
    @Param('muterId', ParseIntPipe) muterId: number,
    @Param('mutedId', ParseIntPipe) mutedId: number,
  ) {
    return this.userService.unmuteUser(muterId, mutedId);
  }

  @Get(':muterId/is-muted/:mutedId')
  async isMuted(
    @Param('muterId', ParseIntPipe) muterId: number,
    @Param('mutedId', ParseIntPipe) mutedId: number,
  ) {
    const isMuted = await this.userService.isMuted(muterId, mutedId);
    return { isMuted };
  }

  @Get(':id/muted')
  async getMutedUsers(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getMutedUsers(id);
  }

  // Report endpoints
  @Post(':reporterId/report/:reportedId')
  async reportUser(
    @Param('reporterId', ParseIntPipe) reporterId: number,
    @Param('reportedId', ParseIntPipe) reportedId: number,
    @Body('reason') reason: string,
  ) {
    return this.userService.reportUser(reporterId, reportedId, reason);
  }

  // Relationship status endpoint
  @Get(':currentUserId/relationship/:targetUserId')
  async getUserRelationshipStatus(
    @Param('currentUserId', ParseIntPipe) currentUserId: number,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
  ) {
    return this.userService.getUserRelationshipStatus(currentUserId, targetUserId);
  }
}
