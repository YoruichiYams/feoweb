import { HotelSettings } from '../types';
import { TELEGRAM_CONFIG } from '../config/telegram';

export interface TelegramSubscriber {
  id?: number;
  chat_id: string;
  username?: string;
  first_name?: string;
  is_active: number;
  created_at?: string;
}

export interface BookingNotificationPayload {
  booking_number: string;
  room_title: string;
  check_in: string;
  check_out: string;
  nights?: number;
  adults: number;
  children: number;
  total_price: number;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  arrival_time?: string;
  special_requests?: string;
}

export interface BroadcastResult {
  success: boolean;
  delivered: number;
  total: number;
  errors: string[];
  message?: string;
}

const TG_STORAGE_KEY = 'hotel_tg_subscribers_v1';
const TG_BLACKLIST_KEY = 'hotel_tg_blacklisted_ids';

/**
 * Get blacklist of deleted subscriber chat IDs
 */
export function getDeletedTelegramIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(TG_BLACKLIST_KEY) || localStorage.getItem('hotel_tg_deleted_ids_v1');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save blacklist of deleted subscriber chat IDs
 */
export function saveDeletedTelegramIds(ids: string[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TG_BLACKLIST_KEY, JSON.stringify(ids));
  }
}

// Initial subscriber list with permanent primary admin
const INITIAL_SUBSCRIBERS: TelegramSubscriber[] = [
  {
    id: 5057042949,
    chat_id: '5057042949',
    username: 'Disp1re',
    first_name: '999 (Администратор)',
    is_active: 1,
    created_at: new Date().toISOString(),
  },
];

/**
 * Format booking data into the required hotel notification HTML template
 */
export function formatBookingNotificationHtml(payload: BookingNotificationPayload): string {
  const calculateNights = () => {
    if (payload.nights && payload.nights > 0) return payload.nights;
    try {
      const diff = new Date(payload.check_out).getTime() - new Date(payload.check_in).getTime();
      const n = Math.round(diff / 86400000);
      return n > 0 ? n : 1;
    } catch {
      return 1;
    }
  };

  const nights = calculateNights();
  const childrenText = payload.children > 0 ? ` + ${payload.children} дет.` : '';
  const priceFormatted = Number(payload.total_price || 0).toLocaleString('ru-RU');

  return `
🛎 <b>НОВОЕ БРОНИРОВАНИЕ!</b>

📋 <b>Номер брони:</b> <code>${payload.booking_number}</code>
🏨 <b>Категория:</b> ${payload.room_title}
📅 <b>Даты:</b> ${payload.check_in} — ${payload.check_out} (${nights} ноч.)
👥 <b>Гости:</b> ${payload.adults} взр.${childrenText}
💰 <b>Сумма к оплате:</b> ${priceFormatted} ₽ <i>(при заселении)</i>

👤 <b>Гость:</b> ${payload.guest_name}
📞 <b>Телефон:</b> <a href="tel:${payload.guest_phone}">${payload.guest_phone}</a>
✉️ <b>Email:</b> ${payload.guest_email || 'Не указан'}
⏰ <b>Ожидаемый заезд:</b> ${payload.arrival_time || '14:00 – 18:00'}
💬 <b>Пожелания:</b> ${payload.special_requests || 'Нет'}

📍 <i>Отель «Сердце Города» • г. Феодосия, ул. Победы, 36/1</i>
  `.trim();
}

/**
 * Get active subscribers from localStorage with automatic cleanup of legacy mock ID and blocked IDs
 */
export function getLocalTelegramSubscribers(): TelegramSubscriber[] {
  const sanitize = (list: TelegramSubscriber[]) =>
    list.filter((s) => !TELEGRAM_CONFIG.BLOCKED_CHAT_IDS.includes(s.chat_id));

  if (typeof window === 'undefined') return sanitize(INITIAL_SUBSCRIBERS);
  const stored = localStorage.getItem(TG_STORAGE_KEY);
  if (!stored) {
    const cleanInitial = sanitize(INITIAL_SUBSCRIBERS);
    localStorage.setItem(TG_STORAGE_KEY, JSON.stringify(cleanInitial));
    return cleanInitial;
  }
  try {
    const parsed: TelegramSubscriber[] = JSON.parse(stored);
    // Migration: Purge mock demo data and any permanently blocked IDs
    const cleaned = parsed.filter(
      (s) =>
        s.chat_id !== '109847291' &&
        s.username !== 'hotel_admin_feodosia' &&
        !TELEGRAM_CONFIG.BLOCKED_CHAT_IDS.includes(s.chat_id)
    );
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(TG_STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return sanitize(INITIAL_SUBSCRIBERS);
  }
}

/**
 * Save subscribers to localStorage (always excluding blocked IDs)
 */
export function saveLocalTelegramSubscribers(subscribers: TelegramSubscriber[]): void {
  if (typeof window !== 'undefined') {
    const sanitized = subscribers.filter(
      (s) => !TELEGRAM_CONFIG.BLOCKED_CHAT_IDS.includes(s.chat_id)
    );
    localStorage.setItem(TG_STORAGE_KEY, JSON.stringify(sanitized));
  }
}

/**
 * Add or activate subscriber in local store
 */
export function registerLocalSubscriber(subscriber: Omit<TelegramSubscriber, 'id' | 'created_at'>): TelegramSubscriber {
  // Discard blocked IDs immediately
  if (TELEGRAM_CONFIG.BLOCKED_CHAT_IDS.includes(subscriber.chat_id)) {
    return {
      chat_id: subscriber.chat_id,
      first_name: subscriber.first_name,
      username: subscriber.username,
      is_active: 0,
    };
  }

  // If explicitly re-added, remove from deleted blacklist
  const deleted = getDeletedTelegramIds();
  if (deleted.includes(subscriber.chat_id)) {
    saveDeletedTelegramIds(deleted.filter((id) => id !== subscriber.chat_id));
  }

  const current = getLocalTelegramSubscribers();
  const existingIdx = current.findIndex((s) => s.chat_id === subscriber.chat_id);
  
  if (existingIdx !== -1) {
    current[existingIdx] = {
      ...current[existingIdx],
      ...subscriber,
      is_active: 1,
    };
    saveLocalTelegramSubscribers(current);
    return current[existingIdx];
  }

  const newSub: TelegramSubscriber = {
    ...subscriber,
    id: Date.now(),
    is_active: 1,
    created_at: new Date().toISOString(),
  };
  current.push(newSub);
  saveLocalTelegramSubscribers(current);
  return newSub;
}

/**
 * Remove a subscriber permanently from the local broadcast list
 */
export function removeLocalSubscriber(chatId: string): void {
  const current = getLocalTelegramSubscribers();
  const filtered = current.filter((s) => s.chat_id !== chatId);
  saveLocalTelegramSubscribers(filtered);

  // Blacklist the deleted chatId into hotel_tg_blacklisted_ids so syncTelegramUpdates won't re-add it
  const deleted = getDeletedTelegramIds();
  if (!deleted.includes(chatId)) {
    deleted.push(chatId);
    saveDeletedTelegramIds(deleted);
  }
}

/**
 * Toggle subscriber active status
 */
export function toggleLocalSubscriberStatus(chatId: string): TelegramSubscriber[] {
  const current = getLocalTelegramSubscribers();
  const idx = current.findIndex((s) => s.chat_id === chatId);
  if (idx !== -1) {
    current[idx].is_active = current[idx].is_active === 1 ? 0 : 1;
    saveLocalTelegramSubscribers(current);
  }
  return current;
}

/**
 * Poll Telegram API via getUpdates to fetch all users who sent /start or messaged the bot
 */
export async function syncTelegramUpdates(botToken: string): Promise<{
  success: boolean;
  newCount: number;
  totalActive: number;
  message: string;
  subscribers: TelegramSubscriber[];
}> {
  const token = botToken.trim();
  if (!token) {
    return {
      success: false,
      newCount: 0,
      totalActive: getLocalTelegramSubscribers().length,
      message: 'Укажите токен бота Telegram (Bot Token) в настройках',
      subscribers: getLocalTelegramSubscribers(),
    };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=100`);
    if (!res.ok) {
      const errJson: any = await res.json().catch(() => ({}));
      const errDesc = errJson.description || `HTTP ${res.status}`;
      let translated = errDesc;
      if (errDesc.includes('Unauthorized')) {
        translated = 'Неверный токен бота (проверьте правильность токена от @BotFather)';
      }
      return {
        success: false,
        newCount: 0,
        totalActive: getLocalTelegramSubscribers().length,
        message: `Ошибка Telegram API: ${translated}`,
        subscribers: getLocalTelegramSubscribers(),
      };
    }

    const data: any = await res.json().catch(() => ({}));
    if (!data.ok || !Array.isArray(data.result)) {
      return {
        success: false,
        newCount: 0,
        totalActive: getLocalTelegramSubscribers().length,
        message: 'Telegram вернул неожиданный формат ответа',
        subscribers: getLocalTelegramSubscribers(),
      };
    }

    let newCount = 0;
    const deletedIds = getDeletedTelegramIds();

    for (const update of data.result) {
      const msg = update.message || update.edited_message;
      if (!msg || !msg.chat) continue;

      const chatId = String(msg.chat.id);
      if (TELEGRAM_CONFIG.BLOCKED_CHAT_IDS.includes(chatId) || deletedIds.includes(chatId)) {
        continue;
      }

      const username = msg.from?.username || msg.chat?.username || undefined;
      const firstName = [msg.from?.first_name || msg.chat?.first_name, msg.from?.last_name || msg.chat?.last_name]
        .filter(Boolean)
        .join(' ') || msg.from?.username || 'Пользователь Telegram';

      const before = getLocalTelegramSubscribers();
      const isExisting = before.some((s) => s.chat_id === chatId);

      registerLocalSubscriber({
        chat_id: chatId,
        username,
        first_name: firstName,
        is_active: 1,
      });

      if (!isExisting) {
        newCount++;
      }
    }

    const currentSubs = getLocalTelegramSubscribers();
    return {
      success: true,
      newCount,
      totalActive: currentSubs.filter((s) => s.is_active === 1).length,
      message: newCount > 0
        ? `Синхронизация успешна: добавлено ${newCount} новых пользователей из бота`
        : `Синхронизация завершена: новых пользователей не обнаружено (в базе ${currentSubs.length})`,
      subscribers: currentSubs,
    };
  } catch (err: any) {
    return {
      success: false,
      newCount: 0,
      totalActive: getLocalTelegramSubscribers().length,
      message: `Сетевой сбой при опросе Telegram: ${err?.message || 'Network error'}`,
      subscribers: getLocalTelegramSubscribers(),
    };
  }
}

/**
 * Broadcast message to all active subscribers via Telegram Bot API with detailed error reporting
 */
export async function broadcastTelegramMessage(
  htmlText: string,
  settings?: HotelSettings
): Promise<BroadcastResult> {
  const token = settings?.telegram_bot_token?.trim() || TELEGRAM_CONFIG.BOT_TOKEN;
  
  // Collect all unique active chat IDs
  const subscribers = getLocalTelegramSubscribers().filter(
    (s) => s.is_active === 1 && !TELEGRAM_CONFIG.BLOCKED_CHAT_IDS.includes(s.chat_id)
  );
  const chatIds = new Set<string>(subscribers.map((s) => s.chat_id));
  
  if (settings?.telegram_chat_id?.trim()) {
    chatIds.add(settings.telegram_chat_id.trim());
  }

  // Ensure primary admin is always included
  chatIds.add(TELEGRAM_CONFIG.PRIMARY_ADMIN_CHAT_ID);

  // Exclude permanently blocked chat IDs
  for (const blocked of TELEGRAM_CONFIG.BLOCKED_CHAT_IDS) {
    chatIds.delete(blocked);
  }

  const targets = Array.from(chatIds);
  const errors: string[] = [];

  console.group('🛎 [Telegram Notification Broadcast]');
  console.log('Recipients:', targets);
  console.log('Formatted Message:\n', htmlText);
  console.groupEnd();

  if (targets.length === 0) {
    return {
      success: false,
      delivered: 0,
      total: 0,
      errors: ['В списке рассылки нет получателей. Добавьте Chat ID вручную или нажмите «Синхронизировать из бота».'],
      message: 'Нет получателей для отправки',
    };
  }

  if (!token) {
    console.warn('[Telegram Broadcast] Токен бота не задан. Уведомление смоделировано в консоли.');
    return {
      success: true,
      delivered: targets.length,
      total: targets.length,
      errors: ['Токен бота не заполнен в настройках. Уведомление смоделировано в консоли браузера.'],
      message: `Смоделировано в консоли для ${targets.length} получателей (токен не указан)`,
    };
  }

  let delivered = 0;
  for (const chatId of targets) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: htmlText,
          parse_mode: 'HTML',
        }),
      });

      if (res.ok) {
        delivered++;
      } else {
        const errJson: any = await res.json().catch(() => ({}));
        const rawDesc = errJson.description || `HTTP ${res.status}`;
        let humanReason = rawDesc;
        if (rawDesc.includes('chat not found')) {
          humanReason = 'Пользователь не запустил бота или чат не найден';
        } else if (rawDesc.includes('bot was blocked')) {
          humanReason = 'Бот заблокирован пользователем';
        } else if (rawDesc.includes('user is deactivated')) {
          humanReason = 'Аккаунт пользователя деактивирован';
        } else if (rawDesc.includes('Unauthorized')) {
          humanReason = 'Неверный токен бота';
        }
        const errorMsg = `Не удалось доставить на ID: ${chatId} (${humanReason})`;
        errors.push(errorMsg);
        console.warn(`[Telegram Broadcast] ${errorMsg}`);
      }
    } catch (err: any) {
      const errorMsg = `Сетевой сбой при отправке на ID: ${chatId} (${err?.message || 'Network error'})`;
      errors.push(errorMsg);
      console.warn(`[Telegram Broadcast] ${errorMsg}`);
    }
  }

  return {
    success: delivered > 0,
    delivered,
    total: targets.length,
    errors,
    message: delivered > 0
      ? `Уведомление успешно доставлено (${delivered}/${targets.length} получателей)`
      : `Не удалось доставить уведомления (${errors.length} ошибок)`,
  };
}

/**
 * Handle new booking notification broadcast
 */
export async function sendBookingTelegramNotification(
  payload: BookingNotificationPayload,
  settings?: HotelSettings
): Promise<void> {
  const message = formatBookingNotificationHtml(payload);
  await broadcastTelegramMessage(message, settings);
}
