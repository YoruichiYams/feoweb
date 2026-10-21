import React from 'react';
import { Heart, MapPin, Phone, Mail, Clock, Shield } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import './Footer.css';

export const Footer: React.FC = () => {
  const { settings, setCurrentPage, setActiveModal, t } = useHotel();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top-grid">
          {/* Col 1: Hotel Brand */}
          <div>
            <div className="footer-brand-title">{settings.hotel_name}</div>
            <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: 16 }}>
              {t.footer.desc}
            </p>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {settings.legal_entity} • ИНН {settings.legal_inn} • ОГРНИП {settings.legal_ogrnip}
            </div>
            <div className="footer-socials">
              <a
                href="https://vk.com"
                target="_blank"
                rel="noreferrer"
                className="footer-social-btn"
                title="VK"
              >
                VK
              </a>
              <a
                href={`https://t.me/${settings.hotel_telegram}`}
                target="_blank"
                rel="noreferrer"
                className="footer-social-btn"
                title="Telegram"
              >
                TG
              </a>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <div className="footer-col-title">{t.footer.navTitle}</div>
            <ul className="footer-links-list">
              <li>
                <button className="footer-link-btn" onClick={() => setCurrentPage('home')}>
                  {t.nav.about}
                </button>
              </li>
              <li>
                <a href="#rooms" className="footer-link-btn" onClick={() => setCurrentPage('home')}>
                  {t.nav.rooms}
                </a>
              </li>
              <li>
                <button className="footer-link-btn" onClick={() => setCurrentPage('specials')}>
                  {t.nav.specials}
                </button>
              </li>
              <li>
                <button className="footer-link-btn" onClick={() => setCurrentPage('gallery')}>
                  {t.nav.gallery}
                </button>
              </li>
              <li>
                <a href="#contacts" className="footer-link-btn" onClick={() => setCurrentPage('home')}>
                  {t.nav.contacts}
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Guest & Admin */}
          <div>
            <div className="footer-col-title">{t.nav.guestAccount}</div>
            <ul className="footer-links-list">
              <li>
                <button
                  className="footer-link-btn"
                  onClick={() => setCurrentPage('booking')}
                  style={{ color: '#5B7364', fontWeight: 700 }}
                >
                  {t.nav.book}
                </button>
              </li>
              <li>
                <button
                  className="footer-link-btn"
                  onClick={() => setCurrentPage('guest-account')}
                >
                  {t.nav.guestAccount}
                </button>
              </li>
              <li>
                <button
                  className="footer-link-btn"
                  onClick={() => setCurrentPage('admin')}
                >
                  {t.nav.admin}
                </button>
              </li>
              <li>
                <button
                  className="footer-link-btn"
                  onClick={() => setActiveModal('cookie-settings')}
                >
                  Cookie
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Contacts & Reception */}
          <div>
            <div className="footer-col-title">{t.footer.contactsTitle}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <MapPin size={18} color="#5B7364" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{settings.hotel_address}</span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Phone size={18} color="#5B7364" style={{ flexShrink: 0 }} />
                <a href={`tel:${settings.hotel_phone_raw}`} style={{ color: '#ffffff', fontWeight: 600 }}>
                  {settings.hotel_phone}
                </a>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Mail size={18} color="#5B7364" style={{ flexShrink: 0 }} />
                <a href={`mailto:${settings.hotel_email}`}>{settings.hotel_email}</a>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Clock size={18} color="#5B7364" style={{ flexShrink: 0 }} />
                <span>24/7</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Links and Copyright */}
        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} {t.footer.rights}
          </div>

          <div className="legal-inline-links">
            <button onClick={() => setCurrentPage('privacy-policy')}>
              {t.footer.privacyPolicy}
            </button>
            <button onClick={() => setCurrentPage('terms-of-service')}>
              {t.footer.termsOfService}
            </button>
            <button onClick={() => setCurrentPage('refund-policy')}>
              {t.footer.refundPolicy}
            </button>
            <button onClick={() => setCurrentPage('cookie-policy')}>
              {t.footer.cookiePolicy}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
