'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Camera, Mail, Phone, User, Star, MapPin, Truck, ChevronRight, CheckCircle, Info } from 'lucide-react';
import styles from './page.module.css';

export default function HirePage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [form, setForm] = useState({
        instagram: '',
        email: '',
        phone: '',
        age: '',
        experience: '',
        transportation: 'Yes',
        location: ''
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.from('form_submissions').insert([{
            form_name: 'Hire Form (Talent)',
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
                        <CheckCircle size={64} color="var(--accent-purple)" />
                        <h1>Application Sent!</h1>
                        <p>Thanks for applying to join Baddie Castings. We'll review your Instagram <strong>{form.instagram}</strong> and get in touch via email if you're a good fit.</p>
                        <Link href="/" className="btn-primary" style={{ marginTop: 24, background: 'var(--gradient-pink)' }}>Back to Home</Link>
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
                        <div className={styles.progressBar} style={{ width: `${(step / 3) * 100}%`, background: 'var(--accent-purple)' }} />
                    </div>

                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <div className={styles.step}>
                                <div className={styles.header}>
                                    <span className={styles.stepNum} style={{ color: 'var(--accent-purple)' }}>Step 01</span>
                                    <h2>Social & Identity</h2>
                                    <p>Tell us who you are online.</p>
                                </div>
                                
                                <div className={styles.field}>
                                    <label><Camera size={14} /> Instagram Name</label>
                                    <input type="text" name="instagram" value={form.instagram} onChange={handleChange} placeholder="@yourprofile" required />
                                </div>

                                <div className={styles.field}>
                                    <label><User size={14} /> What is your Age?</label>
                                    <input type="text" name="age" value={form.age} onChange={handleChange} placeholder="e.g. 23" required />
                                </div>

                                <div className={styles.field}>
                                    <label><MapPin size={14} /> Location</label>
                                    <input type="text" name="location" value={form.location} onChange={handleChange} placeholder="Miami, FL" required />
                                </div>

                                <button type="button" className="btn-primary" onClick={nextStep} style={{ width: '100%', marginTop: 20, background: 'var(--accent-purple)' }}>
                                    Continue <ChevronRight size={18} />
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className={styles.step}>
                                <div className={styles.header}>
                                    <span className={styles.stepNum} style={{ color: 'var(--accent-purple)' }}>Step 02</span>
                                    <h2>Contact Details</h2>
                                    <p>This is only to get in touch, not to send spam.</p>
                                </div>

                                <div className={styles.field}>
                                    <label><Mail size={14} /> Email Address</label>
                                    <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@email.com" required />
                                </div>

                                <div className={styles.field}>
                                    <label><Phone size={14} /> Contact Number</label>
                                    <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="(555) 000-0000" required />
                                </div>

                                <div className={styles.infoBox}>
                                    <Info size={16} />
                                    <span>We'll use these to send interview invites.</span>
                                </div>

                                <div className={styles.actions}>
                                    <button type="button" className="btn-secondary" onClick={prevStep}>Back</button>
                                    <button type="button" className="btn-primary" onClick={nextStep} style={{ background: 'var(--accent-purple)' }}>Continue <ChevronRight size={18} /></button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className={styles.step}>
                                <div className={styles.header}>
                                    <span className={styles.stepNum} style={{ color: 'var(--accent-purple)' }}>Step 03</span>
                                    <h2>Experience</h2>
                                    <p>Almost there!</p>
                                </div>

                                <div className={styles.field}>
                                    <label><Star size={14} /> Any Experience?</label>
                                    <textarea name="experience" value={form.experience} onChange={handleChange} placeholder="List any previous modeling, bottle service, or hosting work..." rows={3} className={styles.textarea} required />
                                </div>

                                <div className={styles.field}>
                                    <label><Truck size={14} /> Reliable Transportation?</label>
                                    <select name="transportation" value={form.transportation} onChange={handleChange} required className="input">
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>

                                <div className={styles.actions}>
                                    <button type="button" className="btn-secondary" onClick={prevStep}>Back</button>
                                    <button type="submit" className="btn-primary" disabled={loading} style={{ background: 'var(--accent-purple)' }}>
                                        {loading ? 'Submitting...' : 'Apply Now'}
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
