import React from 'react';
import { ArrowLeft, ChevronRight, Gift, Check, ArrowRight as ArrowRightIcon, Percent, ShieldCheck } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import './SpecialsPage.css';

export const SpecialsPage: React.FC = () => {
  const { setCurrentPage, t } = useHotel();

  const handleApplyOffer = () => {
    setCurrentPage('booking');
  };

  return (
    <div className="specials-page-wrapper">
      {/* Breadcrumbs Header */}
      <div className="specials-page-banner">
        <div className="container">
          <nav className="page-breadcrumbs" aria-label="Breadcrumb">
            <button
              type="button"
              className="breadcrumb-link"
              onClick={() => setCurrentPage('home')}
            >
              <ArrowLeft size={14} />
              <span>{t.nav.home}</span>
            </button>
            <ChevronRight size={14} className="breadcrumb-separator" />
            <span className="breadcrumb-current">{t.nav.specials}</span>
          </nav>

          <div className="specials-page-header">
            <div className="section-eyebrow">ТАРИФЫ И АКЦИИ • ФЕОДОСИЯ</div>
            <h1 className="specials-page-title">Специальные предложения и тарифы</h1>
            <p className="specials-page-subtitle">
              Бронируйте напрямую на официальном сайте отеля «Сердце Города» в Феодосии и получайте гарантированные скидки, бесплатные опции и лучший сервис.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container specials-page-content">
        <div className="specials-grid">
          {/* Tariff 1: Основной тариф на сайте */}
          <div className="special-card featured">
            <span className="special-card-badge">Хит бронирований</span>
            <div className="special-card-img-wrap">
              <img
                src="https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=85"
                alt="Основной тариф на сайте"
                className="special-img"
                loading="lazy"
              />
              <div className="special-img-overlay" />
            </div>
            <div className="special-content">
              <div className="special-top">
                <span className="special-discount-pill">
                  <Percent size={13} />
                  <span>Скидка 10% от агрегаторов</span>
                </span>
                <h2 className="special-title">Основной тариф на сайте</h2>
                <p className="special-desc">
                  Прямое бронирование без комиссий и сторонних посредников. Гарантия самой выгодной цены за сутки и гибкие условия отмены.
                </p>
              </div>

              <ul className="special-perks">
                <li className="special-perk-item">
                  <Check size={16} color="#5B7364" />
                  <span>Моментальное подтверждение официальным ваучером</span>
                </li>
                <li className="special-perk-item">
                  <Check size={16} color="#5B7364" />
                  <span>Бесплатный ранний заезд (при наличии мест)</span>
                </li>
                <li className="special-perk-item">
                  <Check size={16} color="#5B7364" />
                  <span>Оплата при заселении: наличными, картой или СБП</span>
                </li>
                <li className="special-perk-item">
                  <Check size={16} color="#5B7364" />
                  <span>Бесплатная отмена за 48 часов до даты заезда</span>
                </li>
              </ul>

              <div className="special-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={handleApplyOffer}
                >
                  <span>Забронировать по тарифу</span>
                  <ArrowRightIcon size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Tariff 2: Длительное проживание */}
          <div className="special-card">
            <span className="special-card-badge" style={{ backgroundColor: '#1e40af' }}>
              От 5 ночей
            </span>
            <div className="special-card-img-wrap">
              <img
                src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=85"
                alt="Длительный отдых в Крыму"
                className="special-img"
                loading="lazy"
              />
              <div className="special-img-overlay" />
            </div>
            <div className="special-content">
              <div className="special-top">
                <span className="special-discount-pill" style={{ color: '#60a5fa', borderColor: 'rgba(96, 165, 250, 0.3)' }}>
                  <Percent size={13} />
                  <span>Скидка 15% + парковка в подарок</span>
                </span>
                <h2 className="special-title">Длительный отдых в Крыму</h2>
                <p className="special-desc">
                  Проведите полноценный отпуск у Черного моря! При бронировании от 5 суток дарим персональное парковочное место на закрытой территории отеля.
                </p>
              </div>

              <ul className="special-perks">
                <li className="special-perk-item">
                  <Check size={16} color="#5B7364" />
                  <span>Бесплатное гарантированное парковочное место</span>
                </li>
                <li className="special-perk-item">
                  <Check size={16} color="#5B7364" />
                  <span>Регулярная смена белья и полотенец каждые 3 дня</span>
                </li>
                <li className="special-perk-item">
                  <Check size={16} color="#5B7364" />
                  <span>Скидка 20% на услуги прачечной отеля</span>
                </li>
                <li className="special-perk-item">
                  <Check size={16} color="#5B7364" />
                  <span>Приветственный комплимент от отеля при заезде</span>
                </li>
              </ul>

              <div className="special-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                  onClick={handleApplyOffer}
                >
                  <span>Выбрать даты отдыха</span>
                  <ArrowRightIcon size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Tariff 3: Семейный вояж в Феодосию */}
          <div className="special-card">
            <span className="special-card-badge" style={{ backgroundColor: '#059669' }}>
              Для семей с детьми
            </span>
            <div className="special-card-img-wrap">
              <img
                src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=900&q=85"
                alt="Семейный вояж в Феодосию"
                className="special-img"
                loading="lazy"
              />
              <div className="special-img-overlay" />
            </div>
            <div className="special-content">
              <div className="special-top">
                <span className="special-discount-pill" style={{ color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.3)' }}>
                  <Gift size={13} />
                  <span>Дети до 7 лет — бесплатно</span>
                </span>
                <h2 className="special-title">Семейный вояж в Феодосию</h2>
                <p className="special-desc">
                  Комфортное размещение всей семьи в просторных двухкомнатных люксах или студиях с собственной кухней всего в 10 минутах от пляжей Феодосии.
                </p>
              </div>

              <ul className="special-perks">
                <li className="special-perk-item">
                  <Check size={16} color="#5B7364" />
                  <span>Предоставление детской кроватки и манежа по запросу</span>
                </li>
                <li className="special-perk-item">
                  <Check size={16} color="#5B7364" />
                  <span>Посуда для приготовления домашнего детского питания</span>
                </li>
                <li className="special-perk-item">
                  <Check size={16} color="#5B7364" />
                  <span>Скидочные купоны в музеи Айвазовского и Грина</span>
                </li>
                <li className="special-perk-item">
                  <Check size={16} color="#5B7364" />
                  <span>Закрытая безопасная территория без посторонних</span>
                </li>
              </ul>

              <div className="special-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                  onClick={handleApplyOffer}
                >
                  <span>Забронировать для семьи</span>
                  <ArrowRightIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits bar */}
        <div className="specials-guarantee-bar">
          <div className="guarantee-item">
            <ShieldCheck size={24} color="#5B7364" />
            <div>
              <div className="guarantee-title">Лучшая цена гарантирована</div>
              <div className="guarantee-sub">Напрямую от владельца без наценок сервисов</div>
            </div>
          </div>
          <div className="guarantee-item">
            <Check size={24} color="#5B7364" />
            <div>
              <div className="guarantee-title">Официальный ваучер брони</div>
              <div className="guarantee-sub">Приходит на e-mail и WhatsApp моментально</div>
            </div>
          </div>
          <div className="guarantee-item">
            <Gift size={24} color="#5B7364" />
            <div>
              <div className="guarantee-title">Индивидуальный подход</div>
              <div className="guarantee-sub">Учтем любые пожелания к этажу и номеру</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
