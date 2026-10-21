import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import './CalendarPopover.css';

interface CalendarPopoverProps {
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  onChange: (checkIn: string, checkOut: string) => void;
  isOpen: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
  style?: React.CSSProperties;
  className?: string;
}

export const CalendarPopover: React.FC<CalendarPopoverProps> = ({
  checkIn,
  checkOut,
  onChange,
  isOpen,
  onClose,
  anchorEl,
  style,
  className = '',
}) => {
  const { t } = useHotel();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  // Parse initial month to display
  const initialDate = checkIn ? new Date(checkIn) : new Date();
  const [viewDate, setViewDate] = useState<Date>(
    isNaN(initialDate.getTime()) ? new Date() : new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );

  // Selection state
  const [selectingStep, setSelectingStep] = useState<'checkIn' | 'checkOut'>('checkIn');
  const [tempCheckIn, setTempCheckIn] = useState<string>(checkIn);
  const [tempCheckOut, setTempCheckOut] = useState<string>(checkOut);

  // Sync with props when opened
  useEffect(() => {
    if (isOpen) {
      setTempCheckIn(checkIn);
      setTempCheckOut(checkOut);
      setSelectingStep('checkIn');
      if (checkIn) {
        const d = new Date(checkIn);
        if (!isNaN(d.getTime())) {
          setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
        }
      }
    }
  }, [isOpen, checkIn, checkOut]);

  // Compute fixed position via getBoundingClientRect
  const updatePosition = () => {
    if (!anchorEl) {
      // Default to center if no anchor provided
      setCoords({
        top: Math.max(20, window.innerHeight / 2 - 200),
        left: Math.max(16, window.innerWidth / 2 - 162),
      });
      return;
    }

    const rect = anchorEl.getBoundingClientRect();
    const popoverWidth = 324;
    const popoverHeight = 390;

    let top = rect.bottom + 8;
    let left = rect.left;

    // Check right edge
    if (left + popoverWidth > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - popoverWidth - 16);
    }
    if (left < 16) left = 16;

    // Check bottom edge
    if (top + popoverHeight > window.innerHeight - 16 && rect.top > popoverHeight + 16) {
      top = rect.top - popoverHeight - 8;
    }
    if (top < 16) top = 16;

    setCoords({ top, left });
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen, anchorEl]);

  // Handle outside click & Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        (!anchorEl || !anchorEl.contains(target))
      ) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorEl]);

  if (!isOpen) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthName = t.calendar.months[month];
  const weekdays = t.calendar.daysShort;

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const isPrevDisabled =
    viewDate.getFullYear() < today.getFullYear() ||
    (viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() <= today.getMonth());

  // Generate grid cells (Monday-based)
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startOffset = (firstDayOfMonth + 6) % 7;

  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const formatDateStr = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  interface CalendarDay {
    dayNum: number;
    dateStr: string;
    isCurrentMonth: boolean;
    isPast: boolean;
    isToday: boolean;
  }

  const days: CalendarDay[] = [];

  // Previous month padding
  for (let i = startOffset - 1; i >= 0; i--) {
    const dNum = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, dNum);
    prevDate.setHours(0, 0, 0, 0);
    days.push({
      dayNum: dNum,
      dateStr: formatDateStr(prevDate.getFullYear(), prevDate.getMonth(), dNum),
      isCurrentMonth: false,
      isPast: prevDate < today,
      isToday: prevDate.getTime() === today.getTime(),
    });
  }

  // Current month days
  for (let i = 1; i <= daysInCurrentMonth; i++) {
    const curDate = new Date(year, month, i);
    curDate.setHours(0, 0, 0, 0);
    days.push({
      dayNum: i,
      dateStr: formatDateStr(year, month, i),
      isCurrentMonth: true,
      isPast: curDate < today,
      isToday: curDate.getTime() === today.getTime(),
    });
  }

  // Next month padding to complete 35 or 42 cells
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const nextDate = new Date(year, month + 1, i);
    nextDate.setHours(0, 0, 0, 0);
    days.push({
      dayNum: i,
      dateStr: formatDateStr(nextDate.getFullYear(), nextDate.getMonth(), i),
      isCurrentMonth: false,
      isPast: nextDate < today,
      isToday: nextDate.getTime() === today.getTime(),
    });
  }

  const handleDayClick = (dateStr: string, isPast: boolean) => {
    if (isPast) return;

    if (selectingStep === 'checkIn') {
      setTempCheckIn(dateStr);
      setTempCheckOut('');
      setSelectingStep('checkOut');
    } else {
      if (dateStr <= tempCheckIn) {
        setTempCheckIn(dateStr);
        setTempCheckOut('');
        setSelectingStep('checkOut');
      } else {
        setTempCheckOut(dateStr);
        setSelectingStep('checkIn');
        onChange(tempCheckIn, dateStr);
        setTimeout(() => {
          onClose();
        }, 220);
      }
    }
  };

  const calculateNights = (inDate: string, outDate: string) => {
    if (!inDate || !outDate) return 0;
    const diff = new Date(outDate).getTime() - new Date(inDate).getTime();
    return Math.max(0, Math.round(diff / 86400000));
  };

  const nightsCount = calculateNights(tempCheckIn, tempCheckOut);

  const popoverContent = (
    <>
      <div className="calendar-portal-backdrop" onClick={onClose} />
      <div
        className={`calendar-popover-portal ${className}`}
        ref={popoverRef}
        style={{
          top: coords ? coords.top : 100,
          left: coords ? coords.left : 100,
          ...style,
        }}
      >
        {/* Mobile Sheet Handle */}
        <div className="calendar-sheet-handle" />

        {/* Header */}
        <div className="calendar-header">
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={handlePrevMonth}
            disabled={isPrevDisabled}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="calendar-title">
            <span>{monthName}</span>
            <span className="calendar-title-sep">|</span>
            <span>{year}</span>
          </div>

          <button
            type="button"
            className="calendar-nav-btn"
            onClick={handleNextMonth}
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Weekdays */}
        <div className="calendar-weekdays-grid">
          {weekdays.map((wd, i) => (
            <div key={i} className="calendar-weekday-cell">
              {wd}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="calendar-days-grid">
          {days.map((d, idx) => {
            const isCheckIn = d.dateStr === tempCheckIn;
            const isCheckOut = d.dateStr === tempCheckOut;
            const isInRange =
              tempCheckIn &&
              tempCheckOut &&
              d.dateStr > tempCheckIn &&
              d.dateStr < tempCheckOut;

            let wrapperClass = 'calendar-day-wrapper';
            if (isInRange) wrapperClass += ' in-range';
            if (isCheckIn && tempCheckOut) wrapperClass += ' range-start';
            if (isCheckOut && tempCheckIn) wrapperClass += ' range-end';

            let btnClass = 'calendar-day-btn';
            if (!d.isCurrentMonth) btnClass += ' other-month';
            if (d.isToday) btnClass += ' is-today';
            if (isCheckIn || isCheckOut) btnClass += ' selected-endpoint';

            return (
              <div key={idx} className={wrapperClass}>
                <button
                  type="button"
                  className={btnClass}
                  disabled={d.isPast}
                  onClick={() => handleDayClick(d.dateStr, d.isPast)}
                  title={d.dateStr}
                >
                  {d.dayNum}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer info & Done */}
        <div className="calendar-footer">
          <div className="calendar-summary-text">
            {tempCheckIn && tempCheckOut ? (
              <span>
                <strong>{tempCheckIn}</strong> → <strong>{tempCheckOut}</strong> ({nightsCount}{' '}
                {t.calendar.nights})
              </span>
            ) : tempCheckIn ? (
              <span>{t.calendar.selectCheckOut}</span>
            ) : (
              <span>{t.calendar.selectDates}</span>
            )}
          </div>

          <button
            type="button"
            className="calendar-done-btn"
            onClick={() => {
              if (tempCheckIn && tempCheckOut) {
                onChange(tempCheckIn, tempCheckOut);
              }
              onClose();
            }}
          >
            {t.calendar.apply}
          </button>
        </div>
      </div>
    </>
  );

  return ReactDOM.createPortal(popoverContent, document.body);
};
