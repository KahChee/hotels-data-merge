import { Injectable, Logger } from '@nestjs/common';
import { Hotel, SupplierHotelData, Location, Amenities, Images, Image } from '../types/hotel.types';
import { suppliersConfig, SupplierConfig } from '../config/suppliers.config';

@Injectable()
export class HotelMergeService {
  private readonly logger = new Logger(HotelMergeService.name);
  private pathCache = new Map<string, string[]>();
  private supplierCache = new Map<string, SupplierConfig>();

  constructor() {
    // Preload supplier configurations into cache for faster access
    for (const supplier of suppliersConfig) {
      this.supplierCache.set(supplier.name, supplier);
    }
  }

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

  private getSupplier(supplierName: string): SupplierConfig | undefined {
    return this.supplierCache.get(supplierName);
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
    if (!obj || !path) return undefined;

    // Cache the path split to avoid repeated splits
    let pathArray = this.pathCache.get(path);
    if (!pathArray) {
      pathArray = path.split('.');
      this.pathCache.set(path, pathArray);
    }

    let current = obj;
    for (const key of pathArray) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined; // Path not found
      }
    }

    return current;

    // return path.split('.').reduce((current, key) => {
    //   return current && current[key] !== undefined ? current[key] : undefined;
    // }, obj);
  }

  private extractHotelId(rawHotel: SupplierHotelData, supplierName?: string): string | null {
    if (supplierName) {
      // const supplier = suppliersConfig.find(s => s.name === supplierName);
      const supplier = this.getSupplier(supplierName);
      if (supplier) {
        return this.extractFieldValue(rawHotel, supplier.fieldMapping.hotelId);
      }
    }

    // Fallback logic
    return rawHotel.id || rawHotel.Id || rawHotel.hotel_id || null;
  }

  private normalizeHotelData(rawHotel: SupplierHotelData, supplierName: string): Hotel {
    const supplier = this.getSupplier(supplierName);
    
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
    if (!Array.isArray(amenities)) return [];

    const amenitySet = new Set<string>();
    const normalized: string[] = [];

    for (const amenity of amenities) {
      if (typeof amenity === 'string') {
        const cleaned = amenity.toLowerCase().trim();

        // Only add meaningful amenities (length > 1, not just numbers/symbols)
        if (cleaned.length > 1 && /[a-z]/.test(cleaned) && !amenitySet.has(cleaned)) {
          normalized.push(cleaned);
          amenitySet.add(cleaned);
        }
      }
    }

    return normalized.sort();
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

    const linkSet = new Set<string>();
    const normalized: Image[] = [];

    for (const img of images) {
      let link: string;
      let description: string;
      
      if (typeof img === 'string') {
        link = img;
        description = '';
      } else if (img && typeof img === 'object') {
        link = img.link || img.url || '';
        description = img.description || img.caption || '';
      } else {
        continue;
      }
      
      // Only add valid, unique images
      if (link && !linkSet.has(link)) {
        normalized.push({ link, description });
        linkSet.add(link);
      }
    }

    return normalized;
    
    // return images.map(img => {
    //   if (typeof img === 'string') {
    //     return { link: img, description: '' };
    //   }
      
    //   return {
    //     link: img.link || img.url || '',
    //     description: img.description || img.caption || '',
    //   };
    // }).filter(img => img.link);
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
    if (!existing.length) return [...incoming];
    if (!incoming.length) return [...existing];

    const existingSet = new Set(existing);
    const merged = [...existingSet];

    for (const item of incoming) {
      if (!existingSet.has(item)) {
        merged.push(item);
        existingSet.add(item);
      }
    }

    return merged;
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

        const supplier = this.getSupplier(supplierName);
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