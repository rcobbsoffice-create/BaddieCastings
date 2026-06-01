import { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity,
    FlatList, ActivityIndicator, Alert, ScrollView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase-native';

const BUCKET = 'portfolio';
const MIN_PHOTOS = 3;

export default function PortfolioGallery({ profileId, editable = false, isTalent = false }) {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

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

    const requestPermission = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please allow access to your photo library in Settings.');
                return false;
            }
        }
        return true;
    };

    const pickAndUpload = async (mediaType) => {
        const hasPermission = await requestPermission();
        if (!hasPermission) return;

        const options = {
            mediaTypes: mediaType === 'video'
                ? ImagePicker.MediaTypeOptions.Videos
                : ImagePicker.MediaTypeOptions.Images,
            quality: 0.85,
            allowsEditing: false,
            allowsMultipleSelection: false,
            videoMaxDuration: 120,
        };

        const result = await ImagePicker.launchImageLibraryAsync(options);
        if (result.canceled || !result.assets?.length) return;

        const asset = result.assets[0];
        setUploading(true);

        try {
            const uri = asset.uri;
            const ext = uri.split('.').pop().toLowerCase() || (mediaType === 'video' ? 'mp4' : 'jpg');
            const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
            const filePath = `${profileId}/${fileName}`;
            const mimeType = asset.mimeType || (mediaType === 'video' ? `video/${ext}` : `image/${ext}`);

            // Fetch blob from local URI and upload
            const response = await fetch(uri);
            const blob = await response.blob();

            const { error: storageErr } = await supabase.storage
                .from(BUCKET)
                .upload(filePath, blob, { contentType: mimeType, upsert: false });

            if (storageErr) throw storageErr;

            const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

            const { data, error: dbErr } = await supabase
                .from('profile_media')
                .insert([{ profile_id: profileId, url: publicUrl, type: mediaType, sort_order: media.length }])
                .select();

            if (dbErr) throw dbErr;
            if (data) setMedia(prev => [...prev, data[0]]);
        } catch (err) {
            console.error('Upload error:', err);
            Alert.alert('Upload Failed', err.message || 'Something went wrong. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (item) => {
        Alert.alert('Delete Media', 'Are you sure you want to remove this?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    const pathMatch = item.url.match(/\/storage\/v1\/object\/public\/portfolio\/(.+)/);
                    if (pathMatch) await supabase.storage.from(BUCKET).remove([pathMatch[1]]);
                    const { error } = await supabase.from('profile_media').delete().eq('id', item.id);
                    if (!error) setMedia(prev => prev.filter(m => m.id !== item.id));
                }
            }
        ]);
    };

    const setPrimary = async (id) => {
        await supabase.from('profile_media').update({ is_primary: false }).eq('profile_id', profileId);
        await supabase.from('profile_media').update({ is_primary: true }).eq('id', id);
        setMedia(prev => prev.map(m => ({ ...m, is_primary: m.id === id })));
    };

    if (loading) return (
        <View style={s.center}>
            <ActivityIndicator color="#FF007A" />
            <Text style={s.loadingText}>Loading Gallery...</Text>
        </View>
    );

    const images = media.filter(m => m.type === 'image');
    const videos = media.filter(m => m.type === 'video');
    const photosNeeded = MIN_PHOTOS - images.length;

    return (
        <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
            {/* Min photos banner */}
            {isTalent && editable && images.length < MIN_PHOTOS && (
                <View style={s.minBanner}>
                    <Text style={s.minBannerText}>
                        📸 {images.length}/{MIN_PHOTOS} photos — add {photosNeeded} more to complete your profile
                    </Text>
                </View>
            )}

            {/* Photos */}
            <View style={s.section}>
                <View style={s.sectionHeader}>
                    <Text style={s.sectionTitle}>
                        📷 Photos ({images.length}/20)
                        {isTalent ? `  ·  min ${MIN_PHOTOS} required` : ''}
                    </Text>
                    {editable && images.length < 20 && (
                        <TouchableOpacity style={s.addBtn} onPress={() => pickAndUpload('image')} disabled={uploading}>
                            <Text style={s.addBtnText}>+ Add Photo</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={s.grid}>
                    {images.map(item => (
                        <View key={item.id} style={[s.thumb, item.is_primary && s.primaryThumb]}>
                            <Image source={{ uri: item.url }} style={s.thumbImg} resizeMode="cover" />
                            {editable && (
                                <View style={s.thumbActions}>
                                    <TouchableOpacity onPress={() => setPrimary(item.id)} style={s.thumbBtn}>
                                        <Text style={{ fontSize: 10, color: item.is_primary ? '#FFD700' : '#fff' }}>★</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete(item)} style={[s.thumbBtn, s.deleteBtn]}>
                                        <Text style={{ fontSize: 10, color: '#fff' }}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    ))}
                    {images.length === 0 && <Text style={s.empty}>No photos yet. Add at least {MIN_PHOTOS}.</Text>}
                </View>
            </View>

            {/* Videos */}
            <View style={s.section}>
                <View style={s.sectionHeader}>
                    <Text style={s.sectionTitle}>🎬 Videos ({videos.length}/20)</Text>
                    {editable && videos.length < 20 && (
                        <TouchableOpacity style={s.addBtn} onPress={() => pickAndUpload('video')} disabled={uploading}>
                            <Text style={s.addBtnText}>+ Add Video</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={s.grid}>
                    {videos.map(item => (
                        <View key={item.id} style={s.thumb}>
                            <View style={s.videoPlaceholder}>
                                <Text style={s.videoIcon}>▶</Text>
                                <Text style={s.videoLabel} numberOfLines={1}>Video</Text>
                            </View>
                            {editable && (
                                <View style={s.thumbActions}>
                                    <TouchableOpacity onPress={() => handleDelete(item)} style={[s.thumbBtn, s.deleteBtn]}>
                                        <Text style={{ fontSize: 10, color: '#fff' }}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    ))}
                    {videos.length === 0 && <Text style={s.empty}>No videos yet.</Text>}
                </View>
            </View>

            {uploading && (
                <View style={s.uploadingBanner}>
                    <ActivityIndicator color="#FF007A" size="small" />
                    <Text style={s.uploadingText}>Uploading...</Text>
                </View>
            )}
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container:      { flex: 1 },
    center:         { alignItems: 'center', padding: 24, gap: 8 },
    loadingText:    { color: '#888', fontSize: 13 },
    section:        { marginBottom: 24 },
    sectionHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle:   { color: '#fff', fontSize: 14, fontWeight: '700' },
    addBtn:         { backgroundColor: '#FF007A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    addBtnText:     { color: '#fff', fontSize: 12, fontWeight: '700' },
    grid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    thumb:          { width: '31%', aspectRatio: 0.75, borderRadius: 8, overflow: 'hidden', backgroundColor: '#1a1a2e', position: 'relative' },
    primaryThumb:   { borderWidth: 2, borderColor: '#FF007A' },
    thumbImg:       { width: '100%', height: '100%' },
    thumbActions:   { position: 'absolute', top: 4, right: 4, flexDirection: 'row', gap: 4 },
    thumbBtn:       { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
    deleteBtn:      { backgroundColor: 'rgba(255,0,0,0.7)' },
    videoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a' },
    videoIcon:      { fontSize: 24, color: '#FF007A' },
    videoLabel:     { fontSize: 10, color: '#888', marginTop: 4 },
    empty:          { color: '#666', fontSize: 13, fontStyle: 'italic', padding: 8 },
    minBanner:      { backgroundColor: 'rgba(255,193,7,0.12)', borderWidth: 1, borderColor: 'rgba(255,193,7,0.4)', borderRadius: 10, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center' },
    minBannerText:  { color: '#ffc107', fontSize: 13, fontWeight: '600', flex: 1 },
    uploadingBanner:{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,0,122,0.1)', borderRadius: 10, padding: 12, marginTop: 8 },
    uploadingText:  { color: '#FF007A', fontSize: 13, fontWeight: '600' },
});
