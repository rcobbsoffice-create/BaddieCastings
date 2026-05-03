'use client';

import AppShell from '@/components/AppShell';
import { ShieldCheck, Link2, FileText, Send, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import styles from './page.module.css';

export default function VerificationPage() {
    const [type, setType] = useState('agent'); // 'agent' | 'creator'
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <AppShell>
                <div className={styles.successPage}>
                    <div className={styles.successIcon}><CheckCircle2 size={48} /></div>
                    <h1 className={styles.successTitle}>Application Submitted!</h1>
                    <p className={styles.successDesc}>
                        Our team will review your {type} verification request within 24–48 hours.
                        You will receive a notification once your status is updated.
                    </p>
                    <button className="btn-primary" onClick={() => window.location.href = '/'}>Return Home</button>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="page-header">
                <h1 className="page-title">Verification</h1>
                <p className="page-subtitle">Get verified to unlock full platform features</p>
            </div>

            <div className={styles.content}>
                <div className={styles.typeSelector}>
                    <button
                        className={`${styles.typeBtn} ${type === 'agent' ? styles.active : ''}`}
                        onClick={() => setType('agent')}
                    >
                        Agent / Brand
                    </button>
                    <button
                        className={`${styles.typeBtn} ${type === 'creator' ? styles.active : ''}`}
                        onClick={() => setType('creator')}
                    >
                        Creator
                    </button>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={`card ${styles.formCard}`}>
                        <div className={styles.field}>
                            <label className={styles.label}>Full Name / Business Name</label>
                            <input className="input" placeholder="e.g. Club Onyx or Jasmine Carter" required />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Instagram Handle</label>
                            <div className={styles.inputWithIcon}>
                                <Link2 size={16} />
                                <input className="input" placeholder="@handle" required />
                            </div>
                        </div>

                        {type === 'agent' ? (
                            <>
                                <div className={styles.field}>
                                    <label className={styles.label}>Business Type</label>
                                    <select className="input">
                                        <option>Nightclub</option>
                                        <option>Brand</option>
                                        <option>Event Organizer</option>
                                    </select>
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>References (Instagram handles or names)</label>
                                    <textarea className="input" placeholder="Past talent or businesses you've worked with..." rows={3} />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={styles.field}>
                                    <label className={styles.label}>Portfolio / Website Link</label>
                                    <div className={styles.inputWithIcon}>
                                        <Link2 size={16} />
                                        <input className="input" placeholder="https://..." required />
                                    </div>
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Service Type</label>
                                    <select className="input">
                                        <option>Photography</option>
                                        <option>Videography</option>
                                        <option>Content Creation (Phone)</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <div className={styles.field}>
                            <label className={styles.label}>Bio / Work History</label>
                            <textarea className="input" placeholder="Tell us about yourself..." rows={4} required />
                        </div>

                        <p className={styles.disclaimer}>
                            <ShieldCheck size={12} />
                            Admin will review your social media and references manually.
                        </p>

                        <button type="submit" className="btn-primary" id="btn-submit-verification" style={{ width: '100%', marginTop: 12 }}>
                            <Send size={15} /> Submit for Verification
                        </button>
                    </div>
                </form>
            </div>
        </AppShell>
    );
}
