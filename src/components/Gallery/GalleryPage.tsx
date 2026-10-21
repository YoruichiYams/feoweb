import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ChevronRight, Camera, Maximize2, X, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import './GalleryPage.css';

interface GalleryPhoto {
  src: string;
  category: 'rooms' | 'territory' | 'sea';
  title: string;
  desc?: string;
}

const GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    src: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1400&q=85',
    category: 'rooms',
    title: 'Витражная студия с панорамными окнами',
    desc: 'Дизайнерская спальная зона и максимальное количество естественного света',
  },
  {
    src: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1400&q=85',
    category: 'rooms',
    title: 'Двухместный номер категории Стандарт',
    desc: 'Комфортабельная двуспальная кровать Queen-size и рабочий стол',
  },
  {
    src: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1400&q=85',
    category: 'rooms',
    title: 'Люкс 2-х комнатный с гостиной',
    desc: 'Просторные апартаменты для семьи с отдельной спальней',
  },
  {
    src: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=85',
    category: 'rooms',
    title: 'Делюкс с балконом на улицу Победы',
    desc: 'Французский балкон и элегантный текстиль приглушенных тонов',
  },
  {
    src: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=85',
    category: 'rooms',
    title: 'Апартаменты с оборудованной мини-кухней',
    desc: 'Индукционная плита, холодильник, посуда и обеденная зона',
  },
  {
    src: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1400&q=85',
    category: 'territory',
    title: 'Лобби отеля и зона регистрации',
    desc: 'Круглосуточный ресепшн, мягкие кресла и библиотека об истории Феодосии',
  },
  {
    src: 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&w=1400&q=85',
    category: 'territory',
    title: 'Закрытый внутренний двор и парковка',
    desc: 'Охраняемая территория, видеонаблюдение и персональные парковочные места',
  },
  {
    src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=85',
    category: 'territory',
    title: 'Фасад гостиницы «Победа»',
    desc: 'Исторический центр Феодосии, тихая тенистая улица Победы',
  },
  {
    src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85',
    category: 'sea',
    title: 'Морское побережье и набережная Феодосии',
    desc: 'Всего 5–10 минут неспешной прогулки от отеля до набережной Айвазовского',
  },
  {
    src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=85',
    category: 'sea',
    title: 'Закат над Феодосийским заливом',
    desc: 'Теплые южные вечера и морской бриз Черного моря',
  },
  {
    src: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1400&q=85',
    category: 'sea',
    title: 'Золотой пляж Феодосии',
    desc: 'Знаменитый песчаный берег с чистейшей прозрачной водой',
  },
  {
    src: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1400&q=85',
    category: 'territory',
    title: 'Уютная зона отдыха на свежем воздухе',
    desc: 'Вечерний чай и шелест южных платанов во дворе отеля',
  },
];

type TabCategory = 'all' | 'rooms' | 'territory' | 'sea';

export const GalleryPage: React.FC = () => {
  const { setCurrentPage, t } = useHotel();
  const [activeTab, setActiveTab] = useState<TabCategory>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredPhotos = GALLERY_PHOTOS.filter((p) => {
    if (activeTab === 'all') return true;
    return p.category === activeTab;
  });

  const nextImg = useCallback(() => {
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) => (prev !== null ? (prev + 1) % filteredPhotos.length : 0));
    }
  }, [lightboxIndex, filteredPhotos.length]);

  const prevImg = useCallback(() => {
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) => (prev !== null ? (prev - 1 + filteredPhotos.length) % filteredPhotos.length : 0));
    }
  }, [lightboxIndex, filteredPhotos.length]);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImg();
      if (e.key === 'ArrowLeft') prevImg();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, nextImg, prevImg, closeLightbox]);

  return (
    <div className="gallery-page-wrapper">
      {/* Breadcrumbs Banner */}
      <div className="gallery-page-banner">
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
            <span className="breadcrumb-current">{t.nav.gallery}</span>
          </nav>

          <div className="gallery-page-header">
            <div className="section-eyebrow">ФОТОГАЛЕРЕЯ • ИНТЕРЬЕРЫ</div>
            <h1 className="gallery-page-title">Фотогалерея гостиницы «Победа»</h1>
            <p className="gallery-page-subtitle">
              Познакомьтесь с реальными интерьерами наших дизайнерских номеров, тихим закрытым внутренним двором и великолепными морскими пейзажами Феодосии.
            </p>
          </div>
        </div>
      </div>

      {/* Main Gallery Area */}
      <div className="container gallery-page-content">
        {/* Category Filter Tabs */}
        <div className="gallery-filter-bar">
          <button
            type="button"
            className={`gallery-filter-pill ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Все ({GALLERY_PHOTOS.length})
          </button>
          <button
            type="button"
            className={`gallery-filter-pill ${activeTab === 'rooms' ? 'active' : ''}`}
            onClick={() => setActiveTab('rooms')}
          >
            Номера
          </button>
          <button
            type="button"
            className={`gallery-filter-pill ${activeTab === 'territory' ? 'active' : ''}`}
            onClick={() => setActiveTab('territory')}
          >
            Территория
          </button>
          <button
            type="button"
            className={`gallery-filter-pill ${activeTab === 'sea' ? 'active' : ''}`}
            onClick={() => setActiveTab('sea')}
          >
            Море и набережная
          </button>
        </div>

        {/* Responsive Photo Grid */}
        <div className="gallery-photo-grid">
          {filteredPhotos.map((photo, idx) => (
            <div
              key={idx}
              className="gallery-card"
              onClick={() => setLightboxIndex(idx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setLightboxIndex(idx);
              }}
            >
              <div className="gallery-card-img-wrap">
                <img
                  src={photo.src}
                  alt={photo.title}
                  className="gallery-card-img"
                  loading="lazy"
                />
                <div className="gallery-card-overlay">
                  <div className="gallery-expand-icon">
                    <Maximize2 size={22} />
                  </div>
                  <div className="gallery-card-text">
                    <div className="gallery-card-title">{photo.title}</div>
                    {photo.desc && <div className="gallery-card-desc">{photo.desc}</div>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxIndex !== null && (
        <div className="gallery-lightbox-overlay" onClick={closeLightbox}>
          <button
            type="button"
            className="gallery-lightbox-close"
            onClick={closeLightbox}
            aria-label="Закрыть полноэкранный просмотр"
          >
            <X size={26} />
          </button>

          {filteredPhotos.length > 1 && (
            <>
              <button
                type="button"
                className="gallery-lightbox-arrow prev"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImg();
                }}
                aria-label="Предыдущее фото"
              >
                <ChevronLeftIcon size={32} />
              </button>
              <button
                type="button"
                className="gallery-lightbox-arrow next"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImg();
                }}
                aria-label="Следующее фото"
              >
                <ChevronRightIcon size={32} />
              </button>
            </>
          )}

          <div
            className="gallery-lightbox-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gallery-lightbox-image-wrap">
              <img
                src={filteredPhotos[lightboxIndex].src}
                alt={filteredPhotos[lightboxIndex].title}
                className="gallery-lightbox-image"
              />
            </div>
            <div className="gallery-lightbox-caption">
              <div className="gallery-caption-title">
                {filteredPhotos[lightboxIndex].title}
              </div>
              {filteredPhotos[lightboxIndex].desc && (
                <div className="gallery-caption-sub">
                  {filteredPhotos[lightboxIndex].desc}
                </div>
              )}
              <div className="gallery-caption-counter">
                {lightboxIndex + 1} из {filteredPhotos.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
