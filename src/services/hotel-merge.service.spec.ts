import { Test, TestingModule } from '@nestjs/testing';
import { HotelMergeService } from './hotel-merge.service';
import { createMockSupplierDataMap } from '../../test/utils/test-data';
import { validateHotelStructure, createTestSupplierDataMap, cleanupTestResources } from '../../test/utils/test-helpers';

describe('HotelMergeService', () => {
  let service: HotelMergeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HotelMergeService],
    }).compile();

    service = module.get<HotelMergeService>(HotelMergeService);
  });

  afterEach(async () => {
    await cleanupTestResources();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('mergeHotels', () => {
    it('should merge hotels from multiple suppliers', () => {
      const supplierDataMap = createMockSupplierDataMap();

      const result = service.mergeHotels(supplierDataMap);

      expect(result).toHaveLength(3); // We have 3 unique hotels in our mock data
      
      // Validate structure of all hotels
      result.forEach(hotel => validateHotelStructure(hotel));
      
      // Find the specific hotel we want to test
      const beachVillas = result.find(h => h.id === 'iJhz');
      expect(beachVillas).toBeDefined();
      expect(beachVillas!.name).toBe('Beach Villas Singapore');
      expect(beachVillas!.location.lat).toBe(1.264751);
      expect(beachVillas!.location.lng).toBe(103.824006);
      expect(beachVillas!.amenities.room).toContain('pool'); // From acme Facilities
      expect(beachVillas!.amenities.room).toContain('aircon'); // From patagonia amenities
      expect(beachVillas!.images.rooms.length).toBeGreaterThan(0);
      expect(beachVillas!.images.site.length).toBeGreaterThan(0);
    });

    it('should handle empty supplier data', () => {
      const supplierDataMap = createTestSupplierDataMap({
        acme: [],
        patagonia: []
      });

      const result = service.mergeHotels(supplierDataMap);

      expect(result).toHaveLength(0);
    });

    it('should skip hotels with missing IDs', () => {
      const supplierDataMap = createTestSupplierDataMap({
        acme: [
          {
            DestinationId: 5432,
            Name: 'Hotel Without ID',
            Description: 'This hotel has no ID'
          }
        ]
      });

      const result = service.mergeHotels(supplierDataMap);

      expect(result).toHaveLength(0);
    });

    it('should merge duplicate hotels from different suppliers', () => {
      const supplierDataMap = createTestSupplierDataMap({
        acme: [
          {
            Id: 'SjyX',
            DestinationId: 5432,
            Name: 'InterContinental',
            Description: 'Short description',
            Facilities: ['Pool', 'WiFi']
          }
        ],
        patagonia: [
          {
            id: 'SjyX',
            destination: 5432,
            name: 'InterContinental Singapore Robertson Quay',
            info: 'Longer and more detailed description of the hotel',
            amenities: ['Aircon', 'Tv']
          }
        ]
      });

      const result = service.mergeHotels(supplierDataMap);

      expect(result).toHaveLength(1);
      validateHotelStructure(result[0]);
      expect(result[0].id).toBe('SjyX');
      expect(result[0].name).toBe('InterContinental Singapore Robertson Quay'); // Longer name chosen
      expect(result[0].description).toBe('Longer and more detailed description of the hotel'); // Longer description chosen
      expect(result[0].amenities.room).toContain('pool'); // From acme Facilities (treated as room amenities)
      expect(result[0].amenities.room).toContain('aircon'); // From patagonia amenities
    });
  });

  describe('extractAvailableIds', () => {
    it('should extract unique hotel and destination IDs', () => {
      const supplierDataMap = createTestSupplierDataMap({
        acme: [
          { Id: 'iJhz', DestinationId: 5432 },
          { Id: 'SjyX', DestinationId: 5432 },
          { Id: 'f8c9', DestinationId: 1122 }
        ],
        patagonia: [
          { id: 'iJhz', destination: 5432 }, // Duplicate
          { id: 'abc123', destination: 9999 }
        ]
      });

      const result = service.extractAvailableIds(supplierDataMap);

      expect(result.hotel_ids).toEqual(['SjyX', 'abc123', 'f8c9', 'iJhz']);
      expect(result.destination_ids).toEqual([1122, 5432, 9999]);
    });

    it('should handle empty data', () => {
      const supplierDataMap = createTestSupplierDataMap({});
      
      const result = service.extractAvailableIds(supplierDataMap);

      expect(result.hotel_ids).toEqual([]);
      expect(result.destination_ids).toEqual([]);
    });

    it('should filter out invalid destination IDs', () => {
      const supplierDataMap = createTestSupplierDataMap({
        acme: [
          { Id: 'test1', DestinationId: 0 },
          { Id: 'test2' }, // No destination ID
          { Id: 'test3', DestinationId: 5432 }
        ]
      });

      const result = service.extractAvailableIds(supplierDataMap);

      expect(result.hotel_ids).toEqual(['test1', 'test2', 'test3']);
      expect(result.destination_ids).toEqual([5432]);
    });
  });

  describe('private method testing through public interface', () => {
    it('should normalize amenities correctly', () => {
      const supplierDataMap = createTestSupplierDataMap({
        acme: [
          {
            Id: 'test1',
            DestinationId: 5432,
            Name: 'Test Hotel',
            Facilities: ['Pool', 'WIFI', 'Business Center']
          }
        ],
        patagonia: [
          {
            id: 'test2',
            destination: 5432,
            name: 'Test Hotel 2',
            amenities: ['Aircon', 'TV', 'Coffee Machine']
          }
        ]
      });

      const result = service.mergeHotels(supplierDataMap);

      expect(result).toHaveLength(2);
      result.forEach(hotel => validateHotelStructure(hotel));
      
      expect(result[0].amenities.room).toContain('pool'); // From acme Facilities (treated as room amenities)
      expect(result[0].amenities.room).toContain('wifi');
      expect(result[0].amenities.room).toContain('business center');
      expect(result[1].amenities.room).toContain('aircon'); // From patagonia amenities
      expect(result[1].amenities.room).toContain('tv');
      expect(result[1].amenities.room).toContain('coffee machine');
    });

    it('should normalize images correctly', () => {
      const supplierDataMap = createTestSupplierDataMap({
        patagonia: [
          {
            id: 'test1',
            destination: 5432,
            name: 'Test Hotel',
            images: {
              rooms: [
                { link: 'https://example.com/room1.jpg', description: 'Room 1' },
                { link: 'https://example.com/room2.jpg', description: 'Room 2' }
              ],
              site: [
                'https://example.com/site1.jpg' // String format
              ],
              amenities: []
            }
          }
        ]
      });

      const result = service.mergeHotels(supplierDataMap);

      validateHotelStructure(result[0]);
      expect(result[0].images.rooms).toHaveLength(2);
      expect(result[0].images.rooms[0]).toEqual({
        link: 'https://example.com/room1.jpg',
        description: 'Room 1'
      });
      expect(result[0].images.site).toHaveLength(1);
      expect(result[0].images.site[0]).toEqual({
        link: 'https://example.com/site1.jpg',
        description: ''
      });
    });

    it('should choose best values when merging', () => {
      const supplierDataMap = createTestSupplierDataMap({
        acme: [
          {
            Id: 'test1',
            DestinationId: 5432,
            Name: 'Short Name',
            Description: 'Short desc',
            Address: 'Short address'
          }
        ],
        patagonia: [
          {
            id: 'test1',
            destination: 5432,
            name: 'Much Longer Hotel Name',
            info: 'Much longer and more detailed description of the hotel',
            address: 'Much longer and more detailed address with more information'
          }
        ]
      });

      const result = service.mergeHotels(supplierDataMap);

      expect(result).toHaveLength(1);
      validateHotelStructure(result[0]);
      expect(result[0].name).toBe('Much Longer Hotel Name');
      expect(result[0].description).toBe('Much longer and more detailed description of the hotel');
      expect(result[0].location.address).toBe('Much longer and more detailed address with more information');
    });
  });
});