'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Calendar, Users, MapPin, Mail, Phone, User, Star, ChevronRight, CheckCircle } from 'lucide-react';
import styles from './page.module.css';

export default function BookPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        date: '',
        age: '',
        eventType: '',
        baddiesNeeded: '',
        location: ''
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.from('form_submissions').insert([{
            form_name: 'Bookings Form',
            email: form.email,
            fields: form,
            status: 'new'
        }]);

        if (!error) {
            setSent(true);
        } else {
            alert('Something went wrong. Please try again.');
        }
        setLoading(false);
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    if (sent) {
        return (
            <div className={styles.page}>
                <div className={styles.bg} />
                <div className={styles.container}>
                    <div className={styles.successCard}>
                        <CheckCircle size={64} color="var(--accent-pink)" />
                        <h1>Request Received!</h1>
                        <p>We've received your booking request for <strong>{form.eventType}</strong>. Our team will contact you shortly to finalize the details.</p>
                        <Link href="/" className="btn-primary" style={{ marginTop: 24 }}>Back to Home</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.bg} />
            
            <div className={styles.logo}>
                <Link href="/">
                    <span className={styles.logoText}>Baddie Castings</span>
                </Link>
            </div>

            <div className={styles.container}>
                <div className={styles.formCard}>
                    <div className={styles.progress}>
                        <div className={styles.progressBar} style={{ width: `${(step / 3) * 100}%` }} />
                    </div>

                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <div className={styles.step}>
                                <div className={styles.header}>
                                    <span className={styles.stepNum}>01/03</span>
                                    <h2>Contact Information</h2>
                                    <p>Let's start with who you are.</p>
                                </div>
                                
                                <div className={styles.grid}>
                                    <div className={styles.field}>
                                        <label><User size={14} /> First Name</label>
                                        <input type="text" name="firstName" value={form.firstName} onChange={handleChange} placeholder="Jane" required />
                                    </div>
                                    <div className={styles.field}>
                                        <label><User size={14} /> Last Name</label>
                                        <input type="text" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Doe" required />
                                    </div>
                                </div>

                                <div className={styles.field}>
                                    <label><Mail size={14} /> Email Address</label>
                                    <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="jane@example.com" required />
                                </div>

                                <div className={styles.field}>
                                    <label><Phone size={14} /> Contact Number</label>
                                    <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="(555) 000-0000" required />
                                </div>

                                <button type="button" className="btn-primary" onClick={nextStep} style={{ width: '100%', marginTop: 20 }}>
                                    Continue <ChevronRight size={18} />
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className={styles.step}>
                                <div className={styles.header}>
                                    <span className={styles.stepNum}>02/03</span>
                                    <h2>Event Details</h2>
                                    <p>Tell us about your event.</p>
                                </div>

                                <div className={styles.field}>
                                    <label><Calendar size={14} /> Event Date</label>
                                    <input type="date" name="date" value={form.date} onChange={handleChange} required />
                                </div>

                                <div className={styles.field}>
                                    <label><Star size={14} /> Event Type</label>
                                    <select name="eventType" value={form.eventType} onChange={handleChange} required className="input">
                                        <option value="">Select Event Type</option>
                                        <option>Nightclub VIP</option>
                                        <option>Private Party</option>
                                        <option>Music Video</option>
                                        <option>Corporate Event</option>
                                        <option>Photoshoot</option>
                                        <option>Other</option>
                                    </select>
                                </div>

                                <div className={styles.field}>
                                    <label><MapPin size={14} /> Location</label>
                                    <input type="text" name="location" value={form.location} onChange={handleChange} placeholder="Atlanta, GA" required />
                                </div>

                                <div className={styles.actions}>
                                    <button type="button" className="btn-secondary" onClick={prevStep}>Back</button>
                                    <button type="button" className="btn-primary" onClick={nextStep}>Continue <ChevronRight size={18} /></button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className={styles.step}>
                                <div className={styles.header}>
                                    <span className={styles.stepNum}>03/03</span>
                                    <h2>Requirements</h2>
                                    <p>Almost done!</p>
                                </div>

                                <div className={styles.field}>
                                    <label><Users size={14} /> How many Baddies Needed?</label>
                                    <input type="number" name="baddiesNeeded" value={form.baddiesNeeded} onChange={handleChange} placeholder="e.g. 5" required />
                                </div>

                                <div className={styles.field}>
                                    <label><User size={14} /> What is your Age? (Optional)</label>
                                    <input type="text" name="age" value={form.age} onChange={handleChange} placeholder="e.g. 21+" />
                                </div>

                                <div className={styles.disclaimer}>
                                    By submitting this form, you agree to our terms of service and booking policies.
                                </div>

                                <div className={styles.actions}>
                                    <button type="button" className="btn-secondary" onClick={prevStep}>Back</button>
                                    <button type="submit" className="btn-primary" disabled={loading}>
                                        {loading ? 'Submitting...' : 'Submit Request'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
