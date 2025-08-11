import { Hotel, SupplierHotelData } from '../../src/types/hotel.types';
import { SupplierConfig } from '../../src/config/suppliers.config';

export const mockHotels: Hotel[] = [
  {
    id: 'iJhz',
    destination_id: 5432,
    name: 'Beach Villas Singapore',
    location: {
      lat: 1.264751,
      lng: 103.824006,
      address: '8 Sentosa Gateway, Beach Villas, 098269 Singapore',
      city: 'Singapore',
      country: 'Singapore',
    },
    description: 'Located at the western tip of Resorts World Sentosa, guests at the Beach Villas are guaranteed privacy while they enjoy spectacular views of glittering waters. Surrounded by tropical gardens, these upscale villas in elegant Colonial-style buildings are part of the Resorts World Sentosa complex and a 2-minute walk from the Waterfront train station.',
    amenities: {
      general: ['pool', 'businesscenter', 'wifi', 'drycleaning', 'breakfast'],
      room: ['aircon', 'tv', 'coffee machine', 'kettle', 'hair dryer', 'iron', 'tub'],
    },
    images: {
      rooms: [
        { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/2.jpg', description: 'Double room' },
        { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/3.jpg', description: 'Double room' },
        { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/4.jpg', description: 'Bathroom' },
      ],
      site: [
        { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/1.jpg', description: 'Front' },
      ],
      amenities: [
        { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/0.jpg', description: 'RWS' },
      ],
    },
    booking_conditions: [
      'All children are welcome. One child under 12 years stays free of charge when using existing beds. One child under 2 years stays free of charge in a child cot. One child under 4 years stays free of charge when using existing beds. One child under 3 years stays free of charge in a child cot. Free WiFi is available in all rooms. Free WiFi is available in public areas.',
    ],
  },
  {
    id: 'SjyX',
    destination_id: 5432,
    name: 'InterContinental Singapore Robertson Quay',
    location: {
      lat: 1.29376,
      lng: 103.84675,
      address: '1 Nanson Rd, Singapore 238909',
      city: 'Singapore',
      country: 'Singapore',
    },
    description: 'Enjoy sophisticated waterfront dining, premium rooms and suites, and an outdoor pool.',
    amenities: {
      general: ['pool', 'wifi', 'parking'],
      room: ['aircon', 'tv', 'minibar'],
    },
    images: {
      rooms: [
        { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/Sjym/0.jpg', description: 'Double room' },
      ],
      site: [
        { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/Sjym/1.jpg', description: 'Restaurant' },
      ],
      amenities: [],
    },
    booking_conditions: [
      'Pets are not allowed.',
      'WiFi is available in all areas and is free of charge.',
      'Free private parking is possible on site (reservation is not needed).',
    ],
  },
  {
    id: 'f8c9',
    destination_id: 1122,
    name: 'Hilton Tokyo',
    location: {
      lat: 35.6762,
      lng: 139.6993,
      address: '6-6-2 Nishi-Shinjuku, Shinjuku City, Tokyo 160-0023, Japan',
      city: 'Tokyo',
      country: 'Japan',
    },
    description: 'A luxury hotel in the heart of Tokyo with stunning city views.',
    amenities: {
      general: ['pool', 'spa', 'wifi', 'fitness center'],
      room: ['aircon', 'tv', 'minibar', 'safe'],
    },
    images: {
      rooms: [
        { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/f8c9/2.jpg', description: 'Deluxe room' },
        { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/f8c9/3.jpg', description: 'Suite' },
      ],
      site: [
        { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/f8c9/1.jpg', description: 'Lobby' },
      ],
      amenities: [
        { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/f8c9/0.jpg', description: 'Pool' },
      ],
    },
    booking_conditions: [
      'Check-in from 15:00, check-out until 12:00.',
      'Children under 12 stay free when using existing beds.',
    ],
  },
];

export const mockSupplierData = {
  acme: [
    {
      Id: 'iJhz',
      DestinationId: 5432,
      Name: 'Beach Villas Singapore',
      Latitude: 1.264751,
      Longitude: 103.824006,
      Address: '8 Sentosa Gateway, Beach Villas',
      City: 'Singapore',
      Country: 'Singapore',
      Description: 'Surrounded by tropical gardens, these upscale villas in elegant Colonial-style buildings are part of the Resorts World Sentosa complex and a 2-minute walk from the Waterfront train station.',
      Facilities: ['Pool', 'BusinessCenter', 'WiFi', 'DryCleaning', 'Breakfast'],
    },
    {
      Id: 'SjyX',
      DestinationId: 5432,
      Name: 'InterContinental Singapore Robertson Quay',
      Latitude: 1.29376,
      Longitude: 103.84675,
      Address: '1 Nanson Rd',
      City: 'Singapore',
      Country: 'Singapore',
      Description: 'Enjoy sophisticated waterfront dining, premium rooms and suites, and an outdoor pool.',
      Facilities: ['Pool', 'WiFi', 'Parking'],
    },
  ] as SupplierHotelData[],
  
  patagonia: [
    {
      id: 'iJhz',
      destination: 5432,
      name: 'Beach Villas Singapore',
      info: 'Located at the western tip of Resorts World Sentosa, guests at the Beach Villas are guaranteed privacy while they enjoy spectacular views of glittering waters.',
      amenities: ['Aircon', 'Tv', 'Coffee machine', 'Kettle', 'Hair dryer', 'Iron', 'Tub'],
      images: {
        rooms: [
          { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/2.jpg', description: 'Double room' },
          { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/3.jpg', description: 'Double room' },
          { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/4.jpg', description: 'Bathroom' },
        ],
        site: [
          { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/1.jpg', description: 'Front' },
        ],
        amenities: [
          { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/0.jpg', description: 'RWS' },
        ],
      },
      lat: 1.264751,
      lng: 103.824006,
      address: '8 Sentosa Gateway, Beach Villas, 098269 Singapore',
    },
    {
      id: 'f8c9',
      destination: 1122,
      name: 'Hilton Tokyo',
      info: 'A luxury hotel in the heart of Tokyo with stunning city views.',
      amenities: ['Aircon', 'Tv', 'Minibar', 'Safe'],
      images: {
        rooms: [
          { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/f8c9/2.jpg', description: 'Deluxe room' },
          { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/f8c9/3.jpg', description: 'Suite' },
        ],
        site: [
          { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/f8c9/1.jpg', description: 'Lobby' },
        ],
        amenities: [
          { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/f8c9/0.jpg', description: 'Pool' },
        ],
      },
      lat: 35.6762,
      lng: 139.6993,
      address: '6-6-2 Nishi-Shinjuku, Shinjuku City, Tokyo 160-0023, Japan',
    },
  ] as SupplierHotelData[],
  
  paperflies: [
    {
      hotel_id: 'iJhz',
      destination_id: 5432,
      hotel_name: 'Beach Villas Singapore',
      location: {
        address: '8 Sentosa Gateway, Beach Villas, 098269 Singapore',
        country: 'Singapore',
      },
      details: 'Surrounded by tropical gardens, these upscale villas in elegant Colonial-style buildings are part of the Resorts World Sentosa complex and a 2-minute walk from the Waterfront train station.',
      amenities: {
        general: ['Pool', 'BusinessCenter', 'WiFi', 'DryCleaning', 'Breakfast'],
        room: ['Aircon', 'Tv', 'Coffee machine', 'Kettle', 'Hair dryer', 'Iron', 'Tub'],
      },
      images: {
        rooms: [
          { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/2.jpg', description: 'Double room' },
          { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/3.jpg', description: 'Double room' },
        ],
        site: [
          { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/1.jpg', description: 'Front' },
        ],
        amenities: [
          { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/0qUb/0.jpg', description: 'RWS' },
        ],
      },
      booking_conditions: [
        'All children are welcome. One child under 12 years stays free of charge when using existing beds. One child under 2 years stays free of charge in a child cot. One child under 4 years stays free of charge when using existing beds. One child under 3 years stays free of charge in a child cot. Free WiFi is available in all rooms. Free WiFi is available in public areas.',
      ],
    },
    {
      hotel_id: 'SjyX',
      destination_id: 5432,
      hotel_name: 'InterContinental Singapore Robertson Quay',
      location: {
        address: '1 Nanson Rd, Singapore 238909',
        country: 'Singapore',
      },
      details: 'Enjoy sophisticated waterfront dining, premium rooms and suites, and an outdoor pool.',
      amenities: {
        general: ['Pool', 'WiFi', 'Parking'],
        room: ['Aircon', 'Tv', 'Minibar'],
      },
      images: {
        rooms: [
          { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/Sjym/0.jpg', description: 'Double room' },
        ],
        site: [
          { link: 'https://d2ey9sqrvkqdfs.cloudfront.net/Sjym/1.jpg', description: 'Restaurant' },
        ],
        amenities: [],
      },
      booking_conditions: [
        'Pets are not allowed.',
        'WiFi is available in all areas and is free of charge.',
        'Free private parking is possible on site (reservation is not needed).',
      ],
    },
  ] as SupplierHotelData[],
};

export const mockSupplierConfigs: SupplierConfig[] = [
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

export const createMockSupplierDataMap = (): Map<string, SupplierHotelData[]> => {
  const map = new Map<string, SupplierHotelData[]>();
  map.set('acme', mockSupplierData.acme);
  map.set('patagonia', mockSupplierData.patagonia);
  map.set('paperflies', mockSupplierData.paperflies);
  return map;
};

export const mockAvailableIds = {
  hotel_ids: ['SjyX', 'f8c9', 'iJhz'],
  destination_ids: [1122, 5432],
};