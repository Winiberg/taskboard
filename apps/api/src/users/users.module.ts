import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService], // Esto permite que AuthModule lo pueda usar
})
export class UsersModule {}