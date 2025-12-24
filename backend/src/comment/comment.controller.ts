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
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto, UpdateCommentLikesDto } from './dto/comment.dto';

@Controller('comments')
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Post()
  async createComment(@Body() createCommentDto: CreateCommentDto) {
    return this.commentService.createComment(createCommentDto);
  }

  @Get(':id')
  async getCommentById(@Param('id', ParseIntPipe) id: number) {
    return this.commentService.getCommentById(id);
  }

  @Get('tweet/:tweetId')
  async getCommentsByTweetId(
    @Param('tweetId', ParseIntPipe) tweetId: number,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '20',
  ) {
    return this.commentService.getCommentsByTweetId(
      tweetId,
      parseInt(skip),
      parseInt(take),
    );
  }

  @Get('user/:userId')
  async getCommentsByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
  ) {
    return this.commentService.getCommentsByUserId(
      userId,
      parseInt(skip),
      parseInt(take),
    );
  }

  @Patch(':id')
  async updateComment(
    @Param('id', ParseIntPipe) id: number,
    @Body('content') content: string,
  ) {
    return this.commentService.updateComment(id, content);
  }

  @Delete(':id')
  async deleteComment(@Param('id', ParseIntPipe) id: number) {
    return this.commentService.deleteComment(id);
  }

  @Patch(':id/likes')
  async updateCommentLikes(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCommentLikesDto,
  ) {
    return this.commentService.updateCommentLikes(id, updateDto);
  }

  @Post(':id/like')
  async likeComment(@Param('id', ParseIntPipe) id: number) {
    return this.commentService.incrementCommentLikes(id);
  }

  @Post(':id/unlike')
  async unlikeComment(@Param('id', ParseIntPipe) id: number) {
    return this.commentService.decrementCommentLikes(id);
  }

  @Get('tweet/:tweetId/count')
  async getCommentCount(@Param('tweetId', ParseIntPipe) tweetId: number) {
    const count = await this.commentService.getCommentCount(tweetId);
    return { count };
  }
}
