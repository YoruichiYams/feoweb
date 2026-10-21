import React, { useState, useEffect } from 'react';
import { Cookie, X, Check, SlidersHorizontal } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { CookiePreferences } from '../../types';
import './CookieBanner.css';

const COOKIE_STORAGE_KEY = 'hotel_cookie_consent_v1';

const defaultPrefs: CookiePreferences = {
  essential: true, // Always locked ON
  analytics: true,
  functional: true,
  marketing: false,
};

export const CookieBanner: React.FC = () => {
  const { setCurrentPage, activeModal, setActiveModal } = useHotel();
  const [showBanner, setShowBanner] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>(defaultPrefs);

  useEffect(() => {
    const saved = localStorage.getItem(COOKIE_STORAGE_KEY);
    if (!saved) {
      setShowBanner(true);
    } else {
      try {
        setPrefs(JSON.parse(saved));
      } catch {
        setShowBanner(true);
      }
    }
  }, []);

  const savePreferences = (preferences: CookiePreferences) => {
    const data = { ...preferences, essential: true, acceptedAt: new Date().toISOString() };
    localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(data));
    setPrefs(data);
    setShowBanner(false);
    setActiveModal(null);
  };

  const handleAcceptAll = () => {
    savePreferences({
      essential: true,
      analytics: true,
      functional: true,
      marketing: true,
    });
  };

  const isModalOpen = activeModal === 'cookie-settings';

  return (
    <>
      {/* Fixed bottom consent banner */}
      {showBanner && !isModalOpen && (
        <aside className="cookie-banner-fixed" aria-label="Согласие на использование файлов cookie">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Cookie size={28} color="#D97706" style={{ flexShrink: 0 }} />
            <div className="cookie-text-box">
              Мы используем файлы cookie для корректной работы онлайн-бронирования, аналитики и персонализации предложений отеля. Нажимая «Принять все», вы соглашаетесь с условиями нашей{' '}
              <button
                type="button"
                onClick={() => setCurrentPage('cookie-policy')}
                style={{ color: '#ffffff', textDecoration: 'underline' }}
              >
                Политики файлов Cookie
              </button>
              .
            </div>
          </div>

          <div className="cookie-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveModal('cookie-settings')}
              style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <SlidersHorizontal size={14} />
              <span>Настроить</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleAcceptAll}
            >
              <span>Принять все</span>
            </button>
          </div>
        </aside>
      )}

      {/* Category Settings Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Cookie size={22} color="#D97706" />
                <h3 className="modal-title">Настройки файлов Cookie</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 20 }}>
                Вы можете выбрать, какие типы файлов cookie разрешить для использования. Обязательные cookie необходимы для функционирования процесса бронирования.
              </p>

              {/* 1. Essential */}
              <div className="cookie-category-item">
                <div className="cookie-category-info">
                  <h4>Строго необходимые (Технические)</h4>
                  <p>Обеспечивают базовые функции сайта: безопасность, авторизацию и сохранение параметров бронирования. Не могут быть отключены.</p>
                </div>
                <label className="switch-label">
                  <input type="checkbox" checked disabled />
                  <span className="switch-slider" />
                </label>
              </div>

              {/* 2. Analytics */}
              <div className="cookie-category-item">
                <div className="cookie-category-info">
                  <h4>Производительность и аналитика</h4>
                  <p>Позволяют анализировать посещаемость и удобство страниц отеля для непрерывного улучшения сервиса.</p>
                </div>
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={prefs.analytics}
                    onChange={(e) => setPrefs({ ...prefs, analytics: e.target.checked })}
                  />
                  <span className="switch-slider" />
                </label>
              </div>

              {/* 3. Functional */}
              <div className="cookie-category-item">
                <div className="cookie-category-info">
                  <h4>Функциональные</h4>
                  <p>Запоминают ваши предпочтения (язык, валюту, даты поездки) для быстрого заполнения форм.</p>
                </div>
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={prefs.functional}
                    onChange={(e) => setPrefs({ ...prefs, functional: e.target.checked })}
                  />
                  <span className="switch-slider" />
                </label>
              </div>

              {/* 4. Marketing */}
              <div className="cookie-category-item">
                <div className="cookie-category-info">
                  <h4>Маркетинговые и рекламные</h4>
                  <p>Используются для отображения специальных предложений и сезонных скидок отеля в Феодосии.</p>
                </div>
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={prefs.marketing}
                    onChange={(e) => setPrefs({ ...prefs, marketing: e.target.checked })}
                  />
                  <span className="switch-slider" />
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAcceptAll}
                >
                  Принять все
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => savePreferences(prefs)}
                >
                  Сохранить настройки
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
