import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, Dimensions, ActivityIndicator, 
  Image, TouchableOpacity, Platform, Animated, Easing
} from 'react-native';
import { Play } from 'lucide-react-native';
import { supabase } from '../lib/supabase-native';
import { Colors, Spacing } from './Theme';

const { width: initialWidth } = Dimensions.get('window');

const FALLBACK_VIDEOS = [
  { 
    id: 1, 
    youtube_id: 'S_n5O2pGg0I', 
    title: 'Wild \'N Out', 
    subtitle: 'Baddie Castings Talent on Set',
    poster: 'https://img.youtube.com/vi/S_n5O2pGg0I/maxresdefault.jpg'
  },
  { 
    id: 2, 
    youtube_id: 'S_n5O2pGg0I', 
    title: 'Music Video Shoot', 
    subtitle: 'Background & Lead Talent',
    poster: 'https://img.youtube.com/vi/S_n5O2pGg0I/maxresdefault.jpg'
  },
];

export default function VideoReel() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [WebView, setWebView] = useState(null);
  
  // Animation state
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Breathing glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.8, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(glowOpacity, { toValue: 0.3, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();

    if (Platform.OS !== 'web') {
      try {
        const NativeWebView = require('react-native-webview').WebView;
        setWebView(() => NativeWebView);
      } catch (e) {
        console.warn('WebView failed to load', e);
      }
    }
  }, []);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const { data } = await supabase
          .from('featured_videos')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        
        if (data && data.length > 0) {
          const mapped = data.map(v => ({
            ...v,
            poster: v.poster || `https://img.youtube.com/vi/${v.youtube_id}/maxresdefault.jpg`
          }));
          setVideos(mapped);
        } else {
          setVideos(FALLBACK_VIDEOS);
        }
      } catch (err) {
        setVideos(FALLBACK_VIDEOS);
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, []);

  const handleMouseMove = (e) => {
    if (Platform.OS !== 'web') return;
    const { pageX, pageY } = e.nativeEvent;
    // Simple 3D tilt calculation based on mouse position relative to window center
    // Ideally we'd use getBoundingClientRect but this is a solid approximation for a centered reel
    const centerX = initialWidth / 2;
    const centerY = 400; // Approx vertical position
    const moveX = (pageX - centerX) / 20;
    const moveY = (pageY - centerY) / 20;

    Animated.parallel([
      Animated.spring(tiltX, { toValue: -moveY, friction: 7, tension: 40, useNativeDriver: true }),
      Animated.spring(tiltY, { toValue: moveX, friction: 7, tension: 40, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1.05, friction: 7, tension: 40, useNativeDriver: true }),
    ]).start();
  };

  const handleMouseLeave = () => {
    Animated.parallel([
      Animated.spring(tiltX, { toValue: 0, friction: 7, useNativeDriver: true }),
      Animated.spring(tiltY, { toValue: 0, friction: 7, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, useNativeDriver: true }),
    ]).start();
  };

  if (loading) {
    return (
      <View style={s.loader}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const activeVideo = videos[current];
  const videoUrl = `https://www.youtube.com/embed/${activeVideo?.youtube_id}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&playlist=${activeVideo?.youtube_id}&loop=1`;

  const animatedStyle = {
    transform: [
      { perspective: 1000 },
      { rotateX: tiltX.interpolate({ inputRange: [-20, 20], outputRange: ['-10deg', '10deg'] }) },
      { rotateY: tiltY.interpolate({ inputRange: [-20, 20], outputRange: ['-10deg', '10deg'] }) },
      { scale: scale }
    ]
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.badge}>
          <Text style={s.badgeText}>SHOWCASE</Text>
        </View>
        <Text style={s.title}>Talent in Action</Text>
      </View>

      <View style={s.mainWrapper} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        {/* Dual-Tone Neon Glow Rings */}
        <Animated.View style={[s.glowRing, { borderColor: Colors.primary, opacity: glowOpacity }]} />
        <Animated.View style={[s.glowRing, { 
          borderColor: Colors.accentPurple, 
          opacity: glowOpacity, 
          transform: [{ scale: 1.05 }],
          // Offset the pulse slightly for a more dynamic feel
        }]} />
        
        <Animated.View style={[s.videoCard, animatedStyle]}>
          <View style={s.playerContainer}>
            <View style={s.cropWrapper}>
              {Platform.OS === 'web' ? (
                <iframe
                  src={videoUrl}
                  style={{ 
                    width: '110%', 
                    height: '110%', 
                    border: 'none',
                    position: 'absolute',
                    top: '-5%',
                    left: '-5%',
                  }}
                  allow="autoplay; fullscreen"
                />
              ) : (
                WebView ? (
                  <WebView
                    style={[s.webview, { width: '110%', height: '110%', position: 'absolute', top: '-5%', left: '-5%' }]}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    source={{ uri: videoUrl }}
                  />
                ) : (
                  <View style={s.loader}><ActivityIndicator color={Colors.primary} /></View>
                )
              )}
              {/* Invisible shield to handle interactions while allowing autoplay */}
              <TouchableOpacity activeOpacity={1} style={s.shield} onPress={() => setIsPlaying(!isPlaying)} />
            </View>
          </View>
          
          <View style={s.videoInfo}>
            <Text style={s.vTitle}>{activeVideo.title}</Text>
            <Text style={s.vSub}>{activeVideo.subtitle}</Text>
          </View>
        </Animated.View>
      </View>

      <View style={s.footer}>
        <View style={s.dots}>
          {videos.map((_, i) => (
            <TouchableOpacity 
              key={i} 
              onPress={() => { setIsPlaying(true); setCurrent(i); }}
              style={[s.dot, current === i && s.dotActive]} 
            />
          ))}
        </View>
        
        <View style={s.partners}>
          <View style={s.partnerLogos}>
            <Image source={require('../public/mtv_white.png')} style={s.pLogo} resizeMode="contain" />
            <Image source={require('../public/bet_white.png')} style={s.pLogo} resizeMode="contain" />
            <Image source={require('../public/tvone_white.png')} style={s.pLogo} resizeMode="contain" />
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginVertical: 60 },
  loader: { height: 250, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 24, marginBottom: 24, alignItems: 'center' },
  badge: { 
    backgroundColor: 'rgba(255,45,85,0.15)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8,
    marginBottom: 12
  },
  badgeText: { color: Colors.primary, fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
  title: { color: Colors.text, fontSize: 32, fontWeight: '900', textAlign: 'center' },
  
  mainWrapper: { 
    paddingHorizontal: 30, 
    alignItems: 'center', 
    justifyContent: 'center',
    zIndex: 5
  },
  glowRing: {
    position: 'absolute',
    width: '90%',
    aspectRatio: 16/9,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.primary,
    // Bloom effect for web
    ...Platform.select({
      web: {
        filter: 'blur(20px)',
        boxShadow: `0 0 40px ${Colors.primary}`,
      }
    })
  },
  videoCard: { 
    width: '100%',
    maxWidth: 800,
    aspectRatio: 16/9,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 10,
    ...Platform.select({
      web: {
        boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
      },
      native: {
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      }
    })
  },
  playerContainer: { flex: 1, backgroundColor: '#000' },
  cropWrapper: { 
    width: '100%', 
    height: '100%', 
    overflow: 'hidden', 
    position: 'relative' 
  },
  shield: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'transparent',
    zIndex: 20,
  },
  videoInfo: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: 24, 
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  vTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  vSub: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  
  footer: { marginTop: 40, paddingHorizontal: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 40 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive: { backgroundColor: Colors.primary, width: 32 },
  
  partners: { alignItems: 'center', opacity: 0.6 },
  partnerLogos: { flexDirection: 'row', alignItems: 'center', gap: 48 },
  pLogo: { width: 80, height: 40 },
  webview: { flex: 1 },
});
