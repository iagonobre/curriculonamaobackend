import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/database/database.module';
import { EmailConfirmationService } from './emailConfirmation.service';
import { EmailModule } from 'src/email/email.module';

import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    DatabaseModule,
    EmailModule,
    JwtModule.register({
      secret: process.env.JWT_VERIFICATION_TOKEN_SECRET,
      signOptions: {
        expiresIn: '3600s',
      },
    }),
  ],
  providers: [EmailConfirmationService],
  exports: [EmailConfirmationService],
})
export class EmailConfirmationModule {}
