import React, { useState } from 'react';
import {
  User,
  Search,
  Eye,
  EyeOff,
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  Award,
  CreditCard,
  LogOut,
  XCircle,
  ShieldAlert,
} from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { Booking } from '../../types';
import { apiService } from '../../services/api';
import './GuestAccount.css';

export const GuestAccount: React.FC = () => {
  const { setCurrentPage, settings } = useHotel();

  // Mode: 'login' | 'booking_lookup' | 'dashboard'
  const [authMode, setAuthMode] = useState<'login' | 'booking_lookup'>('booking_lookup');
  const [loginTab, setLoginTab] = useState<'email' | 'phone'>('email');
  const [showPassword, setShowPassword] = useState(false);

  // Form Inputs
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [bookingNumberInput, setBookingNumberInput] = useState('SG-2026-1042');
  const [bookingPhoneInput, setBookingPhoneInput] = useState('');

  // Active Loaded Booking / Session
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [guestEmail, setGuestEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Fast Lookup by Booking Number
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const booking = await apiService.lookupBooking(bookingNumberInput, bookingPhoneInput || undefined);
    if (booking) {
      setActiveBooking(booking);
      setGuestEmail(booking.guest_email);
    } else {
      setErrorMessage('Бронирование не найдено. Проверьте номер брони (например, SG-2026-1042) и телефон.');
    }
  };

  // Login by Email/Phone
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Look for any existing booking matching email or phone
    const allBookings = await apiService.getBookings();
    const found = allBookings.find((b) => {
      if (loginTab === 'email') {
        return b.guest_email.toLowerCase() === emailInput.trim().toLowerCase();
      } else {
        const cleanDigits = phoneInput.replace(/\D/g, '');
        return cleanDigits && b.guest_phone.replace(/\D/g, '').endsWith(cleanDigits.slice(-7));
      }
    });

    if (found) {
      setActiveBooking(found);
      setGuestEmail(found.guest_email);
    } else {
      // Demo login
      setActiveBooking(allBookings[0] || null);
      setGuestEmail(emailInput || 'guest@mail.ru');
    }
  };

  // Cancellation with RF Decree No. 1853 rules
  const handleConfirmCancel = async () => {
    if (!activeBooking) return;
    setIsCancelling(true);

    const res = await apiService.cancelBooking(activeBooking.id);
    if (res.success) {
      setActiveBooking({ ...activeBooking, status: 'cancelled' });
      setCancelModalOpen(false);
    } else {
      alert('Не удалось отменить бронирование.');
    }
    setIsCancelling(false);
  };

  // Calculate cancellation terms (PP РФ № 1853)
  const getCancellationRefundInfo = () => {
    if (!activeBooking) return { isFree: true, refundAmount: 0 };
    const checkInTime = new Date(`${activeBooking.check_in}T14:00:00`).getTime();
    const now = Date.now();
    const hoursLeft = (checkInTime - now) / (1000 * 60 * 60);

    // If cancelled > 48h before check-in, 100% free cancellation
    if (hoursLeft > 48) {
      return {
        isFree: true,
        refundAmount: activeBooking.total_price,
        description: 'Бесплатная отмена (более 48 часов до заезда). Полный возврат средств без удержаний.',
      };
    } else {
      // Under PP РФ № 1853: idle penalty of at most 1 day
      const oneNightCost = Math.round(activeBooking.total_price / 3);
      const refund = Math.max(0, activeBooking.total_price - oneNightCost);
      return {
        isFree: false,
        refundAmount: refund,
        penalty: oneNightCost,
        description: `Поздняя отмена (менее 48 ч). В соответствии с Постановлением Правительства РФ № 1853 отель удерживает плату за фактический простой номера в размере 1 суток (${oneNightCost.toLocaleString('ru-RU')} ₽). Оставшаяся сумма (${refund.toLocaleString('ru-RU')} ₽) подлежит возврату.`,
      };
    }
  };

  const refundInfo = getCancellationRefundInfo();

  return (
    <div className="guest-account-page">
      <div className="container">
        {/* Breadcrumbs */}
        <div className="account-breadcrumbs">
          <button onClick={() => setCurrentPage('home')}>Главная</button>
          <span>/</span>
          <span>Личный кабинет гостя</span>
        </div>

        <h1 className="account-page-title">Личный кабинет</h1>

        {/* LOGGED IN / DASHBOARD VIEW */}
        {activeBooking ? (
          <div className="guest-dashboard-container">
            {/* Guest Welcome & Loyalty Bar */}
            <div
              style={{
                background: '#ffffff',
                padding: '24px 32px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
                marginBottom: 24,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Добро пожаловать,</span>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }}>{activeBooking.guest_name}</h2>
                <span style={{ fontSize: '0.85rem', color: '#5B7364', fontWeight: 600 }}>
                  Статус: Участник программы лояльности «Сердце Города»
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    background: '#fef3c7',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    color: '#b45309',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Award size={18} />
                  <span>500 бонусных баллов</span>
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveBooking(null)}
                >
                  <LogOut size={14} />
                  <span>Выйти</span>
                </button>
              </div>
            </div>

            {/* Active Booking Card */}
            <div className="booking-detail-card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: 16,
                  marginBottom: 20,
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>
                    Номер бронирования
                  </span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#5B7364' }}>
                    {activeBooking.booking_number}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span className={`booking-status-badge ${activeBooking.status}`}>
                    {activeBooking.status === 'confirmed'
                      ? 'Подтверждено'
                      : activeBooking.status === 'checked_in'
                      ? 'Проживает'
                      : activeBooking.status === 'cancelled'
                      ? 'Аннулировано'
                      : 'Завершено'}
                  </span>
                </div>
              </div>

              {/* Grid of details */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 20,
                  marginBottom: 24,
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Категория номера</div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{activeBooking.room_title}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Даты проживания</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                    {activeBooking.check_in} — {activeBooking.check_out}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Расчетные часы</div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    Заезд с {settings.check_in_time} / Выезд до {settings.check_out_time}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Гости</div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    {activeBooking.adults} взр. {activeBooking.children > 0 ? `+ ${activeBooking.children} дет.` : ''}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Итоговая стоимость</div>
                  <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#5B7364' }}>
                    {activeBooking.total_price.toLocaleString('ru-RU')} ₽
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Статус оплаты</div>
                  <div style={{ fontWeight: 600, color: activeBooking.payment_status === 'paid' ? '#15803d' : '#d97706' }}>
                    {activeBooking.payment_status === 'paid' ? 'Оплачено полностью' : 'Оплата при заселении'}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {activeBooking.status !== 'cancelled' && (
                <div style={{ display: 'flex', gap: 16, borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => window.print()}
                  >
                    Печать ваучера
                  </button>

                  <button
                    className="btn btn-secondary"
                    style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                    onClick={() => setCancelModalOpen(true)}
                  >
                    <XCircle size={16} />
                    <span>Отменить бронирование</span>
                  </button>
                </div>
              )}
            </div>

            {/* Cancellation Modal */}
            {cancelModalOpen && (
              <div className="modal-overlay" onClick={() => setCancelModalOpen(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3 className="modal-title">Отмена бронирования</h3>
                    <button className="modal-close-btn" onClick={() => setCancelModalOpen(false)}>
                      ✕
                    </button>
                  </div>

                  <div className="modal-body">
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 20 }}>
                      <ShieldAlert size={28} color="#dc2626" style={{ flexShrink: 0 }} />
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>
                          Вы уверены, что хотите аннулировать бронь № {activeBooking.booking_number}?
                        </h4>
                        <p style={{ fontSize: '0.9rem', color: '#4a5568', lineHeight: 1.5 }}>
                          {refundInfo.description}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        background: '#f8fafc',
                        padding: 16,
                        borderRadius: 8,
                        fontSize: '0.85rem',
                        color: '#64748b',
                        marginBottom: 24,
                      }}
                    >
                      Регулируется Постановлением Правительства РФ № 1853 «Об утверждении Правил предоставления гостиничных услуг в РФ» и ст. 32 Закона РФ «О защите прав потребителей».
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setCancelModalOpen(false)}
                      >
                        Оставить бронь
                      </button>

                      <button
                        className="btn btn-primary"
                        style={{ backgroundColor: '#dc2626' }}
                        disabled={isCancelling}
                        onClick={handleConfirmCancel}
                      >
                        {isCancelling ? 'Отмена...' : 'Подтвердить отмену'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* NOT LOGGED IN / AUTH CARD MATCHING SCREENSHOT */
          <div className="auth-card-container">
            {/* Left Column: Form */}
            <div className="auth-form-side">
              <h2 className="auth-form-title">
                {authMode === 'login' ? 'Вход в личный кабинет' : 'Поиск по номеру брони'}
              </h2>

              {errorMessage && (
                <div
                  style={{
                    background: '#fee2e2',
                    color: '#b91c1c',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    marginBottom: 16,
                  }}
                >
                  {errorMessage}
                </div>
              )}

              {/* Mode: Lookup by Booking Number */}
              {authMode === 'booking_lookup' ? (
                <form onSubmit={handleLookup}>
                  <div className="auth-input-group">
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                      Номер бронирования (например: SG-2026-1042)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="SG-2026-XXXX"
                      className="auth-input"
                      value={bookingNumberInput}
                      onChange={(e) => setBookingNumberInput(e.target.value)}
                    />
                  </div>

                  <div className="auth-input-group">
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                      Номер телефона или Email, указанный при бронировании
                    </label>
                    <input
                      type="text"
                      placeholder="+7 (995) 171-16-64 или email"
                      className="auth-input"
                      value={bookingPhoneInput}
                      onChange={(e) => setBookingPhoneInput(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginBottom: 16 }}
                  >
                    <Search size={16} />
                    <span>Найти бронирование</span>
                  </button>

                  <div style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      style={{ fontSize: '0.85rem', color: '#5B7364', fontWeight: 600 }}
                      onClick={() => setAuthMode('login')}
                    >
                      Войти по логину и паролю
                    </button>
                  </div>
                </form>
              ) : (
                /* Mode: Login by Email/Phone */
                <form onSubmit={handleLogin}>
                  <div className="auth-tabs">
                    <button
                      type="button"
                      className={`auth-tab-btn ${loginTab === 'email' ? 'active' : ''}`}
                      onClick={() => setLoginTab('email')}
                    >
                      Почта
                    </button>
                    <button
                      type="button"
                      className={`auth-tab-btn ${loginTab === 'phone' ? 'active' : ''}`}
                      onClick={() => setLoginTab('phone')}
                    >
                      Телефон
                    </button>
                  </div>

                  {loginTab === 'email' ? (
                    <div className="auth-input-group">
                      <input
                        type="email"
                        required
                        placeholder="Электронная почта"
                        className="auth-input"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="auth-input-group">
                      <input
                        type="tel"
                        required
                        placeholder="Номер телефона"
                        className="auth-input"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="auth-input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Пароль"
                      className="auth-input"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="auth-sub-actions">
                    <button type="button" onClick={() => alert('Демо-вход: нажмите Войти для быстрого доступа')}>
                      Зарегистрироваться
                    </button>
                    <button type="button" onClick={() => alert('Ссылка для восстановления отправлена')}>
                      Забыли пароль?
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginBottom: 16 }}
                  >
                    Войти
                  </button>

                  <div className="social-auth-section">
                    <div className="social-auth-label">или продолжить через</div>
                    <div className="social-icons-row">
                      <div className="social-icon-box vk" title="ВКонтакте ID">VK</div>
                      <div className="social-icon-box tinkoff" title="T-ID">Т</div>
                      <div className="social-icon-box sber" title="Сбер ID">С</div>
                      <div className="social-icon-box alfa" title="Альфа ID">А</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <button
                      type="button"
                      style={{ fontSize: '0.85rem', color: '#5B7364', fontWeight: 600 }}
                      onClick={() => setAuthMode('booking_lookup')}
                    >
                      Войти по номеру бронирования
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Right Column: Loyalty Promo matching TravelLine Avenue reference */}
            <div className="loyalty-promo-side">
              <div className="loyalty-card-mock">
                <div style={{ fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase' }}>
                  Отель «Сердце Города»
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 4 }}>
                  КАРТА ПРЕМИУМ-ГОСТЯ
                </div>
                <div style={{ marginTop: 24, fontSize: '0.9rem', opacity: 0.9 }}>
                  •••• •••• •••• 2026
                </div>
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7c2d12', marginBottom: 14 }}>
                Станьте участником программы лояльности
              </h3>

              <ul className="loyalty-list">
                <li>
                  <CheckCircle2 size={18} color="#b45309" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>Получайте кешбэк баллами за каждое бронирование на сайте.</span>
                </li>
                <li>
                  <CheckCircle2 size={18} color="#b45309" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>Копите баллы и оплачивайте ими до 30% стоимости отдыха.</span>
                </li>
                <li>
                  <CheckCircle2 size={18} color="#b45309" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>Бронируйте в 1 клик: ваши контактные данные сохраняются автоматически.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
