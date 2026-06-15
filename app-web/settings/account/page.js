'use client';

import { useRef, useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { useRouter } from 'next/navigation';
import { ChevronLeft, User, Phone, Mail, MapPin, Camera, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from '../settings.module.css';

export default function AccountSettingsPage() {
    const router = useRouter();
    const fileInputRef = useRef(null);
    const [userId, setUserId] = useState(null);
    const [avatar, setAvatar] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', email: '', city: '' });
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, phone, email, city, avatar_url')
                .eq('id', user.id)
                .single();
            if (profile) {
                setForm({
                    name: profile.full_name || '',
                    phone: profile.phone || '',
                    email: profile.email || user.email || '',
                    city: profile.city || '',
                });
                if (profile.avatar_url) setAvatar(profile.avatar_url);
            }
            setLoading(false);
        };
        load();
    }, []);

    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !userId) return;

        const reader = new FileReader();
        reader.onload = () => setAvatar(reader.result);
        reader.readAsDataURL(file);

        setUploading(true);
        const ext = file.name.split('.').pop();
        const path = `${userId}/avatar.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(path, file, { upsert: true, contentType: file.type });

        if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
            await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);
            setAvatar(publicUrl);
        }
        setUploading(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!userId) return;
        await supabase.from('profiles').update({
            full_name: form.name,
            phone: form.phone,
            city: form.city,
        }).eq('id', userId);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const initials = form.name.trim().split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

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

                <div className={styles.avatarSection}>
                    {avatar ? (
                        <img
                            src={avatar}
                            alt="Profile"
                            style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,0,122,0.4)', boxShadow: '0 0 28px rgba(255,0,122,0.3)' }}
                        />
                    ) : (
                        <div className={styles.avatar}>{loading ? '…' : initials}</div>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handlePhotoChange}
                    />
                    <button
                        type="button"
                        className={styles.changePhoto}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        <Camera size={14} />
                        {uploading ? 'Uploading…' : 'Change Photo'}
                    </button>
                </div>

                <form className={styles.form} onSubmit={handleSave}>
                    {[
                        { icon: User,  label: 'Full Name',     key: 'name',  type: 'text' },
                        { icon: Phone, label: 'Phone Number',  key: 'phone', type: 'tel' },
                        { icon: Mail,  label: 'Email',         key: 'email', type: 'email', disabled: true },
                        { icon: MapPin,label: 'City',          key: 'city',  type: 'text' },
                    ].map(({ icon: Icon, label, key, type, disabled }) => (
                        <div key={key} className={styles.field}>
                            <label className={styles.label}><Icon size={14} />{label}</label>
                            <input
                                type={type}
                                className="input"
                                value={form[key]}
                                onChange={e => setForm({ ...form, [key]: e.target.value })}
                                disabled={!!disabled}
                                style={disabled ? { opacity: 0.5 } : {}}
                            />
                        </div>
                    ))}
                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }}>
                        {saved ? <><CheckCircle size={16} /> Saved!</> : 'Save Changes'}
                    </button>
                </form>
            </div>
        </AppShell>
    );
}
