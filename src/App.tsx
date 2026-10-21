import React from 'react';
import { useHotel } from './context/HotelContext';
import { Header } from './components/Header/Header';
import { Hero } from './components/Hero/Hero';
import { About } from './components/About/About';
import { Rooms } from './components/Rooms/Rooms';
import { SpecialsPage } from './components/Specials/SpecialsPage';
import { GalleryPage } from './components/Gallery/GalleryPage';
import { Contacts } from './components/Contacts/Contacts';
import { Footer } from './components/Footer/Footer';
import { BookingWizard } from './components/Booking/BookingWizard';
import { GuestAccount } from './components/GuestAccount/GuestAccount';
import { AdminPanel } from './components/Admin/AdminPanel';
import { LegalPage } from './components/Legal/LegalPage';
import { CookieBanner } from './components/CookieBanner/CookieBanner';

export const App: React.FC = () => {
  const { currentPage } = useHotel();

  return (
    <div className="site-wrapper">
      <Header />

      <main>
        {currentPage === 'home' && (
          <>
            <Hero />
            <About />
            <Rooms />
            <Contacts />
          </>
        )}

        {currentPage === 'specials' && <SpecialsPage />}

        {currentPage === 'gallery' && <GalleryPage />}

        {currentPage === 'booking' && <BookingWizard />}

        {currentPage === 'guest-account' && <GuestAccount />}

        {currentPage === 'admin' && <AdminPanel />}

        {currentPage === 'privacy-policy' && <LegalPage type="privacy-policy" />}

        {currentPage === 'terms-of-service' && <LegalPage type="terms-of-service" />}

        {currentPage === 'refund-policy' && <LegalPage type="refund-policy" />}

        {currentPage === 'cookie-policy' && <LegalPage type="cookie-policy" />}
      </main>

      <Footer />

      <CookieBanner />
    </div>
  );
};
