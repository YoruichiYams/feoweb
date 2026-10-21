-- Cloudflare D1 Migration: 0001_init.sql
-- Hotel "Сердце Города" (Heart of the City) - Feodosia, Crimea

CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  capacity_adults INTEGER NOT NULL DEFAULT 2,
  capacity_children INTEGER NOT NULL DEFAULT 1,
  area_sqm INTEGER NOT NULL DEFAULT 25,
  price_base INTEGER NOT NULL DEFAULT 3500,
  amenities_json TEXT NOT NULL DEFAULT '[]',
  images_json TEXT NOT NULL DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_number TEXT UNIQUE NOT NULL,
  room_id INTEGER NOT NULL,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  total_price INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'confirmed',
  payment_status TEXT NOT NULL DEFAULT 'pending_arrival',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  icon TEXT NOT NULL DEFAULT 'star'
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  text TEXT NOT NULL,
  date TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'Яндекс Карты',
  is_published INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin'
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS telegram_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed Rooms (9 Categories as required)
INSERT OR IGNORE INTO rooms (id, title, slug, type, capacity_adults, capacity_children, area_sqm, price_base, amenities_json, images_json, is_active) VALUES
(1, 'Стандарт двухместный', 'standart-dvuhmestnyj', 'Стандарт', 2, 1, 24, 3200, 
  '["Двуспальная кровать Queen Size", "Кондиционер с климат-контролем", "Wi-Fi до 100 Мбит/с", "Smart TV 43\"", "Холодильник", "Фен и гигиенический набор", "Собственный санузел с душевой"]',
  '["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80"]', 1),

(2, 'Студия витражная', 'studiya-vitrazhnaya', 'Студия', 2, 1, 32, 4500, 
  '["Панорамные витражные окна", "Кровать King Size", "Зона отдыха с креслами", "Кондиционер", "Smart TV 50\"", "Мини-холодильник", "Чайная станция", "Халаты и тапочки", "Дизайнерская ванная"]',
  '["https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80"]', 1),

(3, 'Люкс 2-х комнатный', 'lyuks-2-komnatnyj', 'Люкс', 3, 2, 48, 6800, 
  '["Две изолированные комнаты", "Спальня с кроватью King Size", "Гостиная с раскладным диваном", "Два кондиционера", "2x Smart TV", "Сейф", "Кофемашина и чайник", "Ванна и тропический душ", "Балкон"]',
  '["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80"]', 1),

(4, 'Люкс 3-х комнатный', 'lyuks-3-komnatnyj', 'Люкс', 5, 2, 72, 8900, 
  '["Просторная резиденция из 3 комнат", "Две отдельные спальни", "Большая гостиная-столовая", "3x Smart TV", "Индивидуальный климат", "Ортопедические матрасы", "Два санузла", "Премиальная косметика", "Вид на Феодосийский залив"]',
  '["https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80"]', 1),

(5, '3-х местный стандарт', '3-mestnyj-standart', 'Стандарт', 3, 1, 28, 4100, 
  '["Три односпальные кровати или Queen + Single", "Кондиционер", "Smart TV", "Рабочий стол", "Холодильник", "Фен", "Душевая кабина", "Шкаф-купе"]',
  '["https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80"]', 1),

(6, 'Апарт-студия', 'apart-studiya', 'Апартаменты', 2, 2, 36, 4800, 
  '["Оборудованная мини-кухня (плита, СВЧ, посуда)", "Обеденная зона", "Двуспальная кровать", "Раскладное кресло-кровать", "Кондиционер", "Стиральная машина в номере", "Wi-Fi до 100 Мбит/с"]',
  '["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80"]', 1),

(7, 'Однокомнатная квартира', 'odnokomnatnaya-kvartira', 'Апартаменты', 3, 2, 42, 5200, 
  '["Полноценная изолированная кухня", "Газовая/индукционная плита", "Двукамерный холодильник", "Стиральная машина", "Спальня с гардеробной", "Лоджия", "Wi-Fi", "Гладильные принадлежности"]',
  '["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80"]', 1),

(8, 'Студия с кухней', 'studiya-s-kuhnej', 'Студия', 2, 1, 30, 4400, 
  '["Эргономичный кухонный уголок", "Индукционная варочная панель", "Электрочайник и СВЧ", "Кровать King Size", "Кондиционер", "Санузел с душевой кабиной", "Шумоизоляция"]',
  '["https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=1200&q=80"]', 1),

(9, 'Стандарт на 2-х', 'standart-na-2-h', 'Стандарт', 2, 0, 20, 3000, 
  '["Две раздельные или одна двуспальная кровать", "Кондиционер", "Wi-Fi", "LED телевизор", "Компактный холодильник", "Душ и санузел", "Фен"]',
  '["https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"]', 1);

-- Seed Services
INSERT OR IGNORE INTO services (id, name, description, price, icon) VALUES
(1, 'Проживание с питомцами до 3 кг', 'Размещение с маленькими декоративными собачками и кошками (при наличии ветпаспорта)', 500, 'paw-print'),
(2, 'Проживание с питомцами от 3 кг', 'Комфортное размещение с питомцами среднего размера, миски и пеленки по запросу', 1000, 'paw-print'),
(3, 'Завтраки по авторскому меню', 'Свежие крымские фермерские продукты, ароматный кофе, выпечка и горячие блюда на выбор', 650, 'coffee'),
(4, 'Услуги стирки и глажки', 'Бережный уход за вашими вещами на профессиональном оборудовании прачечной', 400, 'shirt'),
(5, 'Банные махровые халаты и тапочки', 'Комплект из мягкого натурального 100% хлопка для максимального релакса', 350, 'sparkles'),
(6, 'Дополнительное спальное место', 'Комфортная евро-раскладушка с полноценным ортопедическим матрасом и постельным бельем', 900, 'bed'),
(7, 'Оборудованная кухня в апартаментах', 'Включает всю необходимую посуду, столовые приборы, варочную панель и холодильник', 0, 'utensils'),
(8, 'Охраняемая парковка во дворе', 'Закрытая внутренняя территория с видеонаблюдением 24/7 для гостей отеля', 0, 'shield-check');

-- Seed Reviews
INSERT OR IGNORE INTO reviews (id, author_name, rating, text, date, source, is_published) VALUES
(1, 'Елена Васильева', 5, 'Замечательный отель в самом центре Феодосии! До набережной и картинной галереи Айвазовского буквально 10 минут неспешной прогулки. Номера чистые, свежие, постельное белье белоснежное. Очень приветливый администратор. Вернемся снова!', '15 октября 2026', 'Яндекс Карты', 1),
(2, 'Дмитрий Ковалев', 5, 'Останавливались в витражной студии на неделю. Прекрасные окна, много света, тихий уютный двор. Большой плюс — закрытая парковка для машины, в сезон это спасение. До пляжа близко. Рекомендую однозначно!', '02 октября 2026', '2ГИС', 1),
(3, 'Марина и Сергей', 5, 'Превосходный отель в Феодосии! Брали двухкомнатный люкс для семьи с двумя детьми — всем хватило места, отличный климат-контроль и скоростной интернет. Спасибо за гостеприимство и помощь с экскурсиями.', '24 сентября 2026', '101Hotels', 1),
(4, 'Артем Нестеров', 5, 'Отличная локация на Победы 36/1. Всё рядом: магазины, кафе, рынок и главное — море! Завтраки очень вкусные и сытные. Номер убирали каждый день. Сервис на высоте.', '11 сентября 2026', 'Яндекс Карты', 1),
(5, 'Ольга Романова', 5, 'Очень уютная апарт-студия с кухней. Было всё необходимое для приготовления еды ребенку. Тишина по ночам, удобный матрас, спали отлично. Персонал отзывчивый и вежливый.', '28 августа 2026', '2ГИС', 1);

-- Seed Admin (default login: admin / password: admin123)
-- SHA-256 hash for 'admin123' + salt 'salt2026' = 87b28db86beaa05634e0fe2e3dc8c29df628f413dbca477a3fa7fbe9a184a4ec
INSERT OR IGNORE INTO admins (id, username, password_hash, salt, role) VALUES
(1, 'admin', '87b28db86beaa05634e0fe2e3dc8c29df628f413dbca477a3fa7fbe9a184a4ec', 'salt2026', 'superadmin');

-- Seed Settings
INSERT OR IGNORE INTO settings (key, value) VALUES
('hotel_name', 'Отель «Сердце Города»'),
('hotel_address', 'Республика Крым, г. Феодосия, ул. Победы, д. 36/1'),
('hotel_phone', '+7 (995) 171-16-64'),
('hotel_phone_raw', '+79951711664'),
('hotel_whatsapp', '79951711664'),
('hotel_telegram', 'hotel_serdtse_feodosia'),
('hotel_email', 'info@hotel-feodosia.ru'),
('check_in_time', '14:00'),
('check_out_time', '12:00'),
('legal_entity', 'ИП Федотов А. В.'),
('legal_inn', '910800123456'),
('legal_ogrnip', '321911200012345'),
('telegram_bot_token', ''),
('telegram_chat_id', '');

-- Seed Initial Demo Bookings
INSERT OR IGNORE INTO bookings (id, booking_number, room_id, guest_name, guest_phone, guest_email, check_in, check_out, adults, children, total_price, status, payment_status, created_at) VALUES
(1, 'SG-2026-1042', 2, 'Алексей Мельников', '+7 (918) 456-78-90', 'melnikov@mail.ru', '2026-10-21', '2026-10-24', 2, 0, 13500, 'confirmed', 'paid', '2026-10-18 10:15:00'),
(2, 'SG-2026-1043', 3, 'Светлана Воронина', '+7 (978) 123-45-67', 'voronina@yandex.ru', '2026-10-22', '2026-10-26', 3, 1, 27200, 'confirmed', 'pending_arrival', '2026-10-19 14:30:00'),
(3, 'SG-2026-1044', 6, 'Константин Игнатов', '+7 (905) 987-65-43', 'ignatov.k@gmail.com', '2026-10-20', '2026-10-23', 2, 1, 14400, 'checked_in', 'paid', '2026-10-15 09:20:00');
