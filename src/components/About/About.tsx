import React from 'react';
import { Waves, Car, Wifi, Wind, ShieldCheck, Clock } from 'lucide-react';
import './About.css';

export const About: React.FC = () => {
  return (
    <section id="about" className="about-section section-padding">
      <div className="container">
        <div className="about-grid">
          {/* Images with clean factoid tag */}
          <div className="about-images-wrapper">
            <img
              src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80"
              alt="Отель Сердце Города в Феодосии"
              className="about-img-main"
            />
            <img
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"
              alt="Черноморское побережье Феодосии"
              className="about-img-sub"
            />
            <div className="about-factoid-tag">
              <span>17 номеров категории 4★</span>
            </div>
          </div>

          {/* Presentation Content */}
          <div className="about-content">
            <div className="section-eyebrow">ФЕОДОСИЯ • КРЫМ</div>
            <h2 className="section-title">
              Отель «Сердце Города»
            </h2>
            <p className="about-lead">
              Отель расположен в тихом зеленом секторе исторической Феодосии на ул. Победы, 36/1.
            </p>
            
            <div className="about-facts-list">
              <div className="about-fact-item">
                <span className="fact-bullet" />
                <p>850 метров до песчано-галечного пляжа «Камешки» и центральной набережной (10 минут пешком по платановой аллее).</p>
              </div>
              <div className="about-fact-item">
                <span className="fact-bullet" />
                <p>Закрытый внутренний двор с бесплатной охраняемой парковкой под видеонаблюдением 24/7.</p>
              </div>
              <div className="about-fact-item">
                <span className="fact-bullet" />
                <p>Шумоизолированные монолитные стены — тишина для сна без шума курортных дискотек.</p>
              </div>
              <div className="about-fact-item">
                <span className="fact-bullet" />
                <p>Расчетные часы: заселение с 14:00, выезд до 12:00. Круглосуточная стойка регистрации.</p>
              </div>
            </div>

            {/* Key Advantages Grid */}
            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-icon-box">
                  <Waves size={20} />
                </div>
                <div>
                  <h4 className="feature-title">850 м до моря</h4>
                  <p className="feature-desc">10 минут пешком до пляжа «Камешки» и набережной</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-box">
                  <Car size={20} />
                </div>
                <div>
                  <h4 className="feature-title">Охраняемая парковка</h4>
                  <p className="feature-desc">Бесплатный закрытый двор под видеонаблюдением 24/7</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-box">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="feature-title">Монолитные стены</h4>
                  <p className="feature-desc">Качественная шумоизоляция для спокойного сна</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-box">
                  <Wind size={20} />
                </div>
                <div>
                  <h4 className="feature-title">Инверторный климат</h4>
                  <p className="feature-desc">Бесшумные сплит-системы в каждом номере</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-box">
                  <Wifi size={20} />
                </div>
                <div>
                  <h4 className="feature-title">Wi-Fi 100 Мбит/с</h4>
                  <p className="feature-desc">Стабильное оптоволоконное соединение на всей территории</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-box">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="feature-title">Стойка 24/7</h4>
                  <p className="feature-desc">Заселение с 14:00, выезд до 12:00, помощь гостям</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
