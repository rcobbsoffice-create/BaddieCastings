'use client';

import { useState } from 'react';
import AppShell from '@/components/AppShell';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import styles from '../settings.module.css';

export default function PrivacyPage() {
    const router = useRouter();
    const [profileVisible, setProfileVisible] = useState(true);
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [pwSaved, setPwSaved] = useState(false);

    const handleChangePw = (e) => {
        e.preventDefault();
        setPwSaved(true);
        setCurrentPw('');
        setNewPw('');
        setTimeout(() => setPwSaved(false), 2000);
    };

    return (
        <AppShell>
            <div className={styles.page}>
                <div className={styles.header}>
                    <button className={styles.back} onClick={() => router.back()}>
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className={styles.title}>Privacy & Security</h1>
                    <div style={{ width: 36 }} />
                </div>

                {/* Profile Visibility */}
                <section className={styles.section}>
                    <p className={styles.groupLabel}>Privacy</p>
                    <div className={styles.settingsList}>
                        <div className={styles.toggleRow}>
                            <div>
                                <p className={styles.toggleLabel}>Public Profile</p>
                                <p className={styles.toggleDesc}>Allow agents and brands to discover your profile</p>
                            </div>
                            <button
                                className={`${styles.toggle} ${profileVisible ? styles.toggleOn : ''}`}
                                onClick={() => setProfileVisible(!profileVisible)}
                                aria-label="Profile visibility"
                            >
                                <span className={styles.toggleThumb} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Change Password */}
                <section className={styles.section}>
                    <p className={styles.groupLabel}>Security</p>
                    <div className={styles.settingsList}>
                        <form onSubmit={handleChangePw} className={styles.pwForm}>
                            <div className={styles.field} style={{ padding: '16px 18px 0' }}>
                                <label className={styles.label}><Lock size={13} /> Current Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        className="input"
                                        value={currentPw}
                                        onChange={e => setCurrentPw(e.target.value)}
                                        placeholder="Enter current password"
                                        required
                                        style={{ paddingRight: 44 }}
                                    />
                                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className={styles.field} style={{ padding: '12px 18px 16px' }}>
                                <label className={styles.label}><Shield size={13} /> New Password</label>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    className="input"
                                    value={newPw}
                                    onChange={e => setNewPw(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                />
                            </div>
                            <div style={{ padding: '0 18px 16px' }}>
                                <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                                    {pwSaved ? '✓ Password Updated!' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            </div>
        </AppShell>
    );
}
