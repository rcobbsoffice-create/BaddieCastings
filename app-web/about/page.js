'use client';

import Link from 'next/link';
import { Shield, Heart, Award, Target, Eye, ChevronRight, ArrowLeft } from 'lucide-react';
import styles from './page.module.css';

export default function AboutPage() {
    return (
        <main className={styles.page}>
            <div className={styles.bg} />
            
            <div className={styles.container}>
                <Link href="/" className="btn-secondary" style={{ marginBottom: 40, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <ArrowLeft size={16} /> Back to Home
                </Link>

                <header className={styles.header}>
                    <span className={styles.label}>EST. 2010</span>
                    <h1 className={styles.title}>About Baddie Castings</h1>
                    <p className={styles.intro}>
                        The premier talent management and booking agency specializing in high-profile entertainment and nightlife projects across the United States.
                    </p>
                </header>

                {/* ── About Section ── */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Our Legacy</h2>
                    <div className={styles.contentGrid}>
                        <p>
                            Founded in 2010, <strong>Baddie Castings</strong> is a premier talent management and booking agency specializing in models, actors, event staff, and dancers for high-profile entertainment and nightlife projects. With over a decade of industry experience, we connect top-tier talent with leading brands, artists, and production companies across the United States.
                        </p>
                        <p>
                            Baddie Castings is widely recognized for booking models in major music videos for chart-topping artists such as <strong>21 Savage, Ludacris, Young Nudy, and Blac Youngsta</strong>. Our talent has also been featured in mainstream films, national commercials, concerts, and live performances.
                        </p>
                        <p>
                            In addition to media production, we provide professional staffing solutions for events, nightclubs, lounges, brand activations, and private functions. From experienced promotional models to skilled backup dancers and actors, our roster is curated to meet the demands of both large-scale productions and exclusive events.
                        </p>
                        <p>
                            Over the past 10+ years, Baddie Castings has successfully staffed hundreds of events and contributed to countless projects in major entertainment markets including <strong>Los Angeles and New York City</strong>. Our commitment to professionalism, reliability, and quality talent has made us a trusted partner in the entertainment industry.
                        </p>
                    </div>
                </section>

                {/* ── Values Section ── */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Our Values</h2>
                    <div className={styles.valuesGrid}>
                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}><Award size={24} /></div>
                            <h3 className={styles.valueTitle}>Professionalism</h3>
                            <p className={styles.valueText}>
                                With over a decade of experience, we provide reliable, high-quality talent for projects of all sizes. Our network of 3,000+ models and actors allows us to efficiently connect clients with the right talent for music videos, film productions, and brand activations.
                            </p>
                        </div>
                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}><Shield size={24} /></div>
                            <h3 className={styles.valueTitle}>Empowerment</h3>
                            <p className={styles.valueText}>
                                As a women-owned and operated Atlanta casting agency, empowerment is at our core. We are dedicated to creating opportunities for women in the industry, ensuring our talent feels confident, respected, and positioned for success.
                            </p>
                        </div>
                        <div className={styles.valueCard}>
                            <div className={styles.valueIcon}><Heart size={24} /></div>
                            <h3 className={styles.valueTitle}>Care</h3>
                            <p className={styles.valueText}>
                                Care goes beyond service—it's about support. We provide access to affordable photographers, childcare resources, and prioritize safety on every set. We ensure our staff feel protected from booking to safe transportation home.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── Mission & Vision ── */}
                <div className={styles.missionVision}>
                    <section className={styles.section} style={{ marginBottom: 0 }}>
                        <h2 className={styles.sectionTitle}>Our Mission</h2>
                        <div className={styles.contentGrid}>
                            <p>
                                At Baddie Castings, our mission is to connect clients with the right talent—quickly, efficiently, and nationwide. As a trusted <strong>Atlanta casting agency</strong>, we specialize in providing seamless model booking, talent management, and event staffing solutions tailored to the fast-paced entertainment industry.
                            </p>
                            <p>
                                Powered by a skilled team of executives, directors, and agents, we maintain a diverse network of over 3,000 experienced models, influencers, actors, and dancers to match every project with precision.
                            </p>
                        </div>
                    </section>

                    <section className={styles.section} style={{ marginBottom: 0 }}>
                        <h2 className={styles.sectionTitle}>Our Vision</h2>
                        <div className={styles.contentGrid}>
                            <p>
                                We aim to set the standard for reliability, quality, and innovation in the entertainment industry. Baddie Castings was founded to deliver exceptional talent services with passion and excellence—while being more than just a casting company to our staff.
                            </p>
                            <p>
                                We strive to lead the industry by combining high-quality talent, seamless booking experiences, and a people-first approach that prioritizes opportunity and care.
                            </p>
                        </div>
                    </section>
                </div>

                <div style={{ height: 80 }} />

                {/* ── CTA ── */}
                <div className={styles.ctaSection}>
                    <div className={styles.ctaGlow} />
                    <h2 className={styles.ctaTitle}>Elevate Your Next Project</h2>
                    <p className={styles.ctaText}>
                        Whether you're casting for a music video, planning an event, or producing a film, Baddie Castings delivers talent that stands out.
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/book" className="btn-primary">Book Talent Now</Link>
                        <Link href="/hire" className="btn-secondary">Join Our Roster</Link>
                    </div>
                </div>

                <footer className={styles.footer}>
                    <Link href="/" className={styles.logo}>Baddie Castings</Link>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 8 }}>
                        © 2025 Baddie Castings · Atlanta Casting Agency · Nationwide Staffing
                    </p>
                </footer>
            </div>
        </main>
    );
}
