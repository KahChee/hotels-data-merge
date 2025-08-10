import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { SupplierConfig } from '../config/suppliers.config';
import { SupplierHotelData } from '../types/hotel.types';

@Injectable()
export class SupplierService {
  private readonly logger = new Logger(SupplierService.name);

  constructor(private readonly httpService: HttpService) {}

  async fetchHotelsFromSupplier(supplier: SupplierConfig): Promise<SupplierHotelData[]> {
    try {
      this.logger.log(`Fetching hotels from supplier: ${supplier.name}`);
      
      const response: AxiosResponse<SupplierHotelData[]> = await firstValueFrom(
        this.httpService.get<SupplierHotelData[]>(supplier.url, {
          timeout: 10000, // 10 second timeout
        })
      );

      this.logger.log(`Successfully fetched ${response.data.length} hotels from ${supplier.name}`);
      return response.data || [];
    } catch (error) {
      this.logger.error(`Failed to fetch hotels from ${supplier.name}:`, error.message);
      // Return empty array instead of throwing to allow other suppliers to continue
      return [];
    }
  }

  async fetchHotelsFromAllSuppliers(suppliers: SupplierConfig[]): Promise<Map<string, SupplierHotelData[]>> {
    const supplierDataMap = new Map<string, SupplierHotelData[]>();

    // Fetch from all suppliers concurrently
    const fetchPromises = suppliers.map(async (supplier) => {
      const hotels = await this.fetchHotelsFromSupplier(supplier);
      supplierDataMap.set(supplier.name, hotels);
    });

    await Promise.all(fetchPromises);
    
    this.logger.log(`Completed fetching from ${suppliers.length} suppliers`);
    return supplierDataMap;
  }
}