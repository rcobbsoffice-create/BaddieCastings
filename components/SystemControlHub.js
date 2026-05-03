'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Save, Palette, Bell } from 'lucide-react';

export default function SystemControlHub({ onClose, onUpdated }) {
    const [colors, setColors] = useState({
        saturday: { name: 'Pink Glaze', hex: '#FF007A' },
        sunday: { name: 'Sapphire Night', hex: '#0055FF' }
    });
    const [announcement, setAnnouncement] = useState({
        title: '',
        body: '',
        full_text: ''
    });
    const [loading, setLoading] = useState(false);

    const handleUpdateColors = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('settings')
                .upsert({ key: 'currentWeekendColors', value: colors });

            if (error) throw error;

            // Trigger notification
            await supabase.from('notifications').insert([{
                type: 'color',
                title: 'Weekend Colors Live! 🎨',
                body: `Saturday: ${colors.saturday.name} | Sunday: ${colors.sunday.name}`,
                unread: true,
                icon: 'Zap',
                color: colors.saturday.hex
            }]);

            alert('Global colors updated!');
            onUpdated();
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handlePostAnnouncement = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('announcements')
                .insert([announcement]);

            if (error) throw error;

            // Trigger notification
            await supabase.from('notifications').insert([{
                type: 'announcement',
                title: announcement.title,
                body: announcement.body,
                unread: true,
                icon: 'Bell',
                color: 'var(--accent-pink)'
            }]);

            alert('Announcement posted!');
            onUpdated();
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-card">
                <header className="modal-header">
                    <h2>System Control Hub</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </header>

                <div className="hub-grid">
                    {/* Weekend Colors */}
                    <section className="hub-section">
                        <h3><Palette size={18} /> Weekend Color Sync</h3>
                        <div className="color-inputs">
                            <div className="color-field">
                                <label>Saturday</label>
                                <div className="input-group">
                                    <input type="text" value={colors.saturday.name} onChange={e => setColors({ ...colors, saturday: { ...colors.saturday, name: e.target.value } })} />
                                    <input type="color" value={colors.saturday.hex} onChange={e => setColors({ ...colors, saturday: { ...colors.saturday, hex: e.target.value } })} />
                                </div>
                            </div>
                            <div className="color-field">
                                <label>Sunday</label>
                                <div className="input-group">
                                    <input type="text" value={colors.sunday.name} onChange={e => setColors({ ...colors, sunday: { ...colors.sunday, name: e.target.value } })} />
                                    <input type="color" value={colors.sunday.hex} onChange={e => setColors({ ...colors, sunday: { ...colors.sunday, hex: e.target.value } })} />
                                </div>
                            </div>
                        </div>
                        <button className="btn-save" onClick={handleUpdateColors} disabled={loading}>Update Colors</button>
                    </section>

                    {/* Announcement */}
                    <section className="hub-section">
                        <h3><Bell size={18} /> Push Announcement</h3>
                        <div className="ann-inputs">
                            <input type="text" placeholder="Title (e.g. NYC Castings Open!)" value={announcement.title} onChange={e => setAnnouncement({ ...announcement, title: e.target.value })} />
                            <input type="text" placeholder="Subtitle" value={announcement.body} onChange={e => setAnnouncement({ ...announcement, body: e.target.value })} />
                            <textarea placeholder="Full details..." rows="3" value={announcement.full_text} onChange={e => setAnnouncement({ ...announcement, full_text: e.target.value })}></textarea>
                        </div>
                        <button className="btn-save" onClick={handlePostAnnouncement} disabled={loading}>Post Globally</button>
                    </section>
                </div>
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
                    max-width: 800px;
                    padding: 32px;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.5);
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                }
                .modal-header h2 { font-size: 1.4rem; font-weight: 800; color: var(--accent-pink); }
                .close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; }

                .hub-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
                .hub-section { display: flex; flex-direction: column; gap: 20px; }
                .hub-section h3 { display: flex; align-items: center; gap: 10px; font-size: 1rem; color: var(--text-secondary); }

                .color-inputs, .ann-inputs { display: flex; flex-direction: column; gap: 12px; }
                .color-field label { font-size: 0.7rem; color: var(--text-muted); margin-bottom: 4px; display: block; }
                .input-group { display: flex; gap: 10px; }
                
                input, textarea {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    padding: 12px;
                    color: #fff;
                    font-size: 0.9rem;
                    width: 100%;
                }
                input[type="color"] { width: 50px; padding: 2px; height: 44px; }

                .btn-save {
                    background: var(--bg-secondary);
                    color: var(--accent-pink);
                    border: 1px solid var(--accent-pink);
                    padding: 12px;
                    border-radius: 8px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-save:hover { background: var(--accent-pink); color: #fff; }
                @media (max-width: 768px) { .hub-grid { grid-template-columns: 1fr; } }
            `}</style>
        </div>
    );
}
