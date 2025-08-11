import { Test, TestingModule } from '@nestjs/testing';
import { HotelsController } from './hotels.controller';
import { SupplierService } from '../services/supplier.service';
import { HotelMergeService } from '../services/hotel-merge.service';
import { suppliersConfig } from '../config/suppliers.config';
import { createMockSupplierDataMap, mockAvailableIds, mockHotels } from '../../test/utils/test-data';
import { cleanupTestResources } from '../../test/utils/test-helpers';

describe('HotelsController', () => {
  let controller: HotelsController;
  let supplierService: jest.Mocked<SupplierService>;
  let hotelMergeService: jest.Mocked<HotelMergeService>;

  const mockSupplierDataMap = createMockSupplierDataMap();

  beforeEach(async () => {
    const mockSupplierService = {
      fetchHotelsFromAllSuppliers: jest.fn(),
    };

    const mockHotelMergeService = {
      mergeHotels: jest.fn(),
      extractAvailableIds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HotelsController],
      providers: [
        {
          provide: SupplierService,
          useValue: mockSupplierService,
        },
        {
          provide: HotelMergeService,
          useValue: mockHotelMergeService,
        },
      ],
    }).compile();

    controller = module.get<HotelsController>(HotelsController);
    supplierService = module.get(SupplierService);
    hotelMergeService = module.get(HotelMergeService);
  });

  afterEach(async () => {
    await cleanupTestResources();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHotels', () => {
    beforeEach(() => {
      supplierService.fetchHotelsFromAllSuppliers.mockResolvedValue(mockSupplierDataMap);
      hotelMergeService.mergeHotels.mockReturnValue(mockHotels);
    });

    it('should return all hotels when no filters are provided', async () => {
      const result = await controller.getHotels();

      expect(supplierService.fetchHotelsFromAllSuppliers).toHaveBeenCalledWith(suppliersConfig);
      expect(hotelMergeService.mergeHotels).toHaveBeenCalledWith(mockSupplierDataMap);
      expect(result).toEqual(mockHotels);
      expect(result).toHaveLength(3);
    });

    it('should filter hotels by hotel IDs', async () => {
      const result = await controller.getHotels('iJhz,SjyX');

      expect(result).toHaveLength(2);
      expect(result.map(h => h.id)).toEqual(['iJhz', 'SjyX']);
    });

    it('should filter hotels by hotel IDs (case insensitive)', async () => {
      const result = await controller.getHotels('IJHZ,sjyx');

      expect(result).toHaveLength(2);
      expect(result.map(h => h.id)).toEqual(['iJhz', 'SjyX']);
    });

    it('should filter hotels by destination IDs', async () => {
      const result = await controller.getHotels(undefined, '5432');

      expect(result).toHaveLength(2);
      expect(result.every(h => h.destination_id === 5432)).toBe(true);
    });

    it('should filter hotels by multiple destination IDs', async () => {
      const result = await controller.getHotels(undefined, '5432,1122');

      expect(result).toHaveLength(3);
      expect(result.map(h => h.destination_id)).toEqual([5432, 5432, 1122]);
    });

    it('should filter hotels by both hotel IDs and destination IDs', async () => {
      const result = await controller.getHotels('iJhz,f8c9', '5432,1122');

      expect(result).toHaveLength(2);
      expect(result.map(h => h.id)).toEqual(['iJhz', 'f8c9']);
    });

    it('should handle invalid destination IDs gracefully', async () => {
      const result = await controller.getHotels(undefined, 'invalid,5432,notanumber');

      expect(result).toHaveLength(2);
      expect(result.every(h => h.destination_id === 5432)).toBe(true);
    });

    it('should limit results when items_per_page is provided without page_number', async () => {
      const result = await controller.getHotels(undefined, undefined, '2');

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockHotels.slice(0, 2));
    });

    it('should handle invalid items_per_page gracefully', async () => {
      const result = await controller.getHotels(undefined, undefined, 'invalid');

      expect(result).toHaveLength(3);
      expect(result).toEqual(mockHotels);
    });

    it('should handle zero items_per_page gracefully', async () => {
      const result = await controller.getHotels(undefined, undefined, '0');

      expect(result).toHaveLength(3);
      expect(result).toEqual(mockHotels);
    });

    it('should handle negative items_per_page gracefully', async () => {
      const result = await controller.getHotels(undefined, undefined, '-5');

      expect(result).toHaveLength(3);
      expect(result).toEqual(mockHotels);
    });

    it('should paginate results when both page_number and items_per_page are provided', async () => {
      const result = await controller.getHotels(undefined, undefined, '2', '1');

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockHotels.slice(0, 2));
    });

    it('should return second page of results', async () => {
      const result = await controller.getHotels(undefined, undefined, '2', '2');

      expect(result).toHaveLength(1);
      expect(result).toEqual(mockHotels.slice(2, 4));
    });

    it('should use default items_per_page of 10 when page_number is provided without items_per_page', async () => {
      const result = await controller.getHotels(undefined, undefined, undefined, '1');

      expect(result).toHaveLength(3);
      expect(result).toEqual(mockHotels.slice(0, 10));
    });

    it('should handle invalid page_number gracefully', async () => {
      const result = await controller.getHotels(undefined, undefined, '2', 'invalid');

      expect(result).toHaveLength(3);
      expect(result).toEqual(mockHotels);
    });

    it('should handle zero page_number gracefully', async () => {
      const result = await controller.getHotels(undefined, undefined, '2', '0');

      expect(result).toHaveLength(3);
      expect(result).toEqual(mockHotels);
    });

    it('should handle negative page_number gracefully', async () => {
      const result = await controller.getHotels(undefined, undefined, '2', '-1');

      expect(result).toHaveLength(3);
      expect(result).toEqual(mockHotels);
    });

    it('should return empty array when page is beyond available data', async () => {
      const result = await controller.getHotels(undefined, undefined, '2', '10');

      expect(result).toHaveLength(0);
    });

    it('should handle complex filtering and pagination together', async () => {
      const result = await controller.getHotels('iJhz,SjyX,f8c9', '5432,1122', '2', '1');

      expect(result).toHaveLength(2);
      expect(result.map(h => h.id)).toEqual(['iJhz', 'SjyX']);
    });

    it('should handle whitespace in query parameters', async () => {
      const result = await controller.getHotels(' iJhz , SjyX ', ' 5432 , 1122 ');

      expect(result).toHaveLength(2);
      expect(result.map(h => h.id)).toEqual(['iJhz', 'SjyX']);
    });

    it('should handle empty string parameters', async () => {
      const result = await controller.getHotels('', '');

      expect(result).toHaveLength(3);
      expect(result).toEqual(mockHotels);
    });

    it('should propagate errors from supplier service', async () => {
      const error = new Error('Supplier service error');
      supplierService.fetchHotelsFromAllSuppliers.mockRejectedValue(error);

      await expect(controller.getHotels()).rejects.toThrow('Supplier service error');
    });

    it('should propagate errors from hotel merge service', async () => {
      const error = new Error('Merge service error');
      hotelMergeService.mergeHotels.mockImplementation(() => {
        throw error;
      });

      await expect(controller.getHotels()).rejects.toThrow('Merge service error');
    });
  });

  describe('getSuppliers', () => {
    it('should return suppliers configuration', () => {
      const result = controller.getSuppliers();

      expect(result).toEqual({
        suppliers: suppliersConfig,
      });
    });
  });

  describe('getAvailableIds', () => {
    const mockIds = mockAvailableIds;

    beforeEach(() => {
      supplierService.fetchHotelsFromAllSuppliers.mockResolvedValue(mockSupplierDataMap);
      hotelMergeService.extractAvailableIds.mockReturnValue(mockIds);
    });

    it('should return available hotel and destination IDs', async () => {
      const result = await controller.getAvailableIds();

      expect(supplierService.fetchHotelsFromAllSuppliers).toHaveBeenCalledWith(suppliersConfig);
      expect(hotelMergeService.extractAvailableIds).toHaveBeenCalledWith(mockSupplierDataMap);
      expect(result).toEqual(mockIds);
    });

    it('should propagate errors from supplier service', async () => {
      const error = new Error('Supplier service error');
      supplierService.fetchHotelsFromAllSuppliers.mockRejectedValue(error);

      await expect(controller.getAvailableIds()).rejects.toThrow('Supplier service error');
    });

    it('should propagate errors from hotel merge service', async () => {
      const error = new Error('Extract IDs error');
      hotelMergeService.extractAvailableIds.mockImplementation(() => {
        throw error;
      });

      await expect(controller.getAvailableIds()).rejects.toThrow('Extract IDs error');
    });
  });

  describe('logging', () => {
    beforeEach(() => {
      supplierService.fetchHotelsFromAllSuppliers.mockResolvedValue(mockSupplierDataMap);
      hotelMergeService.mergeHotels.mockReturnValue(mockHotels);
    });

    it('should log hotel filtering operations', async () => {
      const logSpy = jest.spyOn(controller['logger'], 'log');

      await controller.getHotels('iJhz,SjyX', '5432');

      expect(logSpy).toHaveBeenCalledWith('Fetching hotels from all suppliers');
      expect(logSpy).toHaveBeenCalledWith('Filtered by hotel IDs: ijhz, sjyx');
      expect(logSpy).toHaveBeenCalledWith('Filtered by destination IDs: 5432');
      expect(logSpy).toHaveBeenCalledWith('Returning 2 hotels');
    });

    it('should log pagination operations', async () => {
      const logSpy = jest.spyOn(controller['logger'], 'log');

      await controller.getHotels(undefined, undefined, '2', '2');

      expect(logSpy).toHaveBeenCalledWith('Returning hotels for page 2 with 2 items per page');
    });

    it('should log items per page operations', async () => {
      const logSpy = jest.spyOn(controller['logger'], 'log');

      await controller.getHotels(undefined, undefined, '2');

      expect(logSpy).toHaveBeenCalledWith('Returning first 2 hotels');
    });

    it('should warn about invalid page numbers', async () => {
      const warnSpy = jest.spyOn(controller['logger'], 'warn');

      await controller.getHotels(undefined, undefined, '2', 'invalid');

      expect(warnSpy).toHaveBeenCalledWith('Invalid page number: invalid');
    });

    it('should log errors', async () => {
      const error = new Error('Test error');
      const errorSpy = jest.spyOn(controller['logger'], 'error');
      supplierService.fetchHotelsFromAllSuppliers.mockRejectedValue(error);

      await expect(controller.getHotels()).rejects.toThrow();

      expect(errorSpy).toHaveBeenCalledWith('Error fetching hotels:', error);
    });
  });
});