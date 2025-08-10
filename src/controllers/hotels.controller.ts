import { Controller, Get, Logger, Query } from '@nestjs/common';
import { SupplierService } from '../services/supplier.service';
import { HotelMergeService } from '../services/hotel-merge.service';
import { suppliersConfig } from '../config/suppliers.config';
import { Hotel } from '../types/hotel.types';

@Controller('hotels')
export class HotelsController {
  private readonly logger = new Logger(HotelsController.name);

  constructor(
    private readonly supplierService: SupplierService,
    private readonly hotelMergeService: HotelMergeService,
  ) {}

  @Get()
  async getHotels(
    @Query('hotel_ids') hotelIds?: string,
    @Query('destination_ids') destinationIds?: string,
    @Query('items_per_page') itemsPerPage?: string,
    @Query('page_number') pageNumber?: string,
  ): Promise<Hotel[]> {
    try {
      this.logger.log('Fetching hotels from all suppliers');
      
      // Fetch data from all configured suppliers
      const supplierDataMap = await this.supplierService.fetchHotelsFromAllSuppliers(suppliersConfig);
      
      // Merge and normalize the data
      let hotels = this.hotelMergeService.mergeHotels(supplierDataMap);
      
      // Apply filters if provided
      if (hotelIds) {
        const _hotelIds = hotelIds.split(',').map(id => id.trim().toLowerCase());
        hotels = hotels.filter(hotel => _hotelIds.includes(hotel.id.toLowerCase()));
        this.logger.log(`Filtered by hotel IDs: ${_hotelIds.join(', ')}`);
      }
      
      if (destinationIds) {
        const _destinationIds = destinationIds
            .split(',')
            .map(id => parseInt(id.trim(), 10))
            .filter(id => !isNaN(id));
        hotels = hotels.filter(hotel => _destinationIds.includes(hotel.destination_id));
        this.logger.log(`Filtered by destination IDs: ${_destinationIds.join(', ')}`);
      }

      if (itemsPerPage && !pageNumber) {
        const _itemsPerPage = parseInt(itemsPerPage, 10);
        if (!isNaN(_itemsPerPage) && _itemsPerPage > 0) {
          hotels = hotels.slice(0, _itemsPerPage);
          this.logger.log(`Returning first ${_itemsPerPage} hotels`);
        }
      }

      if (pageNumber) {
        const page = parseInt(pageNumber, 10);
        if (!isNaN(page) && page > 0) {
          const _itemsPerPage = parseInt(itemsPerPage || '10', 10);
          hotels = hotels.slice((page - 1) * _itemsPerPage, page * _itemsPerPage);
          this.logger.log(`Returning hotels for page ${page} with ${itemsPerPage} items per page`);
        } else {
          this.logger.warn(`Invalid page number: ${pageNumber}`);
        }
      }
      
      this.logger.log(`Returning ${hotels.length} hotels`);
      return hotels;
      
    } catch (error) {
      this.logger.error('Error fetching hotels:', error);
      throw error;
    }
  }

  @Get('suppliers')
  getSuppliers() {
    return {
      suppliers: suppliersConfig,
    };
  }

  @Get('ids')
  async getAvailableIds(): Promise<{ hotel_ids: string[], destination_ids: number[] }> {
    try {
      this.logger.log('Fetching available hotel and destination IDs');
      
      // Fetch data from all configured suppliers
      const supplierDataMap = await this.supplierService.fetchHotelsFromAllSuppliers(suppliersConfig);
      
      // Extract unique IDs
      const ids = this.hotelMergeService.extractAvailableIds(supplierDataMap);
      
      this.logger.log(`Returning ${ids.hotel_ids.length} hotel IDs and ${ids.destination_ids.length} destination IDs`);
      return ids;
      
    } catch (error) {
      this.logger.error('Error fetching available IDs:', error);
      throw error;
    }
  }
}