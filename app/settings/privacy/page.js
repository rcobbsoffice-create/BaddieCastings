'use client';

import { useState } from 'react';
import AppShell from '@/components/AppShell';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from '../settings.module.css';

export default function PrivacyPage() {
    const router = useRouter();
    const [profileVisible, setProfileVisible] = useState(true);
    const [newPw, setNewPw] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [pwStatus, setPwStatus] = useState(null);

    const handleChangePw = async (e) => {
        e.preventDefault();
        if (newPw.length < 8) { setPwStatus({ error: 'Must be at least 8 characters.' }); return; }
        setPwStatus('saving');
        const { error } = await supabase.auth.updateUser({ password: newPw });
        if (error) { setPwStatus({ error: error.message }); }
        else { setPwStatus('ok'); setNewPw(''); setTimeout(() => setPwStatus(null), 3000); }
    };

    return (
        <AppShell>
            <div className={styles.page}>
                <div className={styles.header}>
                    <button className={styles.back} onClick={() => router.back()}><ChevronLeft size={20} /></button>
                    <h1 className={styles.title}>Privacy & Security</h1>
                    <div style={{ width: 36 }} />
                </div>

                <section className={styles.section}>
                    <p className={styles.groupLabel}>Privacy</p>
                    <div className={styles.settingsList}>
                        <div className={styles.toggleRow}>
                            <div>
                                <p className={styles.toggleLabel}>Public Profile</p>
                                <p className={styles.toggleDesc}>Allow agents and brands to discover your profile</p>
                            </div>
                            <button className={`${styles.toggle} ${profileVisible ? styles.toggleOn : ''}`} onClick={() => setProfileVisible(!profileVisible)} aria-label="Profile visibility">
                                <span className={styles.toggleThumb} />
                            </button>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <p className={styles.groupLabel}>Security</p>
                    <div className={styles.settingsList}>
                        <form onSubmit={handleChangePw} className={styles.pwForm}>
                            <div className={styles.field} style={{ padding: '16px 18px 0' }}>
                                <label className={styles.label}><Lock size={13} /> New Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input type={showPw ? 'text' : 'password'} className="input" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="At least 8 characters" required style={{ paddingRight: 44 }} />
                                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            {pwStatus?.error && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ff4d6d', fontSize: '0.8rem', padding: '8px 18px 0' }}>
                                    <AlertCircle size={13} />{pwStatus.error}
                                </div>
                            )}
                            <div style={{ padding: '12px 18px 16px' }}>
                                <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={pwStatus === 'saving'}>
                                    {pwStatus === 'ok' ? <><CheckCircle size={15} /> Updated!</> : pwStatus === 'saving' ? 'Updating…' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            </div>
        </AppShell>
    );
}
