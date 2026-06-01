'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Image as ImageIcon, Film, Trash2, Star, AlertCircle } from 'lucide-react';
import styles from './PortfolioGallery.module.css';

const BUCKET = 'portfolio';
const MIN_PHOTOS = 3;

export default function PortfolioGallery({ profileId, editable = false, isTalent = false }) {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);

    useEffect(() => {
        if (profileId) fetchMedia();
    }, [profileId]);

    const fetchMedia = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profile_media')
            .select('*')
            .eq('profile_id', profileId)
            .order('sort_order', { ascending: true });
        if (!error && data) setMedia(data);
        setLoading(false);
    };

    const handleUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setUploadError(null);

        const ext = file.name.split('.').pop().toLowerCase();
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const filePath = `${profileId}/${fileName}`;

        try {
            const { error: storageErr } = await supabase.storage
                .from(BUCKET)
                .upload(filePath, file, { contentType: file.type, upsert: false });

            if (storageErr) throw storageErr;

            const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

            const { data, error: dbErr } = await supabase
                .from('profile_media')
                .insert([{ profile_id: profileId, url: publicUrl, type, sort_order: media.length }])
                .select();

            if (dbErr) throw dbErr;
            if (data) setMedia(prev => [...prev, data[0]]);
        } catch (err) {
            console.error('Upload error:', err);
            setUploadError(err.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDelete = async (item) => {
        const url = item.url;
        // Extract storage path from public URL to delete from bucket
        const pathMatch = url.match(/\/storage\/v1\/object\/public\/portfolio\/(.+)/);
        if (pathMatch) {
            await supabase.storage.from(BUCKET).remove([pathMatch[1]]);
        }
        const { error } = await supabase.from('profile_media').delete().eq('id', item.id);
        if (!error) setMedia(prev => prev.filter(m => m.id !== item.id));
    };

    const setPrimary = async (id) => {
        await supabase.from('profile_media').update({ is_primary: false }).eq('profile_id', profileId);
        const { error } = await supabase.from('profile_media').update({ is_primary: true }).eq('id', id);
        if (!error) setMedia(prev => prev.map(m => ({ ...m, is_primary: m.id === id })));
    };

    if (loading) return <div className={styles.loading}>Loading Gallery...</div>;

    const images = media.filter(m => m.type === 'image');
    const videos = media.filter(m => m.type === 'video');
    const photosMissing = isTalent && editable && images.length < MIN_PHOTOS;

    return (
        <div className={styles.galleryContainer}>
            {/* Minimum photos banner */}
            {photosMissing && (
                <div className={styles.minPhotoBanner}>
                    <AlertCircle size={16} />
                    <span>
                        {images.length === 0
                            ? `Upload at least ${MIN_PHOTOS} photos to complete your profile`
                            : `${images.length}/${MIN_PHOTOS} photos — add ${MIN_PHOTOS - images.length} more to complete your profile`}
                    </span>
                </div>
            )}

            {uploadError && (
                <div className={styles.errorBanner}>
                    <AlertCircle size={14} /> {uploadError}
                </div>
            )}

            {/* Photos Section */}
            <div className={styles.section}>
                <div className={styles.header}>
                    <h3>
                        <ImageIcon size={18} /> Photos ({images.length}/20)
                        {isTalent && (
                            <span className={styles.minBadge} style={{ color: images.length >= MIN_PHOTOS ? 'var(--accent-emerald, #00ff88)' : 'var(--accent-gold, #ffc107)' }}>
                                {' '}· min {MIN_PHOTOS} required
                            </span>
                        )}
                    </h3>
                    {editable && images.length < 20 && (
                        <label className={styles.addButton}>
                            <Plus size={16} /> Add Photo
                            <input type="file" accept="image/*" onChange={e => handleUpload(e, 'image')} hidden disabled={uploading} />
                        </label>
                    )}
                </div>
                <div className={styles.grid}>
                    {images.map(item => (
                        <div key={item.id} className={`${styles.item} ${item.is_primary ? styles.primary : ''}`}>
                            <img src={item.url} alt="Portfolio" loading="lazy" />
                            {editable && (
                                <div className={styles.actions}>
                                    <button onClick={() => setPrimary(item.id)} title="Set as Primary">
                                        <Star size={14} fill={item.is_primary ? 'currentColor' : 'none'} />
                                    </button>
                                    <button onClick={() => handleDelete(item)} className={styles.delete}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    {images.length === 0 && <p className={styles.empty}>No photos added yet.</p>}
                </div>
            </div>

            {/* Videos Section */}
            <div className={styles.section}>
                <div className={styles.header}>
                    <h3><Film size={18} /> Videos ({videos.length}/20)</h3>
                    {editable && videos.length < 20 && (
                        <label className={styles.addButton}>
                            <Plus size={16} /> Add Video
                            <input type="file" accept="video/*" onChange={e => handleUpload(e, 'video')} hidden disabled={uploading} />
                        </label>
                    )}
                </div>
                <div className={styles.grid}>
                    {videos.map(item => (
                        <div key={item.id} className={styles.item}>
                            <video src={item.url} muted playsInline onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} />
                            {editable && (
                                <div className={styles.actions}>
                                    <button onClick={() => handleDelete(item)} className={styles.delete}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                            <div className={styles.videoOverlay}><Film size={14} /></div>
                        </div>
                    ))}
                    {videos.length === 0 && <p className={styles.empty}>No videos added yet.</p>}
                </div>
            </div>

            {uploading && (
                <div className={styles.uploadOverlay}>
                    <div className="loader-spin"></div>
                    <p>Uploading...</p>
                </div>
            )}
        </div>
    );
}
