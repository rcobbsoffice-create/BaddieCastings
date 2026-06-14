'use client';

import AppShell from '@/components/AppShell';
import { Star, MapPin, Link2, ChevronRight, X, Calendar, Clock, MessageSquare, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

const categories = ['All', 'Photographers', 'Videographers', 'Phone Creators', 'Premium Production'];

const MOCK_CREATORS = [
    { id: 'm1', name: 'Nova Ray', category: 'Photographers', city: 'Atlanta, GA', bio: 'Nightclub & lifestyle photographer with 5+ years specializing in premium brand imagery.', price: 'From $350', rating: 4.9, reviews: 48, tags: ['Nightlife', 'Editorial', 'Fast Turnaround'], instagram: '@novaray.photo' },
    { id: 'm2', name: 'Viera Films', category: 'Videographers', city: 'Atlanta, GA', bio: 'Cinematic promo videos for clubs, brands, and talent. 4K delivery in 24 hrs.', price: 'From $600', rating: 5.0, reviews: 27, tags: ['4K', 'Promo', 'Same-Day Edit'], instagram: '@vierafilms' },
    { id: 'm3', name: 'Sasha Lens', category: 'Phone Creators', city: 'Miami, FL', bio: 'IG/TikTok content creation for models and brands. POV reels that go viral.', price: 'From $150', rating: 4.7, reviews: 103, tags: ['TikTok', 'Reels', 'Remote OK'], instagram: '@sashalens' },
    { id: 'm4', name: 'Krave Studio', category: 'Premium Production', city: 'Atlanta, GA', bio: 'Full-service production house – music videos, brand campaigns, and editorial spreads.', price: 'From $2,000', rating: 5.0, reviews: 15, tags: ['Music Video', 'Campaign', 'Full Crew'], instagram: '@kravestudio' },
    { id: 'm5', name: 'Milo Vision', category: 'Photographers', city: 'Atlanta, GA', bio: 'Bold, high-contrast portraits and nightlife coverage. Former Vogue contributor.', price: 'From $500', rating: 4.8, reviews: 61, tags: ['Portrait', 'Nightlife', 'Editorial'], instagram: '@milovision' },
];

function BookingModal({ creator, onClose }) {
    const [step, setStep] = useState('form');
    const [form, setForm] = useState({ date: '', time: '', details: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await supabase.from('form_submissions').insert({
            form_name: 'Creator Booking',
            fields: { creator: creator.name, category: creator.category, date: form.date, time: form.time, details: form.details },
            status: 'new',
        });
        setLoading(false);
        setStep('success');
    };

    return (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={styles.modal}>
                <button className={styles.modalClose} onClick={onClose}><X size={18} /></button>
                {step === 'form' ? (
                    <>
                        <div className={styles.modalHeader}>
                            <div className={styles.modalAvatar} style={{ background: `hsl(${String(creator.id).charCodeAt(0) * 37 % 360}, 55%, 28%)` }}>
                                {creator.name.charAt(0)}
                            </div>
                            <div>
                                <p className={styles.modalName}>{creator.name}</p>
                                <p className={styles.modalSub}>{creator.category} · {creator.city}</p>
                            </div>
                        </div>
                        <div className={styles.modalPrice}>{creator.price}</div>
                        <form onSubmit={handleSubmit} className={styles.modalForm}>
                            <div className={styles.formRow}>
                                <div className={styles.formField}>
                                    <label className={styles.formLabel}><Calendar size={13} /> Date</label>
                                    <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required min={new Date().toISOString().split('T')[0]} />
                                </div>
                                <div className={styles.formField}>
                                    <label className={styles.formLabel}><Clock size={13} /> Time</label>
                                    <input type="time" className="input" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} required />
                                </div>
                            </div>
                            <div className={styles.formField} style={{ marginTop: 12 }}>
                                <label className={styles.formLabel}><MessageSquare size={13} /> Project Details</label>
                                <textarea className="input" placeholder="Describe your event, location, and what you need..." value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))} required rows={4} style={{ resize: 'vertical', minHeight: 90 }} />
                            </div>
                            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: 16, opacity: loading ? 0.7 : 1 }}>
                                {loading ? 'Sending Request...' : 'Send Booking Request'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className={styles.successState}>
                        <div className={styles.successIcon}><CheckCircle size={48} color="var(--accent-purple)" /></div>
                        <h2 className={styles.successTitle}>Request Sent!</h2>
                        <p className={styles.successMsg}>Your booking inquiry has been sent to <strong>{creator.name}</strong>. They typically respond within 24 hours.</p>
                        <button className="btn-primary" onClick={onClose} style={{ width: '100%', marginTop: 8 }}>Done</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CreatorsPage() {
    const [active, setActive] = useState('All');
    const [booking, setBooking] = useState(null);
    const [creators, setCreators] = useState(MOCK_CREATORS);

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, city, bio, specialty, hourly_rate, instagram, rating, avatar_url')
                .eq('role', 'creator')
                .eq('status', 'active');

            if (data && data.length > 0) {
                setCreators(data.map(p => ({
                    id: p.id,
                    name: p.full_name || 'Creator',
                    category: p.specialty || 'Photographers',
                    city: p.city || 'Atlanta, GA',
                    bio: p.bio || 'Creative professional available for bookings.',
                    price: p.hourly_rate ? `From $${p.hourly_rate}/hr` : 'Contact for rates',
                    rating: p.rating || 0,
                    reviews: 0,
                    tags: p.specialty ? [p.specialty] : [],
                    instagram: p.instagram || '',
                    avatar_url: p.avatar_url,
                })));
            }
        };
        load();
    }, []);

    const filtered = active === 'All' ? creators : creators.filter(c => c.category === active);

    return (
        <AppShell>
            <div className="page-header">
                <h1 className="page-title">Creators</h1>
                <p className="page-subtitle">Book photographers, videographers &amp; content creators</p>
            </div>

            <div className={styles.content}>
                <div className={`scroll-row ${styles.filterRow}`}>
                    {categories.map(cat => (
                        <button key={cat} className={`${styles.filterChip} ${active === cat ? styles.filterActive : ''}`} onClick={() => setActive(cat)}>
                            {cat}
                        </button>
                    ))}
                </div>

                <div className={styles.creatorGrid}>
                    {filtered.map((c, i) => (
                        <div key={c.id} className={`card ${styles.creatorCard}`} style={{ animationDelay: `${i * 0.07}s` }}>
                            <div className={styles.avatarRow}>
                                {c.avatar_url ? (
                                    <img src={c.avatar_url} alt={c.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                ) : (
                                    <div className={styles.avatar} style={{ background: `hsl(${String(c.id).charCodeAt(0) * 37 % 360}, 55%, 28%)` }}>{c.name.charAt(0)}</div>
                                )}
                                <div className={styles.creatorInfo}>
                                    <p className={styles.creatorName}>{c.name}</p>
                                    <p className={styles.creatorMeta}><MapPin size={10} /> {c.city}</p>
                                </div>
                                {c.rating > 0 && (
                                    <div className={styles.ratingBadge}>
                                        <Star size={11} fill="var(--accent-gold)" color="var(--accent-gold)" />
                                        <span>{c.rating}</span>
                                        {c.reviews > 0 && <span className={styles.reviews}>({c.reviews})</span>}
                                    </div>
                                )}
                            </div>
                            <span className={`badge badge-purple ${styles.catBadge}`}>{c.category}</span>
                            <p className={styles.bio}>{c.bio}</p>
                            {c.tags.length > 0 && (
                                <div className={styles.tags}>
                                    {c.tags.map(t => <span key={t} className="badge badge-pink">{t}</span>)}
                                </div>
                            )}
                            {c.instagram && (
                                <a href={`https://instagram.com/${c.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className={styles.igRow}>
                                    <Link2 size={12} /><span>{c.instagram}</span>
                                </a>
                            )}
                            <div className={styles.bookRow}>
                                <span className={styles.price}>{c.price}</span>
                                <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.82rem' }} onClick={() => setBooking(c)}>
                                    Book Now <ChevronRight size={13} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {booking && <BookingModal creator={booking} onClose={() => setBooking(null)} />}
        </AppShell>
    );
}
