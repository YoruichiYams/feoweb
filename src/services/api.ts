import { Room, Booking, Review, Service, HotelSettings } from '../types';
import { INITIAL_ROOMS, INITIAL_SERVICES, INITIAL_REVIEWS, INITIAL_BOOKINGS, DEFAULT_SETTINGS } from '../data/mockData';
import {
  sendBookingTelegramNotification,
  getLocalTelegramSubscribers,
  registerLocalSubscriber,
  removeLocalSubscriber,
  syncTelegramUpdates,
  broadcastTelegramMessage,
  TelegramSubscriber,
  BroadcastResult,
} from './telegramNotification';

const STORAGE_KEYS = {
  ROOMS: 'hotel_rooms_v1',
  BOOKINGS: 'hotel_bookings_v1',
  SERVICES: 'hotel_services_v1',
  REVIEWS: 'hotel_reviews_v1',
  SETTINGS: 'hotel_settings_v1',
  ADMIN_TOKEN: 'hotel_admin_token',
};

// Initialize localStorage with seeds if empty
function initLocalStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.ROOMS)) {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(INITIAL_ROOMS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(INITIAL_SERVICES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(INITIAL_REVIEWS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }
}

// Ensure storage initialized on import
if (typeof window !== 'undefined') {
  initLocalStorage();
}

export const apiService = {
  // Rooms
  async getRooms(): Promise<Room[]> {
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const data = localStorage.getItem(STORAGE_KEYS.ROOMS);
    return data ? JSON.parse(data) : INITIAL_ROOMS;
  },

  async getRoomById(id: number): Promise<Room | null> {
    try {
      const res = await fetch(`/api/rooms/${id}`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const rooms = await this.getRooms();
    return rooms.find((r) => r.id === id) || null;
  },

  async updateRoom(room: Room): Promise<boolean> {
    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(room),
      });
      if (res.ok) return true;
    } catch {
      // Fallback
    }
    const rooms = await this.getRooms();
    const idx = rooms.findIndex((r) => r.id === room.id);
    if (idx !== -1) {
      rooms[idx] = room;
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
      return true;
    }
    return false;
  },

  // Check Availability
  async checkAvailability(checkIn: string, checkOut: string, adults: number, children: number): Promise<Room[]> {
    try {
      const query = new URLSearchParams({
        checkIn,
        checkOut,
        adults: adults.toString(),
        children: children.toString(),
      });
      const res = await fetch(`/api/rooms/check-availability?${query.toString()}`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    // Local check
    const rooms = await this.getRooms();
    const bookings = await this.getBookings();

    const inDate = new Date(checkIn).getTime();
    const outDate = new Date(checkOut).getTime();

    return rooms.filter((room) => {
      if (!room.is_active) return false;
      if (room.capacity_adults < adults) return false;
      if (room.capacity_adults + room.capacity_children < adults + children) return false;

      // Check date collisions
      const roomBookings = bookings.filter(
        (b) => b.room_id === room.id && (b.status === 'confirmed' || b.status === 'checked_in')
      );

      for (const b of roomBookings) {
        const bIn = new Date(b.check_in).getTime();
        const bOut = new Date(b.check_out).getTime();
        // Overlap condition
        if (!(outDate <= bIn || inDate >= bOut)) {
          return false;
        }
      }

      return true;
    });
  },

  // Bookings
  async getBookings(): Promise<Booking[]> {
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return data ? JSON.parse(data) : INITIAL_BOOKINGS;
  },

  async lookupBooking(number: string, phoneOrEmail?: string): Promise<Booking | null> {
    try {
      const params = new URLSearchParams({ number });
      if (phoneOrEmail) {
        if (phoneOrEmail.includes('@')) {
          params.append('email', phoneOrEmail);
        } else {
          params.append('phone', phoneOrEmail);
        }
      }
      const res = await fetch(`/api/bookings/lookup?${params.toString()}`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    const bookings = await this.getBookings();
    const cleanNumber = number.trim().toUpperCase();
    const found = bookings.find((b) => b.booking_number.toUpperCase() === cleanNumber);

    if (!found) return null;

    if (phoneOrEmail) {
      if (phoneOrEmail.includes('@')) {
        if (found.guest_email.toLowerCase() !== phoneOrEmail.trim().toLowerCase()) {
          return null;
        }
      } else {
        const cleanDigits = phoneOrEmail.replace(/\D/g, '');
        const guestDigits = found.guest_phone.replace(/\D/g, '');
        if (!guestDigits.endsWith(cleanDigits.slice(-7))) {
          return null;
        }
      }
    }

    return found;
  },

  async createBooking(data: {
    roomId: number;
    guestName: string;
    guestPhone: string;
    guestEmail: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    totalPrice: number;
    notes?: string;
    tariff_type?: 'base' | 'breakfast';
    selected_services?: string[];
  }): Promise<{ success: boolean; bookingNumber: string }> {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingNumber = `SG-2026-${randomSuffix}`;

    const rooms = await this.getRooms();
    const room = rooms.find((r) => r.id === data.roomId);

    const newBooking: Booking = {
      id: Date.now(),
      booking_number: bookingNumber,
      room_id: data.roomId,
      room_title: room?.title || `Номер #${data.roomId}`,
      room_type: room?.type || 'Стандарт',
      guest_name: data.guestName,
      guest_phone: data.guestPhone,
      guest_email: data.guestEmail,
      check_in: data.checkIn,
      check_out: data.checkOut,
      adults: data.adults,
      children: data.children,
      total_price: data.totalPrice,
      status: 'confirmed',
      payment_status: 'pending_arrival',
      created_at: new Date().toISOString(),
      notes: data.notes,
      tariff_type: data.tariff_type || 'base',
      selected_services: data.selected_services || [],
    };

    const bookings = await this.getBookings();
    bookings.unshift(newBooking);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));

    // Send Telegram broadcast notification (to bot subscribers + fallback admin chat)
    const hotelSettings = await this.getSettings();
    sendBookingTelegramNotification(
      {
        booking_number: bookingNumber,
        room_title: room?.title || `Номер #${data.roomId}`,
        check_in: data.checkIn,
        check_out: data.checkOut,
        adults: data.adults,
        children: data.children,
        total_price: data.totalPrice,
        guest_name: data.guestName,
        guest_phone: data.guestPhone,
        guest_email: data.guestEmail,
        special_requests: data.notes,
      },
      hotelSettings
    ).catch((err) => console.error('[Telegram notification broadcast failed]', err));

    return { success: true, bookingNumber };
  },

  async cancelBooking(bookingId: number): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'PATCH' });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    const bookings = await this.getBookings();
    const idx = bookings.findIndex((b) => b.id === bookingId);
    if (idx !== -1) {
      bookings[idx].status = 'cancelled';
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
      return { success: true, message: 'Бронирование успешно отменено' };
    }
    return { success: false, message: 'Бронирование не найдено' };
  },

  async updateBookingStatus(
    bookingId: number,
    status: Booking['status'],
    paymentStatus?: Booking['payment_status']
  ): Promise<boolean> {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, payment_status: paymentStatus }),
      });
      if (res.ok) return true;
    } catch {
      // Fallback
    }

    const bookings = await this.getBookings();
    const idx = bookings.findIndex((b) => b.id === bookingId);
    if (idx !== -1) {
      bookings[idx].status = status;
      if (paymentStatus) bookings[idx].payment_status = paymentStatus;
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
      return true;
    }
    return false;
  },

  // Services
  async getServices(): Promise<Service[]> {
    try {
      const res = await fetch('/api/services');
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const data = localStorage.getItem(STORAGE_KEYS.SERVICES);
    return data ? JSON.parse(data) : INITIAL_SERVICES;
  },

  // Reviews
  async getReviews(): Promise<Review[]> {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const data = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    return data ? JSON.parse(data) : INITIAL_REVIEWS;
  },

  async addReview(review: { author_name: string; rating: number; text: string; source?: Review['source'] }): Promise<boolean> {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review),
      });
      if (res.ok) return true;
    } catch {
      // Fallback
    }

    const reviews = await this.getReviews();
    const newRev: Review = {
      id: Date.now(),
      author_name: review.author_name,
      rating: review.rating,
      text: review.text,
      date: new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()),
      source: review.source || 'Сайт отеля',
      is_published: 1,
    };
    reviews.unshift(newRev);
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    return true;
  },

  // Settings
  async getSettings(): Promise<HotelSettings> {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = (await res.json()) as Partial<HotelSettings>;
        return { ...DEFAULT_SETTINGS, ...data };
      }
    } catch {
      // Fallback
    }
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  },

  async updateSettings(settings: Partial<HotelSettings>): Promise<boolean> {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) return true;
    } catch {
      // Fallback
    }
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return true;
  },

  // Admin stats
  async getAdminStats(): Promise<{
    occupancyRate: number;
    arrivalsToday: number;
    departuresToday: number;
    totalRevenue: number;
    totalRooms: number;
  }> {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) return (await res.json()) as any;
    } catch {
      // Fallback
    }

    const rooms = await this.getRooms();
    const bookings = await this.getBookings();
    const active = bookings.filter((b) => b.status === 'confirmed' || b.status === 'checked_in');
    const revenue = bookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.total_price || 0), 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const arrivals = bookings.filter((b) => b.check_in === todayStr && b.status !== 'cancelled').length;
    const departures = bookings.filter((b) => b.check_out === todayStr && b.status !== 'cancelled').length;

    const occupancyRate = rooms.length ? Math.min(100, Math.round((active.length / rooms.length) * 100)) : 45;

    return {
      occupancyRate,
      arrivalsToday: arrivals || 2,
      departuresToday: departures || 1,
      totalRevenue: revenue,
      totalRooms: rooms.length || 9,
    };
  },

  // Telegram Subscribers & Broadcasts
  async getTelegramSubscribers(): Promise<TelegramSubscriber[]> {
    try {
      const res = await fetch('/api/telegram/subscribers');
      if (res.ok) {
        const subs = await res.json();
        if (Array.isArray(subs) && subs.length > 0) return subs;
      }
    } catch {
      // Fallback to local
    }
    return getLocalTelegramSubscribers();
  },

  async addTelegramSubscriber(subscriber: Omit<TelegramSubscriber, 'id' | 'created_at'>): Promise<TelegramSubscriber> {
    try {
      await fetch('/api/telegram/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriber),
      });
    } catch {
      // Local fallback
    }
    return registerLocalSubscriber(subscriber);
  },

  async removeTelegramSubscriber(chatId: string): Promise<void> {
    try {
      await fetch(`/api/telegram/subscribers/${chatId}`, { method: 'DELETE' });
    } catch {
      // Local fallback
    }
    removeLocalSubscriber(chatId);
  },

  async syncTelegramUpdates(botToken: string): Promise<{
    success: boolean;
    newCount: number;
    totalActive: number;
    message: string;
    subscribers: TelegramSubscriber[];
  }> {
    return syncTelegramUpdates(botToken);
  },

  async testTelegramBroadcast(overrideSettings?: HotelSettings): Promise<{ success: boolean; message: string; errors?: string[] }> {
    try {
      const res = await fetch('/api/telegram/test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overrideSettings || {}),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Local fallback
    }

    const settings = overrideSettings || (await this.getSettings());
    const testText = `
🛎 <b>ТЕСТОВОЕ УВЕДОМЛЕНИЕ</b>

Бот отеля «Сердце Города» (г. Феодосия) успешно настроен и готов к отправке уведомлений!
⏰ Время проверки: ${new Date().toLocaleTimeString('ru-RU')}
    `.trim();

    const result = await broadcastTelegramMessage(testText, settings);
    return {
      success: result.success,
      message: result.message || `Тестовое сообщение отправлено (${result.delivered}/${result.total} получателей)`,
      errors: result.errors,
    };
  },
};

