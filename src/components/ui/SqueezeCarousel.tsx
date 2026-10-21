import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  Maximize2,
  BedDouble,
  ArrowRight,
} from 'lucide-react';
import { Room } from '../../types';
import { useHotel } from '../../context/HotelContext';
import './SqueezeCarousel.css';

interface SqueezeCarouselProps {
  rooms: Room[];
  onSelectRoom?: (room: Room) => void;
}

export const SqueezeCarousel: React.FC<SqueezeCarouselProps> = ({ rooms, onSelectRoom }) => {
  const { openBookingWithRoom, t } = useHotel();
  const [activeIndex, setActiveIndex] = useState(0);

  if (!rooms || rooms.length === 0) return null;

  const total = rooms.length;
  const activeRoom = rooms[activeIndex] || rooms[0];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const handleBook = (e: React.MouseEvent, room: Room) => {
    e.stopPropagation();
    if (onSelectRoom) {
      onSelectRoom(room);
    } else {
      openBookingWithRoom(room);
    }
  };

  return (
    <div className="squeeze-carousel-wrapper">
      {/* Top Header Controls with Navigation Arrows */}
      <div className="squeeze-carousel-header">
        <div className="squeeze-carousel-counter">
          <span>{activeIndex + 1} / {total}</span>
        </div>

        <div className="squeeze-carousel-arrows">
          <button
            type="button"
            className="squeeze-arrow-btn"
            onClick={handlePrev}
            aria-label="Previous room"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className="squeeze-arrow-btn"
            onClick={handleNext}
            aria-label="Next room"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Accordion Gallery Track */}
      <div className="squeeze-carousel-track">
        {rooms.map((room, idx) => {
          const isActive = idx === activeIndex;
          const bgImage =
            room.images?.[0] ||
            'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80';

          return (
            <div
              key={room.id}
              className={`squeeze-card ${isActive ? 'is-active' : 'is-inactive'}`}
              onClick={() => setActiveIndex(idx)}
              role="button"
              tabIndex={0}
              aria-expanded={isActive}
              title={room.title}
            >
              {/* Image with Hardware-accelerated 750ms scale transition */}
              <img
                src={bgImage}
                alt={room.title}
                className="squeeze-card-img-bg"
                loading="lazy"
              />

              {/* Gradient Overlay */}
              <div className="squeeze-card-overlay" />

              {/* Active Badge (in-photo) */}
              {isActive && (
                <div className="squeeze-active-card-badge">
                  <Maximize2 size={13} />
                  <span>{room.area_sqm} {t.rooms.sqm}</span>
                  <span>•</span>
                  <span>{room.type}</span>
                </div>
              )}

              {/* Inactive Squeezed Strip View */}
              {!isActive && (
                <div className="squeeze-card-squeezed-content">
                  <div className="squeeze-squeezed-num">{idx + 1}</div>
                  <div className="squeeze-squeezed-title">{room.title}</div>
                  <div className="squeeze-squeezed-price">
                    {room.price_base.toLocaleString('ru-RU')} ₽
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Soft Cross-Fade Room Details Block */}
      <div className="squeeze-details-panel">
        <div key={activeRoom.id} className="squeeze-details-content">
          <div className="squeeze-details-main">
            <div className="squeeze-details-meta">
              <span className="squeeze-meta-chip">
                <Maximize2 size={13} color="#5B7364" />
                <span>{activeRoom.area_sqm} {t.rooms.sqm}</span>
              </span>
              <span className="squeeze-meta-chip">
                <Users size={13} color="#5B7364" />
                <span>
                  {activeRoom.capacity_adults} {t.rooms.adultsCount}
                  {activeRoom.capacity_children > 0 &&
                    ` + ${activeRoom.capacity_children} ${t.rooms.childrenCount}`}
                </span>
              </span>
              {activeRoom.bed_info && (
                <span className="squeeze-meta-chip">
                  <BedDouble size={13} color="#5B7364" />
                  <span>{activeRoom.bed_info}</span>
                </span>
              )}
            </div>

            <h3 className="squeeze-details-title">{activeRoom.title}</h3>

            {activeRoom.description && (
              <p className="squeeze-details-desc">{activeRoom.description}</p>
            )}

            {/* Amenities preview tags */}
            {activeRoom.amenities && activeRoom.amenities.length > 0 && (
              <div className="squeeze-details-amenities">
                {activeRoom.amenities.slice(0, 4).map((am, aIdx) => (
                  <span key={aIdx} className="squeeze-amenity-pill">
                    {am}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Price & Booking CTA */}
          <div className="squeeze-details-action">
            <div className="squeeze-price-group">
              <span className="squeeze-price-label">{t.rooms.perNight}</span>
              <div className="squeeze-price-amount">
                от <span>{activeRoom.price_base.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>

            <button
              type="button"
              className="squeeze-book-btn"
              onClick={(e) => handleBook(e, activeRoom)}
            >
              <Calendar size={18} />
              <span>{t.rooms.bookThisRoom}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Indicator Navigation Dots */}
      <div className="squeeze-dots-row">
        {rooms.map((_, dotIdx) => (
          <button
            key={dotIdx}
            type="button"
            className={`squeeze-dot-btn ${dotIdx === activeIndex ? 'active' : ''}`}
            onClick={() => setActiveIndex(dotIdx)}
            aria-label={`Select room ${dotIdx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
