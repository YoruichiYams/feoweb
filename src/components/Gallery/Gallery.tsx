import React, { useState } from 'react';
import { Camera, Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import './Gallery.css';

interface GalleryPhoto {
  src: string;
  category: 'rooms' | 'interior' | 'territory';
  title: string;
}

const GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    src: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1400&q=85',
    category: 'rooms',
    title: 'Витражная студия с панорамными окнами',
  },
  {
    src: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    category: 'interior',
    title: 'Уютная зона лобби отеля',
  },
  {
    src: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
    category: 'rooms',
    title: 'Двухместный номер категории Стандарт',
  },
  {
    src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    category: 'territory',
    title: 'Морское побережье и набережная Феодосии',
  },
  {
    src: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
    category: 'rooms',
    title: 'Люкс 2-х комнатный с гостиной',
  },
  {
    src: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1400&q=85',
    category: 'interior',
    title: 'Элегантные детали интерьера и спальные места',
  },
  {
    src: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    category: 'rooms',
    title: 'Оборудованная апарт-студия с кухней',
  },
  {
    src: 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&w=1200&q=80',
    category: 'territory',
    title: 'Закрытый внутренний двор и парковка',
  },
];

export const Gallery: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'rooms' | 'interior' | 'territory'>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered = GALLERY_PHOTOS.filter((p) => {
    if (activeTab === 'all') return true;
    return p.category === activeTab;
  });

  const nextImg = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % filtered.length);
    }
  };

  const prevImg = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + filtered.length) % filtered.length);
    }
  };

  return (
    <section id="gallery" className="gallery-section section-padding">
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow">ФОТОГАЛЕРЕЯ • ИНТЕРЬЕРЫ</div>
          <h2 className="section-title">Галерея «Победа»</h2>
          <p className="section-desc">
            Ознакомьтесь с реальными интерьерами наших номеров, уютными общими зонами и живописными окрестностями Феодосии.
          </p>
        </div>

        {/* Category Filters */}
        <div className="room-filters">
          <button
            className={`filter-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Все фото
          </button>
          <button
            className={`filter-btn ${activeTab === 'rooms' ? 'active' : ''}`}
            onClick={() => setActiveTab('rooms')}
          >
            Номера
          </button>
          <button
            className={`filter-btn ${activeTab === 'interior' ? 'active' : ''}`}
            onClick={() => setActiveTab('interior')}
          >
            Интерьер
          </button>
          <button
            className={`filter-btn ${activeTab === 'territory' ? 'active' : ''}`}
            onClick={() => setActiveTab('territory')}
          >
            Территория и море
          </button>
        </div>

        {/* Photos Grid */}
        <div className="gallery-grid">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              className="gallery-item"
              onClick={() => setLightboxIndex(idx)}
            >
              <img src={item.src} alt={item.title} className="gallery-img" loading="lazy" />
              <div className="gallery-overlay-hover">
                <Maximize2 size={24} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div className="lightbox-overlay" onClick={() => setLightboxIndex(null)}>
          <button
            className="lightbox-btn close"
            onClick={() => setLightboxIndex(null)}
            aria-label="Закрыть"
          >
            <X size={24} />
          </button>

          {filtered.length > 1 && (
            <>
              <button
                className="lightbox-btn prev"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImg();
                }}
                aria-label="Предыдущее фото"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                className="lightbox-btn next"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImg();
                }}
                aria-label="Следующее фото"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          <div onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <img
              src={filtered[lightboxIndex].src}
              alt={filtered[lightboxIndex].title}
              className="lightbox-img"
            />
            <div style={{ color: '#ffffff', marginTop: 12, fontSize: '0.95rem' }}>
              {filtered[lightboxIndex].title} ({lightboxIndex + 1} из {filtered.length})
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
