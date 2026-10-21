import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Room, Service, Review, HotelSettings, SearchParams } from '../types';
import { apiService } from '../services/api';
import { DEFAULT_SETTINGS, INITIAL_ROOMS, INITIAL_SERVICES, INITIAL_REVIEWS } from '../data/mockData';
import { Language, translations } from '../data/translations';

interface HotelContextType {
  rooms: Room[];
  services: Service[];
  reviews: Review[];
  settings: HotelSettings;
  searchParams: SearchParams;
  setSearchParams: React.Dispatch<React.SetStateAction<SearchParams>>;
  selectedRoom: Room | null;
  setSelectedRoom: (room: Room | null) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  modalRoom: Room | null;
  setModalRoom: (room: Room | null) => void;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  openBookingWithRoom: (room: Room) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['ru'];
}

const getTomorrowDate = (daysAhead: number = 1): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

const defaultSearch: SearchParams = {
  checkIn: getTomorrowDate(0),
  checkOut: getTomorrowDate(1),
  adults: 2,
  children: 0,
  childrenAges: [],
};

const HotelContext = createContext<HotelContextType | undefined>(undefined);

export const HotelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('hotel_lang');
    return saved === 'en' ? 'en' : 'ru';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('hotel_lang', lang);
  };

  const t = translations[language];

  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [settings, setSettings] = useState<HotelSettings>(DEFAULT_SETTINGS);
  const [searchParams, setSearchParams] = useState<SearchParams>(defaultSearch);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [modalRoom, setModalRoom] = useState<Room | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Simple client-side routing based on hash or state
  const [currentPage, setCurrentPageState] = useState<string>('home');

  const setCurrentPage = (page: string) => {
    setCurrentPageState(page);
    window.location.hash = page === 'home' ? '' : page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['specials', 'gallery', 'booking', 'guest-account', 'admin', 'privacy-policy', 'terms-of-service', 'refund-policy', 'cookie-policy'].includes(hash)) {
        setCurrentPageState(hash);
      } else {
        setCurrentPageState('home');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const refreshData = async () => {
    try {
      const [fetchedRooms, fetchedServices, fetchedReviews, fetchedSettings] = await Promise.all([
        apiService.getRooms(),
        apiService.getServices(),
        apiService.getReviews(),
        apiService.getSettings(),
      ]);
      setRooms(fetchedRooms);
      setServices(fetchedServices);
      setReviews(fetchedReviews);
      setSettings(fetchedSettings);
    } catch (e) {
      console.error('Failed to load hotel data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const openBookingWithRoom = (room: Room) => {
    setSelectedRoom(room);
    setCurrentPage('booking');
  };

  return (
    <HotelContext.Provider
      value={{
        rooms,
        services,
        reviews,
        settings,
        searchParams,
        setSearchParams,
        selectedRoom,
        setSelectedRoom,
        currentPage,
        setCurrentPage,
        activeModal,
        setActiveModal,
        modalRoom,
        setModalRoom,
        isLoading,
        refreshData,
        openBookingWithRoom,
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </HotelContext.Provider>
  );
};

export const useHotel = (): HotelContextType => {
  const context = useContext(HotelContext);
  if (!context) {
    throw new Error('useHotel must be used within a HotelProvider');
  }
  return context;
};
