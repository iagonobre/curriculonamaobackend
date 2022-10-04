import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { UsersService } from './users.service';
import { EmailConfirmationModule } from 'src/emailConfirmation/emailConfirmation.module';

@Module({
  imports: [DatabaseModule, EmailConfirmationModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
