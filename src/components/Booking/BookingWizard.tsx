import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Users,
  CheckCircle,
  ShieldCheck,
  Printer,
  ArrowRight,
  ArrowLeft,
  Bed,
  Check,
  Clock,
  MapPin,
  Edit2,
} from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { Room } from '../../types';
import { apiService } from '../../services/api';
import { CalendarPopover } from '../ui/CalendarPopover';
import './BookingWizard.css';

export const BookingWizard: React.FC = () => {
  const {
    rooms,
    settings,
    searchParams,
    setSearchParams,
    selectedRoom,
    setSelectedRoom,
    setCurrentPage,
    t,
  } = useHotel();

  // Step 1: Dates & Guests -> Step 2: Choose Room -> Step 3: Guest Details -> Step 4: Confirmation
  const [step, setStep] = useState<number>(1);
  const [availableRooms, setAvailableRooms] = useState<Room[]>(rooms);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);
  const [calendarAnchor, setCalendarAnchor] = useState<HTMLElement | null>(null);
  const checkInRef = useRef<HTMLDivElement>(null);
  const checkOutRef = useRef<HTMLDivElement>(null);

  // Guest Details
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [phone, setPhone] = useState('+7 ');
  const [email, setEmail] = useState('');
  const [arrivalTime, setArrivalTime] = useState('14:00 - 16:00');
  const [specialRequests, setSpecialRequests] = useState('');

  // Compliance Checkboxes (Strictly NOT pre-checked)
  const [consentPersonalData, setConsentPersonalData] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);

  // Result
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBookingNumber, setConfirmedBookingNumber] = useState<string | null>(null);

  // Calculate nights
  const getNights = () => {
    if (!searchParams.checkIn || !searchParams.checkOut) return 1;
    const diff = new Date(searchParams.checkOut).getTime() - new Date(searchParams.checkIn).getTime();
    const nights = Math.round(diff / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 1;
  };

  const nights = getNights();

  // Live availability check
  const performSearch = async () => {
    setIsChecking(true);
    try {
      const freeRooms = await apiService.checkAvailability(
        searchParams.checkIn,
        searchParams.checkOut,
        searchParams.adults,
        searchParams.children
      );
      setAvailableRooms(freeRooms);
      if (selectedRoom && !freeRooms.some((r) => r.id === selectedRoom.id)) {
        setSelectedRoom(freeRooms[0] || null);
      }
    } catch {
      setAvailableRooms(rooms);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    performSearch();
  }, [searchParams.checkIn, searchParams.checkOut, searchParams.adults, searchParams.children]);

  // Price Calculation: Base room price * nights (NO tariffs, NO extra services)
  const totalPrice = (selectedRoom ? selectedRoom.price_base : 3200) * nights;

  const handleSelectRoomAndProceed = (room: Room) => {
    setSelectedRoom(room);
    setStep(3);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentPersonalData || !consentTerms) {
      alert('Пожалуйста, подтвердите согласие на обработку персональных данных и принятие условий оферты.');
      return;
    }

    if (!selectedRoom) {
      alert('Пожалуйста, выберите категорию номера.');
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    const fullName = `${lastName.trim()} ${firstName.trim()} ${middleName.trim()}`.trim();

    try {
      const res = await apiService.createBooking({
        roomId: selectedRoom.id,
        guestName: fullName,
        guestPhone: phone,
        guestEmail: email,
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        adults: searchParams.adults,
        children: searchParams.children,
        totalPrice,
        notes: `Время заезда: ${arrivalTime}. ${specialRequests}`,
      });

      if (res.success) {
        setConfirmedBookingNumber(res.bookingNumber);
        setStep(4);
      }
    } catch (err) {
      alert('Ошибка при создании бронирования. Попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="booking-page-container">
      <div className="container">
        {/* Breadcrumbs */}
        <div className="booking-breadcrumbs">
          <button onClick={() => setCurrentPage('home')}>Главная</button>
          <span>/</span>
          <span>Бронирование номеров</span>
        </div>

        {/* Header Bar */}
        <div className="booking-header-bar">
          <div>
            <h1 className="booking-title">Бронирование номеров</h1>
            <span className="booking-subtitle">Отель «Сердце Города» • г. Феодосия</span>
          </div>

          <div className="currency-badge">
            <span>🇷🇺</span>
            <span>RUB (₽)</span>
          </div>
        </div>

        {/* Steps Indicator (Desktop) */}
        <div className="steps-nav">
          <div className={`step-nav-item ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
            <span className="step-number-circle">1</span>
            <span>Даты и гости</span>
          </div>
          <div className={`step-nav-item ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
            <span className="step-number-circle">2</span>
            <span>Выбор номера</span>
          </div>
          <div className={`step-nav-item ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}`}>
            <span className="step-number-circle">3</span>
            <span>Данные гостя</span>
          </div>
          <div className={`step-nav-item ${step === 4 ? 'active' : ''}`}>
            <span className="step-number-circle">4</span>
            <span>Подтверждение</span>
          </div>
        </div>

        {/* Mobile Step Progress Indicator */}
        <div className="mobile-step-bar">
          <div className="mobile-step-text">
            <span>Шаг {step} из 4</span>
            <span className="mobile-step-name">
              {step === 1 && 'Даты и гости'}
              {step === 2 && 'Выбор номера'}
              {step === 3 && 'Данные гостя'}
              {step === 4 && 'Подтверждение'}
            </span>
          </div>
          <div className="mobile-step-progress-track">
            <div className="mobile-step-progress-fill" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
        </div>

        {/* Step 4: Success Voucher Screen */}
        {step === 4 && confirmedBookingNumber && (
          <div className="voucher-card">
            <CheckCircle size={64} color="#15803D" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1e293b' }}>
              {t.booking.successTitle}
            </h2>
            <p style={{ color: '#4a5568', marginTop: 8, fontSize: '1rem' }}>
              {t.booking.successSubtitle}
            </p>

            <div className="voucher-number">
              № {confirmedBookingNumber}
            </div>

            <div
              style={{
                background: '#f8fafc',
                padding: '24px',
                borderRadius: '12px',
                textAlign: 'left',
                margin: '24px auto',
                border: '1px solid #e2e8f0',
              }}
            >
              <h4 style={{ fontWeight: 700, marginBottom: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
                {t.booking.pageTitle}:
              </h4>
              <div className="voucher-details-grid">
                <div><strong>{t.contacts.addressTitle}:</strong> {settings.hotel_address}</div>
                <div><strong>{t.booking.checkIn}:</strong> {searchParams.checkIn}</div>
                <div><strong>{t.booking.checkOut}:</strong> {searchParams.checkOut}</div>
                <div><strong>{t.booking.selectedRoom}:</strong> {selectedRoom?.title}</div>
                <div><strong>{t.booking.totalNights}:</strong> {nights} {t.calendar.nights}</div>
                <div><strong>{t.booking.totalCost}:</strong> {totalPrice.toLocaleString('ru-RU')} ₽</div>
                <div><strong>{t.booking.paymentStatus}</strong></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={() => window.print()}
              >
                <Printer size={18} />
                <span>{t.booking.printVoucher}</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => {
                  window.location.hash = 'guest-account';
                  setCurrentPage('guest-account');
                }}
              >
                <span>Перейти в Личный кабинет</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Steps 1 - 3 */}
        {step < 4 && (
          <div className="wizard-layout">
            {/* Main Form Column */}
            <div>
              {/* STEP 1: Date & Guests Filter */}
              {step === 1 && (
                <div className="wizard-card" style={{ position: 'relative' }}>
                  <h3 className="wizard-card-title">{t.booking.step1Title}</h3>

                  <div className="dates-filter-grid">
                    {/* Check In Tile */}
                    <div
                      className="input-group"
                      style={{ cursor: 'pointer', position: 'relative' }}
                      ref={checkInRef}
                      onClick={() => {
                        setCalendarAnchor(checkInRef.current);
                        setCalendarOpen(true);
                      }}
                    >
                      <label className="input-label">{t.booking.checkIn} (с 14:00)</label>
                      <div
                        className="input-control"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          background: '#ffffff',
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{searchParams.checkIn}</span>
                        <Calendar size={18} color="var(--color-primary, #4A6353)" />
                      </div>
                    </div>

                    {/* Check Out Tile */}
                    <div
                      className="input-group"
                      style={{ cursor: 'pointer', position: 'relative' }}
                      ref={checkOutRef}
                      onClick={() => {
                        setCalendarAnchor(checkOutRef.current);
                        setCalendarOpen(true);
                      }}
                    >
                      <label className="input-label">
                        {t.booking.checkOut} (до 12:00) • {nights} {t.calendar.nights}
                      </label>
                      <div
                        className="input-control"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          background: '#ffffff',
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{searchParams.checkOut}</span>
                        <Calendar size={18} color="var(--color-primary, #4A6353)" />
                      </div>
                    </div>

                    <CalendarPopover
                      className="light-theme"
                      isOpen={calendarOpen}
                      anchorEl={calendarAnchor}
                      checkIn={searchParams.checkIn}
                      checkOut={searchParams.checkOut}
                      onChange={(inDate, outDate) => {
                        setSearchParams((prev) => ({
                          ...prev,
                          checkIn: inDate,
                          checkOut: outDate,
                        }));
                      }}
                      onClose={() => setCalendarOpen(false)}
                    />

                    <div className="input-group">
                      <label className="input-label">{t.booking.adults}</label>
                      <select
                        className="input-control"
                        value={searchParams.adults}
                        onChange={(e) =>
                          setSearchParams((prev) => ({ ...prev, adults: parseInt(e.target.value) }))
                        }
                      >
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <option key={num} value={num}>
                            {num} {t.rooms.adultsCount}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="input-group">
                      <label className="input-label">{t.booking.children}</label>
                      <select
                        className="input-control"
                        value={searchParams.children}
                        onChange={(e) =>
                          setSearchParams((prev) => ({ ...prev, children: parseInt(e.target.value) }))
                        }
                      >
                        {[0, 1, 2, 3, 4].map((num) => (
                          <option key={num} value={num}>
                            {num === 0 ? '0' : `${num} ${t.rooms.childrenCount}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => setStep(2)}
                    >
                      <span>{t.booking.findAvailableRooms}</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Room Selection */}
              {step === 2 && (
                <div className="wizard-card">
                  {/* Quick Dates Adjustment Bar at the Top */}
                  <div
                    style={{
                      background: 'var(--color-sand)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '10px',
                      padding: '14px 20px',
                      marginBottom: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                        {t.booking.adjustDates}
                      </span>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
                        {searchParams.checkIn} — {searchParams.checkOut} ({nights} {t.calendar.nights}) • {searchParams.adults} {t.rooms.adultsCount}{searchParams.children > 0 ? `, ${searchParams.children} ${t.rooms.childrenCount}` : ''}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setStep(1)}
                    >
                      <Edit2 size={14} />
                      <span>{t.booking.adjustDates}</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 className="wizard-card-title" style={{ margin: 0 }}>
                      {t.booking.step2Title} ({availableRooms.length})
                    </h3>
                  </div>

                  {availableRooms.map((room) => {
                    const roomTotal = room.price_base * nights;
                    const isSelected = selectedRoom?.id === room.id;

                    return (
                      <div
                        key={room.id}
                        className={`available-room-card ${isSelected ? 'selected' : ''}`}
                      >
                        <img
                          src={room.images[0]}
                          alt={room.title}
                          className="available-room-img"
                        />

                        <div>
                          <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 4 }}>
                            {room.title}
                          </h4>
                          <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 8 }}>
                            {room.type} • {room.area_sqm} м² • до {room.capacity_adults + room.capacity_children} гостей
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                            {room.amenities.slice(0, 4).join(' • ')}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#5B7364' }}>
                            {roomTotal.toLocaleString('ru-RU')} ₽
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 12 }}>
                            {room.price_base.toLocaleString('ru-RU')} ₽ / {t.calendar.nights} ({nights} {t.calendar.nights})
                          </div>

                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleSelectRoomAndProceed(room)}
                          >
                            <span>{t.booking.selectThisRoom}</span>
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* STEP 3: Guest Details & Legal Compliance */}
              {step === 3 && (
                <form onSubmit={handleBookingSubmit} className="wizard-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 className="wizard-card-title" style={{ margin: 0 }}>
                      Шаг 3. Контактные данные гостя
                    </h3>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setStep(2)}
                    >
                      <ArrowLeft size={14} />
                      <span>Выбрать другой номер</span>
                    </button>
                  </div>

                  <div className="dates-filter-grid">
                    <div className="input-group">
                      <label className="input-label">Фамилия *</label>
                      <input
                        type="text"
                        required
                        placeholder="Иванов"
                        className="input-control"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Имя *</label>
                      <input
                        type="text"
                        required
                        placeholder="Иван"
                        className="input-control"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Отчество</label>
                      <input
                        type="text"
                        placeholder="Иванович"
                        className="input-control"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Номер телефона *</label>
                      <input
                        type="tel"
                        inputMode="tel"
                        required
                        placeholder="+7 (995) 000-00-00"
                        className="input-control"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Email для ваучера *</label>
                      <input
                        type="email"
                        inputMode="email"
                        required
                        placeholder="ivan@mail.ru"
                        className="input-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Ожидаемое время заезда</label>
                      <select
                        className="input-control"
                        value={arrivalTime}
                        onChange={(e) => setArrivalTime(e.target.value)}
                      >
                        <option value="14:00 - 16:00">14:00 - 16:00 (Стандартный)</option>
                        <option value="16:00 - 18:00">16:00 - 18:00</option>
                        <option value="18:00 - 21:00">18:00 - 21:00</option>
                        <option value="После 21:00 (Поздний заезд)">После 21:00 (Поздний заезд)</option>
                      </select>
                    </div>
                  </div>

                  <div className="input-group" style={{ marginTop: 16 }}>
                    <label className="input-label">Особые пожелания (необязательно)</label>
                    <textarea
                      rows={3}
                      placeholder="Например: этаж повыше, раздельные одеяла, тихая сторона..."
                      className="input-control"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                    />
                  </div>

                  {/* Mandatory Legal Compliance Checkboxes */}
                  <div className="compliance-box">
                    <div className="compliance-check-label">
                      <input
                        type="checkbox"
                        id="consent-pd"
                        required
                        checked={consentPersonalData}
                        onChange={(e) => setConsentPersonalData(e.target.checked)}
                      />
                      <label htmlFor="consent-pd" style={{ cursor: 'pointer' }}>
                        Я даю согласие на обработку персональных данных в соответствии с{' '}
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCurrentPage('privacy-policy');
                          }}
                          style={{ color: '#5B7364', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Политикой конфиденциальности (152-ФЗ)
                        </span>
                        . *
                      </label>
                    </div>

                    <div className="compliance-check-label" style={{ marginTop: '12px' }}>
                      <input
                        type="checkbox"
                        id="consent-terms"
                        required
                        checked={consentTerms}
                        onChange={(e) => setConsentTerms(e.target.checked)}
                      />
                      <label htmlFor="consent-terms" style={{ cursor: 'pointer' }}>
                        Я ознакомлен и принимаю условия{' '}
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCurrentPage('terms-of-service');
                          }}
                          style={{ color: '#5B7364', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Публичной оферты
                        </span>{' '}
                        и{' '}
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCurrentPage('refund-policy');
                          }}
                          style={{ color: '#5B7364', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Правил проживания и аннуляции (ПП РФ № 1853)
                        </span>
                        . *
                      </label>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setStep(2)}
                    >
                      <ArrowLeft size={16} />
                      <span>{t.booking.backToRooms}</span>
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      disabled={isSubmitting}
                    >
                      <span>{isSubmitting ? '...' : t.booking.confirmBookingBtn}</span>
                      <Check size={18} />
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Sidebar Summary Column */}
            <div>
              <div className="summary-card">
                <h4 className="summary-title">Параметры брони</h4>

                <div className="summary-row">
                  <span>Заезд:</span>
                  <strong>{searchParams.checkIn} (с 14:00)</strong>
                </div>

                <div className="summary-row">
                  <span>Выезд:</span>
                  <strong>{searchParams.checkOut} (до 12:00)</strong>
                </div>

                <div className="summary-row">
                  <span>Ночей:</span>
                  <strong>
                    {nights} {nights === 1 ? 'ночь' : nights < 5 ? 'ночи' : 'ночей'}
                  </strong>
                </div>

                <div className="summary-row">
                  <span>Гости:</span>
                  <strong>
                    {searchParams.adults} взр.
                    {searchParams.children > 0 ? `, ${searchParams.children} дет.` : ''}
                  </strong>
                </div>

                {selectedRoom && (
                  <div style={{ margin: '14px 0', padding: '12px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedRoom.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {selectedRoom.type} • {selectedRoom.area_sqm} м²
                    </div>
                  </div>
                )}

                <div className="summary-total">
                  <span>Итого к оплате:</span>
                  <div className="summary-total-val">
                    {totalPrice.toLocaleString('ru-RU')} ₽
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 16,
                    fontSize: '0.75rem',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <ShieldCheck size={16} color="#15803D" />
                  <span>Оплата при заселении. Бесплатная отмена за 48 ч.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
