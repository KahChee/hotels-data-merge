export interface FieldMapping {
  hotelId: string[];
  destinationId: string[];
  name: string[];
  description: string[];
  amenities: string[];
  location: {
    lat: string[];
    lng: string[];
    address: string[];
    city: string[];
    country: string[];
  };
  images: {
    rooms: string[];
    site: string[];
    amenities: string[];
  };
  bookingConditions: string[];
}

export interface SupplierConfig {
  name: string;
  url: string;
  fieldMapping: FieldMapping;
}

export const suppliersConfig: SupplierConfig[] = [
  {
    name: 'acme',
    url: 'https://5f2be0b4ffc88500167b85a0.mockapi.io/suppliers/acme',
    fieldMapping: {
      hotelId: ['Id'],
      destinationId: ['DestinationId'],
      name: ['Name'],
      description: ['Description'],
      amenities: ['Facilities'],
      location: {
        lat: ['Latitude'],
        lng: ['Longitude'],
        address: ['Address'],
        city: ['City'],
        country: ['Country'],
      },
      images: {
        rooms: [],
        site: [],
        amenities: [],
      },
      bookingConditions: [],
    },
  },
  {
    name: 'patagonia',
    url: 'https://5f2be0b4ffc88500167b85a0.mockapi.io/suppliers/patagonia',
    fieldMapping: {
      hotelId: ['id'],
      destinationId: ['destination'],
      name: ['name'],
      description: ['info'],
      amenities: ['amenities'],
      location: {
        lat: ['lat'],
        lng: ['lng'],
        address: ['address'],
        city: [],
        country: [],
      },
      images: {
        rooms: ['images.rooms'],
        site: ['images.site'],
        amenities: ['images.amenities'],
      },
      bookingConditions: [],
    },
  },
  {
    name: 'paperflies',
    url: 'https://5f2be0b4ffc88500167b85a0.mockapi.io/suppliers/paperflies',
    fieldMapping: {
      hotelId: ['hotel_id'],
      destinationId: ['destination_id'],
      name: ['hotel_name'],
      description: ['details'],
      amenities: ['amenities'],
      location: {
        lat: [],
        lng: [],
        address: ['location.address'],
        city: [],
        country: ['location.country'],
      },
      images: {
        rooms: ['images.rooms'],
        site: ['images.site'],
        amenities: ['images.amenities'],
      },
      bookingConditions: ['booking_conditions'],
    },
  },
];