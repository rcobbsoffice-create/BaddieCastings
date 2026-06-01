'use client';

import { useRef, useState } from 'react';
import AppShell from '@/components/AppShell';
import { useRouter } from 'next/navigation';
import { ChevronLeft, User, Phone, Mail, MapPin, Camera } from 'lucide-react';
import styles from '../settings.module.css';

export default function AccountSettingsPage() {
    const router = useRouter();
    const fileInputRef = useRef(null);
    const [avatar, setAvatar] = useState(null); // holds data URL of chosen image
    const [form, setForm] = useState({
        name: 'Jasmine Carter',
        phone: '+1 (404) 555-0192',
        email: 'talent@baddiecastings.com',
        city: 'Atlanta, GA',
    });
    const [saved, setSaved] = useState(false);

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setAvatar(reader.result);
        reader.readAsDataURL(file);
    };

    const handleSave = (e) => {
        e.preventDefault();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <AppShell>
            <div className={styles.page}>
                <div className={styles.header}>
                    <button className={styles.back} onClick={() => router.back()}>
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className={styles.title}>Account Settings</h1>
                    <div style={{ width: 36 }} />
                </div>

                {/* Avatar */}
                <div className={styles.avatarSection}>
                    {avatar ? (
                        <img
                            src={avatar}
                            alt="Profile"
                            style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,0,122,0.4)', boxShadow: '0 0 28px rgba(255,0,122,0.3)' }}
                        />
                    ) : (
                        <div className={styles.avatar}>JC</div>
                    )}

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="photo-upload"
                        onChange={handlePhotoChange}
                    />
                    <button
                        type="button"
                        className={styles.changePhoto}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Camera size={14} />
                        Change Photo
                    </button>
                </div>

                <form className={styles.form} onSubmit={handleSave}>
                    {[
                        { icon: User, label: 'Full Name', key: 'name', type: 'text' },
                        { icon: Phone, label: 'Phone Number', key: 'phone', type: 'tel' },
                        { icon: Mail, label: 'Email', key: 'email', type: 'email' },
                        { icon: MapPin, label: 'City', key: 'city', type: 'text' },
                    ].map(({ icon: Icon, label, key, type }) => (
                        <div key={key} className={styles.field}>
                            <label className={styles.label}>
                                <Icon size={14} />
                                {label}
                            </label>
                            <input
                                type={type}
                                className="input"
                                value={form[key]}
                                onChange={e => setForm({ ...form, [key]: e.target.value })}
                            />
                        </div>
                    ))}

                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }}>
                        {saved ? '✓ Saved!' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </AppShell>
    );
}
