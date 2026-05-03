'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Users, MapPin, Mail, Phone, User, Star, ChevronRight, CheckCircle } from 'lucide-react';
import styles from './Form.module.css';

export default function BookForm({ onComplete }) {
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
            if (onComplete) onComplete();
        } else {
            alert('Something went wrong. Please try again.');
        }
        setLoading(false);
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    if (sent) {
        return (
            <div className={styles.success}>
                <CheckCircle size={64} color="var(--accent-pink)" />
                <h2>Request Received!</h2>
                <p>We've received your booking request for <strong>{form.eventType}</strong>. Our team will contact you shortly.</p>
            </div>
        );
    }

    return (
        <div className={styles.formContainer}>
            <div className={styles.progress}>
                <div className={styles.progressBar} style={{ width: `${(step / 3) * 100}%` }} />
            </div>

            <form onSubmit={handleSubmit}>
                {step === 1 && (
                    <div className={styles.step}>
                        <div className={styles.header}>
                            <span className={styles.stepNum}>Step 01/03</span>
                            <h3>Contact Info</h3>
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

                        <button type="button" className="btn-primary" onClick={nextStep} style={{ width: '100%', marginTop: 12 }}>
                            Continue <ChevronRight size={18} />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className={styles.step}>
                        <div className={styles.header}>
                            <span className={styles.stepNum}>Step 02/03</span>
                            <h3>Event Details</h3>
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
                            <span className={styles.stepNum}>Step 03/03</span>
                            <h3>Requirements</h3>
                        </div>

                        <div className={styles.field}>
                            <label><Users size={14} /> How many Baddies Needed?</label>
                            <input type="number" name="baddiesNeeded" value={form.baddiesNeeded} onChange={handleChange} placeholder="e.g. 5" required />
                        </div>

                        <div className={styles.field}>
                            <label><User size={14} /> What is your Age?</label>
                            <input type="text" name="age" value={form.age} onChange={handleChange} placeholder="e.g. 21+" />
                        </div>

                        <div className={styles.disclaimer}>
                            By submitting this form, you agree to our booking policies.
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
    );
}
