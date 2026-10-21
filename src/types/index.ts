export interface Room {
  id: number;
  title: string;
  slug: string;
  type: string;
  capacity_adults: number;
  capacity_children: number;
  area_sqm: number;
  price_base: number;
  amenities: string[];
  images: string[];
  is_active: number;
  description?: string;
  bed_info?: string;
}

export interface Booking {
  id: number;
  booking_number: string;
  room_id: number;
  room_title?: string;
  room_type?: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  check_in: string; // YYYY-MM-DD
  check_out: string; // YYYY-MM-DD
  adults: number;
  children: number;
  total_price: number;
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  payment_status: 'paid' | 'pending_arrival' | 'refunded';
  created_at: string;
  selected_services?: string[];
  tariff_type?: 'base' | 'breakfast';
  notes?: string;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  icon: string;
}

export interface Review {
  id: number;
  author_name: string;
  rating: number;
  text: string;
  date: string;
  source: 'Яндекс Карты' | '2ГИС' | '101Hotels' | 'Сайт отеля';
  is_published: number;
}

export interface HotelSettings {
  hotel_name: string;
  hotel_address: string;
  hotel_phone: string;
  hotel_phone_raw: string;
  hotel_whatsapp: string;
  hotel_telegram: string;
  hotel_email: string;
  check_in_time: string;
  check_out_time: string;
  legal_entity: string;
  legal_inn: string;
  legal_ogrnip: string;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
}

export interface SearchParams {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  childrenAges: number[];
}

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  acceptedAt?: string;
}
