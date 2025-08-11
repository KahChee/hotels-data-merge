import { INestApplication } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { SupplierHotelData } from '../../src/types/hotel.types';

/**
 * Creates a mock HTTP service for testing
 */
export const createMockHttpService = () => {
  return {
    get: jest.fn(),
  };
};

/**
 * Creates a mock Axios response
 */
export const createMockAxiosResponse = <T>(data: T): AxiosResponse<T> => {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  };
};

/**
 * Utility to create a mock logger
 */
export const createMockLogger = () => {
  return {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };
};

/**
 * Utility to validate hotel object structure
 */
export const validateHotelStructure = (hotel: any) => {
  expect(hotel).toHaveProperty('id');
  expect(hotel).toHaveProperty('destination_id');
  expect(hotel).toHaveProperty('name');
  expect(hotel).toHaveProperty('location');
  expect(hotel).toHaveProperty('description');
  expect(hotel).toHaveProperty('amenities');
  expect(hotel).toHaveProperty('images');
  expect(hotel).toHaveProperty('booking_conditions');

  // Validate location structure
  expect(hotel.location).toHaveProperty('lat');
  expect(hotel.location).toHaveProperty('lng');
  expect(hotel.location).toHaveProperty('address');
  expect(hotel.location).toHaveProperty('city');
  expect(hotel.location).toHaveProperty('country');

  // Validate amenities structure
  expect(hotel.amenities).toHaveProperty('general');
  expect(hotel.amenities).toHaveProperty('room');
  expect(Array.isArray(hotel.amenities.general)).toBe(true);
  expect(Array.isArray(hotel.amenities.room)).toBe(true);

  // Validate images structure
  expect(hotel.images).toHaveProperty('rooms');
  expect(hotel.images).toHaveProperty('site');
  expect(hotel.images).toHaveProperty('amenities');
  expect(Array.isArray(hotel.images.rooms)).toBe(true);
  expect(Array.isArray(hotel.images.site)).toBe(true);
  expect(Array.isArray(hotel.images.amenities)).toBe(true);

  // Validate booking conditions
  expect(Array.isArray(hotel.booking_conditions)).toBe(true);
};

/**
 * Utility to validate image object structure
 */
export const validateImageStructure = (image: any) => {
  expect(image).toHaveProperty('link');
  expect(image).toHaveProperty('description');
  expect(typeof image.link).toBe('string');
  expect(typeof image.description).toBe('string');
};

/**
 * Utility to measure execution time
 */
export const measureExecutionTime = async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
};

/**
 * Utility to create a supplier data map for testing
 */
export const createTestSupplierDataMap = (data: Record<string, SupplierHotelData[]>): Map<string, SupplierHotelData[]> => {
  const map = new Map<string, SupplierHotelData[]>();
  Object.entries(data).forEach(([supplier, hotels]) => {
    map.set(supplier, hotels);
  });
  return map;
};

/**
 * Utility to create error scenarios for testing
 */
export const createErrorScenarios = () => {
  return {
    networkError: new Error('Network error'),
    timeoutError: new Error('timeout of 10000ms exceeded'),
    notFoundError: new Error('Request failed with status code 404'),
    serverError: new Error('Request failed with status code 500'),
    unauthorizedError: new Error('Request failed with status code 401'),
    badRequestError: new Error('Request failed with status code 400'),
  };
};

/**
 * Utility to clean up test resources
 */
export const cleanupTestResources = async (app?: INestApplication) => {
  if (app) {
    await app.close();
  }

  // Clear any global mocks or timers if needed
  jest.clearAllMocks();
  jest.clearAllTimers();
  jest.restoreAllMocks(); // For jest.spyOn
};