import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  BedDouble,
  Settings as SettingsIcon,
  Users,
  TrendingUp,
  LogIn,
  LogOut,
  Plus,
  Shield,
  Save,
  DollarSign,
  Bell,
  Send,
  ExternalLink,
  Trash2,
  RefreshCw,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Download,
} from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { Room, Booking, HotelSettings } from '../../types';
import { apiService } from '../../services/api';
import { TelegramSubscriber } from '../../services/telegramNotification';
import './AdminPanel.css';

export const AdminPanel: React.FC = () => {
  const { setCurrentPage, settings, refreshData } = useHotel();

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Telegram subscribers and broadcast state
  const [tgSubscribers, setTgSubscribers] = useState<TelegramSubscriber[]>([]);
  const [isTestingBroadcast, setIsTestingBroadcast] = useState(false);
  const [testBroadcastStatus, setTestBroadcastStatus] = useState<string | null>(null);
  const [testBroadcastErrors, setTestBroadcastErrors] = useState<string[]>([]);

  // Manual subscriber input state
  const [manualChatId, setManualChatId] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualAddError, setManualAddError] = useState<string | null>(null);

  // Sync getUpdates state
  const [isSyncingUpdates, setIsSyncingUpdates] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem('admin_authenticated') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chessboard' | 'rooms' | 'settings'>('dashboard');

  // Loaded Data
  const [stats, setStats] = useState({
    occupancyRate: 68,
    arrivalsToday: 2,
    departuresToday: 1,
    totalRevenue: 55100,
    totalRooms: 9,
  });
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);
  const [roomsList, setRoomsList] = useState<Room[]>([]);
  const [settingsForm, setSettingsForm] = useState<HotelSettings>(settings);

  // Modal for Booking Details / Creation
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [newBookingData, setNewBookingData] = useState({
    roomId: 1,
    guestName: '',
    guestPhone: '+7 ',
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    adults: 2,
    children: 0,
    totalPrice: 6400,
  });

  const loadAdminData = async () => {
    try {
      const [fetchedStats, fetchedBookings, fetchedRooms, fetchedSettings, fetchedSubs] = await Promise.all([
        apiService.getAdminStats(),
        apiService.getBookings(),
        apiService.getRooms(),
        apiService.getSettings(),
        apiService.getTelegramSubscribers(),
      ]);
      setStats(fetchedStats);
      setBookingsList(fetchedBookings);
      setRoomsList(fetchedRooms);
      setSettingsForm(fetchedSettings);
      setTgSubscribers(fetchedSubs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddManualSubscriber = async (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setManualAddError(null);
    const cleanChatId = manualChatId.trim();
    if (!cleanChatId) {
      setManualAddError('Введите Telegram Chat ID');
      return;
    }

    try {
      await apiService.addTelegramSubscriber({
        chat_id: cleanChatId,
        first_name: manualName.trim() || 'Администратор отеля',
        is_active: 1,
      });
      setManualChatId('');
      setManualName('');
      const updated = await apiService.getTelegramSubscribers();
      setTgSubscribers(updated);
      setTestBroadcastStatus(`Получатель с Chat ID ${cleanChatId} добавлен в рассылку`);
      setTestBroadcastErrors([]);
    } catch (err: any) {
      setManualAddError(`Ошибка добавления: ${err?.message || 'сбой операции'}`);
    }
  };

  const handleRemoveSubscriber = async (chatId: string) => {
    try {
      await apiService.removeTelegramSubscriber(chatId);
      const updated = await apiService.getTelegramSubscribers();
      setTgSubscribers(updated);
      setTestBroadcastStatus(`Получатель с Chat ID ${chatId} удален из рассылки`);
      setTestBroadcastErrors([]);
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error('Failed to remove subscriber:', err);
    }
  };

  const handleSyncTelegramUpdates = async () => {
    setIsSyncingUpdates(true);
    setSyncStatusMessage(null);
    try {
      const res = await apiService.syncTelegramUpdates(settingsForm.telegram_bot_token || '');
      setSyncStatusMessage(res.message);
      setTgSubscribers(res.subscribers);
      if (res.newCount > 0) {
        setTestBroadcastStatus(`Найдено ${res.newCount} новых пользователей`);
      }
    } catch (err: any) {
      setSyncStatusMessage(`Ошибка синхронизации: ${err?.message || 'не удалось опросить Telegram API'}`);
    } finally {
      setIsSyncingUpdates(false);
    }
  };

  const handleTestTelegramBroadcast = async () => {
    setIsTestingBroadcast(true);
    setTestBroadcastStatus(null);
    setTestBroadcastErrors([]);
    try {
      const res = await apiService.testTelegramBroadcast(settingsForm);
      setTestBroadcastStatus(res.message);
      if (res.errors && res.errors.length > 0) {
        setTestBroadcastErrors(res.errors);
      }
      // Refresh subscribers list
      const subs = await apiService.getTelegramSubscribers();
      setTgSubscribers(subs);
    } catch (err: any) {
      setTestBroadcastStatus(`Ошибка отправки: ${err?.message || 'не удалось связаться с сервером'}`);
      setTestBroadcastErrors([err?.message || 'Неизвестная ошибка']);
    } finally {
      setIsTestingBroadcast(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'feo-admin36' && password === '987456') {
      sessionStorage.setItem('admin_authenticated', 'true');
      setIsAuthenticated(true);
      setLoginError(null);
    } else {
      setLoginError('Неверный логин или пароль');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  const handleStatusChange = async (bookingId: number, newStatus: Booking['status']) => {
    await apiService.updateBookingStatus(bookingId, newStatus);
    loadAdminData();
    if (selectedBooking && selectedBooking.id === bookingId) {
      setSelectedBooking({ ...selectedBooking, status: newStatus });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiService.updateSettings(settingsForm);
    await refreshData();
    alert('Настройки отеля успешно сохранены!');
  };

  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiService.createBooking({
      roomId: newBookingData.roomId,
      guestName: newBookingData.guestName,
      guestPhone: newBookingData.guestPhone,
      guestEmail: 'reception@hotel-feodosia.ru',
      checkIn: newBookingData.checkIn,
      checkOut: newBookingData.checkOut,
      adults: newBookingData.adults,
      children: newBookingData.children,
      totalPrice: newBookingData.totalPrice,
      notes: 'Создано администратором от стойки',
    });
    setIsNewBookingModalOpen(false);
    loadAdminData();
  };

  // Generate calendar days for current month (Chessboard)
  const daysInMonth = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 2 + i);
    return {
      dateStr: d.toISOString().split('T')[0],
      dayNum: d.getDate(),
      weekday: new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(d),
      isToday: d.toDateString() === new Date().toDateString(),
    };
  });

  const handleExportChessboardToExcel = () => {
    const periodStr = `${daysInMonth[0]?.dateStr} — ${daysInMonth[daysInMonth.length - 1]?.dateStr}`;
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Шахматка</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <style>
          th { background-color: #5B7364; color: #FFFFFF; font-weight: bold; border: 1px solid #CCCCCC; padding: 6px; text-align: center; }
          td { border: 1px solid #CCCCCC; padding: 6px; text-align: center; font-size: 11pt; }
          .room-col { text-align: left; font-weight: bold; background-color: #F8FAF9; }
          .occupied { background-color: #DCFCE7; color: #166534; font-weight: bold; }
          .free { background-color: #FFFFFF; color: #94A3B8; }
        </style>
      </head>
      <body>
        <h2>Отель «Сердце Города» (г. Феодосия) — Шахматка бронирований</h2>
        <p><b>Период:</b> ${periodStr} | <b>Выгружено:</b> ${new Date().toLocaleString('ru-RU')}</p>
        <table border="1">
          <thead>
            <tr>
              <th>Номер / Категория</th>
              <th>Базовая цена (₽)</th>
              ${daysInMonth.map((d) => `<th>${d.dayNum} (${d.weekday})</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${roomsList.map((room) => {
      const cells = daysInMonth.map((day) => {
        const b = bookingsList.find(
          (bk) => bk.room_id === room.id && bk.status !== 'cancelled' && day.dateStr >= bk.check_in && day.dateStr < bk.check_out
        );
        if (b) {
          return `<td class="occupied">${b.guest_name} (${b.guest_phone || b.booking_number})</td>`;
        }
        return `<td class="free">—</td>`;
      }).join('');
      return `
                <tr>
                  <td class="room-col">${room.title}</td>
                  <td>${room.price_base}</td>
                  ${cells}
                </tr>
              `;
    }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shakhmatka_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 420, width: '100%', background: '#ffffff', padding: 36, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#edf3f0', color: '#5B7364', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Shield size={24} />
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }}>Вход в панель отеля</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Отель «Сердце Города» (Феодосия)</p>
          </div>

          {loginError && (
            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: 6, fontSize: '0.85rem', marginBottom: 16 }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                Логин
              </label>
              <input
                type="text"
                required
                className="input-control"
                placeholder="Логин"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                Пароль
              </label>
              <input
                type="password"
                required
                className="input-control"
                placeholder="Пароль"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <LogIn size={18} />
              <span>Войти в систему</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <div className="container">
        {/* Navigation Bar */}
        <div className="admin-nav-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#edf3f0', color: '#5B7364', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>Панель управления</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {settings.hotel_name} • г. Феодосия
              </div>
            </div>
          </div>

          <div className="admin-nav-tabs">
            <button
              type="button"
              id="admin-tab-dashboard"
              className={`admin-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={16} />
              <span>Дашборд</span>
            </button>

            <button
              type="button"
              id="admin-tab-chessboard"
              className={`admin-tab-btn ${activeTab === 'chessboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('chessboard')}
            >
              <CalendarDays size={16} />
              <span>Шахматка</span>
            </button>

            <button
              type="button"
              id="admin-tab-rooms"
              className={`admin-tab-btn ${activeTab === 'rooms' ? 'active' : ''}`}
              onClick={() => setActiveTab('rooms')}
            >
              <BedDouble size={16} />
              <span>Номера</span>
            </button>

            <button
              type="button"
              id="admin-tab-settings"
              className={`admin-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <SettingsIcon size={16} />
              <span>Настройки</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentPage('home')}
            >
              На сайт
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleLogout}
              title="Выйти из панели"
            >
              <LogOut size={14} />
              <span>Выйти из панели</span>
            </button>
          </div>
        </div>

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Metrics */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon-wrap primary">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <div className="metric-label">Текущая загрузка</div>
                  <div className="metric-val">{stats.occupancyRate}%</div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrap success">
                  <Users size={24} />
                </div>
                <div>
                  <div className="metric-label">Заезды сегодня</div>
                  <div className="metric-val">{stats.arrivalsToday}</div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrap warning">
                  <CalendarDays size={24} />
                </div>
                <div>
                  <div className="metric-label">Выезды сегодня</div>
                  <div className="metric-val">{stats.departuresToday}</div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrap blue">
                  <DollarSign size={24} />
                </div>
                <div>
                  <div className="metric-label">Выручка за период</div>
                  <div className="metric-val">{stats.totalRevenue.toLocaleString('ru-RU')} ₽</div>
                </div>
              </div>
            </div>

            {/* Recent Bookings Table */}
            <div className="admin-data-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Все бронирования отеля</h3>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsNewBookingModalOpen(true)}
                >
                  <Plus size={16} />
                  <span>Создать бронь от стойки</span>
                </button>
              </div>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>№ Брони</th>
                    <th>Гость</th>
                    <th>Категория</th>
                    <th>Даты проживания</th>
                    <th>Сумма</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingsList.map((b) => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 700, color: '#5B7364' }}>{b.booking_number}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.guest_name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{b.guest_phone}</div>
                      </td>
                      <td>{b.room_title || `Номер #${b.room_id}`}</td>
                      <td>{b.check_in} — {b.check_out}</td>
                      <td style={{ fontWeight: 700 }}>{b.total_price.toLocaleString('ru-RU')} ₽</td>
                      <td>
                        <span className={`booking-status-badge ${b.status}`}>
                          {b.status === 'confirmed' ? 'Подтверждено' : b.status === 'checked_in' ? 'Заселен' : b.status === 'cancelled' ? 'Аннулировано' : 'Завершен'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedBooking(b)}
                        >
                          Детали
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CHESSBOARD (ШАХМАТКА БРОНИРОВАНИЙ) */}
        {activeTab === 'chessboard' && (
          <div className="timeline-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Шахматка номерного фонда (14 дней)</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Нажмите на занятый отрезок для просмотра данных гостя или на свободную ячейку для бронирования
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleExportChessboardToExcel}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Download size={15} />
                  <span>Скачать в Excel (.xls)</span>
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsNewBookingModalOpen(true)}
                >
                  <Plus size={16} />
                  <span>Забронировать номер</span>
                </button>
              </div>
            </div>

            <div className="timeline-table-wrapper">
              <table className="timeline-table">
                <thead>
                  <tr>
                    <th className="room-col-header">Номер / Категория</th>
                    {daysInMonth.map((day) => (
                      <th
                        key={day.dateStr}
                        className="day-col-header"
                        style={{
                          background: day.isToday ? '#edf3f0' : undefined,
                          borderBottom: day.isToday ? '2px solid #5B7364' : undefined,
                        }}
                      >
                        <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{day.dayNum}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>
                          {day.weekday}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roomsList.map((room) => (
                    <tr key={room.id}>
                      <td className="room-col-name">
                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{room.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {room.price_base.toLocaleString('ru-RU')} ₽/ночь
                        </div>
                      </td>

                      {daysInMonth.map((day) => {
                        // Find if any booking covers this day
                        const activeBk = bookingsList.find((b) => {
                          if (b.room_id !== room.id || b.status === 'cancelled') return false;
                          return day.dateStr >= b.check_in && day.dateStr < b.check_out;
                        });

                        return (
                          <td
                            key={day.dateStr}
                            className="timeline-cell"
                            onClick={() => {
                              if (activeBk) {
                                setSelectedBooking(activeBk);
                              } else {
                                setNewBookingData((prev) => ({
                                  ...prev,
                                  roomId: room.id,
                                  checkIn: day.dateStr,
                                  totalPrice: room.price_base * 2,
                                }));
                                setIsNewBookingModalOpen(true);
                              }
                            }}
                          >
                            {activeBk && (
                              <div className={`booking-bar-span ${activeBk.status}`}>
                                {activeBk.guest_name.split(' ')[0]}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ROOMS MANAGER */}
        {activeTab === 'rooms' && (
          <div className="admin-data-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 20 }}>
              Управление 9 категориями номеров
            </h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Фото</th>
                  <th>Категория</th>
                  <th>Тип</th>
                  <th>Вместимость</th>
                  <th>Площадь</th>
                  <th>Базовая цена</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {roomsList.map((room) => (
                  <tr key={room.id}>
                    <td>
                      <img
                        src={room.images[0]}
                        alt={room.title}
                        style={{ width: 60, height: 45, objectFit: 'cover', borderRadius: 4 }}
                      />
                    </td>
                    <td style={{ fontWeight: 700 }}>{room.title}</td>
                    <td>{room.type}</td>
                    <td>{room.capacity_adults} взр. + {room.capacity_children} дет.</td>
                    <td>{room.area_sqm} м²</td>
                    <td style={{ fontWeight: 800, color: '#5B7364' }}>
                      {room.price_base.toLocaleString('ru-RU')} ₽
                    </td>
                    <td>
                      <span className="booking-status-badge confirmed">Доступен</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          const newPrice = prompt(`Изменить базовую цену для "${room.title}":`, room.price_base.toString());
                          if (newPrice && !isNaN(Number(newPrice))) {
                            const updated = { ...room, price_base: Number(newPrice) };
                            apiService.updateRoom(updated).then(() => loadAdminData());
                          }
                        }}
                      >
                        Изменить цену
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="admin-data-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 20 }}>
              Настройки отеля и реквизиты
            </h3>

            <form onSubmit={handleSaveSettings}>
              <div className="settings-form-grid">
                <div>
                  <label className="input-label">Название отеля</label>
                  <input
                    type="text"
                    className="input-control"
                    value={settingsForm.hotel_name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, hotel_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="input-label">Адрес в Феодосии</label>
                  <input
                    type="text"
                    className="input-control"
                    value={settingsForm.hotel_address}
                    onChange={(e) => setSettingsForm({ ...settingsForm, hotel_address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="input-label">Телефон для бронирования</label>
                  <input
                    type="text"
                    className="input-control"
                    value={settingsForm.hotel_phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, hotel_phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="input-label">Email отдела бронирования</label>
                  <input
                    type="email"
                    className="input-control"
                    value={settingsForm.hotel_email}
                    onChange={(e) => setSettingsForm({ ...settingsForm, hotel_email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="input-label">Юридическое лицо / ИП</label>
                  <input
                    type="text"
                    className="input-control"
                    value={settingsForm.legal_entity}
                    onChange={(e) => setSettingsForm({ ...settingsForm, legal_entity: e.target.value })}
                  />
                </div>

                <div>
                  <label className="input-label">ИНН / ОГРНИП</label>
                  <input
                    type="text"
                    className="input-control"
                    value={settingsForm.legal_inn}
                    onChange={(e) => setSettingsForm({ ...settingsForm, legal_inn: e.target.value })}
                  />
                </div>

                <div>
                  <label className="input-label">Время заезда / выезда</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input
                      type="text"
                      className="input-control"
                      value={settingsForm.check_in_time}
                      onChange={(e) => setSettingsForm({ ...settingsForm, check_in_time: e.target.value })}
                    />
                    <input
                      type="text"
                      className="input-control"
                      value={settingsForm.check_out_time}
                      onChange={(e) => setSettingsForm({ ...settingsForm, check_out_time: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">Резервный Telegram Chat ID (для прямых уведомлений)</label>
                  <input
                    type="text"
                    placeholder="109847291 или @hotel_manager"
                    className="input-control"
                    value={settingsForm.telegram_chat_id || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, telegram_chat_id: e.target.value })}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: 4 }}>
                    Используется как дополнительный канал доставки в случае отсутствия подписчиков
                  </span>
                </div>
              </div>

              {/* TELEGRAM BOT & NOTIFICATION BROADCAST SECTION */}
              <div className="admin-telegram-section" style={{ marginTop: 36, borderTop: '1px solid #e2e8f0', paddingTop: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Bell size={22} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                      Telegram-бот и рассылка уведомлений
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '2px 0 0' }}>
                      Автоматическая рассылка карточек всех новых бронирований в Telegram администраторам и управляющим
                    </p>
                  </div>
                </div>

                <div className="settings-form-grid">
                  <div>
                    <label className="input-label">Токен Telegram-бота (Bot Token)</label>
                    <input
                      type="password"
                      placeholder="7123456789:AAH..."
                      className="input-control"
                      value={settingsForm.telegram_bot_token || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, telegram_bot_token: e.target.value })}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: 4 }}>
                      Токен бота из @BotFather. В локальном режиме без токена сообщения логируются в консоль.
                    </span>
                  </div>

                  <div>
                    <label className="input-label">Ссылка для подключения новых администраторов</label>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input
                        type="text"
                        readOnly
                        className="input-control"
                        value="https://t.me/hotel_feodosia_bot"
                        style={{ background: '#f8fafc', color: '#334155' }}
                      />
                      <a
                        href="https://t.me/hotel_feodosia_bot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <ExternalLink size={14} />
                        <span>Открыть</span>
                      </a>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: 4 }}>
                      Администраторы переходят по ссылке и отправляют команду <code>/start</code> для подписки
                    </span>
                  </div>
                </div>

                {/* Connected Subscribers List, Sync & Manual Form */}
                <div style={{
                  marginTop: 24,
                  background: '#f8fafc',
                  padding: 22,
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                    flexWrap: 'wrap',
                    gap: 12,
                  }}>
                    <div>
                      <h5 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                        Получатели рассылки бронирований ({tgSubscribers.filter((s) => s.is_active === 1).length})
                      </h5>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Список администраторов, мгновенно получающих карточки всех новых броней
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={isSyncingUpdates}
                        onClick={handleSyncTelegramUpdates}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        title="Опросить Telegram API (getUpdates) для поиска пользователей, отправивших /start"
                      >
                        <RefreshCw size={14} className={isSyncingUpdates ? 'animate-spin' : ''} />
                        <span>{isSyncingUpdates ? 'Опрос бота...' : 'Обновить подписчиков из бота'}</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={isTestingBroadcast}
                        onClick={handleTestTelegramBroadcast}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <Send size={14} />
                        <span>{isTestingBroadcast ? 'Отправка...' : 'Проверить отправку'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Sync status message */}
                  {syncStatusMessage && (
                    <div
                      style={{
                        padding: '10px 14px',
                        marginBottom: 12,
                        borderRadius: 8,
                        background: syncStatusMessage.includes('Ошибка') ? '#fee2e2' : '#e0f2fe',
                        color: syncStatusMessage.includes('Ошибка') ? '#991b1b' : '#0369a1',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <RefreshCw size={16} />
                      <span>{syncStatusMessage}</span>
                    </div>
                  )}

                  {/* Broadcast success or status */}
                  {testBroadcastStatus && (
                    <div
                      style={{
                        padding: '10px 14px',
                        marginBottom: 12,
                        borderRadius: 8,
                        background: testBroadcastStatus.includes('Ошибка') ? '#fee2e2' : '#dcfce7',
                        color: testBroadcastStatus.includes('Ошибка') ? '#991b1b' : '#166534',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <CheckCircle size={16} />
                      <span>{testBroadcastStatus}</span>
                    </div>
                  )}

                  {/* Detailed Delivery Errors Log */}
                  {testBroadcastErrors.length > 0 && (
                    <div
                      style={{
                        padding: '12px 16px',
                        marginBottom: 16,
                        borderRadius: 8,
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#991b1b',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 6 }}>
                        <AlertCircle size={16} />
                        <span>Ошибки доставки Telegram:</span>
                      </div>
                      <ul style={{ margin: '0 0 8px 18px', padding: 0 }}>
                        {testBroadcastErrors.map((err, idx) => (
                          <li key={idx} style={{ marginBottom: 4 }}>{err}</li>
                        ))}
                      </ul>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#7f1d1d' }}>
                        💡 <i>Telegram разрешает ботам отправлять сообщения только тем пользователям, которые первыми открыли диалог с ботом и нажали Start (команда /start).</i>
                      </p>
                    </div>
                  )}

                  {/* Manual Add Recipient Box */}
                  <div
                    style={{
                      background: '#ffffff',
                      padding: '16px 18px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <UserPlus size={16} color="#5B7364" />
                      <span>Добавить получателя вручную</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) 160px', gap: 10, alignItems: 'flex-end' }}>
                      <div>
                        <label className="input-label" style={{ fontSize: '0.78rem', marginBottom: 4 }}>
                          Telegram Chat ID *
                        </label>
                        <input
                          type="text"
                          placeholder="Например: 582910482"
                          className="input-control"
                          value={manualChatId}
                          onChange={(e) => setManualChatId(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddManualSubscriber();
                            }
                          }}
                        />
                      </div>

                      <div>
                        <label className="input-label" style={{ fontSize: '0.78rem', marginBottom: 4 }}>
                          Имя / Должность (опционально)
                        </label>
                        <input
                          type="text"
                          placeholder="Например: Управляющий"
                          className="input-control"
                          value={manualName}
                          onChange={(e) => setManualName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddManualSubscriber();
                            }
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ height: '42px', justifyContent: 'center' }}
                        onClick={() => handleAddManualSubscriber()}
                      >
                        <UserPlus size={15} />
                        <span>Добавить</span>
                      </button>
                    </div>

                    {manualAddError && (
                      <span style={{ fontSize: '0.75rem', color: '#dc2626', display: 'block', marginTop: 6 }}>
                        {manualAddError}
                      </span>
                    )}

                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: 8 }}>
                      Узнать свой цифровой Chat ID можно у ботов <code>@userinfobot</code> или <code>@myidbot</code> в Telegram.
                    </span>
                  </div>

                  {/* Subscribers List */}
                  {tgSubscribers.length === 0 ? (
                    <div style={{
                      padding: 20,
                      background: '#ffffff',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      textAlign: 'center',
                      color: '#64748b',
                      fontSize: '0.9rem',
                    }}>
                      <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#334155' }}>
                        В базе пока нет зарегистрированных получателей
                      </p>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                        1. Добавьте Chat ID вручную в форме выше, либо<br />
                        2. Откройте <a href="https://t.me/hotel_feodosia_bot" target="_blank" rel="noreferrer" style={{ color: '#5B7364', fontWeight: 600 }}>бота в Telegram</a>, отправьте команду <code>/start</code> и нажмите кнопку «Обновить подписчиков из бота».
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {tgSubscribers.map((sub, idx) => (
                        <div
                          key={sub.chat_id || idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#ffffff',
                            padding: '12px 16px',
                            borderRadius: 10,
                            border: '1px solid #e2e8f0',
                            fontSize: '0.85rem',
                            flexWrap: 'wrap',
                            gap: 10,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span
                              style={{
                                width: 9,
                                height: 9,
                                borderRadius: '50%',
                                background: sub.is_active ? '#22c55e' : '#94a3b8',
                                flexShrink: 0,
                              }}
                              title={sub.is_active ? 'Активен' : 'Отключен'}
                            />
                            <strong>{sub.first_name || 'Администратор'}</strong>
                            {sub.username && (
                              <span style={{ color: '#64748b' }}>@{sub.username}</span>
                            )}
                            <code
                              style={{
                                fontSize: '0.78rem',
                                background: '#f1f5f9',
                                padding: '3px 8px',
                                borderRadius: 4,
                                color: '#334155',
                                fontWeight: 600,
                              }}
                            >
                              ID: {sub.chat_id}
                            </code>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: sub.is_active ? '#15803d' : '#64748b',
                                fontWeight: 700,
                                background: sub.is_active ? '#dcfce7' : '#f1f5f9',
                                padding: '3px 8px',
                                borderRadius: 12,
                              }}
                            >
                              {sub.is_active ? 'Получает рассылку' : 'Приостановлен'}
                            </span>

                            {deleteConfirmId === sub.chat_id ? (
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <button
                                  type="button"
                                  className="btn btn-sm"
                                  style={{ background: '#dc2626', color: '#ffffff', padding: '4px 8px', fontSize: '0.78rem' }}
                                  onClick={() => handleRemoveSubscriber(sub.chat_id)}
                                >
                                  Удалить?
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                                  onClick={() => setDeleteConfirmId(null)}
                                >
                                  Отмена
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ color: '#dc2626', borderColor: '#fecaca', padding: '6px 10px' }}
                                title="Удалить из рассылки"
                                onClick={() => setDeleteConfirmId(sub.chat_id)}
                              >
                                <Trash2 size={14} />
                                <span>Удалить</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  <span>Сохранить настройки</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: View/Edit Booking Details */}
        {selectedBooking && (
          <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Детали брони {selectedBooking.booking_number}</h3>
                <button className="modal-close-btn" onClick={() => setSelectedBooking(null)}>✕</button>
              </div>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 20 }}>
                  <div><strong>Гость:</strong> {selectedBooking.guest_name}</div>
                  <div><strong>Телефон:</strong> {selectedBooking.guest_phone}</div>
                  <div><strong>Заезд:</strong> {selectedBooking.check_in}</div>
                  <div><strong>Выезд:</strong> {selectedBooking.check_out}</div>
                  <div><strong>Категория:</strong> {selectedBooking.room_title}</div>
                  <div><strong>Сумма:</strong> {selectedBooking.total_price.toLocaleString('ru-RU')} ₽</div>
                  <div><strong>Статус:</strong> {selectedBooking.status}</div>
                  <div><strong>Оплата:</strong> {selectedBooking.payment_status}</div>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>
                    Изменить статус:
                  </label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleStatusChange(selectedBooking.id, 'confirmed')}
                    >
                      Подтверждено
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleStatusChange(selectedBooking.id, 'checked_in')}
                    >
                      Заселен
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleStatusChange(selectedBooking.id, 'checked_out')}
                    >
                      Выехал
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#dc2626' }}
                      onClick={() => handleStatusChange(selectedBooking.id, 'cancelled')}
                    >
                      Аннулировать
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create Manual Booking */}
        {isNewBookingModalOpen && (
          <div className="modal-overlay" onClick={() => setIsNewBookingModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Создать бронирование от стойки</h3>
                <button className="modal-close-btn" onClick={() => setIsNewBookingModalOpen(false)}>✕</button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleCreateManualBooking}>
                  <div style={{ marginBottom: 12 }}>
                    <label className="input-label">Категория номера</label>
                    <select
                      className="input-control"
                      value={newBookingData.roomId}
                      onChange={(e) => {
                        const rId = Number(e.target.value);
                        const r = roomsList.find((item) => item.id === rId);
                        setNewBookingData({
                          ...newBookingData,
                          roomId: rId,
                          totalPrice: (r ? r.price_base : 3200) * 2,
                        });
                      }}
                    >
                      {roomsList.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.title} ({r.price_base} ₽/ночь)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label className="input-label">ФИО Гостя</label>
                    <input
                      type="text"
                      required
                      placeholder="Иванов Сергей"
                      className="input-control"
                      value={newBookingData.guestName}
                      onChange={(e) => setNewBookingData({ ...newBookingData, guestName: e.target.value })}
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label className="input-label">Телефон гостя</label>
                    <input
                      type="tel"
                      required
                      placeholder="+7 (995) 000-00-00"
                      className="input-control"
                      value={newBookingData.guestPhone}
                      onChange={(e) => setNewBookingData({ ...newBookingData, guestPhone: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div>
                      <label className="input-label">Заезд</label>
                      <input
                        type="date"
                        className="input-control"
                        value={newBookingData.checkIn}
                        onChange={(e) => setNewBookingData({ ...newBookingData, checkIn: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="input-label">Выезд</label>
                      <input
                        type="date"
                        className="input-control"
                        value={newBookingData.checkOut}
                        onChange={(e) => setNewBookingData({ ...newBookingData, checkOut: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label className="input-label">Итоговая сумма (₽)</label>
                    <input
                      type="number"
                      required
                      className="input-control"
                      value={newBookingData.totalPrice}
                      onChange={(e) => setNewBookingData({ ...newBookingData, totalPrice: Number(e.target.value) })}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Создать бронь
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
