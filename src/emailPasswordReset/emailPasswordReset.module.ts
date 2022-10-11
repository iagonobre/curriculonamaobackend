import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/database/database.module';
import { EmailModule } from 'src/email/email.module';

import { JwtModule } from '@nestjs/jwt';
import { EmailPasswordResetService } from './emailPasswordReset.service';

@Module({
  imports: [
    DatabaseModule,
    EmailModule,
    JwtModule.register({
      secret: process.env.JWT_RESET_PASSWORD_TOKEN_SECRET,
      signOptions: {
        expiresIn: '1h',
      },
    }),
  ],
  providers: [EmailPasswordResetService],
  exports: [EmailPasswordResetService],
})
export class EmailPasswordResetModule {}
