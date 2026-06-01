'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Save, AlertCircle } from 'lucide-react';

const EMPTY = {
    category: 'Nightlife',
    title: '',
    venue: '',
    date: '',
    location: 'Atlanta, GA',
    pay: '',
    spots: 5,
    requirements: '',
    color: 'N/A'
};

export default function CastingStudio({ onClose, onCreated, listing }) {
    const [form, setForm] = useState(listing ? {
        category:     listing.category     || 'Nightlife',
        title:        listing.title        || '',
        venue:        listing.venue        || '',
        date:         listing.date         || '',
        location:     listing.location     || 'Atlanta, GA',
        pay:          listing.pay          || '',
        spots:        listing.spots        || 5,
        requirements: listing.requirements || '',
        color:        listing.color        || 'N/A',
    } : { ...EMPTY });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const isEdit = !!listing;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isEdit) {
                const { error: sbError } = await supabase
                    .from('listings')
                    .update(form)
                    .eq('id', listing.id);
                if (sbError) throw sbError;
            } else {
                const { error: sbError } = await supabase
                    .from('listings')
                    .insert([form]);
                if (sbError) throw sbError;

                await supabase.from('notifications').insert([{
                    type: 'casting',
                    title: 'New Casting Published! ✨',
                    body: `${form.title} at ${form.venue} is now open for applications.`,
                    unread: true,
                    icon: 'Star',
                    color: 'var(--accent-pink)'
                }]);
            }

            onCreated();
            onClose();
        } catch (err) {
            console.error('Casting Error:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-card">
                <header className="modal-header">
                    <h2>{isEdit ? 'Edit Casting' : 'Create New Casting'}</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </header>

                {error && (
                    <div className="error-banner">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="casting-form">
                    <div className="form-row">
                        <div className="field">
                            <label>Category</label>
                            <select value={form.category} onChange={set('category')}>
                                <option>Nightlife</option>
                                <option>Photoshoots</option>
                                <option>Videoshoots</option>
                                <option>Branding</option>
                                <option>Events</option>
                            </select>
                        </div>
                        <div className="field">
                            <label>Title</label>
                            <input type="text" placeholder="e.g. VIP Hostess" value={form.title} onChange={set('title')} required />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="field">
                            <label>Venue</label>
                            <input type="text" placeholder="Club Onyx" value={form.venue} onChange={set('venue')} required />
                        </div>
                        <div className="field">
                            <label>Location</label>
                            <input type="text" placeholder="Atlanta, GA" value={form.location} onChange={set('location')} required />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="field">
                            <label>Date</label>
                            <input type="text" placeholder="Sat Apr 19" value={form.date} onChange={set('date')} required />
                            <input
                                type="date"
                                onChange={e => {
                                    if (!e.target.value) return;
                                    const d = new Date(e.target.value + 'T00:00:00');
                                    const formatted = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                                    setForm({ ...form, date: formatted });
                                }}
                                style={{ marginTop: '4px' }}
                            />
                        </div>
                        <div className="field">
                            <label>Pay</label>
                            <input type="text" placeholder="$250 + tips" value={form.pay} onChange={set('pay')} required />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="field">
                            <label>Spots</label>
                            <input type="number" value={form.spots} onChange={e => setForm({ ...form, spots: parseInt(e.target.value) })} required />
                        </div>
                        <div className="field">
                            <label>Required Color</label>
                            <input type="text" placeholder="Black" value={form.color} onChange={set('color')} />
                        </div>
                    </div>

                    <div className="field">
                        <label>Requirements</label>
                        <textarea
                            rows="3"
                            placeholder="Heels required, 21+, etc."
                            value={form.requirements}
                            onChange={set('requirements')}
                        ></textarea>
                    </div>

                    <button type="submit" className="btn-save" disabled={loading}>
                        <Save size={18} />
                        {loading ? (isEdit ? 'Saving…' : 'Publishing…') : (isEdit ? 'Save Changes' : 'Publish Casting')}
                    </button>
                </form>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(10px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }
                .modal-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-lg);
                    width: 100%;
                    max-width: 600px;
                    max-height: 90vh;
                    overflow-y: auto;
                    padding: 32px;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.5);
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }
                .modal-header h2 {
                    font-size: 1.4rem;
                    font-weight: 800;
                    color: var(--accent-pink);
                }
                .close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; }

                .error-banner {
                    background: rgba(255, 60, 60, 0.1);
                    border: 1px solid var(--accent-ruby);
                    color: var(--accent-ruby);
                    padding: 12px;
                    border-radius: 8px;
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                    font-size: 0.9rem;
                }

                .casting-form { display: flex; flex-direction: column; gap: 20px; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .field { display: flex; flex-direction: column; gap: 8px; }
                .field label { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }

                input, select, textarea {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    padding: 12px;
                    color: #fff;
                    font-family: inherit;
                    width: 100%;
                }
                input:focus, select:focus, textarea:focus {
                    outline: none;
                    border-color: var(--accent-pink);
                }

                .btn-save {
                    margin-top: 10px;
                    background: var(--accent-pink);
                    color: #fff;
                    border: none;
                    padding: 16px;
                    border-radius: 12px;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-save:hover { filter: brightness(1.1); box-shadow: 0 0 30px var(--accent-pink-glow); }
                .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
            `}</style>
        </div>
    );
}
