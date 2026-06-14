'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Save, Palette, Bell, CreditCard, Eye, EyeOff, CheckCircle, Mail, Send, Loader } from 'lucide-react';

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
    const [stripeKeys, setStripeKeys] = useState({
        publishable_key: '',
        secret_key: '',
    });
    const [showSecret, setShowSecret] = useState(false);
    const [stripeSaved, setStripeSaved] = useState(false);
    const [resendConfig, setResendConfig] = useState({
        api_key: '',
        from_email: '',
        from_name: '',
    });
    const [showResendKey, setShowResendKey] = useState(false);
    const [resendSaved, setResendSaved] = useState(false);
    const [testEmailTo, setTestEmailTo] = useState('');
    const [testEmailStatus, setTestEmailStatus] = useState(null); // null | 'sending' | 'ok' | { error }
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadKeys = async () => {
            const [pubRes, secRes, resendKeyRes, fromEmailRes, fromNameRes] = await Promise.all([
                supabase.from('settings').select('value').eq('key', 'stripe_publishable_key').single(),
                supabase.from('settings').select('value').eq('key', 'stripe_secret_key').single(),
                supabase.from('settings').select('value').eq('key', 'resend_api_key').single(),
                supabase.from('settings').select('value').eq('key', 'resend_from_email').single(),
                supabase.from('settings').select('value').eq('key', 'resend_from_name').single(),
            ]);
            setStripeKeys({
                publishable_key: pubRes.data?.value || '',
                secret_key: secRes.data?.value ? '••••••••••••••••••••••' : '',
            });
            setResendConfig({
                api_key: resendKeyRes.data?.value ? '••••••••••••••••••••••' : '',
                from_email: fromEmailRes.data?.value || '',
                from_name: fromNameRes.data?.value || '',
            });
        };
        loadKeys();
    }, []);

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

    const handleSaveStripeKeys = async () => {
        setLoading(true);
        try {
            const upserts = [];
            if (stripeKeys.publishable_key && !stripeKeys.publishable_key.startsWith('••')) {
                upserts.push(
                    supabase.from('settings').upsert({ key: 'stripe_publishable_key', value: stripeKeys.publishable_key })
                );
            }
            if (stripeKeys.secret_key && !stripeKeys.secret_key.startsWith('••')) {
                upserts.push(
                    supabase.from('settings').upsert({ key: 'stripe_secret_key', value: stripeKeys.secret_key })
                );
            }
            if (upserts.length === 0) return;
            await Promise.all(upserts);
            setStripeSaved(true);
            setStripeKeys(k => ({
                publishable_key: k.publishable_key.startsWith('••') ? k.publishable_key : k.publishable_key,
                secret_key: '••••••••••••••••••••••',
            }));
            setTimeout(() => setStripeSaved(false), 3000);
        } catch (err) {
            console.error(err);
            alert('Failed to save Stripe keys.');
        }
        setLoading(false);
    };

    const handleSaveResendConfig = async () => {
        setLoading(true);
        try {
            const upserts = [];
            if (resendConfig.api_key && !resendConfig.api_key.startsWith('••')) {
                upserts.push(supabase.from('settings').upsert({ key: 'resend_api_key', value: resendConfig.api_key }));
            }
            if (resendConfig.from_email) {
                upserts.push(supabase.from('settings').upsert({ key: 'resend_from_email', value: resendConfig.from_email }));
            }
            if (resendConfig.from_name) {
                upserts.push(supabase.from('settings').upsert({ key: 'resend_from_name', value: resendConfig.from_name }));
            }
            if (upserts.length === 0) return;
            await Promise.all(upserts);
            setResendSaved(true);
            if (resendConfig.api_key && !resendConfig.api_key.startsWith('••')) {
                setResendConfig(c => ({ ...c, api_key: '••••••••••••••••••••••' }));
            }
            setTimeout(() => setResendSaved(false), 3000);
        } catch (err) {
            console.error(err);
            alert('Failed to save Resend config.');
        }
        setLoading(false);
    };

    const handleTestEmail = async () => {
        if (!testEmailTo) return;
        setTestEmailStatus('sending');
        try {
            const res = await fetch('/api/send-email/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: testEmailTo }),
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                setTestEmailStatus({ error: data.error });
            } else {
                setTestEmailStatus('ok');
                setTimeout(() => setTestEmailStatus(null), 5000);
            }
        } catch (err) {
            setTestEmailStatus({ error: err.message });
        }
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

                    {/* Stripe Payments */}
                    <section className="hub-section" style={{ gridColumn: '1 / -1' }}>
                        <h3><CreditCard size={18} /> Stripe Payment Keys</h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: -10 }}>
                            Keys are stored securely in your database. Only enter new values to update — leave blank to keep existing.
                        </p>
                        <div className="ann-inputs">
                            <div>
                                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Publishable Key (pk_live_… or pk_test_…)</label>
                                <input
                                    type="text"
                                    placeholder="pk_live_..."
                                    value={stripeKeys.publishable_key}
                                    onChange={e => setStripeKeys(k => ({ ...k, publishable_key: e.target.value }))}
                                />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Secret Key (sk_live_… or sk_test_…)</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showSecret ? 'text' : 'password'}
                                        placeholder="sk_live_..."
                                        value={stripeKeys.secret_key}
                                        onChange={e => setStripeKeys(k => ({ ...k, secret_key: e.target.value }))}
                                        style={{ paddingRight: 44 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSecret(s => !s)}
                                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                                    >
                                        {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button className="btn-save" onClick={handleSaveStripeKeys} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                            {stripeSaved ? <><CheckCircle size={15} /> Keys Saved!</> : <><Save size={15} /> Save Stripe Keys</>}
                        </button>
                    </section>

                    {/* Resend Email */}
                    <section className="hub-section" style={{ gridColumn: '1 / -1' }}>
                        <h3><Mail size={18} /> Resend Email Config</h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: -10 }}>
                            Get your API key at <strong style={{ color: '#fff' }}>resend.com</strong>. Add your domain under Domains, then verify DNS records. Use a verified address as the From email.
                        </p>
                        <div className="ann-inputs">
                            <div style={{ position: 'relative' }}>
                                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Resend API Key (re_…)</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showResendKey ? 'text' : 'password'}
                                        placeholder="re_xxxxxxxxxxxxxx"
                                        value={resendConfig.api_key}
                                        onChange={e => setResendConfig(c => ({ ...c, api_key: e.target.value }))}
                                        style={{ paddingRight: 44 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowResendKey(s => !s)}
                                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                                    >
                                        {showResendKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>From Email</label>
                                    <input
                                        type="email"
                                        placeholder="noreply@yourdomain.com"
                                        value={resendConfig.from_email}
                                        onChange={e => setResendConfig(c => ({ ...c, from_email: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>From Name</label>
                                    <input
                                        type="text"
                                        placeholder="Baddie Castings"
                                        value={resendConfig.from_name}
                                        onChange={e => setResendConfig(c => ({ ...c, from_name: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                        <button className="btn-save" onClick={handleSaveResendConfig} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                            {resendSaved ? <><CheckCircle size={15} /> Config Saved!</> : <><Save size={15} /> Save Email Config</>}
                        </button>

                        {/* Test email */}
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Send a test email to verify your setup</label>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    value={testEmailTo}
                                    onChange={e => setTestEmailTo(e.target.value)}
                                    style={{ flex: 1 }}
                                />
                                <button
                                    className="btn-save"
                                    onClick={handleTestEmail}
                                    disabled={!testEmailTo || testEmailStatus === 'sending'}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', padding: '12px 18px' }}
                                >
                                    {testEmailStatus === 'sending'
                                        ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</>
                                        : testEmailStatus === 'ok'
                                        ? <><CheckCircle size={14} /> Sent!</>
                                        : <><Send size={14} /> Send Test</>}
                                </button>
                            </div>
                            {testEmailStatus && testEmailStatus.error && (
                                <p style={{ fontSize: '0.78rem', color: '#ff4d6d', margin: 0 }}>{testEmailStatus.error}</p>
                            )}
                            {testEmailStatus === 'ok' && (
                                <p style={{ fontSize: '0.78rem', color: '#00ff88', margin: 0 }}>Test email sent! Check your inbox.</p>
                            )}
                        </div>
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
                    max-height: 90vh;
                    overflow-y: auto;
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
                .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @media (max-width: 768px) { .hub-grid { grid-template-columns: 1fr; } }
            `}</style>
        </div>
    );
}
