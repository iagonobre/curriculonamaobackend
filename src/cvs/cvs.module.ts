import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { CvsService } from './cvs.service';

@Module({
  imports: [DatabaseModule],
  providers: [CvsService],
  exports: [CvsService],
})
export class CvsModule {}
