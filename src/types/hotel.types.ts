export interface Location {
  lat: number;
  lng: number;
  address: string;
  city: string;
  country: string;
}

export interface Amenities {
  general: string[];
  room: string[];
}

export interface Image {
  link: string;
  description: string;
}

export interface Images {
  rooms: Image[];
  site: Image[];
  amenities: Image[];
}

export interface Hotel {
  id: string;
  destination_id: number;
  name: string;
  location: Location;
  description: string;
  amenities: Amenities;
  images: Images;
  booking_conditions: string[];
}

// Raw supplier data interfaces
export interface SupplierHotelData {
  id?: string;
  Id?: string;
  hotel_id?: string;
  destination_id?: number;
  destination?: number;
  name?: string;
  hotel_name?: string;
  location?: any;
  address?: any;
  description?: string;
  details?: string;
  info?: string;
  amenities?: any;
  facilities?: any;
  images?: any;
  pictures?: any;
  booking_conditions?: string[];
  terms?: string[];
  [key: string]: any; // Allow for additional unknown properties
}