'use client';

import { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import { supabase } from '@/lib/supabase';
import {
  DollarSign, Users, TrendingUp, ShoppingBag, BarChart2,
  CheckCircle, XCircle, Clock, Bell, Star, Settings,
  Mail, Eye, EyeOff, Search, Filter, ChevronRight,
  Zap, RefreshCw, Trash2, MessageSquare, X
} from 'lucide-react';
import CastingStudio from '@/components/CastingStudio';
import SystemControlHub from '@/components/SystemControlHub';
import PortfolioGallery from '@/components/PortfolioGallery';
import styles from './page.module.css';

// ─── Tab definitions ──────────────────────────────────────────────────────
const TABS = ['Overview', 'Applications', 'Submissions', 'Talent', 'Content', 'Settings'];

export default function AgencyDashboard() {
  const [tab, setTab] = useState('Overview');
  const [expandedSub, setExpandedSub] = useState(null);
  const [showCastingModal, setShowCastingModal]   = useState(false);
  const [showConfigModal, setShowConfigModal]     = useState(false);
  const [announcementText, setAnnouncementText]   = useState('');
  const [postingAnn, setPostingAnn]               = useState(false);
  const [submissionSearch, setSubmissionSearch]   = useState('');
  const [submissionFilter, setSubmissionFilter]   = useState('all');
  const [loadingAnn, setLoadingAnn]               = useState(false);

  // Video Management State
  const [featuredVideos, setFeaturedVideos] = useState([]);
  const [newVideo, setNewVideo] = useState({ youtube_id: '', title: '', subtitle: '' });
  const [addingVideo, setAddingVideo] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [updatingVideo, setUpdatingVideo] = useState(false);

  const [colors, setColors] = useState({
    saturday: { name: 'Hot Pink',     hex: '#FF007A' },
    sunday:   { name: 'Royal Purple', hex: '#9B59FF' },
  });

  const [stats, setStats] = useState({
    totalTalent: 0, pendingApps: 0, activeBookings: 0,
    totalRevenue: 0, uniformsSold: 0, newSubmissions: 0,
  });

  const [applications,  setApplications]  = useState([]);
  const [submissions,   setSubmissions]   = useState([]);
  const [profiles,      setProfiles]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedApps,  setSelectedApps]  = useState(new Set());
  const [ratingModal,   setRatingModal]   = useState(null); // talent profile object
  const [ratingValue,   setRatingValue]   = useState(5);

  // ─── Fetch all data ───────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [appsRes, subsRes, profRes, shiftRes, txRes, settingsRes, videosRes] = await Promise.all([
        supabase.from('applications').select('*').order('created_at', { ascending: false }),
        supabase.from('form_submissions').select('*').order('submitted_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('shifts').select('id, confirmed').eq('confirmed', true),
        supabase.from('transactions').select('amount').eq('status', 'paid'),
        supabase.from('settings').select('value').eq('key', 'currentWeekendColors').single(),
        supabase.from('featured_videos').select('*').order('sort_order', { ascending: true }),
      ]);

      const apps   = appsRes.data   || [];
      const subs   = subsRes.data   || [];
      const profs  = profRes.data   || [];
      const shifts = shiftRes.data  || [];
      const txns   = txRes.data     || [];
      const videos = videosRes.data || [];

      if (settingsRes.data?.value) setColors(settingsRes.data.value);

      setApplications(apps);
      setSubmissions(subs);
      setProfiles(profs);
      setFeaturedVideos(videos);

      const revenue = txns.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

      setStats({
        totalTalent:    profs.filter(p => p.role === 'talent' && p.status === 'active').length,
        pendingApps:    apps.filter(a => a.status === 'pending').length,
        activeBookings: shifts.length,
        totalRevenue:   revenue,
        uniformsSold:   0, // populated from orders if needed
        newSubmissions: subs.filter(s => !s.is_read).length,
      });
    } catch (err) {
      console.error('Agency fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchAll(); 
    
    // ─── Real-time Submissions ──────────────────────────────────────────
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'form_submissions' }, (payload) => {
        setSubmissions(prev => [payload.new, ...prev]);
        setStats(s => ({ ...s, newSubmissions: s.newSubmissions + 1 }));
        // Optional: play a subtle notification sound or show a toast
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  // ─── Video Management ──────────────────────────────────────────────────
  const extractYouTubeId = (url) => {
    if (!url) return '';
    if (url.length === 11) return url; // Already an ID
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  };

  const handleAddVideo = async () => {
    const videoId = extractYouTubeId(newVideo.youtube_id);
    if (!videoId || !newVideo.title) return;
    setAddingVideo(true);
    const { data, error } = await supabase.from('featured_videos').insert([
      { ...newVideo, youtube_id: videoId, sort_order: featuredVideos.length }
    ]).select();

    if (!error && data) {
      setFeaturedVideos(prev => [...prev, data[0]]);
      setNewVideo({ youtube_id: '', title: '', subtitle: '' });
    }
    setAddingVideo(false);
  };

  const handleDeleteVideo = async (id) => {
    const { error } = await supabase.from('featured_videos').delete().eq('id', id);
    if (!error) setFeaturedVideos(prev => prev.filter(v => v.id !== id));
  };

  const handleUpdateVideo = async () => {
    const videoId = extractYouTubeId(editingVideo.youtube_id);
    if (!videoId || !editingVideo.title) return;
    setUpdatingVideo(true);
    const { error } = await supabase.from('featured_videos')
      .update({
        youtube_id: videoId,
        title: editingVideo.title,
        subtitle: editingVideo.subtitle
      })
      .eq('id', editingVideo.id);

    if (!error) {
      setFeaturedVideos(prev => prev.map(v => v.id === editingVideo.id ? { ...editingVideo, youtube_id: videoId } : v));
      setEditingVideo(null);
    }
    setUpdatingVideo(false);
  };

  // ─── Application status update ────────────────────────────────────────
  const handleAppStatus = async (id, status) => {
    const { error } = await supabase.from('applications').update({ status }).eq('id', id);
    if (!error) setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  // ─── Mark submission read ─────────────────────────────────────────────
  const markRead = async (id) => {
    await supabase.from('form_submissions').update({ is_read: true }).eq('id', id);
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, is_read: true } : s));
  };

  // ─── Update submission status ─────────────────────────────────────────
  const updateSubStatus = async (id, status) => {
    await supabase.from('form_submissions').update({ status }).eq('id', id);
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  // ─── Delete submission ────────────────────────────────────────────────
  const handleDeleteSubmission = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this submission?')) return;
    
    const { error } = await supabase.from('form_submissions').delete().eq('id', id);
    if (!error) {
      setSubmissions(prev => prev.filter(s => s.id !== id));
      if (expandedSub === id) setExpandedSub(null);
    }
  };

  // ─── Clear all submissions ──────────────────────────────────────────
  const [clearingSubmissions, setClearingSubmissions] = useState(false);

  const handleClearSubmissions = async () => {
    const count = filteredSubs.length;
    if (count === 0) return;

    const confirmMsg = submissionFilter === 'all'
      ? `Are you sure you want to PERMANENTLY DELETE ALL ${count} submissions?`
      : `Are you sure you want to PERMANENTLY DELETE the ${count} filtered submissions (${submissionFilter})?`;

    if (!window.confirm(confirmMsg)) return;

    setClearingSubmissions(true);
    const idsToDelete = filteredSubs.map(s => s.id);
    try {
      const { error } = await supabase.from('form_submissions').delete().in('id', idsToDelete);
      if (error) {
        console.error('Clear submissions error:', error);
        alert(`Failed to delete submissions: ${error.message}`);
      } else {
        setSubmissions(prev => prev.filter(s => !idsToDelete.includes(s.id)));
        setExpandedSub(null);
      }
    } catch (err) {
      console.error('Clear submissions exception:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setClearingSubmissions(false);
    }
  };

  // ─── Bulk application actions ─────────────────────────────────────────────
  const handleBulkStatus = async (status) => {
    const ids = [...selectedApps];
    if (!ids.length) return;
    await supabase.from('applications').update({ status }).in('id', ids);
    setApplications(prev => prev.map(a => ids.includes(a.id) ? { ...a, status } : a));
    setSelectedApps(new Set());
  };

  const toggleSelectApp = (id) => setSelectedApps(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleSelectAll = () => {
    const pending = applications.filter(a => a.status === 'pending').map(a => a.id);
    setSelectedApps(prev => prev.size === pending.length ? new Set() : new Set(pending));
  };

  // ─── Rate talent ──────────────────────────────────────────────────────────
  const handleRateTalent = async () => {
    if (!ratingModal) return;
    const current = ratingModal.rating || 0;
    const shifts  = Math.max(ratingModal.shifts_worked || 1, 1);
    const newRating = parseFloat(((current * (shifts - 1) + ratingValue) / shifts).toFixed(1));
    await supabase.from('profiles').update({ rating: newRating }).eq('id', ratingModal.id);
    setProfiles(prev => prev.map(p => p.id === ratingModal.id ? { ...p, rating: newRating } : p));
    setRatingModal(null);
  };

  // ─── Post announcement ────────────────────────────────────────────────
  const handlePostAnnouncement = async () => {
    if (!announcementText.trim()) return;
    setPostingAnn(true);
    try {
      await supabase.from('announcements').insert([{
        title:     'Agency Update 📣',
        body:      announcementText.substring(0, 100),
        full_text: announcementText,
        author:    'Agency',
        icon:      '📣',
      }]);
      setAnnouncementText('');
    } catch (err) { console.error(err); }
    finally { setPostingAnn(false); }
  };

  // ─── Save weekend colors ──────────────────────────────────────────────
  const handleSaveColors = async () => {
    setLoadingAnn(true);
    await supabase.from('settings').upsert({ key: 'currentWeekendColors', value: colors });
    await supabase.from('notifications').insert([{
      type: 'info', title: 'New Weekend Color Drop! 🎨',
      body: `New colors: ${Object.values(colors).map(c => c.name).join(', ')}`,
      unread: true, icon: 'Zap', color: 'var(--accent-gold)',
    }]);
    setLoadingAnn(false);
  };

  // ─── Filtered submissions ─────────────────────────────────────────────
  const filteredSubs = submissions.filter(s => {
    const matchSearch = !submissionSearch ||
      s.email?.toLowerCase().includes(submissionSearch.toLowerCase()) ||
      JSON.stringify(s.fields).toLowerCase().includes(submissionSearch.toLowerCase());
    const matchFilter = submissionFilter === 'all' || s.status === submissionFilter || (submissionFilter === 'unread' && !s.is_read);
    return matchSearch && matchFilter;
  });

  const statCards = [
    { label: 'Active Talent',    value: stats.totalTalent,    icon: Users,      color: 'var(--accent-pink)',   bg: 'var(--accent-pink-dim)' },
    { label: 'Pending Apps',     value: stats.pendingApps,    icon: Clock,      color: '#facc15',              bg: 'rgba(250,204,21,0.1)' },
    { label: 'Revenue',          value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'var(--accent-gold)', bg: 'rgba(255,215,0,0.1)' },
    { label: 'Confirmed Shifts', value: stats.activeBookings, icon: BarChart2,  color: '#00ff88',              bg: 'rgba(0,255,136,0.1)' },
    { label: 'New Leads',        value: stats.newSubmissions, icon: Mail,       color: 'var(--accent-purple)', bg: 'var(--accent-purple-dim)' },
  ];

  return (
    <AppShell>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Agency HQ</h1>
          <p className="page-subtitle">Platform control · talent · submissions</p>
        </div>
        <div className={styles.headerActions}>
          <button className="btn-pink" onClick={() => setShowCastingModal(true)}>+ New Casting</button>
          <button className={styles.refreshBtn} onClick={fetchAll} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className={styles.tabBar}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
          >
            {t}
            {t === 'Submissions' && stats.newSubmissions > 0 && (
              <span className={styles.badge}>{stats.newSubmissions}</span>
            )}
            {t === 'Applications' && stats.pendingApps > 0 && (
              <span className={styles.badge}>{stats.pendingApps}</span>
            )}
          </button>
        ))}
      </div>

      <div className={styles.content}>

        {/* ══════════════════════════════ OVERVIEW ══════════════════════════════ */}
        {tab === 'Overview' && (
          <div className={styles.overviewGrid}>
            {/* Stats */}
            <div className={styles.statsRow}>
              {statCards.map(s => (
                <div key={s.label} className={`card ${styles.statCard}`}>
                  <div className={styles.statIcon} style={{ background: s.bg, color: s.color }}>
                    <s.icon size={18} />
                  </div>
                  <p className={styles.statValue}>{loading ? '—' : s.value}</p>
                  <p className={styles.statLabel}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Analytics */}
            <section className={styles.section}>
              <div className="section-header"><span className="section-title">📊 Platform Analytics</span></div>
              <div className={`card ${styles.announceCard}`}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                  {[
                    { label: 'Active Talent', value: stats.totalTalent, color: 'var(--accent-pink)' },
                    { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, color: 'var(--accent-gold)' },
                    { label: 'Pending Apps', value: stats.pendingApps, color: '#facc15' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '1.4rem', fontWeight: 900, color: s.color }}>{loading ? '—' : s.value}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 10 }}>TALENT STATUS BREAKDOWN</p>
                  {[
                    { label: 'Active',  count: profiles.filter(p => p.status === 'active').length,   color: '#00ff88' },
                    { label: 'Pending', count: profiles.filter(p => p.status === 'pending').length,  color: '#facc15' },
                    { label: 'Suspended', count: profiles.filter(p => p.status === 'suspended').length, color: '#ff4d6d' },
                  ].map(row => {
                    const total = profiles.length || 1;
                    return (
                      <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: 64 }}>{row.label}</span>
                        <div style={{ flex: 1, height: 8, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.round((row.count / total) * 100)}%`, height: '100%', background: row.color, borderRadius: 4, transition: 'width 0.5s' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', width: 24, textAlign: 'right' }}>{row.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Weekend Color Drop */}
            <section className={styles.section}>
              <div className="section-header"><span className="section-title">🎨 Weekend Color Drop</span></div>
              <div className={`card ${styles.colorCard}`}>
                <div className={styles.colorGrid}>
                  {['saturday', 'sunday'].map(day => (
                    <div key={day} className={styles.colorField}>
                      <label style={{ textTransform: 'capitalize', fontWeight: 700 }}>{day}</label>
                      <input
                        type="text" className="input"
                        value={colors[day]?.name || ''}
                        onChange={e => setColors(c => ({ ...c, [day]: { ...c[day], name: e.target.value } }))}
                      />
                      <div className={styles.colorRow}>
                        <input type="color" value={colors[day]?.hex || '#000000'}
                          onChange={e => setColors(c => ({ ...c, [day]: { ...c[day], hex: e.target.value } }))}
                          style={{ width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer' }}
                        />
                        <input type="text" className="input" value={colors[day]?.hex || ''}
                          onChange={e => setColors(c => ({ ...c, [day]: { ...c[day], hex: e.target.value } }))}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button className="btn-gold" style={{ width: '100%', marginTop: 16 }}
                  onClick={handleSaveColors} disabled={loadingAnn}>
                  {loadingAnn ? 'Syncing…' : '💾 Save & Broadcast Colors'}
                </button>
              </div>
            </section>

            {/* Post Announcement */}
            <section className={styles.section}>
              <div className="section-header"><span className="section-title">📣 Post Announcement</span></div>
              <div className={`card ${styles.announceCard}`}>
                <textarea
                  className="input" rows={3}
                  placeholder="Write an announcement for all talent…"
                  value={announcementText}
                  onChange={e => setAnnouncementText(e.target.value)}
                  style={{ resize: 'none' }}
                />
                <button className="btn-primary" style={{ marginTop: 10, width: '100%' }}
                  onClick={handlePostAnnouncement} disabled={postingAnn}>
                  {postingAnn ? 'Posting…' : <><Bell size={14} /> Post to All Talent</>}
                </button>
              </div>
            </section>

            {/* Quick Actions */}
            <section className={styles.section}>
              <div className="section-header"><span className="section-title">⚡ Quick Actions</span></div>
              <div className={`card ${styles.actionsCard}`}>
                <button className={styles.actionItem} onClick={() => setShowCastingModal(true)}>
                  <Star size={20} />
                  <div><h4>Post Casting</h4><p>Publish a new opportunity</p></div>
                  <ChevronRight size={16} />
                </button>
                <div className={styles.divider} />
                <button className={styles.actionItem} onClick={() => setShowConfigModal(true)}>
                  <Settings size={20} />
                  <div><h4>System Controls</h4><p>Platform configuration</p></div>
                  <ChevronRight size={16} />
                </button>
                <div className={styles.divider} />
                <button className={styles.actionItem} onClick={() => setTab('Submissions')}>
                  <Mail size={20} />
                  <div><h4>View Submissions</h4><p>{stats.newSubmissions} unread leads</p></div>
                  <ChevronRight size={16} />
                </button>
                <div className={styles.divider} />
                <a href="/messages" className={styles.actionItem} style={{ textDecoration: 'none' }}>
                  <MessageSquare size={20} />
                  <div><h4>Messages</h4><p>Direct talent communication</p></div>
                  <ChevronRight size={16} />
                </a>
              </div>
            </section>
          </div>
        )}

        {/* ══════════════════════════════ APPLICATIONS ══════════════════════════════ */}
        {tab === 'Applications' && (
          <div>
            {applications.filter(a => a.status === 'pending').length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 0 12px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <input type="checkbox" onChange={toggleSelectAll} checked={selectedApps.size === applications.filter(a => a.status === 'pending').length && selectedApps.size > 0} />
                  Select All Pending
                </label>
                {selectedApps.size > 0 && (
                  <>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedApps.size} selected</span>
                    <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.78rem' }} onClick={() => handleBulkStatus('approved')}>
                      <CheckCircle size={13} /> Approve All
                    </button>
                    <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.78rem', color: 'var(--accent-ruby)' }} onClick={() => handleBulkStatus('rejected')}>
                      <XCircle size={13} /> Reject All
                    </button>
                  </>
                )}
              </div>
            )}
            <div className={styles.listSection}>
              {applications.length === 0 && !loading && <p className={styles.emptyMsg}>No applications yet.</p>}
              {applications.map(app => (
                <div key={app.id} className={`card ${styles.appCard}`}>
                  {app.status === 'pending' && (
                    <input type="checkbox" checked={selectedApps.has(app.id)} onChange={() => toggleSelectApp(app.id)} style={{ marginRight: 4 }} onClick={e => e.stopPropagation()} />
                  )}
                  <div className={styles.appAvatar}>{app.full_name?.[0] || 'T'}</div>
                  <div className={styles.appInfo}>
                    <h3>{app.full_name || 'Unknown'}</h3>
                    <p>{app.listing_title} · {new Date(app.created_at).toLocaleDateString()}</p>
                    {app.instagram && <p style={{ color: 'var(--accent-pink)', fontSize: '0.8rem' }}>{app.instagram}</p>}
                    <span className={`badge ${app.status === 'approved' ? 'badge-emerald' : app.status === 'rejected' ? 'badge-ruby' : ''}`} style={{ fontSize: '0.6rem', marginTop: 4, display: 'inline-block' }}>
                      {app.status}
                    </span>
                  </div>
                  {app.status === 'pending' && (
                    <div className={styles.appActions}>
                      <button className={`${styles.actionBtn} ${styles.reject}`} onClick={() => handleAppStatus(app.id, 'rejected')} title="Reject"><XCircle size={20} /></button>
                      <button className={`${styles.actionBtn} ${styles.approve}`} onClick={() => handleAppStatus(app.id, 'approved')} title="Approve"><CheckCircle size={20} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════ SUBMISSIONS ══════════════════════════════ */}
        {tab === 'Submissions' && (
          <div>
            {/* Toolbar */}
            <div className={styles.subToolbar}>
              <div className={styles.searchWrap}>
                <Search size={14} />
                <input className="input" placeholder="Search by email or field…"
                  value={submissionSearch}
                  onChange={e => setSubmissionSearch(e.target.value)}
                  style={{ paddingLeft: 32, height: 38 }}
                />
              </div>
              <div className={styles.filterWrap}>
                <Filter size={14} />
                <select className="input" value={submissionFilter}
                  onChange={e => setSubmissionFilter(e.target.value)}
                  style={{ height: 38 }}>
                  <option value="all">All</option>
                  <option value="unread">Unread</option>
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="converted">Converted</option>
                  <option value="spam">Spam</option>
                </select>
              </div>
              <button
                className="btn-secondary"
                onClick={handleClearSubmissions}
                style={{ height: 38, color: 'var(--accent-ruby)', borderColor: 'rgba(255,51,102,0.2)' }}
                disabled={filteredSubs.length === 0 || clearingSubmissions}
              >
                <Trash2 size={14} /> {clearingSubmissions ? 'Deleting…' : `Clear ${submissionFilter === 'all' ? 'All' : 'Filtered'}`}
              </button>
              <span className={styles.subCount}>{filteredSubs.length} results</span>
            </div>

            <div className={styles.listSection}>
              {filteredSubs.length === 0 && !loading && (
                <p className={styles.emptyMsg}>No submissions match your filter.</p>
              )}
              {filteredSubs.map(sub => {
                const isExpanded = expandedSub === sub.id;
                return (
                  <div key={sub.id}
                    className={`card ${styles.subCard} ${!sub.is_read ? styles.subUnread : ''} ${isExpanded ? styles.subExpanded : ''}`}
                    onClick={() => {
                        setExpandedSub(isExpanded ? null : sub.id);
                        markRead(sub.id);
                    }}
                  >
                    <div className={styles.subIcon}>
                      <Mail size={18} />
                    </div>
                    <div className={styles.subInfo}>
                      <h3>
                        {sub.fields?.firstName ? `${sub.fields.firstName} ${sub.fields.lastName || ''}` : 
                         sub.fields?.['What\'s Your Name?'] || 
                         sub.fields?.['Name'] || 
                         sub.fields?.instagram ||
                         sub.email || 
                         'New Inquiry'}
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {sub.form_name} · {new Date(sub.submitted_at).toLocaleDateString()}
                      </p>
                      
                      {isExpanded && sub.fields && (
                        <div className={`${styles.subFields} animate-in`}>
                          <div className={styles.divider} style={{ margin: '12px 0' }} />
                          {Object.entries(sub.fields).map(([k, v]) => (
                            <div key={k} className={styles.subFieldFull}>
                              <span className={styles.subFieldLabel}>{k}:</span>
                              <span className={styles.subFieldValue}>{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={styles.subRight}>
                      <span className={`badge ${
                        sub.status === 'converted' ? 'badge-emerald' :
                        sub.status === 'spam'      ? 'badge-ruby' :
                        sub.status === 'reviewed'  ? 'badge-gold' : ''
                      }`} style={{ fontSize: '0.6rem' }}>{sub.status}</span>
                      <div className={styles.subActions} onClick={e => e.stopPropagation()}>
                        <button title="Mark Reviewed"  onClick={() => updateSubStatus(sub.id, 'reviewed')}><Eye size={14}/></button>
                        <button title="Mark Converted" onClick={() => updateSubStatus(sub.id, 'converted')} style={{color:'var(--accent-emerald)'}}><CheckCircle size={14}/></button>
                        <button title="Mark Spam"      onClick={() => updateSubStatus(sub.id, 'spam')} style={{color:'var(--accent-ruby)'}}><XCircle size={14}/></button>
                        <button title="Delete"         onClick={(e) => handleDeleteSubmission(sub.id, e)} style={{color:'var(--text-muted)'}}><Trash2 size={14}/></button>
                      </div>
                      {!sub.is_read && <span className={styles.unreadDot} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════ TALENT ══════════════════════════════ */}
        {tab === 'Talent' && (
          <div className={styles.listSection}>
            {profiles.filter(p => p.role === 'talent').map(p => {
              const isExpanded = expandedSub === p.id;
              return (
                <div key={p.id} className={`card ${styles.talentCard} ${isExpanded ? styles.subExpanded : ''}`}
                  onClick={() => setExpandedSub(isExpanded ? null : p.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <div className={styles.appAvatar}>{p.full_name?.[0] || 'T'}</div>
                    <div className={styles.appInfo}>
                      <h3>{p.full_name || p.email}</h3>
                      <p>{p.city || 'No city'} · {p.instagram || 'No IG'}</p>
                      <span className={`badge ${
                        p.status === 'active'    ? 'badge-emerald' :
                        p.status === 'suspended' ? 'badge-ruby' : ''
                      }`} style={{ fontSize: '0.6rem', marginTop: 4, display: 'inline-block' }}>
                        {p.status}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <p>⭐ {p.rating || '—'}</p>
                      <p>{p.shifts_worked} shifts</p>
                      <button className={styles.actionBtn} style={{ color: 'var(--accent-gold)' }} title="Rate Talent" onClick={e => { e.stopPropagation(); setRatingModal(p); setRatingValue(5); }}>
                        <Star size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className={styles.galleryExpanded}>
                      <div className={styles.divider} style={{ margin: '16px 0' }} />
                      <PortfolioGallery profileId={p.id} editable={false} />
                    </div>
                  )}
                </div>
              );
            })}
            {profiles.filter(p => p.role === 'talent').length === 0 && !loading && (
              <p className={styles.emptyMsg}>No talent profiles yet.</p>
            )}
          </div>
        )}

        {/* ══════════════════════════════ CONTENT ══════════════════════════════ */}
        {tab === 'Content' && (
          <div className={styles.overviewGrid}>
            <section className={styles.section}>
              <div className="section-header"><span className="section-title">📽️ {editingVideo ? 'Edit Featured Video' : 'Add Featured Video'}</span></div>
              <div className={`card ${styles.announceCard}`}>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <input 
                    className="input" placeholder="Paste YouTube Link or ID"
                    value={editingVideo ? editingVideo.youtube_id : newVideo.youtube_id}
                    onChange={e => editingVideo ? setEditingVideo({ ...editingVideo, youtube_id: e.target.value }) : setNewVideo({ ...newVideo, youtube_id: e.target.value })}
                  />
                  <input 
                    className="input" placeholder="Project Title"
                    value={editingVideo ? editingVideo.title : newVideo.title}
                    onChange={e => editingVideo ? setEditingVideo({ ...editingVideo, title: e.target.value }) : setNewVideo({ ...newVideo, title: e.target.value })}
                  />
                  <input 
                    className="input" placeholder="Subtitle (e.g. Official Music Video)"
                    value={editingVideo ? editingVideo.subtitle : newVideo.subtitle}
                    onChange={e => editingVideo ? setEditingVideo({ ...editingVideo, subtitle: e.target.value }) : setNewVideo({ ...newVideo, subtitle: e.target.value })}
                  />
                  
                  {editingVideo ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-pink" style={{ flex: 1 }} onClick={handleUpdateVideo} disabled={updatingVideo}>
                        {updatingVideo ? 'Saving...' : '💾 Update Video'}
                      </button>
                      <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setEditingVideo(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button className="btn-pink" style={{ marginTop: 8 }} onClick={handleAddVideo} disabled={addingVideo}>
                      {addingVideo ? 'Adding...' : '+ Add Video to Slider'}
                    </button>
                  )}
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <div className="section-header"><span className="section-title">Live Portfolio Rotation</span></div>
              <div className={styles.listSection}>
                {featuredVideos.map(v => (
                  <div key={v.id} className={`card ${styles.appCard}`}>
                    <div className={styles.appAvatar} style={{ background: '#000' }}>▶️</div>
                    <div className={styles.appInfo}>
                      <h3>{v.title}</h3>
                      <p>{v.subtitle} · ID: {v.youtube_id}</p>
                    </div>
                    <div className={styles.appActions}>
                      <button 
                        className={styles.actionBtn} 
                        style={{ color: 'var(--accent-gold)' }}
                        onClick={() => setEditingVideo(v)}
                        title="Edit"
                      >
                        <Zap size={20} />
                      </button>
                      <button 
                        className={`${styles.actionBtn} ${styles.reject}`}
                        onClick={() => handleDeleteVideo(v.id)}
                        title="Delete"
                      >
                        <XCircle size={20} />
                      </button>
                    </div>
                  </div>
                ))}
                {featuredVideos.length === 0 && (
                  <p className={styles.emptyMsg}>No featured videos added yet.</p>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ══════════════════════════════ SETTINGS ══════════════════════════════ */}
        {tab === 'Settings' && (
          <div className={styles.section}>
            <div className={`card ${styles.settingsCard}`}>
              <h3 style={{ marginBottom: 20, fontWeight: 800 }}>Platform Settings</h3>
              <button className="btn-pink" style={{ width: '100%' }}
                onClick={() => setShowConfigModal(true)}>
                <Settings size={16} /> Open System Control Hub
              </button>
            </div>
          </div>
        )}
      </div>

      {showCastingModal && <CastingStudio onClose={() => setShowCastingModal(false)} onCreated={fetchAll} />}
      {showConfigModal  && <SystemControlHub onClose={() => setShowConfigModal(false)} onUpdated={fetchAll} />}

      {/* Rating Modal */}
      {ratingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
          onClick={e => e.target === e.currentTarget && setRatingModal(null)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28, width: '100%', maxWidth: 360 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 800 }}>Rate {ratingModal.full_name?.split(' ')[0]}</h3>
              <button onClick={() => setRatingModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRatingValue(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 32, opacity: s <= ratingValue ? 1 : 0.3, transition: 'opacity 0.15s' }}>★</button>
              ))}
            </div>
            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>{ratingValue} / 5 stars</p>
            <button className="btn-gold" style={{ width: '100%' }} onClick={handleRateTalent}>Submit Rating</button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
