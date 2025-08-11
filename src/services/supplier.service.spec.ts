import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { SupplierService } from './supplier.service';
import { SupplierConfig } from '../config/suppliers.config';
import { SupplierHotelData } from '../types/hotel.types';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { mockSupplierData, mockSupplierConfigs } from '../../test/utils/test-data';
import { createMockAxiosResponse, createErrorScenarios, createMockHttpService, cleanupTestResources } from '../../test/utils/test-helpers';

describe('SupplierService', () => {
  let service: SupplierService;
  let httpService: jest.Mocked<HttpService>;

  const mockSupplierConfig: SupplierConfig = mockSupplierConfigs[0];
  const mockHotelData: SupplierHotelData[] = mockSupplierData.acme;

  beforeEach(async () => {
    const mockHttpService = createMockHttpService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<SupplierService>(SupplierService);
    httpService = module.get(HttpService);
  });

  afterEach(async () => {
    await cleanupTestResources();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchHotelsFromSupplier', () => {
    it('should successfully fetch hotels from a supplier', async () => {
      const mockResponse = createMockAxiosResponse(mockHotelData);
      httpService.get.mockReturnValue(of(mockResponse));

      const result = await service.fetchHotelsFromSupplier(mockSupplierConfig);

      expect(httpService.get).toHaveBeenCalledWith(
        mockSupplierConfig.url,
        { timeout: 10000 }
      );
      expect(result).toEqual(mockHotelData);
      expect(result).toHaveLength(mockHotelData.length);
    });

    it('should return empty array when supplier returns null data', async () => {
      const mockResponse = createMockAxiosResponse(null as any);
      httpService.get.mockReturnValue(of(mockResponse));

      const result = await service.fetchHotelsFromSupplier(mockSupplierConfig);

      expect(result).toEqual([]);
    });

    it('should return empty array when supplier returns undefined data', async () => {
      const mockResponse = createMockAxiosResponse(undefined as any);
      httpService.get.mockReturnValue(of(mockResponse));

      const result = await service.fetchHotelsFromSupplier(mockSupplierConfig);

      expect(result).toEqual([]);
    });

    it('should handle HTTP errors gracefully', async () => {
      const errors = createErrorScenarios();
      
      for (const [errorName, error] of Object.entries(errors)) {
        httpService.get.mockReturnValue(throwError(() => error));
        
        const result = await service.fetchHotelsFromSupplier(mockSupplierConfig);
        
        expect(result).toEqual([]);
      }
    });
  });

  describe('fetchHotelsFromAllSuppliers', () => {
    const suppliers: SupplierConfig[] = [
      {
        ...mockSupplierConfig,
        name: 'supplier1',
        url: 'https://api.supplier1.com/hotels',
      },
      {
        ...mockSupplierConfig,
        name: 'supplier2',
        url: 'https://api.supplier2.com/hotels',
      },
      {
        ...mockSupplierConfig,
        name: 'supplier3',
        url: 'https://api.supplier3.com/hotels',
      },
    ];

    it('should fetch hotels from all suppliers successfully', async () => {
      const mockResponse1: AxiosResponse<SupplierHotelData[]> = {
        data: [mockHotelData[0]],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      const mockResponse2: AxiosResponse<SupplierHotelData[]> = {
        data: [mockHotelData[1]],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      const mockResponse3: AxiosResponse<SupplierHotelData[]> = {
        data: [],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.get
        .mockReturnValueOnce(of(mockResponse1))
        .mockReturnValueOnce(of(mockResponse2))
        .mockReturnValueOnce(of(mockResponse3));

      const result = await service.fetchHotelsFromAllSuppliers(suppliers);

      expect(httpService.get).toHaveBeenCalledTimes(3);
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.supplier1.com/hotels',
        { timeout: 10000 }
      );
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.supplier2.com/hotels',
        { timeout: 10000 }
      );
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.supplier3.com/hotels',
        { timeout: 10000 }
      );

      expect(result.size).toBe(3);
      expect(result.get('supplier1')).toEqual([mockHotelData[0]]);
      expect(result.get('supplier2')).toEqual([mockHotelData[1]]);
      expect(result.get('supplier3')).toEqual([]);
    });

    it('should handle mixed success and failure scenarios', async () => {
      const mockResponse1: AxiosResponse<SupplierHotelData[]> = {
        data: [mockHotelData[0]],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      const error = new Error('Network error');

      const mockResponse3: AxiosResponse<SupplierHotelData[]> = {
        data: [mockHotelData[1]],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.get
        .mockReturnValueOnce(of(mockResponse1))
        .mockReturnValueOnce(throwError(() => error))
        .mockReturnValueOnce(of(mockResponse3));

      const result = await service.fetchHotelsFromAllSuppliers(suppliers);

      expect(result.size).toBe(3);
      expect(result.get('supplier1')).toEqual([mockHotelData[0]]);
      expect(result.get('supplier2')).toEqual([]); // Failed request returns empty array
      expect(result.get('supplier3')).toEqual([mockHotelData[1]]);
    });

    it('should handle all suppliers failing', async () => {
      const error = new Error('Network error');

      httpService.get
        .mockReturnValueOnce(throwError(() => error))
        .mockReturnValueOnce(throwError(() => error))
        .mockReturnValueOnce(throwError(() => error));

      const result = await service.fetchHotelsFromAllSuppliers(suppliers);

      expect(result.size).toBe(3);
      expect(result.get('supplier1')).toEqual([]);
      expect(result.get('supplier2')).toEqual([]);
      expect(result.get('supplier3')).toEqual([]);
    });

    it('should handle empty suppliers array', async () => {
      const result = await service.fetchHotelsFromAllSuppliers([]);

      expect(httpService.get).not.toHaveBeenCalled();
      expect(result.size).toBe(0);
    });

    it('should fetch from suppliers concurrently', async () => {
      const mockResponse: AxiosResponse<SupplierHotelData[]> = {
        data: mockHotelData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      // Mock a delay to test concurrency
      httpService.get.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(of(mockResponse)), 100);
        }) as any;
      });

      const startTime = Date.now();
      const result = await service.fetchHotelsFromAllSuppliers(suppliers);
      const endTime = Date.now();

      // If requests were sequential, it would take ~300ms (3 * 100ms)
      // If concurrent, it should take ~100ms
      expect(endTime - startTime).toBeLessThan(200);
      expect(result.size).toBe(3);
    });
  });

  describe('error handling and logging', () => {
    it('should log successful fetches', async () => {
      const mockResponse: AxiosResponse<SupplierHotelData[]> = {
        data: mockHotelData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.get.mockReturnValue(of(mockResponse));

      const logSpy = jest.spyOn(service['logger'], 'log');

      await service.fetchHotelsFromSupplier(mockSupplierConfig);

      expect(logSpy).toHaveBeenCalledWith(`Fetching hotels from supplier: ${mockSupplierConfig.name}`);
      expect(logSpy).toHaveBeenCalledWith(`Successfully fetched ${mockHotelData.length} hotels from ${mockSupplierConfig.name}`);
    });

    it('should log errors when fetching fails', async () => {
      const error = new Error('Network timeout');
      httpService.get.mockReturnValue(throwError(() => error));

      const errorSpy = jest.spyOn(service['logger'], 'error');

      await service.fetchHotelsFromSupplier(mockSupplierConfig);

      expect(errorSpy).toHaveBeenCalledWith(
        `Failed to fetch hotels from ${mockSupplierConfig.name}:`,
        'Network timeout'
      );
    });
  });
});