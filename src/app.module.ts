import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HotelsController } from './controllers/hotels.controller';
import { SupplierService } from './services/supplier.service';
import { HotelMergeService } from './services/hotel-merge.service';

@Module({
  imports: [HttpModule],
  controllers: [AppController, HotelsController],
  providers: [AppService, SupplierService, HotelMergeService],
})
export class AppModule {}
