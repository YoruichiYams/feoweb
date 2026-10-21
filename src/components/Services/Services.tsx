import React, { useState } from 'react';
import { ChevronDown, Coffee, PawPrint, Shirt, Bed, Utensils, ShieldCheck, ConciergeBell } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import './Services.css';

export const Services: React.FC = () => {
  const { services } = useHotel();
  const [openId, setOpenId] = useState<number | null>(1);

  const toggleItem = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'paw-print':
        return <PawPrint size={22} />;
      case 'coffee':
        return <Coffee size={22} />;
      case 'shirt':
        return <Shirt size={22} />;
      case 'bed':
        return <Bed size={22} />;
      case 'utensils':
        return <Utensils size={22} />;
      case 'shield-check':
        return <ShieldCheck size={22} />;
      default:
        return <ConciergeBell size={22} />;
    }
  };

  return (
    <section id="services" className="services-section section-padding">
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow">Комфорт и забота</div>
          <h2 className="section-title">Услуги и сервис отеля</h2>
          <p className="section-desc">
            Мы позаботились обо всех деталях, чтобы ваш отдых в Феодосии был беззаботным, легким и по-настоящему восстанавливающим.
          </p>
        </div>

        <div className="services-accordion-wrapper">
          {services.map((service) => {
            const isOpen = openId === service.id;
            return (
              <div key={service.id} className="service-accordion-item">
                <button
                  type="button"
                  className="service-accordion-header"
                  onClick={() => toggleItem(service.id)}
                  aria-expanded={isOpen}
                >
                  <div className="service-title-box">
                    <div className="service-icon-wrap">
                      {getServiceIcon(service.icon)}
                    </div>
                    <span className="service-name">{service.name}</span>
                  </div>

                  <div className="service-meta-box">
                    <span className="service-price-tag">
                      {service.price > 0 ? `${service.price.toLocaleString('ru-RU')} ₽` : 'Бесплатно'}
                    </span>
                    <ChevronDown
                      size={20}
                      color="#64748b"
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.25s ease',
                      }}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="service-accordion-body">
                    <p>{service.description}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
