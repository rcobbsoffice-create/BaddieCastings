'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import VideoSection from '@/components/VideoSection';
import HeroMainSlider from '@/components/HeroSlider';
import Modal from '@/components/Modal';
import BookForm from '@/components/BookForm';
import HireForm from '@/components/HireForm';
import { Star, Users, ChevronRight, Shield } from 'lucide-react';
import styles from './landing.module.css';

const roles = [
    {
        emoji: '👑',
        title: 'Talent',
        sub: 'Bottle Girls & Models',
        desc: 'Apply for casting calls, get booked for events, manage your schedule, and grow your career on your terms.',
        badge: 'Most Popular',
        badgeClass: 'badge-pink',
        cta: 'Apply as Talent',
    },
    {
        emoji: '📸',
        title: 'Creators',
        sub: 'Photographers & Videographers',
        desc: 'Build your profile, list your rates, and get booked by top talent and brands looking for your vision.',
        badge: 'Verified Only',
        badgeClass: 'badge-purple',
        cta: 'Join as Creator',
    },
    {
        emoji: '🎯',
        title: 'Brands & Agents',
        sub: 'Post Castings & Book Events',
        desc: 'Post casting calls, browse verified talent, manage applicants, and book the best in the game.',
        badge: 'Verified Only',
        badgeClass: 'badge-gold',
        cta: 'Post a Casting',
    },
];

const steps = [
    {
        num: '01',
        title: 'Apply & Get Verified',
        desc: 'Submit your profile and get approved by our team. We verify everyone so you only work with the best.',
    },
    {
        num: '02',
        title: 'Browse Opportunities',
        desc: 'Explore casting calls, events, and creator bookings posted by verified brands and agencies.',
    },
    {
        num: '03',
        title: 'Get Booked & Get Paid',
        desc: 'Accept bookings, show up, and get paid. Manage everything from your Baddie Castings dashboard.',
    },
];

const stats = [
    { value: '500+', label: 'Active Talent' },
    { value: '200+', label: 'Castings' },
    { value: '50+', label: 'Brands' },
    { value: '$2M+', label: 'Paid Out' },
];


export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);
    const [bookOpen, setBookOpen] = useState(false);
    const [hireOpen, setHireOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div className={styles.root}>
            <div className={styles.bg} />

            {/* Nav */}
            <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
                <div className={styles.navInner}>
                  <div className={styles.logoWrap}>
                    <Image src="/logo.png" alt="BC" width={32} height={32} className={styles.navLogoImg} />
                    <span className={styles.navLogo}>Baddie Castings</span>
                  </div>
                  <div className={styles.navLinks}>
                    <Link href="/login" className="btn-secondary" style={{ padding: '10px 24px', fontSize: '0.85rem' }}>
                        Sign In
                    </Link>
                  </div>
                </div>
            </nav>

            {/* Premium Hero Slider */}
            <HeroMainSlider />

            <section className={styles.quickActions}>
                <button onClick={() => setBookOpen(true)} className={styles.actionCard} style={{ background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', width: '100%' }}>
                    <div className={styles.actionIcon} style={{ background: 'var(--accent-gold-dim)', color: 'var(--accent-gold)' }}>
                        <Star size={22} />
                    </div>
                    <div>
                        <h3 style={{ color: 'var(--text-primary)' }}>Book Talent</h3>
                        <p>Hire for your venue</p>
                    </div>
                    <ChevronRight size={18} />
                </button>
                <button onClick={() => setHireOpen(true)} className={styles.actionCard} style={{ background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', width: '100%' }}>
                    <div className={styles.actionIcon} style={{ background: 'var(--accent-purple-dim)', color: 'var(--accent-purple)' }}>
                        <Users size={22} />
                    </div>
                    <div>
                        <h3 style={{ color: 'var(--text-primary)' }}>Join the Team</h3>
                        <p>Apply to become a Baddie</p>
                    </div>
                    <ChevronRight size={18} />
                </button>
            </section>

            {/* Stats Row (Full Width) */}
            <section className={styles.statsSection}>
                <div className={styles.statsInner}>
                    {stats.map((s) => (
                        <div key={s.label} className={styles.statChip}>
                            <span className={styles.statValue}>{s.value}</span>
                            <span className={styles.statLabel}>{s.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Featured Projects Slider */}
            <VideoSection />

            {/* Hero image */}
            <section className={styles.heroImageWrap}>
                <div className={styles.heroImageGlow} />
                <Image
                    src="/talent-hero.png"
                    alt="Baddie Castings Talent"
                    width={440}
                    height={280}
                    className={styles.heroImage}
                    priority
                />
            </section>

            {/* Roles */}
            <section className={styles.section}>
                <p className={styles.sectionLabel}>Who It&apos;s For</p>
                <h2 className={styles.sectionTitle}>Built for Every Role</h2>
                <p className={styles.sectionSub}>Whether you&apos;re talent, a creator, or a brand — there&apos;s a seat for you.</p>

                <div className={styles.roleCards}>
                    {roles.map((r) => (
                        <div key={r.title} className={styles.roleCard}>
                            <div className={styles.roleCardTop}>
                                <span className={styles.roleEmoji}>{r.emoji}</span>
                                <span className={`badge ${r.badgeClass}`}>{r.badge}</span>
                            </div>
                            <h3 className={styles.roleCardTitle}>{r.title}</h3>
                            <p className={styles.roleCardSub}>{r.sub}</p>
                            <p className={styles.roleCardDesc}>{r.desc}</p>
                            <a href="/apply" className={styles.roleCardCta}>
                                {r.cta} →
                            </a>
                        </div>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section className={styles.section}>
                <p className={styles.sectionLabel}>The Process</p>
                <h2 className={styles.sectionTitle}>How It Works</h2>

                <div className={styles.steps}>
                    {steps.map((s, i) => (
                        <div key={s.num} className={styles.step}>
                            <div className={styles.stepNum}>{s.num}</div>
                            <div className={styles.stepBody}>
                                <h3 className={styles.stepTitle}>{s.title}</h3>
                                <p className={styles.stepDesc}>{s.desc}</p>
                            </div>
                            {i < steps.length - 1 && <div className={styles.stepConnector} />}
                        </div>
                    ))}
                </div>
            </section>

            {/* Shop banner */}
            <section className={styles.shopSection}>
                <div className={styles.shopImageWrap}>
                    <Image
                        src="/shop-hero.png"
                        alt="Uniforms and Add-Ons"
                        width={440}
                        height={200}
                        className={styles.shopImage}
                    />
                    <div className={styles.shopOverlay}>
                        <h3 className={styles.shopTitle}>Uniforms &amp; Add-Ons</h3>
                        <p className={styles.shopSub}>Everything you need to show up and stand out.</p>
                    </div>
                </div>
            </section>

            {/* Bottom CTA */}
            <section className={styles.ctaSection}>
                <div className={styles.ctaGlow} />
                <h2 className={styles.ctaTitle}>Ready to Get Booked?</h2>
                <p className={styles.ctaSub}>Join hundreds of talent and creators already on the platform.</p>
                <a href="/apply" className="btn-primary" style={{ fontSize: '1rem', padding: '18px 40px' }}>
                    Apply Now — It&apos;s Free
                </a>

                <div className={styles.appBadgeContainer} style={{ marginTop: '24px' }}>
                    <p className={styles.appBadgeText} style={{ marginBottom: '4px' }}>
                        <b>Stay Connected on the Go</b><br/>
                        Download our mobile app to manage your bookings anywhere.
                    </p>
                    <div className={styles.appBadges}>
                        <Image
                            src="/app-store-badge.png"
                            alt="Download on App Store"
                            width={160}
                            height={48}
                            className={styles.appBadge}
                        />
                        <Image
                            src="/google-play-badge.png"
                            alt="Get it on Google Play"
                            width={160}
                            height={48}
                            className={styles.appBadge}
                        />
                    </div>
                </div>

                <p className={styles.ctaSignin}>
                    Already have an account?{' '}
                    <a href="/login" className={styles.ctaSigninLink}>Sign In →</a>
                </p>
            </section>

            {/* Modals */}
            <Modal isOpen={bookOpen} onClose={() => setBookOpen(false)} title="Book Talent">
                <BookForm onComplete={() => setTimeout(() => setBookOpen(false), 3000)} />
            </Modal>

            <Modal isOpen={hireOpen} onClose={() => setHireOpen(false)} title="Join the Team">
                <HireForm onComplete={() => setTimeout(() => setHireOpen(false), 3000)} />
            </Modal>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerInner}>
                    <span className={styles.footerLogo}>Baddie Castings</span>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                        <Link href="/about" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.8rem' }}>About Us</Link>
                        <span className={styles.footerTag}>© 2025 · Atlanta, GA</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
