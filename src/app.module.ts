import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { CvsModule } from './cvs/cvs.module';
import { ServeStaticModule } from '@nestjs/serve-static';

import { join } from 'path';
import { EmailModule } from './email/email.module';
import { EmailConfirmationModule } from './emailConfirmation/emailConfirmation.module';
import { EmailPasswordResetModule } from './emailPasswordReset/emailPasswordReset.module';

@Module({
  imports: [
    UsersModule,
    CvsModule,
    DatabaseModule,
    AuthModule,
    ConfigModule.forRoot(),
    ServeStaticModule.forRoot({
      serveRoot: '/cv',
      rootPath: join(__dirname, '..', 'public'),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public', 'images'),
      serveRoot: '/profile',
    }),
    EmailModule,
    EmailConfirmationModule,
    EmailPasswordResetModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
