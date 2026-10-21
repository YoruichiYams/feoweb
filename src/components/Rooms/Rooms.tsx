import React, { useState } from 'react';
import { Users, Maximize2, Bed, ArrowRight, Info, LayoutGrid, Sliders } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { Room } from '../../types';
import { RoomModal } from './RoomModal';
import { SqueezeCarousel } from '../ui/SqueezeCarousel';
import './Rooms.css';

export const Rooms: React.FC = () => {
  const { rooms, openBookingWithRoom, modalRoom, setModalRoom, t } = useHotel();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');

  const filterCategories = [
    { key: 'all', label: t.rooms.allRooms },
    { key: 'Стандарт', label: 'Стандарты' },
    { key: 'Студия', label: 'Студии' },
    { key: 'Люкс', label: 'Люксы' },
    { key: 'Апартаменты', label: 'Апартаменты' },
  ];

  const filteredRooms = rooms.filter((r) => {
    if (selectedFilter === 'all') return true;
    return r.type.toLowerCase() === selectedFilter.toLowerCase();
  });

  return (
    <section id="rooms" className="rooms-section section-padding">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-eyebrow">{t.rooms.sectionBadge}</div>
          <h2 className="section-title">{t.rooms.title}</h2>
          <p className="section-desc">
            {t.rooms.subtitle}
          </p>
        </div>

        {/* Interactive SqueezeCarousel Showcase */}
        <SqueezeCarousel rooms={rooms} onSelectRoom={(room) => openBookingWithRoom(room)} />

        {/* View Mode & Filter Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginTop: 40, marginBottom: 24 }}>
          <div className="room-filters" style={{ margin: 0 }}>
            {filterCategories.map((cat) => (
              <button
                key={cat.key}
                className={`filter-btn ${selectedFilter === cat.key ? 'active' : ''}`}
                onClick={() => setSelectedFilter(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn btn-sm ${viewMode === 'carousel' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('carousel')}
              title="Аккордеон-галерея"
            >
              <Sliders size={15} />
              <span>Слайдер</span>
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('grid')}
              title="Сетка всех номеров"
            >
              <LayoutGrid size={15} />
              <span>Сетка</span>
            </button>
          </div>
        </div>

        {/* Room Grid (when in grid mode or for filtered listing) */}
        {viewMode === 'grid' && (
        <div className="rooms-grid">
          {filteredRooms.map((room) => {
            const coverImage =
              room.images && room.images.length > 0
                ? room.images[0]
                : 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80';

            return (
              <div key={room.id} className="room-card">
                {/* Image Cover */}
                <div className="room-image-box">
                  <img src={coverImage} alt={room.title} className="room-img" loading="lazy" />
                  <span className="room-type-badge">{room.type}</span>
                  <span className="room-area-badge">{room.area_sqm} м²</span>
                </div>

                {/* Body Content */}
                <div className="room-body">
                  <h3 className="room-title">{room.title}</h3>

                  <div className="room-capacity">
                    <div className="capacity-item" title="Вместимость">
                      <Users size={16} color="#5B7364" />
                      <span>
                        до {room.capacity_adults + room.capacity_children} гостей
                      </span>
                    </div>
                    {room.bed_info && (
                      <div className="capacity-item" title="Спальное место">
                        <Bed size={16} color="#5B7364" />
                        <span style={{ maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {room.bed_info}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Amenities Preview */}
                  <div className="room-amenities-list">
                    {room.amenities.slice(0, 3).map((item, idx) => (
                      <span key={idx} className="amenity-pill">
                        {item}
                      </span>
                    ))}
                    {room.amenities.length > 3 && (
                      <span className="amenity-pill">+{room.amenities.length - 3}</span>
                    )}
                  </div>

                  {/* Footer with Price and Action Buttons */}
                  <div className="room-footer">
                    <div className="room-price-info">
                      <span className="room-price-from">Цена от</span>
                      <div className="room-price-val">
                        {room.price_base.toLocaleString('ru-RU')} ₽
                        <span> / ночь</span>
                      </div>
                    </div>

                    <div className="room-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setModalRoom(room)}
                        title="Подробное описание"
                      >
                        <Info size={15} />
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => openBookingWithRoom(room)}
                      >
                        <span>Бронь</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Modal Detail View */}
      {modalRoom && (
        <RoomModal room={modalRoom} onClose={() => setModalRoom(null)} />
      )}
    </section>
  );
};
