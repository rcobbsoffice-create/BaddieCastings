'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './HeroSlider.module.css';

const slides = [
  {
    image: '/hero-slide-1.png',
    title: 'The Elite Casting Platform',
    subtitle: 'Where Atlanta\'s finest talent meets top brands.',
    cta: 'Apply for Access',
    link: '/apply'
  },
  {
    image: '/hero-slide-3.png',
    title: 'Atlanta\'s Premier Agency',
    subtitle: 'Elevating the culture through elite talent and high-end production.',
    cta: 'Join the Movement',
    link: '/apply'
  },
  {
    image: '/hero-slide-2.png',
    title: 'Book the Best in the Game',
    subtitle: 'Verified talent, seamless bookings, professional results.',
    cta: 'Post a Casting',
    link: '/apply'
  }
];

export default function HeroMainSlider() {
  const [current, setCurrent] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 8000); // Slower for video
    return () => clearInterval(timer);
  }, []);

  if (!mounted) return <div className={styles.slider} />;

  return (
    <div className={styles.slider}>
      {slides.map((slide, index) => {
        const isActive = index === current;
        return (
          <div
            key={index}
            className={`${styles.slide} ${isActive ? styles.active : ''}`}
          >
            {slide.youtubeId ? (
              <div className={styles.videoWrapper}>
                <iframe
                  src={`https://www.youtube.com/embed/${slide.youtubeId}?autoplay=1&mute=1&loop=1&playlist=${slide.youtubeId}&controls=0&showinfo=0&rel=0&iv_load_policy=3`}
                  frameBorder="0"
                  allow="autoplay; fullscreen"
                  className={styles.video}
                />
              </div>
            ) : slide.video ? (
              <video
                src={slide.video}
                autoPlay
                muted
                loop
                playsInline
                className={styles.video}
              />
            ) : (
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className={styles.image}
                priority={index === 0}
              />
            )}

            {slide.overlayImage && (
              <div className={styles.floatingOverlay}>
                <Image
                  src={slide.overlayImage}
                  alt="Overlay"
                  width={600}
                  height={600}
                  className={styles.floatingImg}
                />
              </div>
            )}
            
            <div className={styles.overlay}>
              <div className={`${styles.content} ${slide.videoStyle ? styles.videoContent : ''}`}>
                <h1 className={`${styles.title} ${slide.customFont ? styles.krona : ''} ${slide.videoStyle ? styles.videoTitle : ''}`}>
                  {slide.title}
                  {slide.highlight && (
                    <span className={styles.highlight}>{slide.highlight}</span>
                  )}
                </h1>
                <p className={`${styles.subtitle} ${slide.videoStyle ? styles.videoSub : ''}`}>{slide.subtitle}</p>
                <a href={slide.link} className="btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
                  {slide.cta} →
                </a>
              </div>
            </div>
          </div>
        );
      })}
      <div className={styles.dots}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
