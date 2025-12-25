import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { CreateBookmarkDto } from './dto/bookmark.dto';

@Controller('bookmarks')
export class BookmarkController {
  constructor(private bookmarkService: BookmarkService) {}

  @Post()
  async createBookmark(@Body() createBookmarkDto: CreateBookmarkDto) {
    return this.bookmarkService.createBookmark(createBookmarkDto);
  }

  @Delete(':userId/:tweetId')
  async removeBookmark(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('tweetId', ParseIntPipe) tweetId: number,
  ) {
    return this.bookmarkService.removeBookmark(userId, tweetId);
  }

  @Get('user/:userId')
  async getBookmarksByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
  ) {
    return this.bookmarkService.getBookmarksByUserId(userId, parseInt(skip), parseInt(take));
  }

  @Get('check/:userId/:tweetId')
  async isBookmarked(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('tweetId', ParseIntPipe) tweetId: number,
  ) {
    return this.bookmarkService.isBookmarked(userId, tweetId);
  }

  @Get('ids/:userId')
  async getBookmarkedTweetIds(@Param('userId', ParseIntPipe) userId: number) {
    return this.bookmarkService.getBookmarkedTweetIds(userId);
  }
}
