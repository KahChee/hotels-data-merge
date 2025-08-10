import { Injectable, Logger } from '@nestjs/common';
import { Hotel, SupplierHotelData, Location, Amenities, Images, Image } from '../types/hotel.types';
import { suppliersConfig, SupplierConfig } from '../config/suppliers.config';

@Injectable()
export class HotelMergeService {
  private readonly logger = new Logger(HotelMergeService.name);

  mergeHotels(supplierDataMap: Map<string, SupplierHotelData[]>): Hotel[] {
    const hotelMap = new Map<string, Hotel>();

    // Process each supplier's data
    for (const [supplierName, hotels] of supplierDataMap) {
      this.logger.log(`Processing ${hotels.length} hotels from ${supplierName}`);
      
      for (const rawHotel of hotels) {
        const hotelId = this.extractHotelId(rawHotel, supplierName);
        if (!hotelId) {
          this.logger.warn(`Skipping hotel with missing ID from ${supplierName}`);
          continue;
        }

        const normalizedHotel = this.normalizeHotelData(rawHotel, supplierName);
        
        if (hotelMap.has(hotelId)) {
          // Merge with existing hotel data
          const existingHotel = hotelMap.get(hotelId)!;
          const mergedHotel = this.mergeHotelData(existingHotel, normalizedHotel);
          hotelMap.set(hotelId, mergedHotel);
        } else {
          // Add new hotel
          hotelMap.set(hotelId, normalizedHotel);
        }
      }
    }

    const result = Array.from(hotelMap.values());
    this.logger.log(`Merged data resulted in ${result.length} unique hotels`);
    return result;
  }

  private extractFieldValue(data: any, fieldPaths: string[]): any {
    for (const path of fieldPaths) {
      const value = this.getNestedValue(data, path);
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
    return null;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private extractHotelId(rawHotel: SupplierHotelData, supplierName?: string): string | null {
    if (supplierName) {
      const supplier = suppliersConfig.find(s => s.name === supplierName);
      if (supplier) {
        return this.extractFieldValue(rawHotel, supplier.fieldMapping.hotelId);
      }
    }

    // Fallback logic
    return rawHotel.id || rawHotel.Id || rawHotel.hotel_id || null;
  }

  private normalizeHotelData(rawHotel: SupplierHotelData, supplierName: string): Hotel {
    const supplier = suppliersConfig.find(s => s.name === supplierName);
    
    return {
      id: this.extractHotelId(rawHotel, supplierName)!,
      destination_id: this.extractDestinationId(rawHotel, supplier),
      name: this.extractName(rawHotel, supplier),
      location: this.extractLocation(rawHotel, supplier),
      description: this.extractDescription(rawHotel, supplier),
      amenities: this.extractAmenities(rawHotel, supplier),
      images: this.extractImages(rawHotel, supplier),
      booking_conditions: this.extractBookingConditions(rawHotel, supplier),
    };
  }

  private extractDestinationId(rawHotel: SupplierHotelData, supplier?: SupplierConfig): number {
    if (supplier) {
      const value = this.extractFieldValue(rawHotel, supplier.fieldMapping.destinationId);
      return value ? Number(value) : 0;
    }

    // Fallback logic
    return rawHotel.destination_id || rawHotel.destination || 0;
  }

  private extractName(rawHotel: SupplierHotelData, supplier?: SupplierConfig): string {
    if (supplier) {
      return this.extractFieldValue(rawHotel, supplier.fieldMapping.name) || '';
    }

    // Fallback logic
    return rawHotel.name || rawHotel.hotel_name || '';
  }

  private extractLocation(rawHotel: SupplierHotelData, supplier?: SupplierConfig): Location {
    if (supplier) {
      return {
        lat: Number(this.extractFieldValue(rawHotel, supplier.fieldMapping.location.lat)) || 0,
        lng: Number(this.extractFieldValue(rawHotel, supplier.fieldMapping.location.lng)) || 0,
        address: this.extractFieldValue(rawHotel, supplier.fieldMapping.location.address) || '',
        city: this.extractFieldValue(rawHotel, supplier.fieldMapping.location.city) || '',
        country: this.extractFieldValue(rawHotel, supplier.fieldMapping.location.country) || '',
      };
    }
    
    // Fallback logic
    const location = rawHotel.location || rawHotel.address || {};
    return {
      lat: location.lat || location.latitude || 0,
      lng: location.lng || location.longitude || 0,
      address: location.address || location.street_address || '',
      city: location.city || '',
      country: location.country || '',
    };
  }

  private extractDescription(rawHotel: SupplierHotelData, supplier?: SupplierConfig): string {
    if (supplier) {
      return this.extractFieldValue(rawHotel, supplier.fieldMapping.description) || '';
    }

    // Fallback logic
    return rawHotel.description || rawHotel.details || rawHotel.info || '';
  }

  private extractAmenities(rawHotel: SupplierHotelData, supplier?: SupplierConfig): Amenities {
    if (supplier) {
      const amenitiesData = this.extractFieldValue(rawHotel, supplier.fieldMapping.amenities);
      if (amenitiesData) {
        if (Array.isArray(amenitiesData)) {
          // For suppliers like patagonia where amenities is a flat array
          return {
            general: [],
            room: this.normalizeAmenityList(amenitiesData),
          };
        } else if (typeof amenitiesData === 'object') {
          // For suppliers like paperflies where amenities has structure
          return {
            general: this.normalizeAmenityList(amenitiesData.general || []),
            room: this.normalizeAmenityList(amenitiesData.room || []),
          };
        }
      }
    }
    
    // Fallback logic
    const amenities = rawHotel.amenities || rawHotel.facilities || {};
    if (Array.isArray(amenities)) {
      // For suppliers like patagonia where amenities is a flat array
      return {
        general: [],
        room: this.normalizeAmenityList(amenities),
      };
    }
    
    // For suppliers like paperflies where amenities has structure
    return {
      general: this.normalizeAmenityList(amenities.general || amenities.hotel || []),
      room: this.normalizeAmenityList(amenities.room || amenities.rooms || []),
    };
  }

  private normalizeAmenityList(amenities: any): string[] {
    if (Array.isArray(amenities)) {
      return amenities.map(a => typeof a === 'string' ? a.toLowerCase().trim() : '').filter(Boolean);
    }
    return [];
  }

  private extractImages(rawHotel: SupplierHotelData, supplier?: SupplierConfig): Images {
    if (supplier) {
      const roomsData = this.extractFieldValue(rawHotel, supplier.fieldMapping.images.rooms);
      const siteData = this.extractFieldValue(rawHotel, supplier.fieldMapping.images.site);
      const amenitiesData = this.extractFieldValue(rawHotel, supplier.fieldMapping.images.amenities);
      
      return {
        rooms: this.normalizeImageList(roomsData || []),
        site: this.normalizeImageList(siteData || []),
        amenities: this.normalizeImageList(amenitiesData || []),
      };
    }
    
    // Fallback logic
    const images = rawHotel.images || rawHotel.pictures || {};
    return {
      rooms: this.normalizeImageList(images.rooms || images.room || []),
      site: this.normalizeImageList(images.site || images.exterior || []),
      amenities: this.normalizeImageList(images.amenities || images.facilities || []),
    };
  }

  private normalizeImageList(images: any): Image[] {
    if (!Array.isArray(images)) return [];
    
    return images.map(img => {
      if (typeof img === 'string') {
        return { link: img, description: '' };
      }
      
      return {
        link: img.link || img.url || '',
        description: img.description || img.caption || '',
      };
    }).filter(img => img.link);
  }

  private extractBookingConditions(rawHotel: SupplierHotelData, supplier?: SupplierConfig): string[] {
    if (supplier) {
      const conditions = this.extractFieldValue(rawHotel, supplier.fieldMapping.bookingConditions);
      return Array.isArray(conditions) ? conditions : [];
    }
    
    // Fallback logic
    const conditions = rawHotel.booking_conditions || rawHotel.terms || [];
    return Array.isArray(conditions) ? conditions : [];
  }

  private mergeHotelData(existing: Hotel, incoming: Hotel): Hotel {
    return {
      id: existing.id,
      destination_id: existing.destination_id || incoming.destination_id,
      name: this.chooseBestValue(existing.name, incoming.name),
      location: this.mergeLocation(existing.location, incoming.location),
      description: this.chooseBestValue(existing.description, incoming.description),
      amenities: this.mergeAmenities(existing.amenities, incoming.amenities),
      images: this.mergeImages(existing.images, incoming.images),
      booking_conditions: this.mergeArrays(existing.booking_conditions, incoming.booking_conditions),
    };
  }

  private chooseBestValue(existing: string, incoming: string): string {
    // Choose the longer, more descriptive value
    if (!existing) return incoming;
    if (!incoming) return existing;
    return existing.length >= incoming.length ? existing : incoming;
  }

  private mergeLocation(existing: Location, incoming: Location): Location {
    return {
      lat: existing.lat || incoming.lat,
      lng: existing.lng || incoming.lng,
      address: this.chooseBestValue(existing.address, incoming.address),
      city: this.chooseBestValue(existing.city, incoming.city),
      country: this.chooseBestValue(existing.country, incoming.country),
    };
  }

  private mergeAmenities(existing: Amenities, incoming: Amenities): Amenities {
    return {
      general: this.mergeArrays(existing.general, incoming.general),
      room: this.mergeArrays(existing.room, incoming.room),
    };
  }

  private mergeImages(existing: Images, incoming: Images): Images {
    return {
      rooms: this.mergeImageArrays(existing.rooms, incoming.rooms),
      site: this.mergeImageArrays(existing.site, incoming.site),
      amenities: this.mergeImageArrays(existing.amenities, incoming.amenities),
    };
  }

  private mergeArrays<T>(existing: T[], incoming: T[]): T[] {
    const combined = [...existing, ...incoming];
    return Array.from(new Set(combined));
  }

  private mergeImageArrays(existing: Image[], incoming: Image[]): Image[] {
    const linkSet = new Set(existing.map(img => img.link));
    const merged = [...existing];
    
    for (const img of incoming) {
      if (!linkSet.has(img.link)) {
        merged.push(img);
        linkSet.add(img.link);
      }
    }
    
    return merged;
  }

  extractAvailableIds(supplierDataMap: Map<string, SupplierHotelData[]>): { hotel_ids: string[], destination_ids: number[] } {
    const hotelIds = new Set<string>();
    const destinationIds = new Set<number>();

    // Process each supplier's data to extract IDs
    for (const [supplierName, hotels] of supplierDataMap) {
      this.logger.log(`Extracting IDs from ${hotels.length} hotels from ${supplierName}`);
      
      for (const rawHotel of hotels) {
        const hotelId = this.extractHotelId(rawHotel, supplierName);
        if (hotelId) {
          hotelIds.add(hotelId);
        }

        const supplier = suppliersConfig.find(s => s.name === supplierName);
        const destinationId = this.extractDestinationId(rawHotel, supplier);
        if (destinationId && destinationId !== 0) {
          destinationIds.add(destinationId);
        }
      }
    }

    const result = {
      hotel_ids: Array.from(hotelIds).sort(),
      destination_ids: Array.from(destinationIds).sort((a, b) => a - b),
    };

    this.logger.log(`Extracted ${result.hotel_ids.length} unique hotel IDs and ${result.destination_ids.length} unique destination IDs`);
    return result;
  }
}