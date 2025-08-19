import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';
import { SupplierConfig } from '../config/suppliers.config';
import { SupplierHotelData } from '../types/hotel.types';

@Injectable()
export class SupplierService {
  private readonly logger = new Logger(SupplierService.name);
  private readonly MAX_RETRIES = 3;
  private readonly BASE_DELAY_MS = 1000; // 1 second base delay

  constructor(private readonly httpService: HttpService) {}

  async fetchHotelsFromSupplier(supplier: SupplierConfig): Promise<SupplierHotelData[]> {
    this.logger.log(`Fetching hotels from supplier: ${supplier.name}`);
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response: AxiosResponse<SupplierHotelData[]> = await firstValueFrom(
          this.httpService.get<SupplierHotelData[]>(supplier.url, {
            timeout: 10000, // 10 second timeout
          })
        );

        this.logger.log(`Successfully fetched ${response.data.length} hotels from ${supplier.name}${attempt > 1 ? ` (attempt ${attempt})` : ''}`);
        return response.data || [];
      } catch (error) {
        const isLastAttempt = attempt === this.MAX_RETRIES;
        const shouldRetry = this.isRetryableError(error);

        if (shouldRetry && !isLastAttempt) {
          const delay = this.calculateRetryDelay(attempt);
          this.logger.warn(
            `Attempt ${attempt} failed for supplier ${supplier.name}: ${error.message}. Retrying in ${delay}ms...`
          );
          await this.sleep(delay);
        } else {
          this.logger.error(
            `Failed to fetch hotels from ${supplier.name} after ${attempt} attempt(s): ${error.message}`
          );
          // Return empty array instead of throwing to allow other suppliers to continue
          return [];
        }
      }
    }

    // This should never be reached due to the logic above, but included for completeness
    return [];
  }

  /**
   * Determines if an error is retryable based on error type and status code
   */
  private isRetryableError(error: any): boolean {
    // Network errors, timeouts, and connection issues are retryable
    if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
      return true;
    }

    // If it's an Axios error with a response, check the status code
    if (error.response) {
      const status = error.response.status;
      // Retry on 5xx server errors and 429 (rate limiting)
      return status >= 500 || status === 429;
    }

    // If it's an Axios error without a response (network issues), it's retryable
    if (error.request) {
      return true;
    }

    // For other errors (4xx client errors, etc.), don't retry
    return false;
  }

  /**
   * Calculates retry delay with exponential backoff and jitter
   */
  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff: base_delay * 2^(attempt-1) with jitter
    const exponentialDelay = this.BASE_DELAY_MS * Math.pow(2, attempt - 1);
    // Add jitter (±25% of the delay) to avoid thundering herd
    const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
    return Math.round(exponentialDelay + jitter);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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