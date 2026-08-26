-- Картинки
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS phone VARCHAR(32);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Телефоны seed-поставщиков
UPDATE suppliers SET phone = '+7 495 111-22-33',
  logo_url = 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=200&q=80'
  WHERE id = 'e0000001-0000-0000-0000-000000000001';
UPDATE suppliers SET phone = '+7 495 444-55-66',
  logo_url = 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=200&q=80'
  WHERE id = 'e0000001-0000-0000-0000-000000000002';

-- Картинки текущих товаров
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80'
  WHERE slug = 'cement-m500';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1504917595217-d4dc5c07cb31?w=800&q=80'
  WHERE slug = 'armatura-12';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1517581178692-2ed30461626e?w=800&q=80'
  WHERE slug = 'kladka-kirpicha';

-- Больше товаров
INSERT INTO products (id, category_id, name, slug, description, unit, type, is_active, image_url)
VALUES
('f0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000001',
 'Пескобетон М300', 'peskobeton-m300', 'Сухая смесь, мешок 40 кг', 'мешок', 'material', true,
 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=800&q=80'),
('f0000001-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000002',
 'Арматура А500С 16мм', 'armatura-16', 'Пруток 11.7 м, рифлёная', 'тонна', 'material', true,
 'https://images.unsplash.com/photo-1581094794329-adcbf044eadb?w=800&q=80'),
('f0000001-0000-0000-0000-000000000006', 'b0000001-0000-0000-0000-000000000003',
 'Доска обрезная 50×150', 'doska-50-150', 'Хвоя, естественная влажность', 'м³', 'material', true,
 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80'),
('f0000001-0000-0000-0000-000000000007', 'b0000001-0000-0000-0000-000000000004',
 'Утеплитель 50 мм', 'uteplitel-50', 'Минеральная плита 600×1200', 'упак', 'material', true,
 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'),
('f0000001-0000-0000-0000-000000000008', 'b0000001-0000-0000-0000-000000000006',
 'Штукатурка стен', 'shtukaturka', 'Машинная / ручная, м²', 'м²', 'service', true,
 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80'),
('f0000001-0000-0000-0000-000000000009', 'b0000001-0000-0000-0000-000000000007',
 'Монтаж гипсокартона', 'gkl-montazh', 'Каркас + обшивка', 'м²', 'service', true,
 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80')
ON CONFLICT (id) DO UPDATE SET image_url = EXCLUDED.image_url, description = EXCLUDED.description;

-- Offers (Москва)
INSERT INTO offers (product_id, supplier_id, region_id, price, currency, min_order_qty, stock_qty, delivery_days, supports_discount, is_active)
VALUES
('f0000001-0000-0000-0000-000000000004', 'e0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 245, 'RUB', 10, 800, 1, true, true),
('f0000001-0000-0000-0000-000000000004', 'e0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 238, 'RUB', 20, 500, 2, true, true),
('f0000001-0000-0000-0000-000000000005', 'e0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 58500, 'RUB', 1, 40, 2, true, true),
('f0000001-0000-0000-0000-000000000005', 'e0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 57200, 'RUB', 2, 25, 3, true, true),
('f0000001-0000-0000-0000-000000000006', 'e0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 18500, 'RUB', 1, 120, 2, true, true),
('f0000001-0000-0000-0000-000000000006', 'e0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 17800, 'RUB', 2, 80, 3, false, true),
('f0000001-0000-0000-0000-000000000007', 'e0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 890, 'RUB', 5, 300, 1, true, true),
('f0000001-0000-0000-0000-000000000008', 'e0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 650, 'RUB', 20, NULL, 3, true, true),
('f0000001-0000-0000-0000-000000000009', 'e0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 780, 'RUB', 15, NULL, 4, true, true)
ON CONFLICT DO NOTHING;

-- Живые объявления (нужен любой user — берём, если есть; иначе создаём демо-юзера)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
  'd0000001-0000-0000-0000-000000000099',
  'demo@stroycompare.ru',
  '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUV', -- не для логина, только автор объявлений
  'Демо',
  'Автор',
  'buyer',
  true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO listings (id, user_id, title, description, price, type, region_id, status, contact_phone, image_url)
VALUES
('c1000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000099',
 'Остаток цемента М500, 40 мешков',
 'Сухой, хранение на складе. Самовывоз Москва, ЮАО.',
 380, 'material', 'a0000001-0000-0000-0000-000000000001', 'active', '+7 916 000-11-22',
 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80'),
('c1000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000099',
 'Бригада каменщиков, МО',
 'Кладка перегородок и несущих. Работаем по области.',
 1600, 'service', 'a0000001-0000-0000-0000-000000000001', 'active', '+7 916 000-33-44',
 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80'),
('c1000001-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000099',
 'Доска 50×150, 4 м³',
 'Хвоя, остаток с объекта. Можно забрать сегодня.',
 16000, 'material', 'a0000001-0000-0000-0000-000000000001', 'active', '+7 916 000-55-66',
 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80'),
('c1000001-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000099',
 'Утеплитель 50 мм, 20 упаковок',
 'Новый, плёнка целая.',
 750, 'material', 'a0000001-0000-0000-0000-000000000001', 'active', '+7 916 000-77-88',
 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80')
ON CONFLICT (id) DO NOTHING;