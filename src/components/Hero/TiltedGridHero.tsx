import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ChevronDown,
  Calendar,
  Users,
} from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { CalendarPopover } from '../ui/CalendarPopover';
import './TiltedGridHero.css';

const HERO_IMAGES: string[] = [
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=85',
];

// Tripled buffer ensures seamless infinite loop across all screen resolutions
const RIBBON_ITEMS: string[] = [
  ...HERO_IMAGES,
  ...HERO_IMAGES,
  ...HERO_IMAGES,
];

export const TiltedGridHero: React.FC = () => {
  const { searchParams, setSearchParams, setCurrentPage, settings, t } = useHotel();

  // Calendar and Anchor state
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarAnchor, setCalendarAnchor] = useState<HTMLElement | null>(null);
  const checkInTileRef = useRef<HTMLDivElement>(null);
  const checkOutTileRef = useRef<HTMLDivElement>(null);

  // Guest popover state
  const [guestPopoverOpen, setGuestPopoverOpen] = useState(false);
  const guestPopoverRef = useRef<HTMLDivElement>(null);

  // 3D Continuous Infinite Ribbon state
  const viewportRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const scrollPosRef = useRef<number>(0);
  const speedRef = useRef<number>(1.25); // Smooth 30-35s cycle drift
  const isHoveredRef = useRef<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartScrollRef = useRef<number>(0);

  // Continuous animation loop along 3D cylindrical arc
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const viewport = viewportRef.current;
      if (viewport) {
        const vw = viewport.clientWidth;
        const isMobile = window.innerWidth < 768;
        const cardWidth = isMobile ? Math.min(440, Math.round(window.innerWidth * 0.85)) : 440;
        const gap = isMobile ? 16 : 24;
        const stride = cardWidth + gap;
        const cycleWidth = HERO_IMAGES.length * stride;

        if (!isDraggingRef.current) {
          // Soft deceleration on hover, normal speed otherwise
          const targetSpeed = isHoveredRef.current ? 0.3 : 1.35;
          speedRef.current += (targetSpeed - speedRef.current) * 0.08;
          scrollPosRef.current += speedRef.current * (dt / 0.0166);
        }

        // Seamless wrap around single cycle
        if (scrollPosRef.current >= cycleWidth) {
          scrollPosRef.current -= cycleWidth;
        } else if (scrollPosRef.current < 0) {
          scrollPosRef.current += cycleWidth;
        }

        const centerScreenX = vw / 2;

        // Position and bend each card into the cylindrical 3D arc
        for (let i = 0; i < RIBBON_ITEMS.length; i++) {
          const card = cardsRef.current[i];
          if (!card) continue;

          // Compute horizontal position
          const cardX = i * stride - scrollPosRef.current;
          const cardCenterX = cardX + cardWidth / 2;
          const distFromCenter = cardCenterX - centerScreenX;
          const norm = Math.max(-1.8, Math.min(1.8, distFromCenter / (vw * 0.44)));

          // Cylindrical Arc Transformation:
          // Center (norm = 0): flat, scale 1, rotateY 0, translateZ 0
          // Left (norm < 0): turns inward to the right (rotateY > 0), curves back (translateZ < 0)
          // Right (norm > 0): turns inward to the left (rotateY < 0), curves back (translateZ < 0)
          const rotateY = -norm * 18;
          const translateZ = -Math.pow(Math.abs(norm), 1.25) * 44;
          const scale = Math.max(0.72, 1 - Math.abs(norm) * 0.035);

          card.style.transform = `translate3d(${cardX}px, 0, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;
          card.style.width = `${cardWidth}px`;
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Pointer drag interactions
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartScrollRef.current = scrollPosRef.current;
    if (viewportRef.current) {
      viewportRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const delta = e.clientX - dragStartXRef.current;
    scrollPosRef.current = dragStartScrollRef.current - delta;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    if (viewportRef.current) {
      try {
        viewportRef.current.releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    }
  };

  // Close guest popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (guestPopoverRef.current && !guestPopoverRef.current.contains(e.target as Node)) {
        setGuestPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'Выберите дату';
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y}`;
  };

  const calculateNights = () => {
    if (!searchParams.checkIn || !searchParams.checkOut) return 1;
    const diff = new Date(searchParams.checkOut).getTime() - new Date(searchParams.checkIn).getTime();
    const nights = Math.round(diff / 86400000);
    return nights > 0 ? nights : 1;
  };

  const openCalendarFor = (type: 'in' | 'out') => {
    setGuestPopoverOpen(false);
    if (type === 'in') {
      setCalendarAnchor(checkInTileRef.current);
    } else {
      setCalendarAnchor(checkOutTileRef.current);
    }
    setCalendarOpen(true);
  };

  const handleCalendarChange = (inDate: string, outDate: string) => {
    setSearchParams((prev) => ({
      ...prev,
      checkIn: inDate,
      checkOut: outDate,
    }));
  };

  const updateAdults = (delta: number) => {
    setSearchParams((prev) => ({
      ...prev,
      adults: Math.max(1, Math.min(6, prev.adults + delta)),
    }));
  };

  const updateChildren = (delta: number) => {
    setSearchParams((prev) => ({
      ...prev,
      children: Math.max(0, Math.min(4, prev.children + delta)),
    }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCalendarOpen(false);
    setGuestPopoverOpen(false);
    setCurrentPage('booking');
  };

  const nights = calculateNights();

  return (
    <section className="tilted-hero-section">
      {/* 1. TOP HEADER (Exact match to heroref.png) */}
      <div className="hero-header-wrap">
        <h1 className="hero-main-title">
          {settings.hotel_name || 'Отель «Сердце Города»'} <br />
          <span>г. Феодосия</span>
        </h1>
      </div>

      {/* 2. CONTINUOUS 3D RIBBON OF CLEAN PHOTOS (Exact match to heroref.png) */}
      <div
        className="hero-ribbon-viewport"
        ref={viewportRef}
        onMouseEnter={() => {
          isHoveredRef.current = true;
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false;
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="hero-ribbon-track">
          {RIBBON_ITEMS.map((imageSrc, idx) => (
            <div
              key={idx}
              ref={(el) => {
                cardsRef.current[idx] = el;
              }}
              className="tilted-card"
            >
              <img
                src={imageSrc}
                alt={`Интерьер ${settings.hotel_name || 'отеля «Сердце Города»'} ${idx + 1}`}
                className="tilted-card-img"
                loading="eager"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. SUBTEXT UNDER THE RIBBON */}
      <p className="hero-subtext">
        Тихий отдых в историческом центре в 10 минутах от моря
      </p>

      {/* 4. PINNED BOTTOM BOOKING SEARCH DOCK */}
      <div className="tilted-search-dock">
        <form onSubmit={handleSearchSubmit} className="tilted-search-form">
          {/* Check-In Tile */}
          <div
            className={`tilted-search-tile ${calendarOpen && calendarAnchor === checkInTileRef.current ? 'active' : ''}`}
            ref={checkInTileRef}
            onClick={() => openCalendarFor('in')}
            role="button"
            tabIndex={0}
          >
            <span className="tilted-tile-label">
              <Calendar size={13} color="#C5A880" />
              <span>{t.hero.checkIn}</span>
            </span>
            <div className="tilted-tile-value">
              <span>{formatDateDisplay(searchParams.checkIn)}</span>
            </div>
          </div>

          {/* Check-Out Tile */}
          <div
            className={`tilted-search-tile ${calendarOpen && calendarAnchor === checkOutTileRef.current ? 'active' : ''}`}
            ref={checkOutTileRef}
            onClick={() => openCalendarFor('out')}
            role="button"
            tabIndex={0}
          >
            <span className="tilted-tile-label">
              <Calendar size={13} color="#C5A880" />
              <span>
                {t.hero.checkOut} ({nights} {t.calendar.nights})
              </span>
            </span>
            <div className="tilted-tile-value">
              <span>{formatDateDisplay(searchParams.checkOut)}</span>
            </div>
          </div>

          {/* Guests Tile */}
          <div
            className={`tilted-search-tile ${guestPopoverOpen ? 'active' : ''}`}
            ref={guestPopoverRef}
            onClick={() => {
              setCalendarOpen(false);
              setGuestPopoverOpen(!guestPopoverOpen);
            }}
            role="button"
            tabIndex={0}
          >
            <span className="tilted-tile-label">
              <Users size={13} color="#5B7364" />
              <span>{t.hero.guests}</span>
            </span>
            <div className="tilted-tile-value">
              <span>
                {searchParams.adults} {t.rooms.adultsCount}
                {searchParams.children > 0 ? `, ${searchParams.children} ${t.rooms.childrenCount}` : ''}
              </span>
              <ChevronDown size={14} color="#94a3b8" />
            </div>

            {/* Guests Counter Dropdown / Mobile Bottom Sheet */}
            {guestPopoverOpen && (
              <>
                <div
                  className="tilted-guest-backdrop"
                  onClick={(e) => {
                    e.stopPropagation();
                    setGuestPopoverOpen(false);
                  }}
                />
                <div className="tilted-guest-popover" onClick={(e) => e.stopPropagation()}>
                  <div className="tilted-sheet-handle" />
                  <div className="tilted-guest-row">
                  <div>
                    <div className="tilted-guest-title">{t.booking.adults}</div>
                    <div className="tilted-guest-sub">18+</div>
                  </div>
                  <div className="tilted-guest-controls">
                    <button
                      type="button"
                      className="tilted-counter-btn"
                      disabled={searchParams.adults <= 1}
                      onClick={() => updateAdults(-1)}
                    >
                      -
                    </button>
                    <span className="tilted-counter-num">{searchParams.adults}</span>
                    <button
                      type="button"
                      className="tilted-counter-btn"
                      disabled={searchParams.adults >= 6}
                      onClick={() => updateAdults(1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="tilted-guest-row">
                  <div>
                    <div className="tilted-guest-title">{t.booking.children}</div>
                    <div className="tilted-guest-sub">0-17</div>
                  </div>
                  <div className="tilted-guest-controls">
                    <button
                      type="button"
                      className="tilted-counter-btn"
                      disabled={searchParams.children <= 0}
                      onClick={() => updateChildren(-1)}
                    >
                      -
                    </button>
                    <span className="tilted-counter-num">{searchParams.children}</span>
                    <button
                      type="button"
                      className="tilted-counter-btn"
                      disabled={searchParams.children >= 4}
                      onClick={() => updateChildren(1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', marginTop: 12 }}
                  onClick={() => setGuestPopoverOpen(false)}
                >
                  {t.calendar.apply}
                </button>
              </div>
            </>
          )}
          </div>

          {/* Submit CTA */}
          <button type="submit" className="tilted-search-cta">
            <Search size={18} />
            <span>{t.hero.findRoom}</span>
          </button>
        </form>
      </div>

      {/* PORTAL CALENDAR POPOVER: Renders into document.body with fixed positioning */}
      <CalendarPopover
        isOpen={calendarOpen}
        anchorEl={calendarAnchor}
        checkIn={searchParams.checkIn}
        checkOut={searchParams.checkOut}
        onChange={handleCalendarChange}
        onClose={() => setCalendarOpen(false)}
      />
    </section>
  );
};
