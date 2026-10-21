import React from 'react';
import { MapPin, Phone, Mail, Clock, MessageCircle, Send, Car, Train, Navigation, ShieldCheck } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import './Contacts.css';

export const Contacts: React.FC = () => {
  const { settings, t } = useHotel();

  return (
    <section id="contacts" className="contacts-section section-padding">
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow">{t.contacts.badge}</div>
          <h2 className="section-title">{t.contacts.title}</h2>
          <p className="section-desc">
            {t.contacts.subtitle}
          </p>
        </div>

        <div className="contacts-grid">
          {/* Contact Details Card */}
          <div className="contact-info-card">
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: 8 }}>
              {settings.hotel_name}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              {t.contacts.reception247}
            </p>

            <div className="contact-rows-list">
              {/* Address */}
              <div className="contact-row-item">
                <div className="contact-icon-box">
                  <MapPin size={22} />
                </div>
                <div>
                  <div className="contact-detail-title">{t.contacts.addressTitle}</div>
                  <div className="contact-detail-val">{settings.hotel_address}</div>
                </div>
              </div>

              {/* Phone */}
              <div className="contact-row-item">
                <div className="contact-icon-box">
                  <Phone size={22} />
                </div>
                <div>
                  <div className="contact-detail-title">{t.contacts.phoneTitle}</div>
                  <div className="contact-detail-val">
                    <a href={`tel:${settings.hotel_phone_raw}`}>{settings.hotel_phone}</a>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="contact-row-item">
                <div className="contact-icon-box">
                  <Mail size={22} />
                </div>
                <div>
                  <div className="contact-detail-title">{t.contacts.emailTitle}</div>
                  <div className="contact-detail-val">
                    <a href={`mailto:${settings.hotel_email}`}>{settings.hotel_email}</a>
                  </div>
                </div>
              </div>

              {/* Check-In / Out Times */}
              <div className="contact-row-item">
                <div className="contact-icon-box">
                  <Clock size={22} />
                </div>
                <div>
                  <div className="contact-detail-title">{t.contacts.hoursTitle}</div>
                  <div className="contact-detail-val">
                    {t.contacts.hoursVal}
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Messengers */}
            <div className="messengers-row">
              <a
                href={`https://wa.me/${settings.hotel_whatsapp}?text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5!%20%D0%AF%20%D1%85%D0%BE%D1%87%D1%83%20%D1%83%D0%B7%D0%BD%D0%B0%D1%82%D1%8C%20%D0%BF%D1%80%D0%BE%20%D0%B1%D1%80%D0%BE%D0%BD%D0%B8%D1%80%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5%20%D0%B2%20%D0%BE%D1%82%D0%B5%D0%BB%D0%B5%20%D0%A1%D0%B5%D1%80%D0%B4%D1%86%D0%B5%20%D0%93%D0%BE%D1%80%D0%BE%D0%B4%D0%B0`}
                target="_blank"
                rel="noreferrer"
                className="btn-msg wa"
              >
                <MessageCircle size={18} />
                <span>WhatsApp</span>
              </a>

              <a
                href={`https://t.me/${settings.hotel_telegram}`}
                target="_blank"
                rel="noreferrer"
                className="btn-msg tg"
              >
                <Send size={18} />
                <span>Telegram</span>
              </a>
            </div>
          </div>

          {/* Interactive Map */}
          <div className="map-container">
            <iframe
              title="Яндекс Карта расположения гостиницы Победа в Феодосии"
              src="https://yandex.ru/map-widget/v1/?text=%D0%A0%D0%B5%D1%81%D0%BF%D1%83%D0%B1%D0%BB%D0%B8%D0%BA%D0%B0%20%D0%9A%D1%80%D1%8B%D0%BC%2C%20%D0%B3.%20%D0%A4%D0%B5%D0%BE%D0%B4%D0%BE%D1%81%D0%B8%D1%8F%2C%20%D1%83%D0%BB%D0%B8%D1%86%D0%B0%20%D0%9F%D0%BE%D0%B1%D0%B5%D0%B4%D1%8B%2C%2036%2F1&z=16"
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen={true}
              loading="lazy"
            />
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                right: 12,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: '#1e293b',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                <MapPin size={18} color="#5B7364" />
                <span>{settings.hotel_address}</span>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href="https://yandex.ru/maps/?text=%D0%A0%D0%B5%D1%81%D0%BF%D1%83%D0%B1%D0%BB%D0%B8%D0%BA%D0%B0+%D0%9A%D1%80%D1%8B%D0%BC%2C+%D0%B3.+%D0%A4%D0%B5%D0%BE%D0%B4%D0%BE%D1%81%D0%B8%D1%8F%2C+%D1%83%D0%BB%D0%B8%D1%86%D0%B0+%D0%9F%D0%BE%D0%B1%D0%B5%D0%B4%D1%8B%2C+36%2F1"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  {t.contacts.yandexMaps}
                </a>
                <a
                  href="https://2gis.ru/feodosia"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  {t.contacts.gis2}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* How to Get Here Guide */}
        <div className="how-to-reach-box">
          <h3 className="how-to-reach-title">{t.contacts.howToReach}</h3>
          <div className="directions-grid">
            <div className="direction-card">
              <div className="direction-card-title">
                <Car size={20} />
                <span>{t.contacts.byCarTitle}</span>
              </div>
              <p className="direction-card-text">
                {t.contacts.byCarText}
              </p>
            </div>

            <div className="direction-card">
              <div className="direction-card-title">
                <Train size={20} />
                <span>{t.contacts.byTrainTitle}</span>
              </div>
              <p className="direction-card-text">
                {t.contacts.byTrainText}
              </p>
            </div>

            <div className="direction-card">
              <div className="direction-card-title">
                <Navigation size={20} />
                <span>{t.contacts.byBusTitle}</span>
              </div>
              <p className="direction-card-text">
                {t.contacts.byBusText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
