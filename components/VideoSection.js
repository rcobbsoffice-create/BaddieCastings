'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './HeroSlider.module.css';

export default function VideoSection() {
  const [videoSlides, setVideoSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVideos() {
      const { data } = await supabase
        .from('featured_videos')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (data && data.length > 0) {
        setVideoSlides(data);
      }
      setLoading(false);
    }
    fetchVideos();
  }, []);

  useEffect(() => {
    if (videoSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % videoSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [videoSlides]);

  if (loading || videoSlides.length === 0) return null;

  return (
    <div className={styles.videoSectionWrapper}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Featured Videos</h2>
        <p className={styles.sectionSub}>
          Baddie Castings is the premier provider for lead and background talent across these major productions.
        </p>
      </div>

      <div className={styles.miniSlider}>
        {videoSlides.map((slide) => {
          if (!slide) return null;
          const isActive = videoSlides[current]?.id === slide.id;
          return (
            <div
              key={slide.id}
              className={`${styles.slide} ${isActive ? styles.active : ''}`}
              style={{ borderRadius: '24px', overflow: 'hidden' }}
            >
              <div className={styles.videoWrapper}>
                <iframe
                  src={`https://www.youtube.com/embed/${slide.youtube_id}?autoplay=1&mute=1&loop=1&playlist=${slide.youtube_id}&controls=0&showinfo=0&rel=0&iv_load_policy=3`}
                  frameBorder="0"
                  allow="autoplay; fullscreen"
                  className={styles.video}
                />
              </div>
              
              <div className={`${styles.overlay} ${styles.videoOverlay}`}>
                <div className={styles.videoContent}>
                  <h1 className={styles.videoTitle} style={{ fontSize: '1.2rem' }}>
                    {slide.title}
                  </h1>
                  <p className={styles.videoSub}>{slide.subtitle}</p>
                  <a href={slide.link || '/apply'} className="btn-primary" style={{ padding: '12px 24px', fontSize: '0.9rem' }}>
                    {slide.cta_text || 'Watch Project'}
                  </a>
                </div>
              </div>
            </div>
          );
        })}
        
        <div className={styles.dots} style={{ bottom: '20px' }}>
          {videoSlides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => setCurrent(i)}
              className={`${styles.dot} ${videoSlides[current]?.id === slide.id ? styles.dotActive : ''}`}
            />
          ))}
        </div>
      </div>

      <div className={styles.partnersRow}>
        <div className={styles.partnerLogo}><img src="/mtv_white.png" alt="MTV" /></div>
        <div className={styles.partnerLogo}><img src="/tvone_white.png" alt="TV One" /></div>
        <div className={styles.partnerLogo}><img src="/bet_white.png" alt="BET" /></div>
      </div>
    </div>
  );
}
