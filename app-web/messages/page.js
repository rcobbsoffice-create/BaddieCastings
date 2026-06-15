'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import AppShell from '@/components/AppShell';
import { supabase } from '@/lib/supabase';
import { Send, MessageSquare, ChevronLeft, Circle } from 'lucide-react';
import styles from './page.module.css';

export default function MessagesPage() {
    const [me, setMe] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [activeContact, setActiveContact] = useState(null);
    const [thread, setThread] = useState([]);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef(null);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from('profiles').select('id, full_name, role, avatar_url').eq('id', user.id).single();
            setMe(profile);

            // Load all message partners
            const { data: msgs } = await supabase
                .from('messages')
                .select('sender_id, recipient_id')
                .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);

            const partnerIds = [...new Set((msgs || []).flatMap(m => [m.sender_id, m.recipient_id]).filter(id => id !== user.id))];

            if (partnerIds.length > 0) {
                const { data: partners } = await supabase.from('profiles').select('id, full_name, role, avatar_url').in('id', partnerIds);
                setContacts(partners || []);
                if (partners?.length) setActiveContact(partners[0]);
            } else {
                // For agency/admin: load talent to start a convo
                const myRole = profile?.role;
                if (['agency', 'admin', 'agent'].includes(myRole)) {
                    const { data: talent } = await supabase.from('profiles').select('id, full_name, role, avatar_url').in('role', ['talent', 'bottle_girl', 'bartender', 'hookah_girl', 'dj']).eq('status', 'active').limit(20);
                    setContacts(talent || []);
                    if (talent?.length) setActiveContact(talent[0]);
                }
            }
            setLoading(false);
        };
        init();
    }, []);

    const loadThread = useCallback(async () => {
        if (!me || !activeContact) return;
        const { data } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${me.id},recipient_id.eq.${activeContact.id}),and(sender_id.eq.${activeContact.id},recipient_id.eq.${me.id})`)
            .order('created_at', { ascending: true });
        setThread(data || []);

        // Mark received as read
        await supabase.from('messages').update({ read: true }).eq('recipient_id', me.id).eq('sender_id', activeContact.id).eq('read', false);
    }, [me, activeContact]);

    useEffect(() => { loadThread(); }, [loadThread]);

    useEffect(() => {
        if (!me || !activeContact) return;
        const channel = supabase.channel(`thread-${me.id}-${activeContact.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
                const msg = payload.new;
                if ((msg.sender_id === me.id && msg.recipient_id === activeContact.id) ||
                    (msg.sender_id === activeContact.id && msg.recipient_id === me.id)) {
                    setThread(prev => [...prev, msg]);
                }
            }).subscribe();
        return () => supabase.removeChannel(channel);
    }, [me, activeContact]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!draft.trim() || !me || !activeContact) return;
        setSending(true);
        await supabase.from('messages').insert({ sender_id: me.id, recipient_id: activeContact.id, body: draft.trim() });
        setDraft('');
        setSending(false);
    };

    const getInitials = (name) => name?.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
    const formatTime = (iso) => iso ? new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';

    return (
        <AppShell>
            <div className={styles.page}>
                {/* Sidebar */}
                <div className={`${styles.sidebar} ${activeContact ? styles.sidebarHidden : ''}`}>
                    <div className={styles.sidebarHeader}>
                        <h1 className={styles.sidebarTitle}>Messages</h1>
                    </div>
                    {loading ? (
                        <p className={styles.empty}>Loading…</p>
                    ) : contacts.length === 0 ? (
                        <div className={styles.empty}>
                            <MessageSquare size={32} style={{ opacity: 0.3 }} />
                            <p>No conversations yet.</p>
                        </div>
                    ) : (
                        <div className={styles.contactList}>
                            {contacts.map(c => (
                                <button key={c.id} className={`${styles.contactRow} ${activeContact?.id === c.id ? styles.contactActive : ''}`} onClick={() => setActiveContact(c)}>
                                    <div className={styles.contactAvatar}>
                                        {c.avatar_url ? <img src={c.avatar_url} alt={c.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : getInitials(c.full_name)}
                                    </div>
                                    <div className={styles.contactInfo}>
                                        <p className={styles.contactName}>{c.full_name || 'Unknown'}</p>
                                        <p className={styles.contactRole}>{c.role}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Thread */}
                <div className={`${styles.thread} ${!activeContact ? styles.threadHidden : ''}`}>
                    {activeContact ? (
                        <>
                            <div className={styles.threadHeader}>
                                <button className={styles.backBtn} onClick={() => setActiveContact(null)}><ChevronLeft size={20} /></button>
                                <div className={styles.contactAvatar} style={{ width: 36, height: 36, fontSize: '0.8rem' }}>
                                    {activeContact.avatar_url ? <img src={activeContact.avatar_url} alt={activeContact.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : getInitials(activeContact.full_name)}
                                </div>
                                <div>
                                    <p className={styles.threadName}>{activeContact.full_name}</p>
                                    <p className={styles.threadRole}>{activeContact.role}</p>
                                </div>
                            </div>

                            <div className={styles.messages}>
                                {thread.length === 0 && (
                                    <p className={styles.noMessages}>No messages yet. Say hi!</p>
                                )}
                                {thread.map(msg => {
                                    const isMine = msg.sender_id === me?.id;
                                    return (
                                        <div key={msg.id} className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleTheirs}`}>
                                            <p className={styles.bubbleText}>{msg.body}</p>
                                            <p className={styles.bubbleTime}>{formatTime(msg.created_at)}</p>
                                        </div>
                                    );
                                })}
                                <div ref={bottomRef} />
                            </div>

                            <form className={styles.composer} onSubmit={handleSend}>
                                <input
                                    className={styles.input}
                                    placeholder="Type a message…"
                                    value={draft}
                                    onChange={e => setDraft(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e); }}
                                />
                                <button type="submit" className={styles.sendBtn} disabled={!draft.trim() || sending}>
                                    <Send size={18} />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className={styles.threadEmpty}>
                            <MessageSquare size={40} style={{ opacity: 0.2 }} />
                            <p>Select a conversation</p>
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
