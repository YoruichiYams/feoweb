import React, { useState } from 'react';
import { X, Users, Maximize2, Bed, Check, ChevronLeft, ChevronRight, Bell, ShieldCheck } from 'lucide-react';
import { Room } from '../../types';
import { useHotel } from '../../context/HotelContext';

interface RoomModalProps {
  room: Room;
  onClose: () => void;
}

export const RoomModal: React.FC<RoomModalProps> = ({ room, onClose }) => {
  const { openBookingWithRoom } = useHotel();
  const [photoIndex, setPhotoIndex] = useState(0);

  const images = room.images && room.images.length > 0 ? room.images : ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'];

  const nextPhoto = () => setPhotoIndex((prev) => (prev + 1) % images.length);
  const prevPhoto = () => setPhotoIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-content-lg"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: 0 }}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <span style={{ fontSize: '0.8rem', color: '#5B7364', fontWeight: 700, textTransform: 'uppercase' }}>
              {room.type} • Отель «Сердце Города»
            </span>
            <h3 className="modal-title">{room.title}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>

        {/* Gallery Slider */}
        <div style={{ position: 'relative', height: '360px', backgroundColor: '#000000', overflow: 'hidden' }}>
          <img
            src={images[photoIndex]}
            alt={room.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {images.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                style={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.85)',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronLeft size={22} color="#1e293b" />
              </button>
              <button
                onClick={nextPhoto}
                style={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.85)',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronRight size={22} color="#1e293b" />
              </button>
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: '0.75rem',
                }}
              >
                {photoIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>

        {/* Content Body */}
        <div className="modal-body">
          {/* Key specs pill row */}
          <div
            style={{
              display: 'flex',
              gap: 20,
              flexWrap: 'wrap',
              paddingBottom: 20,
              borderBottom: '1px solid #e2e8f0',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', color: '#1e293b' }}>
              <Users size={18} color="#5B7364" />
              <span>До {room.capacity_adults + room.capacity_children} гостей ({room.capacity_adults} взр. + {room.capacity_children} дет.)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', color: '#1e293b' }}>
              <Maximize2 size={18} color="#5B7364" />
              <span>Площадь {room.area_sqm} м²</span>
            </div>
            {room.bed_info && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', color: '#1e293b' }}>
                <Bed size={18} color="#5B7364" />
                <span>{room.bed_info}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8 }}>Описание категории</h4>
            <p style={{ color: '#4a5568', lineHeight: 1.6 }}>{room.description}</p>
          </div>

          {/* Amenities Grid */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 12 }}>Удобства в номере</h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 10,
              }}
            >
              {room.amenities.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.875rem', color: '#334155' }}>
                  <Check size={16} color="#5B7364" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rules / Policy box */}
          <div
            style={{
              background: '#f8fafc',
              padding: 16,
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              marginBottom: 24,
              fontSize: '0.85rem',
              color: '#64748b',
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <ShieldCheck size={24} color="#5B7364" style={{ flexShrink: 0 }} />
            <div>
              <strong>Гарантия лучшей цены и бесплатная отмена:</strong> При бронировании на официальном сайте действует бесплатная отмена бронирования за 48 часов до заезда в соответствии с ПП РФ № 1853.
            </div>
          </div>

          {/* Footer bar with price and CTA */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 16,
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Стоимость проживания:</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#5B7364' }}>
                {room.price_base.toLocaleString('ru-RU')} ₽ <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 400 }}>/ ночь</span>
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg"
              onClick={() => {
                onClose();
                openBookingWithRoom(room);
              }}
            >
              <Bell size={18} />
              <span>Забронировать этот номер</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
