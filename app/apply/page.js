'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

import { 
  User, 
  Camera, 
  Target, 
  Building2, 
  Check 
} from 'lucide-react';

const ROLES = [
    {
        id: 'talent',
        icon: User,
        title: 'Talent',
        sub: 'Bottle Girls & Models',
        desc: 'Apply for castings, get booked for events, and grow your career.',
        badge: 'Most Popular',
        badgeClass: 'badge-pink',
    },
    {
        id: 'creator',
        icon: Camera,
        title: 'Creator',
        sub: 'Photographers & Videographers',
        desc: 'Build your profile, set your rates, and get booked by brands.',
        badge: 'Verified Only',
        badgeClass: 'badge-purple',
    },
    {
        id: 'agent',
        icon: Target,
        title: 'Casting Agent / Brand',
        sub: 'Post Castings & Book Talent',
        desc: 'Post opportunities, manage applicants, and book the best talent.',
        badge: 'Verified Only',
        badgeClass: 'badge-gold',
    },
    {
        id: 'agency',
        icon: Building2,
        title: 'Agency',
        sub: 'Executive Management',
        desc: 'Orchestrate talent, manage castings, and control your ecosystem.',
        badge: 'Management',
        badgeClass: 'badge-purple',
    },
];

const STEPS = ['Role', 'Info', 'Details', 'Done'];

function ProgressBar({ step }) {
    return (
        <div className={styles.progress}>
            {STEPS.slice(0, 3).map((label, i) => (
                <div key={label} className={styles.progressStep}>
                    <div className={`${styles.progressDot} ${i < step ? styles.progressDone : ''} ${i === step - 1 ? styles.progressActive : ''}`}>
                        {i < step - 1 ? '✓' : i + 1}
                    </div>
                    <span className={`${styles.progressLabel} ${i === step - 1 ? styles.progressLabelActive : ''}`}>{label}</span>
                    {i < 2 && <div className={`${styles.progressLine} ${i < step - 1 ? styles.progressLineDone : ''}`} />}
                </div>
            ))}
        </div>
    );
}

export default function ApplyPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Step 1
    const [role, setRole] = useState('');

    // Step 2 — base info
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        city: '',
        instagram: '',
    });

    // Step 3 — role-specific
    const [details, setDetails] = useState({
        // talent
        dressSize: '',
        shoeSize: '',
        height: '',
        experience: '',
        // creator
        specialty: '',
        hourlyRate: '',
        portfolioUrl: '',
        // agent / agency
        companyName: '',
        companyType: '',
        website: '',
    });

    const selectedRole = ROLES.find(r => r.id === role);

    const setField = (field) => (e) =>
        setForm(prev => ({ ...prev, [field]: e.target.value }));

    const setDetail = (field) => (e) =>
        setDetails(prev => ({ ...prev, [field]: e.target.value }));

    const handleStep1 = () => {
        if (!role) return;
        setStep(2);
        setError('');
    };

    const handleStep2 = () => {
        const { fullName, email, password, confirmPassword } = form;
        if (!fullName || !email || !password) {
            setError('Please fill in all required fields.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setError('');
        setStep(3);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const metadata = {
            full_name: form.fullName,
            role,
            city: form.city,
            instagram: form.instagram,
            status: 'pending',
            ...(role === 'talent' && {
                dress_size: details.dressSize,
                shoe_size: details.shoeSize,
                height: details.height,
                experience: details.experience,
            }),
            ...(role === 'creator' && {
                specialty: details.specialty,
                hourly_rate: details.hourlyRate,
                portfolio_url: details.portfolioUrl,
            }),
            ...((role === 'agent' || role === 'agency') && {
                company_name: details.companyName,
                company_type: details.companyType,
                website: details.website,
            }),
        };

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: { data: metadata },
            });

            if (signUpError) {
                setError(signUpError.message);
                setLoading(false);
                return;
            }

            // Insert profile row if profiles table exists
            if (data?.user) {
                await supabase.from('profiles').insert({
                    id: data.user.id,
                    email: form.email,
                    full_name: form.fullName,
                    role,
                    city: form.city,
                    instagram: form.instagram,
                    status: 'pending',
                    ...metadata,
                }).select();
                // Ignore error — table may not exist yet
            }

            // Trigger Welcome Email
            try {
                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: form.email,
                        subject: 'Welcome to Baddie Castings! 👑',
                        html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                                <h1 style="color: #ff3366;">Welcome to Baddie Castings! 👑</h1>
                                <p>Hi ${form.fullName},</p>
                                <p>We're thrilled to have you on board! You can now explore castings, connect with agencies, and grow your career.</p>
                                <br />
                                <a href="${window.location.origin}/dashboard" style="background-color: #ff3366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                                    Go to Dashboard
                                </a>
                                <p style="margin-top: 30px; font-size: 14px; color: #777;">
                                    Stay glowing,<br/>
                                    The Baddie Castings Team
                                </p>
                            </div>
                        `
                    })
                });
            } catch (emailErr) {
                console.warn('Welcome email failed to send:', emailErr);
            }

            setStep(4);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.bg} />

            <div className={styles.logo}>
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <span className={styles.logoText}>Baddie Castings</span>
                </Link>
                <span className={styles.logoTag}>Apply for Access</span>
            </div>

            {/* ── Step 1: Role ── */}
            {step === 1 && (
                <div className={styles.panel}>
                    <h1 className={styles.title}>Choose Your Role</h1>
                    <p className={styles.subtitle}>How will you be using the platform?</p>

                    <div className={styles.roleGrid}>
                        {ROLES.map((r) => (
                            <button
                                key={r.id}
                                className={`${styles.roleCard} ${role === r.id ? styles.roleSelected : ''}`}
                                onClick={() => setRole(r.id)}
                            >
                                <div className={styles.roleIcon}>
                                    <r.icon size={22} color="#ffffff" />
                                </div>
                                <div className={styles.roleBody}>
                                    <div className={styles.roleTitleRow}>
                                        <p className={styles.roleTitle}>{r.title}</p>
                                        <span className={`badge ${r.badgeClass}`}>{r.badge}</span>
                                    </div>
                                    <p className={styles.roleSub}>{r.sub}</p>
                                    <p className={styles.roleDesc}>{r.desc}</p>
                                </div>
                                {role === r.id && <span className={styles.checkmark}><Check size={18} /></span>}
                            </button>
                        ))}
                    </div>

                    <button
                        className="btn-primary"
                        onClick={handleStep1}
                        disabled={!role}
                        style={{ width: '100%', marginTop: 8, opacity: role ? 1 : 0.4 }}
                    >
                        Continue →
                    </button>

                    <p className={styles.loginLink}>
                        Already have an account?{' '}
                        <Link href="/login" className={styles.link}>Sign In →</Link>
                    </p>
                </div>
            )}

            {/* ── Step 2: Basic Info ── */}
            {step === 2 && (
                <div className={styles.panel}>
                    <ProgressBar step={2} />
                    <button className={styles.back} onClick={() => { setStep(1); setError(''); }}>← Back</button>

                    <div className={styles.selectedRole}>
                        <span>{selectedRole?.emoji}</span>
                        <span>Applying as {selectedRole?.title}</span>
                    </div>

                    <h1 className={styles.title}>Your Information</h1>
                    <p className={styles.subtitle}>Tell us a bit about yourself.</p>

                    {error && <div className={styles.errorBox}>⚠️ {error}</div>}

                    <div className={styles.form}>
                        <div className={styles.field}>
                            <label className={styles.label}>Full Name *</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="Jasmine Carter"
                                value={form.fullName}
                                onChange={setField('fullName')}
                                required
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Email Address *</label>
                            <input
                                type="email"
                                className="input"
                                placeholder="you@email.com"
                                value={form.email}
                                onChange={setField('email')}
                                required
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Password *</label>
                            <input
                                type="password"
                                className="input"
                                placeholder="Min. 6 characters"
                                value={form.password}
                                onChange={setField('password')}
                                required
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Confirm Password *</label>
                            <input
                                type="password"
                                className="input"
                                placeholder="••••••••"
                                value={form.confirmPassword}
                                onChange={setField('confirmPassword')}
                                required
                            />
                        </div>

                        <div className={styles.fieldRow}>
                            <div className={styles.field}>
                                <label className={styles.label}>City</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Atlanta, GA"
                                    value={form.city}
                                    onChange={setField('city')}
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Instagram</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="@handle"
                                    value={form.instagram}
                                    onChange={setField('instagram')}
                                />
                            </div>
                        </div>

                        <button
                            className="btn-primary"
                            type="button"
                            onClick={handleStep2}
                            style={{ width: '100%' }}
                        >
                            Continue →
                        </button>
                    </div>
                </div>
            )}

            {/* ── Step 3: Role Details ── */}
            {step === 3 && (
                <div className={styles.panel}>
                    <ProgressBar step={3} />
                    <button className={styles.back} onClick={() => { setStep(2); setError(''); }}>← Back</button>

                    <div className={styles.selectedRole}>
                        <span>{selectedRole?.emoji}</span>
                        <span>Applying as {selectedRole?.title}</span>
                    </div>

                    <h1 className={styles.title}>
                        {role === 'talent' && 'Your Measurements'}
                        {role === 'creator' && 'Your Services'}
                        {(role === 'agent' || role === 'agency') && 'Your Company'}
                    </h1>
                    <p className={styles.subtitle}>
                        {role === 'talent' && 'Help agents find the right fit for their casting.'}
                        {role === 'creator' && 'Let brands know what you offer.'}
                        {(role === 'agent' || role === 'agency') && 'Tell us about your company or agency.'}
                    </p>

                    {error && <div className={styles.errorBox}>⚠️ {error}</div>}

                    <form className={styles.form} onSubmit={handleSubmit}>

                        {/* Talent fields */}
                        {role === 'talent' && (
                            <>
                                <div className={styles.fieldRow}>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Dress Size</label>
                                        <select className="input" value={details.dressSize} onChange={setDetail('dressSize')}>
                                            <option value="">Select</option>
                                            {['XS (0)', 'S (2-4)', 'M (6-8)', 'L (10-12)', 'XL (14-16)', 'XXL (18+)'].map(s => (
                                                <option key={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Shoe Size</label>
                                        <select className="input" value={details.shoeSize} onChange={setDetail('shoeSize')}>
                                            <option value="">Select</option>
                                            {['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11'].map(s => (
                                                <option key={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.field}>
                                    <label className={styles.label}>Height</label>
                                    <select className="input" value={details.height} onChange={setDetail('height')}>
                                        <option value="">Select</option>
                                        {["4'10\"", "4'11\"", "5'0\"", "5'1\"", "5'2\"", "5'3\"", "5'4\"", "5'5\"", "5'6\"", "5'7\"", "5'8\"", "5'9\"", "5'10\"", "5'11\"", "6'0\"", "6'1\"", "6'2\""].map(h => (
                                            <option key={h}>{h}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.field}>
                                    <label className={styles.label}>Experience Level</label>
                                    <select className="input" value={details.experience} onChange={setDetail('experience')}>
                                        <option value="">Select</option>
                                        <option>New — No prior experience</option>
                                        <option>Some — 1-2 events</option>
                                        <option>Experienced — 3-10 events</option>
                                        <option>Veteran — 10+ events</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Creator fields */}
                        {role === 'creator' && (
                            <>
                                <div className={styles.field}>
                                    <label className={styles.label}>Specialty *</label>
                                    <select className="input" value={details.specialty} onChange={setDetail('specialty')} required>
                                        <option value="">Select</option>
                                        <option>Photography</option>
                                        <option>Videography</option>
                                        <option>Photography & Videography</option>
                                        <option>Content Creation</option>
                                    </select>
                                </div>

                                <div className={styles.field}>
                                    <label className={styles.label}>Hourly Rate</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="e.g. $150/hr"
                                        value={details.hourlyRate}
                                        onChange={setDetail('hourlyRate')}
                                    />
                                </div>

                                <div className={styles.field}>
                                    <label className={styles.label}>Portfolio / Website URL</label>
                                    <input
                                        type="url"
                                        className="input"
                                        placeholder="https://yourportfolio.com"
                                        value={details.portfolioUrl}
                                        onChange={setDetail('portfolioUrl')}
                                    />
                                </div>
                            </>
                        )}

                        {/* Agent / Agency fields */}
                        {(role === 'agent' || role === 'agency') && (
                            <>
                                <div className={styles.field}>
                                    <label className={styles.label}>
                                        {role === 'agency' ? 'Agency Name *' : 'Company / Brand Name *'}
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder={role === 'agency' ? 'Elite Talent Group' : 'Club Onyx VIP'}
                                        value={details.companyName}
                                        onChange={setDetail('companyName')}
                                        required
                                    />
                                </div>

                                <div className={styles.field}>
                                    <label className={styles.label}>Type</label>
                                    <select className="input" value={details.companyType} onChange={setDetail('companyType')}>
                                        <option value="">Select</option>
                                        {role === 'agency'
                                            ? ['Talent Agency', 'Management Company', 'Booking Agency', 'Entertainment Group'].map(t => <option key={t}>{t}</option>)
                                            : ['Nightclub / Venue', 'Brand / Clothing', 'Event Company', 'Photographer / Studio', 'Restaurant / Lounge', 'Other'].map(t => <option key={t}>{t}</option>)
                                        }
                                    </select>
                                </div>

                                <div className={styles.field}>
                                    <label className={styles.label}>Website</label>
                                    <input
                                        type="url"
                                        className="input"
                                        placeholder="https://yoursite.com"
                                        value={details.website}
                                        onChange={setDetail('website')}
                                    />
                                </div>
                            </>
                        )}

                        <div className={styles.terms}>
                            By applying you agree to our{' '}
                            <span className={styles.link}>Terms of Service</span>{' '}
                            and{' '}
                            <span className={styles.link}>Privacy Policy</span>.
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                            style={{ width: '100%', opacity: loading ? 0.6 : 1 }}
                        >
                            {loading ? 'Submitting...' : 'Submit Application →'}
                        </button>
                    </form>
                </div>
            )}

            {/* ── Step 4: Success ── */}
            {step === 4 && (
                <div className={styles.panel}>
                    <div className={styles.successIcon}>✓</div>
                    <h1 className={styles.title}>Application Submitted!</h1>
                    <p className={styles.subtitle}>
                        We&apos;ve received your application as{' '}
                        <strong style={{ color: 'var(--accent-pink)' }}>{selectedRole?.title}</strong>.
                        Our team will review it within 48 hours.
                    </p>

                    <div className={styles.successInfo}>
                        <div className={styles.successRow}>
                            <span className={styles.successLabel}>Name</span>
                            <span className={styles.successValue}>{form.fullName}</span>
                        </div>
                        <div className={styles.successRow}>
                            <span className={styles.successLabel}>Email</span>
                            <span className={styles.successValue}>{form.email}</span>
                        </div>
                        <div className={styles.successRow}>
                            <span className={styles.successLabel}>Role</span>
                            <span className={styles.successValue}>{selectedRole?.emoji} {selectedRole?.title}</span>
                        </div>
                        <div className={styles.successRow}>
                            <span className={styles.successLabel}>Status</span>
                            <span className="badge badge-gold">Pending Review</span>
                        </div>
                    </div>

                    <p className={styles.successNote}>
                        Check your email for a confirmation link. Once approved, you&apos;ll be able to sign in.
                    </p>

                    <Link href="/login" className="btn-primary" style={{ width: '100%', display: 'flex', marginTop: 8 }}>
                        Go to Sign In →
                    </Link>
                </div>
            )}
        </div>
    );
}
