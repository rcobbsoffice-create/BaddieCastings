'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { CheckCircle2, Circle, ChevronRight, MapPin, Clock, X, CalendarPlus, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

const initialWeekColors = {
    saturday: { name: 'Hot Pink', hex: '#FF007A' },
    sunday: { name: 'Royal Purple', hex: '#9B59FF' },
};

const initialShifts = [
    {
        id: 1, day: 'Saturday', date: 'Apr 19', venue: 'Club Onyx',
        address: 'Atlanta, GA', time: '9 PM – Close',
        color: initialWeekColors.saturday, spots: 12, confirmed: true,
        notes: 'All Black dress code. Report to VIP check-in by 8:30 PM. Bring valid ID.',
    },
    {
        id: 2, day: 'Sunday', date: 'Apr 20', venue: 'Compound ATL',
        address: 'Atlanta, GA', time: '8 PM – Close',
        color: initialWeekColors.sunday, spots: 8, confirmed: false,
        notes: 'Royal Purple attire. Meet at the side entrance on Marietta St.',
    },
    {
        id: 3, day: 'Saturday', date: 'Apr 26', venue: 'Gold Room',
        address: 'Atlanta, GA', time: '10 PM – Close',
        color: initialWeekColors.saturday, spots: 6, confirmed: false,
        notes: 'All Black. Premium event — formal heels required.',
    },
    {
        id: 4, day: 'Sunday', date: 'Apr 27', venue: 'Suite Food Lounge',
        address: 'Atlanta, GA', time: '9 PM – Close',
        color: initialWeekColors.sunday, spots: 10, confirmed: false,
        notes: 'Purple or lavender tones accepted. Arrive 30 min early for briefing.',
    },
];

const events = [
    {
        title: 'ATL Brand Summit', date: 'May 2', type: 'Networking', icon: '🤝',
        location: 'Americasmart, Atlanta, GA',
        time: '12 PM – 6 PM',
        description: 'Connect with top brands, agents, and fellow talent at the premier ATL networking summit. Bring headshots and business cards.',
    },
    {
        title: 'Model Boot Camp', date: 'May 5', type: 'Training', icon: '💎',
        location: 'Studio Luxe ATL, Atlanta, GA',
        time: '10 AM – 3 PM',
        description: 'Runway, posing, and on-camera coaching from top industry coaches. Open to all talent levels. Casual attire.',
    },
];

function EventModal({ event, onClose }) {
    const handleAddToCalendar = () => {
        const title = encodeURIComponent(event.title);
        const details = encodeURIComponent(event.description);
        const location = encodeURIComponent(event.location);
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
        window.open(url, '_blank');
    };

    return (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={styles.modal}>
                <button className={styles.modalClose} onClick={onClose} id="btn-event-modal-close">
                    <X size={18} />
                </button>

                <div className={styles.eventModalIcon}>{event.icon}</div>
                <span className={`badge badge-purple`} style={{ marginBottom: 8 }}>{event.type}</span>
                <h2 className={styles.modalTitle}>{event.title}</h2>

                <div className={styles.eventDetailRow}>
                    <Clock size={13} />
                    <span>{event.date} · {event.time}</span>
                </div>
                <div className={styles.eventDetailRow}>
                    <MapPin size={13} />
                    <span>{event.location}</span>
                </div>

                <p className={styles.eventDesc}>{event.description}</p>

                <button
                    className="btn-primary"
                    id={`btn-add-calendar-${event.title.replace(/\s+/g, '-').toLowerCase()}`}
                    style={{ width: '100%', marginTop: 8 }}
                    onClick={handleAddToCalendar}
                >
                    <CalendarPlus size={15} /> Add to Google Calendar
                </button>
            </div>
        </div>
    );
}

export default function SchedulePage() {
    const [shifts, setShifts] = useState(initialShifts);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [confirming, setConfirming] = useState(null);
    const [weekColors, setWeekColors] = useState(initialWeekColors);

    useEffect(() => {
        const fetchScheduleData = async () => {
            try {
                const { data: colorData } = await supabase
                    .from('settings')
                    .select('value')
                    .eq('key', 'currentWeekendColors')
                    .single();

                if (colorData && colorData.value) {
                    setWeekColors(colorData.value);
                    setShifts(prev => prev.map(s => {
                        const dayColors = colorData.value[s.day.toLowerCase()];
                        return dayColors ? { ...s, color: dayColors } : s;
                    }));
                } else {
                    const storedColors = localStorage.getItem('currentWeekendColors');
                    if (storedColors) {
                        const parsed = JSON.parse(storedColors);
                        setWeekColors(parsed);
                        setShifts(prev => prev.map(s => {
                            const dayColors = parsed[s.day.toLowerCase()];
                            return dayColors ? { ...s, color: dayColors } : s;
                        }));
                    }
                }
            } catch (err) {
                console.warn('Schedule Color Sync error:', err);
            }
        };

        fetchScheduleData();
    }, []);

    const handleConfirm = async (id) => {
        setConfirming(id);
        await new Promise(r => setTimeout(r, 800));
        setShifts(prev => prev.map(s => s.id === id ? { ...s, confirmed: true } : s));
        setConfirming(null);
    };

    return (
        <AppShell>
            <div className="page-header">
                <h1 className="page-title">Schedule</h1>
                <p className="page-subtitle">Your upcoming shifts &amp; events</p>
            </div>

            <div className={styles.content}>

                {/* Color Legend */}
                <section className={styles.section}>
                    <p className={styles.sectionLabel}>This Week&apos;s Colors</p>
                    <div className="grid-2">
                        {Object.entries(weekColors).map(([day, c]) => (
                            <div key={day} className={styles.colorBadge} style={{ '--c': c.hex }}>
                                <div className={styles.colorDot} style={{ background: c.hex }} />
                                <div>
                                    <p className={styles.dayName}>{day.charAt(0).toUpperCase() + day.slice(1)}</p>
                                    <p className={styles.colorName}>{c.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Shifts */}
                <section className={styles.section}>
                    <p className={styles.sectionLabel}>Upcoming Shifts</p>
                    <div className={styles.shiftList}>
                        {shifts.map((shift) => (
                            <div key={shift.id} className={`card ${styles.shiftCard}`}>
                                <div className={styles.shiftTop}>
                                    <div>
                                        <p className={styles.shiftDate}>{shift.day} · {shift.date}</p>
                                        <p className={styles.shiftVenue}>{shift.venue}</p>
                                    </div>
                                    <div className={styles.shiftColorChip} style={{ background: shift.color.hex }}>
                                        {shift.color.name}
                                    </div>
                                </div>
                                <div className={styles.shiftMeta}>
                                    <span className={styles.metaItem}><MapPin size={12} /> {shift.address}</span>
                                    <span className={styles.metaItem}><Clock size={12} /> {shift.time}</span>
                                    <span className={styles.metaItem}><Users size={12} /> {shift.spots} spots</span>
                                </div>
                                {shift.notes && (
                                    <p className={styles.shiftNotes}>{shift.notes}</p>
                                )}
                                <div className={styles.shiftFooter}>
                                    {shift.confirmed ? (
                                        <span className={styles.confirmedBadge}>
                                            <CheckCircle2 size={14} /> Confirmed
                                        </span>
                                    ) : (
                                        <button
                                            className="btn-primary"
                                            id={`btn-confirm-shift-${shift.id}`}
                                            style={{ padding: '10px 20px', fontSize: '0.82rem', opacity: confirming === shift.id ? 0.7 : 1 }}
                                            disabled={confirming === shift.id}
                                            onClick={() => handleConfirm(shift.id)}
                                        >
                                            {confirming === shift.id
                                                ? 'Confirming...'
                                                : <><Circle size={13} /> Confirm Participation</>
                                            }
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Events */}
                <section className={styles.section}>
                    <p className={styles.sectionLabel}>Events &amp; Networking</p>
                    <div className={styles.eventList}>
                        {events.map((e) => (
                            <button
                                key={e.title}
                                id={`btn-event-${e.title.replace(/\s+/g, '-').toLowerCase()}`}
                                className={styles.eventCard}
                                onClick={() => setSelectedEvent(e)}
                            >
                                <span className={styles.eventIcon}>{e.icon}</span>
                                <div className={styles.eventCardBody}>
                                    <p className={styles.eventTitle}>{e.title}</p>
                                    <p className={styles.eventMeta}>{e.date} · {e.type}</p>
                                </div>
                                <ChevronRight size={16} color="var(--text-muted)" />
                            </button>
                        ))}
                    </div>
                </section>
            </div>

            {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
        </AppShell>
    );
}
