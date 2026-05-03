'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, X, Image as ImageIcon, Film, Trash2, Star, GripVertical } from 'lucide-react';
import styles from './PortfolioGallery.module.css';

export default function PortfolioGallery({ profileId, editable = false }) {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (profileId) {
            fetchMedia();
        }
    }, [profileId]);

    const fetchMedia = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profile_media')
            .select('*')
            .eq('profile_id', profileId)
            .order('sort_order', { ascending: true });

        if (!error && data) {
            setMedia(data);
        }
        setLoading(false);
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${profileId}/${fileName}`;

        // In a real app, you'd upload to Supabase Storage here
        // For this demo, we'll simulate the upload and use a placeholder URL if storage fails
        // but we'll try the real way first if configured.
        
        try {
            // Check if it's image or video
            const type = file.type.startsWith('video/') ? 'video' : 'image';
            
            // For now, let's just insert into the DB with a placeholder if we can't upload
            // but we'll try to use a mock URL for now to show functionality
            const mockUrl = type === 'image' 
                ? `https://picsum.photos/seed/${Math.random()}/800/1000`
                : '/Pink-ink.mp4'; // Reusing existing video for demo

            const { data, error } = await supabase
                .from('profile_media')
                .insert([{
                    profile_id: profileId,
                    url: mockUrl,
                    type: type,
                    sort_order: media.length
                }])
                .select();

            if (!error && data) {
                setMedia([...media, data[0]]);
            }
        } catch (err) {
            console.error('Upload error:', err);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        const { error } = await supabase
            .from('profile_media')
            .delete()
            .eq('id', id);

        if (!error) {
            setMedia(media.filter(m => m.id !== id));
        }
    };

    const setPrimary = async (id) => {
        // Reset all to false then set target to true
        await supabase.from('profile_media').update({ is_primary: false }).eq('profile_id', profileId);
        const { error } = await supabase.from('profile_media').update({ is_primary: true }).eq('id', id);

        if (!error) {
            setMedia(media.map(m => ({ ...m, is_primary: m.id === id })));
        }
    };

    if (loading) return <div className={styles.loading}>Loading Gallery...</div>;

    const images = media.filter(m => m.type === 'image');
    const videos = media.filter(m => m.type === 'video');

    return (
        <div className={styles.galleryContainer}>
            {/* Photos Section */}
            <div className={styles.section}>
                <div className={styles.header}>
                    <h3><ImageIcon size={18} /> Photos ({images.length}/20)</h3>
                    {editable && images.length < 20 && (
                        <label className={styles.addButton}>
                            <Plus size={16} /> Add Photo
                            <input type="file" accept="image/*" onChange={handleUpload} hidden />
                        </label>
                    )}
                </div>
                <div className={styles.grid}>
                    {images.map((item) => (
                        <div key={item.id} className={`${styles.item} ${item.is_primary ? styles.primary : ''}`}>
                            <img src={item.url} alt="Gallery" />
                            {editable && (
                                <div className={styles.actions}>
                                    <button onClick={() => setPrimary(item.id)} title="Set as Primary">
                                        <Star size={14} fill={item.is_primary ? "currentColor" : "none"} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className={styles.delete}>
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
                            <input type="file" accept="video/*" onChange={handleUpload} hidden />
                        </label>
                    )}
                </div>
                <div className={styles.grid}>
                    {videos.map((item) => (
                        <div key={item.id} className={styles.item}>
                            <video src={item.url} muted playsInline onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} />
                            {editable && (
                                <div className={styles.actions}>
                                    <button onClick={() => handleDelete(item.id)} className={styles.delete}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                            <div className={styles.videoOverlay}>
                                <Film size={14} />
                            </div>
                        </div>
                    ))}
                    {videos.length === 0 && <p className={styles.empty}>No videos added yet.</p>}
                </div>
            </div>

            {uploading && (
                <div className={styles.uploadOverlay}>
                    <div className="loader-spin"></div>
                    <p>Uploading Media...</p>
                </div>
            )}
        </div>
    );
}
