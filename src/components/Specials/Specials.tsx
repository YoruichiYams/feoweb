import React from 'react';
import { Percent, Check, Calendar, Gift, Car, ArrowRight } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import './Specials.css';

export const Specials: React.FC = () => {
  const { setCurrentPage } = useHotel();

  const handleApplyOffer = () => {
    setCurrentPage('booking');
  };

  return (
    <section id="specials" className="specials-section section-padding">
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow">ПРЯМОЕ БРОНИРОВАНИЕ • ТАРИФЫ</div>
          <h2 className="section-title">Специальные предложения</h2>
          <p className="section-desc">
            Бронируйте напрямую на официальном сайте отеля «Сердце Города» и получайте гарантированные скидки и приятные комплименты.
          </p>
        </div>

        <div className="specials-grid">
          {/* Offer 1 */}
          <div className="special-card featured">
            <span className="special-card-badge">Хит бронирований</span>
            <img
              src="https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80"
              alt="Основной тариф"
              className="special-img"
              loading="lazy"
            />
            <div className="special-content">
              <h3 className="special-title">Основной тариф на сайте</h3>
              <span className="special-discount-tag">Скидка 10% от цен агрегаторов</span>
              <p className="special-desc">
                Прямое бронирование без комиссий и посредников. Гарантируем самую низкую стоимость суток и бесплатную отмену за 48 часов.
              </p>
              <ul className="special-perks">
                <li className="special-perk-item">
                  <Check size={16} color="#5B7364" />
                  <span>Моментальное подтверждение ваучером</span>
                </li>
                <li className="special-perk-item">
                  <Check size={16} color="#5B7364" />
                  <span>Бесплатный ранний заезд (при наличии свободных мест)</span>
                </li>
                <li className="special-perk-item">
                  <Check size={16} color="#5B7364" />
                  <span>Оплата при заселении наличными или картой</span>
                </li>
              </ul>
              <div className="special-footer">
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={handleApplyOffer}
                >
                  <span>Забронировать по тарифу</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Offer 2 */}
          <div className="special-card">
            <span className="special-card-badge" style={{ backgroundColor: '#2563eb' }}>
              От 5 ночей
            </span>
            <img
              src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"
              alt="Длительное проживание"
              className="special-img"
              loading="lazy"
            />
            <div className="special-content">
              <h3 className="special-title">Длительный отдых в Крыму</h3>
              <span className="special-discount-tag">Скидка 15% + парковка включена</span>
              <p className="special-desc">
                Проведите полноценный отпуск у Черного моря! При бронировании от 5 суток дарим персональное место на закрытой парковке.
              </p>
              <ul className="special-perks">
                <li className="special-perk-item">
                  <Check size={16} color="#5B7364" />
                  <span>Бесплатное парковочное место во дворе</span>
                </li>
                <li className="special-perk-item">
                  <Check size={16} color="#5B7364" />
                  <span>Смена белья и полотенец каждые 3 дня</span>
                </li>
                <li className="special-perk-item">
                  <Check size={16} color="#5B7364" />
                  <span>Скидка 20% на услуги прачечной</span>
                </li>
              </ul>
              <div className="special-footer">
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                  onClick={handleApplyOffer}
                >
                  <span>Выбрать даты</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Offer 3 */}
          <div className="special-card">
            <span className="special-card-badge" style={{ backgroundColor: '#059669' }}>
              Сезонное предложение
            </span>
            <img
              src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80"
              alt="Семейный вояж"
              className="special-img"
              loading="lazy"
            />
            <div className="special-content">
              <h3 className="special-title">Семейный вояж в Феодосию</h3>
              <span className="special-discount-tag">Дети до 7 лет бесплатно</span>
              <p className="special-desc">
                Комфортное размещение всей семьи в просторных двухкомнатных люксах или квартирах с оборудованной кухней.
              </p>
              <ul className="special-perks">
                <li className="special-perk-item">
                  <Check size={16} color="#5B7364" />
                  <span>Предоставление детской кроватки по запросу</span>
                </li>
                <li className="special-perk-item">
                  <Check size={16} color="#5B7364" />
                  <span>Посуда для приготовления каш и питания</span>
                </li>
                <li className="special-perk-item">
                  <Check size={16} color="#5B7364" />
                  <span>Скидочные купоны в музеи Феодосии</span>
                </li>
              </ul>
              <div className="special-footer">
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                  onClick={handleApplyOffer}
                >
                  <span>Забронировать номер</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
