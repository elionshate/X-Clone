import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Put,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { TweetService } from './tweet.service';
import { CreateTweetDto, UpdateTweetDto, UpdateTweetLikesDto } from './dto/tweet.dto';

@Controller('tweets')
export class TweetController {
  constructor(private tweetService: TweetService) {}

  @Post()
  async createTweet(@Body() createTweetDto: CreateTweetDto) {
    return this.tweetService.createTweet(createTweetDto);
  }

  @Get()
  async getAllTweets(
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
    @Query('excludeUserId') excludeUserId?: string,
  ) {
    const excludeId = excludeUserId ? parseInt(excludeUserId) : undefined;
    return this.tweetService.getAllTweets(parseInt(skip), parseInt(take), excludeId);
  }

  @Get('search')
  async searchTweets(
    @Query('q') query: string,
    @Query('userId') userId?: string,
  ) {
    const userIdNum = userId ? parseInt(userId) : undefined;
    return this.tweetService.searchTweets(query, userIdNum);
  }

  @Get(':id')
  async getTweetById(@Param('id', ParseIntPipe) id: number) {
    return this.tweetService.getTweetById(id);
  }

  @Get('user/:userId')
  async getTweetsByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
  ) {
    return this.tweetService.getTweetsByUserId(userId, parseInt(skip), parseInt(take));
  }

  @Get('following/:userId')
  async getFollowingTweets(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
  ) {
    return this.tweetService.getFollowingTweets(userId, parseInt(skip), parseInt(take));
  }

  @Get('for-you/:userId')
  async getForYouTweets(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
  ) {
    return this.tweetService.getForYouTweets(userId, parseInt(skip), parseInt(take));
  }

  @Delete(':id')
  async deleteTweet(@Param('id', ParseIntPipe) id: number) {
    return this.tweetService.deleteTweet(id);
  }

  @Patch(':id/content')
  async updateTweetContent(
    @Param('id', ParseIntPipe) id: number,
    @Body('content') content: string,
  ) {
    return this.tweetService.updateTweetContent(id, content);
  }

  @Put(':id')
  async updateTweet(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTweetDto: UpdateTweetDto,
  ) {
    return this.tweetService.updateTweet(id, updateTweetDto);
  }

  @Patch(':id/likes')
  async updateTweetLikes(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTweetLikesDto,
  ) {
    return this.tweetService.updateTweetLikes(id, updateDto);
  }

  @Post(':id/like')
  async likeTweet(
    @Param('id', ParseIntPipe) id: number,
    @Body('actorId') actorId?: number,
  ) {
    return this.tweetService.incrementLikes(id, actorId);
  }

  @Post(':id/unlike')
  async unlikeTweet(
    @Param('id', ParseIntPipe) id: number,
    @Body('actorId') actorId?: number,
  ) {
    return this.tweetService.decrementLikes(id, actorId);
  }

  @Get('likes/user/:userId')
  async getLikesByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
  ) {
    return this.tweetService.getLikesByUserId(userId, parseInt(skip), parseInt(take));
  }

  @Get(':tweetId/hasLiked/:userId')
  async hasUserLiked(
    @Param('tweetId', ParseIntPipe) tweetId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.tweetService.hasUserLiked(userId, tweetId);
  }

  @Get('likes/ids/:userId')
  async getLikedTweetIds(@Param('userId', ParseIntPipe) userId: number) {
    return this.tweetService.getLikedTweetIds(userId);
  }

  @Post(':id/retweet')
  async retweetTweet(
    @Param('id', ParseIntPipe) id: number,
    @Body('actorId') actorId?: number,
  ) {
    return this.tweetService.incrementRetweets(id, actorId);
  }

  @Post(':id/unRetweet')
  async unretweetTweet(
    @Param('id', ParseIntPipe) id: number,
    @Body('actorId') actorId?: number,
  ) {
    return this.tweetService.decrementRetweets(id, actorId);
  }

  @Get('retweets/user/:userId')
  async getRetweetsByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
  ) {
    return this.tweetService.getRetweetsByUserId(userId, parseInt(skip), parseInt(take));
  }

  @Get(':tweetId/hasRetweeted/:userId')
  async hasUserRetweeted(
    @Param('tweetId', ParseIntPipe) tweetId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.tweetService.hasUserRetweeted(userId, tweetId);
  }

  @Patch(':id/retweets')
  async updateRetweetCount(
    @Param('id', ParseIntPipe) id: number,
    @Body('retweetCount') retweetCount: number,
  ) {
    return this.tweetService.updateTweetRetweets(id, retweetCount);
  }

  @Post(':id/view')
  async incrementViews(@Param('id', ParseIntPipe) id: number) {
    return this.tweetService.incrementViews(id);
  }

  @Post('views/batch')
  async incrementViewsBatch(@Body('ids') ids: number[]) {
    return this.tweetService.incrementViewsBatch(ids);
  }
}
