'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Save, AlertCircle } from 'lucide-react';

export default function CastingStudio({ onClose, onCreated }) {
    const [form, setForm] = useState({
        category: 'Nightlife',
        title: '',
        venue: '',
        date: '',
        location: 'Atlanta, GA',
        pay: '',
        spots: 5,
        requirements: '',
        color: 'N/A'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: sbError } = await supabase
                .from('listings')
                .insert([form]);

            if (sbError) throw sbError;

            // Optional: Create notification for all talent
            const newNotif = {
                type: 'casting',
                title: 'New Casting Published! ✨',
                body: `${form.title} at ${form.venue} is now open for applications.`,
                unread: true,
                icon: 'Star',
                color: 'var(--accent-pink)'
            };
            await supabase.from('notifications').insert([newNotif]);

            onCreated();
            onClose();
        } catch (err) {
            console.error('Casting Creation Error:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-card">
                <header className="modal-header">
                    <h2>Create New Casting</h2>
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
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                <option>Nightlife</option>
                                <option>Photoshoots</option>
                                <option>Videoshoots</option>
                                <option>Branding</option>
                                <option>Events</option>
                            </select>
                        </div>
                        <div className="field">
                            <label>Title</label>
                            <input type="text" placeholder="e.g. VIP Hostess" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="field">
                            <label>Venue</label>
                            <input type="text" placeholder="Club Onyx" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} required />
                        </div>
                        <div className="field">
                            <label>Location</label>
                            <input type="text" placeholder="Atlanta, GA" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="field">
                            <label>Date</label>
                            <input type="text" placeholder="Sat Apr 19" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                        </div>
                        <div className="field">
                            <label>Pay</label>
                            <input type="text" placeholder="$250 + tips" value={form.pay} onChange={e => setForm({ ...form, pay: e.target.value })} required />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="field">
                            <label>Spots</label>
                            <input type="number" value={form.spots} onChange={e => setForm({ ...form, spots: parseInt(e.target.value) })} required />
                        </div>
                        <div className="field">
                            <label>Required Color</label>
                            <input type="text" placeholder="Black" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
                        </div>
                    </div>

                    <div className="field">
                        <label>Requirements</label>
                        <textarea
                            rows="3"
                            placeholder="Heels required, 21+, etc."
                            value={form.requirements}
                            onChange={e => setForm({ ...form, requirements: e.target.value })}
                        ></textarea>
                    </div>

                    <button type="submit" className="btn-save" disabled={loading}>
                        <Save size={18} />
                        {loading ? 'Publishing...' : 'Publish Casting'}
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
