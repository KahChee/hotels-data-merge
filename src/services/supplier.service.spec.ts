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
        `Failed to fetch hotels from ${mockSupplierConfig.name} after 1 attempt(s): Network timeout`
      );
    });
  });

  describe('retry mechanism', () => {
    beforeEach(() => {
      // Mock the sleep method to avoid actual delays in tests
      jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);
    });

    it('should retry up to 3 times on retryable errors and then succeed', async () => {
      const mockResponse = createMockAxiosResponse(mockHotelData);
      const networkError = new Error('Network error');
      networkError['code'] = 'ECONNRESET';

      httpService.get
        .mockReturnValueOnce(throwError(() => networkError))
        .mockReturnValueOnce(throwError(() => networkError))
        .mockReturnValueOnce(of(mockResponse));

      const logSpy = jest.spyOn(service['logger'], 'log');
      const warnSpy = jest.spyOn(service['logger'], 'warn');

      const result = await service.fetchHotelsFromSupplier(mockSupplierConfig);

      expect(httpService.get).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockHotelData);
      expect(warnSpy).toHaveBeenCalledTimes(2);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Attempt 1 failed for supplier ${mockSupplierConfig.name}`)
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Attempt 2 failed for supplier ${mockSupplierConfig.name}`)
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Successfully fetched ${mockHotelData.length} hotels from ${mockSupplierConfig.name} (attempt 3)`)
      );
    });

    it('should fail after 3 retry attempts and return empty array', async () => {
      const networkError = new Error('Network error');
      networkError['code'] = 'ECONNRESET';

      httpService.get.mockReturnValue(throwError(() => networkError));

      const errorSpy = jest.spyOn(service['logger'], 'error');
      const warnSpy = jest.spyOn(service['logger'], 'warn');

      const result = await service.fetchHotelsFromSupplier(mockSupplierConfig);

      expect(httpService.get).toHaveBeenCalledTimes(3);
      expect(result).toEqual([]);
      expect(warnSpy).toHaveBeenCalledTimes(2);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Failed to fetch hotels from ${mockSupplierConfig.name} after 3 attempt(s)`)
      );
    });

    it('should not retry on non-retryable errors (4xx client errors)', async () => {
      const clientError = {
        response: { status: 404 },
        message: 'Not Found'
      };

      httpService.get.mockReturnValue(throwError(() => clientError));

      const errorSpy = jest.spyOn(service['logger'], 'error');
      const warnSpy = jest.spyOn(service['logger'], 'warn');

      const result = await service.fetchHotelsFromSupplier(mockSupplierConfig);

      expect(httpService.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Failed to fetch hotels from ${mockSupplierConfig.name} after 1 attempt(s)`)
      );
    });

    it('should retry on 5xx server errors', async () => {
      const serverError = {
        response: { status: 500 },
        message: 'Internal Server Error'
      };
      const mockResponse = createMockAxiosResponse(mockHotelData);

      httpService.get
        .mockReturnValueOnce(throwError(() => serverError))
        .mockReturnValueOnce(of(mockResponse));

      const warnSpy = jest.spyOn(service['logger'], 'warn');

      const result = await service.fetchHotelsFromSupplier(mockSupplierConfig);

      expect(httpService.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockHotelData);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('should retry on 429 rate limiting errors', async () => {
      const rateLimitError = {
        response: { status: 429 },
        message: 'Too Many Requests'
      };
      const mockResponse = createMockAxiosResponse(mockHotelData);

      httpService.get
        .mockReturnValueOnce(throwError(() => rateLimitError))
        .mockReturnValueOnce(of(mockResponse));

      const warnSpy = jest.spyOn(service['logger'], 'warn');

      const result = await service.fetchHotelsFromSupplier(mockSupplierConfig);

      expect(httpService.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockHotelData);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('should retry on timeout errors (ECONNABORTED)', async () => {
      const timeoutError = new Error('Timeout');
      timeoutError['code'] = 'ECONNABORTED';
      const mockResponse = createMockAxiosResponse(mockHotelData);

      httpService.get
        .mockReturnValueOnce(throwError(() => timeoutError))
        .mockReturnValueOnce(of(mockResponse));

      const warnSpy = jest.spyOn(service['logger'], 'warn');

      const result = await service.fetchHotelsFromSupplier(mockSupplierConfig);

      expect(httpService.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockHotelData);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('should retry on DNS resolution errors (ENOTFOUND)', async () => {
      const dnsError = new Error('DNS resolution failed');
      dnsError['code'] = 'ENOTFOUND';
      const mockResponse = createMockAxiosResponse(mockHotelData);

      httpService.get
        .mockReturnValueOnce(throwError(() => dnsError))
        .mockReturnValueOnce(of(mockResponse));

      const warnSpy = jest.spyOn(service['logger'], 'warn');

      const result = await service.fetchHotelsFromSupplier(mockSupplierConfig);

      expect(httpService.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockHotelData);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('should retry on network errors without response', async () => {
      const networkError = {
        request: {},
        message: 'Network Error'
      };
      const mockResponse = createMockAxiosResponse(mockHotelData);

      httpService.get
        .mockReturnValueOnce(throwError(() => networkError))
        .mockReturnValueOnce(of(mockResponse));

      const warnSpy = jest.spyOn(service['logger'], 'warn');

      const result = await service.fetchHotelsFromSupplier(mockSupplierConfig);

      expect(httpService.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockHotelData);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('should calculate retry delays with exponential backoff', () => {
      const calculateRetryDelay = service['calculateRetryDelay'].bind(service);
      
      // Test that delays increase exponentially (with some tolerance for jitter)
      const delay1 = calculateRetryDelay(1);
      const delay2 = calculateRetryDelay(2);
      const delay3 = calculateRetryDelay(3);

      // Base delay is 1000ms, so expected delays are ~1000, ~2000, ~4000 (±25% jitter)
      expect(delay1).toBeGreaterThan(750);
      expect(delay1).toBeLessThan(1250);
      
      expect(delay2).toBeGreaterThan(1500);
      expect(delay2).toBeLessThan(2500);
      
      expect(delay3).toBeGreaterThan(3000);
      expect(delay3).toBeLessThan(5000);
    });

    it('should identify retryable errors correctly', () => {
      const isRetryableError = service['isRetryableError'].bind(service);

      // Retryable errors
      expect(isRetryableError({ code: 'ECONNABORTED' })).toBe(true);
      expect(isRetryableError({ code: 'ENOTFOUND' })).toBe(true);
      expect(isRetryableError({ code: 'ECONNRESET' })).toBe(true);
      expect(isRetryableError({ response: { status: 500 } })).toBe(true);
      expect(isRetryableError({ response: { status: 502 } })).toBe(true);
      expect(isRetryableError({ response: { status: 503 } })).toBe(true);
      expect(isRetryableError({ response: { status: 429 } })).toBe(true);
      expect(isRetryableError({ request: {} })).toBe(true);

      // Non-retryable errors
      expect(isRetryableError({ response: { status: 400 } })).toBe(false);
      expect(isRetryableError({ response: { status: 401 } })).toBe(false);
      expect(isRetryableError({ response: { status: 403 } })).toBe(false);
      expect(isRetryableError({ response: { status: 404 } })).toBe(false);
      expect(isRetryableError({ message: 'Some other error' })).toBe(false);
    });
  });
});