'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { MapPin, Calendar, DollarSign, Users, ChevronRight, X, User, Phone, Link2, MessageSquare, CheckCircle, Bookmark, BookmarkCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

const categories = ['All', 'Nightlife', 'Photoshoots', 'Videoshoots', 'Branding', 'Events'];

const initialListings = [
    {
        id: 1, category: 'Nightlife', title: 'Bottle Service Opening Night',
        venue: 'Club Onyx VIP', date: 'Sat Apr 19', location: 'Atlanta, GA',
        pay: '$200 + tips', color: 'All Black', spots: 8, requirements: 'Heels, confidence, 21+',
        status: 'Open',
    },
    {
        id: 2, category: 'Photoshoots', title: 'Summer Collection Shoot',
        venue: 'Studio Luxe ATL', date: 'Thu Apr 24', location: 'Atlanta, GA',
        pay: '$350 flat', color: 'White', spots: 3, requirements: 'Sizes 0–8, portfolio required',
        status: 'Open',
    },
    {
        id: 3, category: 'Branding', title: 'Brand Ambassador – Haus of Luxe',
        venue: 'Remote / Social', date: 'Ongoing', location: 'Remote',
        pay: '$500/mo + commission', color: 'N/A', spots: 5, requirements: '5k+ IG followers',
        status: 'Open',
    },
    {
        id: 4, category: 'Videoshoots', title: 'Promo Video – Nightlife Capsule',
        venue: 'Lounge 22', date: 'Fri Apr 25', location: 'Atlanta, GA',
        pay: '$275', color: 'Red', spots: 4, requirements: 'Natural hair a plus',
        status: 'Closing Soon',
    },
    {
        id: 5, category: 'Events', title: 'Lifestyle Expo Brand Host',
        venue: 'Atlanta Convention Center', date: 'Sat May 3', location: 'Atlanta, GA',
        pay: '$150/day', color: 'Brand Uniform', spots: 10, requirements: 'Outgoing personality',
        status: 'Open',
    },
];

const statusColor = { 'Open': 'badge-green', 'Closing Soon': 'badge-red' };

function ApplyModal({ listing, onClose, onSuccess }) {
    const [step, setStep] = useState('form'); // 'form' | 'success'
    const [form, setForm] = useState({ name: '', phone: '', instagram: '', portfolio: '', notes: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        const appData = {
            talent_id: user?.id,
            listing_id: listing.id,
            listing_title: listing.title,
            full_name: form.name,
            instagram: form.instagram,
            phone: form.phone,
            portfolio: form.portfolio,
            notes: form.notes,
            status: 'pending',
        };

        const { error: sbError } = await supabase
            .from('applications')
            .insert([appData]);

        if (sbError) {
            console.warn('Application insert error:', sbError);
        } else {
            // Trigger Notification Email to the Listing Owner
            try {
                if (listing.posted_by) {
                    const { data: owner } = await supabase
                        .from('profiles')
                        .select('email, full_name')
                        .eq('id', listing.posted_by)
                        .single();

                    if (owner?.email) {
                        await fetch('/api/send-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                to: owner.email,
                                subject: 'New Application Received! 📩',
                                html: `
                                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                                        <h2 style="color: #ff3366;">New Application Received! 📩</h2>
                                        <p>Good news!</p>
                                        <p><strong>${form.name}</strong> has just applied to your casting call: <strong>${listing.title}</strong>.</p>
                                        <br />
                                        <a href="${window.location.origin}/dashboard/applications" style="background-color: #ff3366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                                            View Application
                                        </a>
                                        <p style="margin-top: 30px; font-size: 14px; color: #777;">
                                            - Baddie Castings Notifications
                                        </p>
                                    </div>
                                `
                            })
                        });
                    }
                }
            } catch (emailErr) {
                console.warn('Notification email failed to send:', emailErr);
            }

            if (onSuccess) onSuccess(listing.id);
        }

        setLoading(false);
        setStep('success');
    };

    return (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={styles.modal}>
                <button className={styles.modalClose} onClick={onClose} id="btn-apply-modal-close">
                    <X size={18} />
                </button>

                {step === 'form' ? (
                    <>
                        <div className={styles.modalHeader}>
                            <span className={`badge badge-purple`}>{listing.category}</span>
                            <h2 className={styles.modalTitle}>{listing.title}</h2>
                            <p className={styles.modalVenue}>{listing.venue} · {listing.date}</p>
                            <div className={styles.modalPayRow}>
                                <DollarSign size={13} />
                                <span>{listing.pay}</span>
                                <span className={styles.modalSep}>·</span>
                                <Users size={13} />
                                <span>{listing.spots} spots left</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className={styles.modalForm}>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}><User size={13} /> Full Name</label>
                                <input
                                    id="apply-name"
                                    type="text"
                                    className="input"
                                    placeholder="Your name"
                                    value={form.name}
                                    onChange={handleChange('name')}
                                    required
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formField}>
                                    <label className={styles.formLabel}><Phone size={13} /> Phone</label>
                                    <input
                                        id="apply-phone"
                                        type="tel"
                                        className="input"
                                        placeholder="(404) 000-0000"
                                        value={form.phone}
                                        onChange={handleChange('phone')}
                                        required
                                    />
                                </div>
                                <div className={styles.formField}>
                                    <label className={styles.formLabel}><Link2 size={13} /> Instagram</label>
                                    <input
                                        id="apply-instagram"
                                        type="text"
                                        className="input"
                                        placeholder="@handle"
                                        value={form.instagram}
                                        onChange={handleChange('instagram')}
                                    />
                                </div>
                            </div>

                            <div className={styles.formField}>
                                <label className={styles.formLabel}><Link2 size={13} /> Portfolio / TikTok Link</label>
                                <input
                                    id="apply-portfolio"
                                    type="url"
                                    className="input"
                                    placeholder="https://"
                                    value={form.portfolio}
                                    onChange={handleChange('portfolio')}
                                />
                            </div>

                            <div className={styles.formField}>
                                <label className={styles.formLabel}><MessageSquare size={13} /> Why are you a great fit?</label>
                                <textarea
                                    id="apply-notes"
                                    className="input"
                                    placeholder="Tell the agent about your experience, availability, etc."
                                    value={form.notes}
                                    onChange={handleChange('notes')}
                                    rows={3}
                                    style={{ resize: 'vertical', minHeight: 80 }}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn-primary"
                                id="btn-confirm-apply"
                                disabled={loading}
                                style={{ width: '100%', marginTop: 8, opacity: loading ? 0.7 : 1 }}
                            >
                                {loading ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className={styles.successState}>
                        <div className={styles.successIcon}>
                            <CheckCircle size={48} color="var(--accent-pink)" />
                        </div>
                        <h2 className={styles.successTitle}>Application Sent! 🎉</h2>
                        <p className={styles.successMsg}>
                            You've applied to <strong>{listing.title}</strong>. The casting agent will review your profile and reach out within 48 hours.
                        </p>
                        <button
                            className="btn-primary"
                            id="btn-apply-done"
                            onClick={onClose}
                            style={{ width: '100%', marginTop: 8 }}
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
export default function OpportunitiesPage() {
    const [active, setActive] = useState('All');
    const [applying, setApplying] = useState(null);
    const [saved, setSaved] = useState([]);
    const [appliedIds, setAppliedIds] = useState(new Set());

    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            const [listingsRes, applicationsRes] = await Promise.all([
                supabase
                    .from('listings')
                    .select('*')
                    .in('status', ['Open', 'Closing Soon'])
                    .order('created_at', { ascending: false }),
                user
                    ? supabase
                        .from('applications')
                        .select('listing_id')
                        .eq('talent_id', user.id)
                    : Promise.resolve({ data: [] }),
            ]);

            setListings(listingsRes.data?.length ? listingsRes.data : initialListings);
            if (applicationsRes.data?.length) {
                setAppliedIds(new Set(applicationsRes.data.map(a => a.listing_id)));
            }
            setLoading(false);
        };

        load();
    }, []);

    const filtered = active === 'All' ? listings : listings.filter(l => l.category === active);

    const toggleSave = (id) => {
        setSaved(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    };

    return (
        <AppShell>
            <div className="page-header">
                <h1 className="page-title">Castings</h1>
                <p className="page-subtitle">Castings, shoots &amp; brand deals</p>
            </div>

            <div className={styles.content}>
                {loading ? (
                    <div className={styles.loadingState}>
                        <div className="spinner"></div>
                        <p>Finding the hottest opportunities...</p>
                    </div>
                ) : (
                    <>
                        {/* Filter chips */}
                        <div className={`scroll-row ${styles.filterRow}`}>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    id={`filter-${cat.toLowerCase()}`}
                                    className={`${styles.filterChip} ${active === cat ? styles.filterActive : ''}`}
                                    onClick={() => setActive(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Listings */}
                        <div className={styles.listingList}>
                            {filtered.map((l, i) => (
                                <div key={l.id} className={`card ${styles.listing}`} style={{ animationDelay: `${i * 0.06}s` }}>
                                    <div className={styles.listingTop}>
                                        <div>
                                            <span className={`badge badge-purple`}>{l.category}</span>
                                            <h2 className={styles.listingTitle}>{l.title}</h2>
                                            <p className={styles.listingVenue}>{l.venue}</p>
                                        </div>
                                        <div className={styles.listingTopRight}>
                                            <span className={`badge ${statusColor[l.status] || 'badge-pink'}`}>{l.status}</span>
                                            <button
                                                id={`btn-save-${l.id}`}
                                                className={styles.saveBtn}
                                                onClick={() => toggleSave(l.id)}
                                                title={saved.includes(l.id) ? 'Unsave' : 'Save'}
                                            >
                                                {saved.includes(l.id)
                                                    ? <BookmarkCheck size={17} color="var(--accent-pink)" />
                                                    : <Bookmark size={17} />
                                                }
                                            </button>
                                        </div>
                                    </div>
                                    <div className={styles.listingMeta}>
                                        <span className={styles.metaItem}><Calendar size={12} /> {l.date}</span>
                                        <span className={styles.metaItem}><MapPin size={12} /> {l.location}</span>
                                        <span className={styles.metaItem}><DollarSign size={12} /> {l.pay}</span>
                                        <span className={styles.metaItem}><Users size={12} /> {l.spots} spots</span>
                                    </div>
                                    {l.color !== 'N/A' && (
                                        <p className={styles.colorReq}>🎨 Color: <strong>{l.color}</strong></p>
                                    )}
                                    <p className={styles.requirements}>Requirements: {l.requirements}</p>
                                    <div className={styles.listingFooter}>
                                        {appliedIds.has(l.id) ? (
                                            <div className={styles.appliedBadge}>
                                                <CheckCircle size={14} />
                                                Applied — Pending Review
                                            </div>
                                        ) : (
                                            <button
                                                className="btn-primary"
                                                id={`btn-apply-${l.id}`}
                                                style={{ width: '100%' }}
                                                onClick={() => setApplying(l)}
                                            >
                                                Apply Now <ChevronRight size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {applying && (
                <ApplyModal
                    listing={applying}
                    onClose={() => setApplying(null)}
                    onSuccess={(id) => setAppliedIds(prev => new Set([...prev, id]))}
                />
            )}
        </AppShell>
    );
}
