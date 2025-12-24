import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { TweetService } from './tweet.service';
import { CreateTweetDto, UpdateTweetLikesDto } from './dto/tweet.dto';

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
  ) {
    return this.tweetService.getAllTweets(parseInt(skip), parseInt(take));
  }

  @Get('search')
  async searchTweets(@Query('q') query: string) {
    return this.tweetService.searchTweets(query);
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

  @Delete(':id')
  async deleteTweet(@Param('id', ParseIntPipe) id: number) {
    return this.tweetService.deleteTweet(id);
  }

  @Patch(':id/likes')
  async updateTweetLikes(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTweetLikesDto,
  ) {
    return this.tweetService.updateTweetLikes(id, updateDto);
  }

  @Post(':id/like')
  async likeTweet(@Param('id', ParseIntPipe) id: number) {
    return this.tweetService.incrementLikes(id);
  }

  @Post(':id/unlike')
  async unlikeTweet(@Param('id', ParseIntPipe) id: number) {
    return this.tweetService.decrementLikes(id);
  }

  @Post(':id/retweet')
  async retweetTweet(@Param('id', ParseIntPipe) id: number) {
    return this.tweetService.incrementRetweets(id);
  }

  @Post(':id/unRetweet')
  async unretweetTweet(@Param('id', ParseIntPipe) id: number) {
    return this.tweetService.decrementRetweets(id);
  }

  @Patch(':id/retweets')
  async updateRetweetCount(
    @Param('id', ParseIntPipe) id: number,
    @Body('retweetCount') retweetCount: number,
  ) {
    return this.tweetService.updateTweetRetweets(id, retweetCount);
  }
}
