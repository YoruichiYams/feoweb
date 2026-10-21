import React, { useState } from 'react';
import { MapPin, User, ChevronDown, Menu, X, Bell, Heart, Shield } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import './Header.css';

export const Header: React.FC = () => {
  const { settings, setCurrentPage, language, setLanguage, t } = useHotel();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleNavClick = (target: string, isHash: boolean = true) => {
    setMobileMenuOpen(false);
    if (isHash) {
      if (window.location.hash !== '') {
        setCurrentPage('home');
        setTimeout(() => {
          const el = document.getElementById(target);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const el = document.getElementById(target);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      setCurrentPage(target);
    }
  };

  const handleQuickBook = () => {
    setCurrentPage('booking');
  };

  return (
    <header>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="container top-bar-inner">
          <a
            href="#contacts"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('contacts');
            }}
            className="top-bar-address"
            title="Показать отель на карте Феодосии"
          >
            <MapPin size={15} color="#C5A880" />
            <span>{settings.hotel_address}</span>
          </a>

          <div className="top-bar-actions">
            <button
              onClick={() => handleNavClick('admin', false)}
              className="top-bar-btn"
              title="Панель администратора"
            >
              <Shield size={14} />
              <span>{t.nav.admin}</span>
            </button>

            <button
              onClick={() => handleNavClick('guest-account', false)}
              className="top-bar-btn"
              title="Личный кабинет гостя"
            >
              <User size={14} />
              <span>{t.nav.guestAccount}</span>
            </button>

            <div className="lang-selector" style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '6px' }}>
              <button
                type="button"
                className={`lang-btn ${language === 'ru' ? 'active' : ''}`}
                onClick={() => setLanguage('ru')}
                style={{
                  background: language === 'ru' ? '#5B7364' : 'transparent',
                  color: language === 'ru' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                RU
              </button>
              <span style={{ color: '#64748b', fontSize: '0.75rem' }}>/</span>
              <button
                type="button"
                className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => setLanguage('en')}
                style={{
                  background: language === 'en' ? '#5B7364' : 'transparent',
                  color: language === 'en' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="main-header">
        <div className="container navbar-inner">
          {/* Logo */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('home', false);
            }}
            className="brand-logo"
          >
            <div className="brand-icon-wrapper">
              <Heart size={24} fill="#5B7364" color="#5B7364" />
            </div>
            <div className="brand-text">
              <span className="brand-name">{settings.hotel_name}</span>
              <span className="brand-sub">Феодосия • Крым</span>
            </div>
          </a>

          {/* Desktop Navigation Menu */}
          <nav>
            <ul className="nav-menu">
              <li
                className="nav-item-dropdown"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button
                  className="nav-link"
                  onClick={() => handleNavClick('about')}
                  style={{ cursor: 'pointer' }}
                >
                  <span>{t.nav.about}</span>
                  <ChevronDown size={14} />
                </button>
                <div className={`dropdown-menu ${dropdownOpen ? 'open' : ''}`}>
                  <a
                    href="#about"
                    className="dropdown-item"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick('about');
                    }}
                  >
                    {t.nav.aboutHotel}
                  </a>
                  <a
                    href="#gallery"
                    className="dropdown-item"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick('gallery', false);
                    }}
                  >
                    {t.nav.gallery}
                  </a>
                </div>
              </li>

              <li>
                <a
                  href="#rooms"
                  className="nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick('rooms');
                  }}
                >
                  {t.nav.rooms}
                </a>
              </li>

              <li>
                <a
                  href="#specials"
                  className="nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick('specials', false);
                  }}
                >
                  {t.nav.specials}
                </a>
              </li>

              <li>
                <a
                  href="#contacts"
                  className="nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick('contacts');
                  }}
                >
                  {t.nav.contacts}
                </a>
              </li>
            </ul>
          </nav>

          {/* Action / Call to action */}
          <div className="header-actions">
            <button
              onClick={handleQuickBook}
              className="btn-book-action"
              title="Забронировать номер"
            >
              <Bell size={18} />
              <span>{t.nav.book}</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              className="mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Переключить меню"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <ul className="mobile-nav-list">
          <li>
            <button
              className="mobile-nav-link"
              onClick={() => handleNavClick('home', false)}
            >
              {t.nav.home}
            </button>
          </li>
          <li>
            <button
              className="mobile-nav-link"
              onClick={() => handleNavClick('about')}
            >
              {t.nav.about}
            </button>
          </li>
          <li>
            <button
              className="mobile-nav-link"
              onClick={() => handleNavClick('rooms')}
            >
              {t.nav.rooms}
            </button>
          </li>
          <li>
            <button
              className="mobile-nav-link"
              onClick={() => handleNavClick('specials', false)}
            >
              {t.nav.specials}
            </button>
          </li>
          <li>
            <button
              className="mobile-nav-link"
              onClick={() => handleNavClick('gallery', false)}
            >
              {t.nav.gallery}
            </button>
          </li>
          <li>
            <button
              className="mobile-nav-link"
              onClick={() => handleNavClick('contacts')}
            >
              {t.nav.contacts}
            </button>
          </li>

          <li className="mobile-divider" />

          <li>
            <button
              className="mobile-nav-link sub-link"
              onClick={() => handleNavClick('guest-account', false)}
            >
              <User size={18} />
              <span>{t.nav.guestAccount}</span>
            </button>
          </li>
          <li>
            <button
              className="mobile-nav-link sub-link"
              onClick={() => handleNavClick('admin', false)}
            >
              <Shield size={18} />
              <span>{t.nav.admin}</span>
            </button>
          </li>

          <li className="mobile-contact-box">
            <a href={`tel:${settings.hotel_phone_raw}`} className="mobile-phone-link">
              <span>{settings.hotel_phone}</span>
            </a>
            <div className="mobile-address-text">{settings.hotel_address}</div>
          </li>

          <li style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 6px' }}>
            <div className="mobile-lang-pill">
              <button
                type="button"
                className={`mobile-lang-btn ${language === 'ru' ? 'active' : ''}`}
                onClick={() => setLanguage('ru')}
              >
                Русский (RU)
              </button>
              <button
                type="button"
                className={`mobile-lang-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => setLanguage('en')}
              >
                English (EN)
              </button>
            </div>
          </li>
          <li style={{ paddingTop: '8px' }}>
            <button
              className="btn btn-primary mobile-book-btn"
              onClick={handleQuickBook}
            >
              <Bell size={18} />
              <span>{t.nav.book}</span>
            </button>
          </li>
        </ul>
      </div>
    </header>
  );
};
