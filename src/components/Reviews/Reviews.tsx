import React, { useState } from 'react';
import { Star, MessageSquare, Plus, CheckCircle, X } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { apiService } from '../../services/api';
import './Reviews.css';

export const Reviews: React.FC = () => {
  const { reviews, refreshData } = useHotel();
  const [modalOpen, setModalOpen] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [source, setSource] = useState<'Яндекс Карты' | '2ГИС' | '101Hotels' | 'Сайт отеля'>('Сайт отеля');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !text.trim()) return;

    setIsSubmitting(true);
    await apiService.addReview({
      author_name: authorName,
      rating,
      text,
      source,
    });
    await refreshData();
    setIsSubmitting(false);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setModalOpen(false);
      setAuthorName('');
      setText('');
    }, 1500);
  };

  const getSourceClass = (src: string) => {
    if (src.includes('Яндекс')) return 'yandex';
    if (src.includes('2ГИС')) return 'twogis';
    if (src.includes('101Hotels')) return 'hotels';
    return '';
  };

  return (
    <section id="reviews" className="reviews-section section-padding">
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow">ОТЗЫВЫ ГОСТЕЙ • ФЕОДОСИЯ</div>
          <h2 className="section-title">Отзывы наших гостей</h2>
          <p className="section-desc">
            Реальные оценки путешественников на независимых геосервисах после проживания в гостинице «Победа».
          </p>
        </div>

        {/* Aggregated ratings bar */}
        <div className="reviews-summary-bar">
          <div className="rating-source-card">
            <div className="rating-source-val">5.0</div>
            <div className="rating-source-info">
              <span className="rating-source-name">Яндекс Карты</span>
              <div className="rating-source-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="#D97706" color="#D97706" />
                ))}
              </div>
            </div>
          </div>

          <div className="rating-source-card">
            <div className="rating-source-val">4.9</div>
            <div className="rating-source-info">
              <span className="rating-source-name">2ГИС</span>
              <div className="rating-source-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="#D97706" color="#D97706" />
                ))}
              </div>
            </div>
          </div>

          <div className="rating-source-card">
            <div className="rating-source-val">5.0</div>
            <div className="rating-source-info">
              <span className="rating-source-name">101Hotels</span>
              <div className="rating-source-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="#D97706" color="#D97706" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Cards */}
        <div className="reviews-grid">
          {reviews.slice(0, 3).map((rev) => (
            <div key={rev.id} className="review-card">
              <div className="review-header">
                <div className="review-stars">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} size={16} fill="#D97706" color="#D97706" />
                  ))}
                </div>
                <span className={`review-source-badge ${getSourceClass(rev.source)}`}>
                  {rev.source}
                </span>
              </div>
              <p className="review-quote">«{rev.text}»</p>
              <div>
                <div className="review-author">{rev.author_name}</div>
                <div className="review-date">{rev.date}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Review Button */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button className="btn btn-secondary" onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            <span>Оставить свой отзыв об отеле</span>
          </button>
        </div>
      </div>

      {/* Review Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Оставить отзыв</h3>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {successMsg ? (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <CheckCircle size={56} color="#15803D" style={{ margin: '0 auto 16px' }} />
                  <h4 style={{ fontSize: '1.25rem', marginBottom: 8 }}>Спасибо за ваш отзыв!</h4>
                  <p style={{ color: '#64748b' }}>Ваш отзыв успешно опубликован на сайте.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                      Ваше имя
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Иван Петров"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                      Оценка
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          style={{
                            background: 'none',
                            cursor: 'pointer',
                            padding: 4,
                          }}
                        >
                          <Star
                            size={28}
                            fill={star <= rating ? '#D97706' : 'none'}
                            color="#D97706"
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                      Ваш отзыв
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Поделитесь вашими впечатлениями об отдыхе, номере и обслуживании..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                    style={{ width: '100%' }}
                  >
                    {isSubmitting ? 'Отправка...' : 'Опубликовать отзыв'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
