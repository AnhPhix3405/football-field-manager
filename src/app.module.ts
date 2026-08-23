import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forRoot(databaseConfig), AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
