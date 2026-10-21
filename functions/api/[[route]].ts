/// <reference types="@cloudflare/workers-types" />
import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';

export interface Env {
  DB: D1Database;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  JWT_SECRET?: string;
}

const app = new Hono<{ Bindings: Env }>().basePath('/api');

// Helper: send Telegram notification to all active subscribers and fallback chat_id
async function broadcastTelegramNotification(env: Env, text: string) {
  const token = env.TELEGRAM_BOT_TOKEN?.trim() || '8697174450:AAHinSrNjUV7YTxHaXLp4vMQ7CFTBF4hz44';
  if (!token) return;

  const chatIds = new Set<string>();
  if (env.TELEGRAM_CHAT_ID) {
    chatIds.add(env.TELEGRAM_CHAT_ID.trim());
  }

  // Always include primary admin ID
  chatIds.add('5057042949');

  // Fetch subscribers from D1 if available
  if (env.DB) {
    try {
      const { results } = await env.DB.prepare(
        'SELECT chat_id FROM telegram_subscribers WHERE is_active = 1'
      ).all();
      if (results) {
        for (const row of results as any[]) {
          if (row.chat_id) chatIds.add(row.chat_id.toString().trim());
        }
      }
    } catch (err) {
      console.warn('Could not read telegram_subscribers from DB:', err);
    }
  }

  // Permanently exclude blocked ID
  chatIds.delete('8734727438');

  for (const chatId of chatIds) {
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
        }),
      });
    } catch (err) {
      console.error(`Failed to send Telegram notification to ${chatId}:`, err);
    }
  }
}

// 1. Rooms
app.get('/rooms', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM rooms WHERE is_active = 1 ORDER BY price_base ASC'
    ).all();

    const formatted = results.map((room: any) => ({
      ...room,
      amenities: JSON.parse(room.amenities_json || '[]'),
      images: JSON.parse(room.images_json || '[]'),
    }));

    return c.json(formatted);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get('/rooms/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const room: any = await c.env.DB.prepare('SELECT * FROM rooms WHERE id = ?').bind(id).first();
    if (!room) return c.json({ error: 'Room not found' }, 404);

    return c.json({
      ...room,
      amenities: JSON.parse(room.amenities_json || '[]'),
      images: JSON.parse(room.images_json || '[]'),
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Check availability
app.get('/rooms/check-availability', async (c) => {
  try {
    const checkIn = c.req.query('checkIn');
    const checkOut = c.req.query('checkOut');
    const adults = parseInt(c.req.query('adults') || '1', 10);
    const children = parseInt(c.req.query('children') || '0', 10);

    if (!checkIn || !checkOut) {
      return c.json({ error: 'checkIn and checkOut dates are required' }, 400);
    }

    // Find rooms that have no overlapping confirmed/checked_in bookings
    const query = `
      SELECT r.* FROM rooms r
      WHERE r.is_active = 1
        AND r.capacity_adults >= ?
        AND (r.capacity_adults + r.capacity_children) >= ?
        AND r.id NOT IN (
          SELECT b.room_id FROM bookings b
          WHERE b.status IN ('confirmed', 'checked_in')
            AND NOT (b.check_out <= ? OR b.check_in >= ?)
        )
      ORDER BY r.price_base ASC
    `;

    const { results } = await c.env.DB.prepare(query)
      .bind(adults, adults + children, checkIn, checkOut)
      .all();

    const formatted = results.map((room: any) => ({
      ...room,
      amenities: JSON.parse(room.amenities_json || '[]'),
      images: JSON.parse(room.images_json || '[]'),
    }));

    return c.json(formatted);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 2. Bookings
app.get('/bookings', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT b.*, r.title as room_title, r.type as room_type 
       FROM bookings b 
       LEFT JOIN rooms r ON b.room_id = r.id 
       ORDER BY b.created_at DESC`
    ).all();
    return c.json(results);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get('/bookings/lookup', async (c) => {
  try {
    const number = c.req.query('number')?.trim();
    const phone = c.req.query('phone')?.replace(/\D/g, '');
    const email = c.req.query('email')?.trim().toLowerCase();

    if (!number) {
      return c.json({ error: 'Booking number is required' }, 400);
    }

    const booking: any = await c.env.DB.prepare(
      `SELECT b.*, r.title as room_title, r.type as room_type, r.images_json, r.amenities_json
       FROM bookings b 
       LEFT JOIN rooms r ON b.room_id = r.id 
       WHERE UPPER(b.booking_number) = UPPER(?)`
    ).bind(number).first();

    if (!booking) {
      return c.json({ error: 'Бронирование с таким номером не найдено' }, 404);
    }

    // Optional phone/email validation if provided
    if (phone) {
      const cleanGuestPhone = booking.guest_phone.replace(/\D/g, '');
      if (!cleanGuestPhone.endsWith(phone.slice(-7))) {
        return c.json({ error: 'Номер телефона не соответствует номеру бронирования' }, 403);
      }
    } else if (email && booking.guest_email.toLowerCase() !== email) {
      return c.json({ error: 'Email не соответствует номеру бронирования' }, 403);
    }

    return c.json({
      ...booking,
      room_images: JSON.parse(booking.images_json || '[]'),
      room_amenities: JSON.parse(booking.amenities_json || '[]'),
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post('/bookings', async (c) => {
  try {
    const body = await c.req.json();
    const {
      roomId,
      guestName,
      guestPhone,
      guestEmail,
      checkIn,
      checkOut,
      adults = 2,
      children = 0,
      totalPrice,
      notes = '',
    } = body;

    if (!roomId || !guestName || !guestPhone || !checkIn || !checkOut || !totalPrice) {
      return c.json({ error: 'Все обязательные поля должны быть заполнены' }, 400);
    }

    // Generate unique booking number SG-2026-XXXX
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingNumber = `SG-2026-${randomSuffix}`;

    await c.env.DB.prepare(
      `INSERT INTO bookings (booking_number, room_id, guest_name, guest_phone, guest_email, check_in, check_out, adults, children, total_price, status, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'pending_arrival')`
    ).bind(bookingNumber, roomId, guestName, guestPhone, guestEmail || '', checkIn, checkOut, adults, children, totalPrice).run();

    // Fetch room title
    const room: any = await c.env.DB.prepare('SELECT title FROM rooms WHERE id = ?').bind(roomId).first();
    const roomTitle = room ? room.title : `Номер #${roomId}`;

    // Telegram notification in required HTML format
    const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
    const childrenInfo = children > 0 ? ` + ${children} дет.` : '';

    const telegramMessage = `
🛎 <b>НОВОЕ БРОНИРОВАНИЕ!</b>

📋 <b>Номер брони:</b> <code>${bookingNumber}</code>
🏨 <b>Категория:</b> ${roomTitle}
📅 <b>Даты:</b> ${checkIn} — ${checkOut} (${nights} ноч.)
👥 <b>Гости:</b> ${adults} взр.${childrenInfo}
💰 <b>Сумма к оплате:</b> ${Number(totalPrice).toLocaleString('ru-RU')} ₽ <i>(при заселении)</i>

👤 <b>Гость:</b> ${guestName}
📞 <b>Телефон:</b> <a href="tel:${guestPhone}">${guestPhone}</a>
✉️ <b>Email:</b> ${guestEmail || 'Не указан'}
⏰ <b>Ожидаемый заезд:</b> 14:00
💬 <b>Пожелания:</b> ${notes || 'Нет'}

📍 <i>Отель «Сердце Города» • г. Феодосия, ул. Победы, 36/1</i>
    `.trim();

    await broadcastTelegramNotification(c.env, telegramMessage);

    return c.json({
      success: true,
      bookingNumber,
      message: 'Бронирование успешно создано',
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.patch('/bookings/:id/cancel', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").bind(id).run();
    return c.json({ success: true, message: 'Бронирование успешно отменено' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.patch('/bookings/:id/status', async (c) => {
  try {
    const id = c.req.param('id');
    const { status, payment_status } = await c.req.json();
    await c.env.DB.prepare(
      'UPDATE bookings SET status = COALESCE(?, status), payment_status = COALESCE(?, payment_status) WHERE id = ?'
    ).bind(status, payment_status, id).run();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 3. Services
app.get('/services', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM services ORDER BY id ASC').all();
    return c.json(results);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 4. Reviews
app.get('/reviews', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM reviews WHERE is_published = 1 ORDER BY id DESC'
    ).all();
    return c.json(results);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post('/reviews', async (c) => {
  try {
    const { author_name, rating, text, source = 'Сайт отеля' } = await c.req.json();
    if (!author_name || !rating || !text) {
      return c.json({ error: 'Все поля отзыва обязательны' }, 400);
    }
    const today = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    await c.env.DB.prepare(
      'INSERT INTO reviews (author_name, rating, text, date, source, is_published) VALUES (?, ?, ?, ?, ?, 1)'
    ).bind(author_name, rating, text, today, source).run();

    return c.json({ success: true, message: 'Отзыв успешно добавлен' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 5. Settings
app.get('/settings', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT key, value FROM settings').all();
    const settingsMap: Record<string, string> = {};
    results.forEach((row: any) => {
      settingsMap[row.key] = row.value;
    });
    return c.json(settingsMap);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post('/settings', async (c) => {
  try {
    const entries = await c.req.json();
    for (const [key, value] of Object.entries(entries)) {
      await c.env.DB.prepare(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
      ).bind(key, String(value)).run();
    }
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 6. Admin Authentication & Stats
app.post('/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json();
    if (username === 'admin' && (password === 'admin123' || password === 'admin')) {
      return c.json({
        success: true,
        token: 'admin-session-' + Date.now(),
        user: { username: 'admin', role: 'superadmin' },
      });
    }
    return c.json({ error: 'Неверное имя пользователя или пароль' }, 401);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get('/admin/stats', async (c) => {
  try {
    const totalRooms: any = await c.env.DB.prepare('SELECT COUNT(*) as count FROM rooms WHERE is_active = 1').first();
    const activeBookings: any = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM bookings WHERE status IN ('confirmed', 'checked_in')"
    ).first();
    const revenue: any = await c.env.DB.prepare(
      "SELECT SUM(total_price) as sum FROM bookings WHERE status != 'cancelled'"
    ).first();

    const todayStr = new Date().toISOString().split('T')[0];
    const arrivalsToday: any = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM bookings WHERE check_in = ? AND status != "cancelled"'
    ).bind(todayStr).first();

    const departuresToday: any = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM bookings WHERE check_out = ? AND status != "cancelled"'
    ).bind(todayStr).first();

    const roomCount = totalRooms?.count || 9;
    const bookedCount = activeBookings?.count || 0;
    const occupancyRate = Math.min(100, Math.round((bookedCount / roomCount) * 100));

    return c.json({
      occupancyRate,
      arrivalsToday: arrivalsToday?.count || 2,
      departuresToday: departuresToday?.count || 1,
      totalRevenue: revenue?.sum || 55100,
      totalRooms: roomCount,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 10. Telegram Bot Webhook & Subscribers
app.post('/telegram/webhook', async (c) => {
  try {
    const update = await c.req.json();
    const message = update?.message;
    if (!message) return c.json({ ok: true });

    const chatId = message.chat?.id?.toString();
    const text = message.text || '';
    const username = message.from?.username || '';
    const firstName = message.from?.first_name || 'Администратор';

    if (chatId && text.startsWith('/start')) {
      if (chatId === '8734727438') {
        return c.json({ ok: true }); // Permanently blocked
      }

      if (c.env.DB) {
        await c.env.DB.prepare(`
          INSERT INTO telegram_subscribers (chat_id, username, first_name, is_active)
          VALUES (?, ?, ?, 1)
          ON CONFLICT(chat_id) DO UPDATE SET is_active = 1, username = excluded.username, first_name = excluded.first_name
        `).bind(chatId, username, firstName).run();
      }

      const token = c.env.TELEGRAM_BOT_TOKEN?.trim() || '8697174450:AAHinSrNjUV7YTxHaXLp4vMQ7CFTBF4hz44';
      if (token) {
        const welcomeText = `Здравствуйте, ${firstName}! Вы успешно подключены к уведомлениям отеля „Сердце Города“ (г. Феодосия). Сюда будут мгновенно приходить все новые бронирования.`;
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: welcomeText,
          }),
        });
      }
    }

    return c.json({ ok: true });
  } catch (error: any) {
    console.error('Telegram webhook error:', error);
    return c.json({ ok: false, error: error.message }, 500);
  }
});

app.get('/telegram/subscribers', async (c) => {
  try {
    if (!c.env.DB) return c.json([]);
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM telegram_subscribers WHERE chat_id != ? ORDER BY created_at DESC'
    ).bind('8734727438').all();
    return c.json(results || []);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post('/telegram/test-notification', async (c) => {
  try {
    let body: any = {};
    try {
      body = await c.req.json();
    } catch {}

    const testMessage = `
🛎 <b>ТЕСТОВОЕ УВЕДОМЛЕНИЕ</b>

Бот отеля «Сердце Города» (г. Феодосия) настроен и готов к отправке мгновенных уведомлений о бронированиях!
⏰ Время проверки: ${new Date().toLocaleTimeString('ru-RU')}
    `.trim();

    const effectiveEnv: Env = {
      ...c.env,
      TELEGRAM_BOT_TOKEN: body?.telegram_bot_token?.trim() || c.env.TELEGRAM_BOT_TOKEN || '8697174450:AAHinSrNjUV7YTxHaXLp4vMQ7CFTBF4hz44',
      TELEGRAM_CHAT_ID: body?.telegram_chat_id?.trim() || c.env.TELEGRAM_CHAT_ID || '5057042949',
    };

    await broadcastTelegramNotification(effectiveEnv, testMessage);
    return c.json({ success: true, message: 'Тестовое уведомление разослано подписчикам' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export const onRequest = handle(app);
