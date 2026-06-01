'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

const FEE_ROLES = ['bottle_girl', 'bartender', 'hookah_girl'];
const SERVICE_ROLES = ['bottle_girl', 'bartender', 'hookah_girl', 'dj'];

// Top-level role categories
const ROLES = [
    {
        id: 'talent',
        emoji: '👑',
        title: 'Talent',
        sub: 'Models & Performers',
        desc: 'Apply for castings, get booked for events, and grow your career.',
        badge: 'Most Popular',
        badgeClass: 'badge-pink',
    },
    {
        id: 'service_industry',
        emoji: '🎪',
        title: 'Service Industry',
        sub: 'Bottle Girls, Bartenders & More',
        desc: 'Work events, venues, and clubs. Choose your specific role next.',
        badge: 'Nightlife',
        badgeClass: 'badge-gold',
    },
    {
        id: 'creator',
        emoji: '📸',
        title: 'Creator',
        sub: 'Photographers & Videographers',
        desc: 'Build your profile, set your rates, and get booked by brands.',
        badge: 'Verified Only',
        badgeClass: 'badge-purple',
    },
    {
        id: 'agent',
        emoji: '🎯',
        title: 'Casting Agent / Brand',
        sub: 'Post Castings & Book Talent',
        desc: 'Post opportunities, manage applicants, and book the best talent.',
        badge: 'Verified Only',
        badgeClass: 'badge-gold',
    },
    {
        id: 'agency',
        emoji: '🏢',
        title: 'Agency',
        sub: 'Executive Management',
        desc: 'Orchestrate talent, manage castings, and control your ecosystem.',
        badge: 'Management',
        badgeClass: 'badge-purple',
    },
];

// Service Industry sub-roles
const SERVICE_SUBROLES = [
    {
        id: 'bottle_girl',
        emoji: '🍾',
        title: 'Bottle Girl',
        sub: 'Nightclub & Event Service',
        desc: 'Work bottle service at top venues, clubs, and private events.',
        badge: '$180 Fee',
        badgeClass: 'badge-pink',
        onboardingFee: 180,
    },
    {
        id: 'bartender',
        emoji: '🍸',
        title: 'Bartender',
        sub: 'Bar & Event Service',
        desc: 'Craft cocktails and work bar service at premier venues and events.',
        badge: '$120 Fee',
        badgeClass: 'badge-gold',
        onboardingFee: 120,
    },
    {
        id: 'hookah_girl',
        emoji: '💨',
        title: 'Hookah Girl',
        sub: 'Hookah & Lounge Service',
        desc: 'Provide hookah service at lounges, clubs, and private events.',
        badge: '$120 Fee',
        badgeClass: 'badge-purple',
        onboardingFee: 120,
    },
    {
        id: 'dj',
        emoji: '🎧',
        title: 'DJ',
        sub: 'Music & Entertainment',
        desc: 'Perform at clubs, private bookings, and events across the city.',
        badge: 'No Fee',
        badgeClass: 'badge-gold',
        onboardingFee: 0,
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Step flow: 'category' → (optional) 'service_subrole' → 'info' → 'details' → 'done'
    const [flowStep, setFlowStep] = useState('category');

    // Role selection
    const [category, setCategory] = useState('');       // top-level category id
    const [role, setRole] = useState('');               // final resolved role id

    // Step 2 — base info
    const [form, setForm] = useState({
        fullName: '', email: '', password: '', confirmPassword: '', city: '', instagram: '',
    });

    // Step 3 — role-specific
    const [details, setDetails] = useState({
        dressSize: '', shoeSize: '', height: '', experience: '',
        availability: '', specialty: '', hourlyRate: '', portfolioUrl: '',
        companyName: '', companyType: '', website: '',
    });

    const selectedCategory  = ROLES.find(r => r.id === category);
    const selectedSubRole   = SERVICE_SUBROLES.find(r => r.id === role);
    const selectedRole      = SERVICE_ROLES.includes(role)
        ? selectedSubRole
        : ROLES.find(r => r.id === role);

    const setField  = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }));
    const setDetail = (f) => (e) => setDetails(prev => ({ ...prev, [f]: e.target.value }));

    // ── Step handlers ──────────────────────────────────────────────────────────

    const handleCategoryNext = () => {
        if (!category) return;
        if (category === 'service_industry') {
            setFlowStep('service_subrole');
        } else {
            setRole(category);
            setFlowStep('info');
        }
        setError('');
    };

    const handleSubRoleNext = () => {
        if (!role) return;
        setFlowStep('info');
        setError('');
    };

    const handleInfoNext = () => {
        const { fullName, email, password, confirmPassword } = form;
        if (!fullName || !email || !password) { setError('Please fill in all required fields.'); return; }
        if (password.length < 6)              { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirmPassword)      { setError('Passwords do not match.'); return; }
        setError('');
        setFlowStep('details');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const metadata = {
            full_name:  form.fullName,
            role,
            city:       form.city,
            instagram:  form.instagram,
            status:     'pending',
            ...(role === 'talent' && {
                dress_size:  details.dressSize,
                shoe_size:   details.shoeSize,
                height:      details.height,
                experience:  details.experience,
            }),
            ...(role === 'creator' && {
                specialty:      details.specialty,
                hourly_rate:    details.hourlyRate,
                portfolio_url:  details.portfolioUrl,
            }),
            ...((role === 'agent' || role === 'agency') && {
                company_name: details.companyName,
                company_type: details.companyType,
                website:      details.website,
            }),
            ...(SERVICE_ROLES.includes(role) && {
                experience:      details.experience,
                availability:    details.availability,
                onboarding_fee:  selectedSubRole?.onboardingFee ?? 0,
            }),
        };

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: { data: metadata },
            });

            if (signUpError) { setError(signUpError.message); setLoading(false); return; }

            if (data?.user) {
                await supabase.from('profiles').insert({
                    id:         data.user.id,
                    email:      form.email,
                    full_name:  form.fullName,
                    role,
                    city:       form.city,
                    instagram:  form.instagram,
                    status:     'pending',
                    ...metadata,
                }).select();
            }

            try {
                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: form.email,
                        subject: 'Welcome to Baddie Castings! 👑',
                        html: `
                            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
                                <h1 style="color:#ff3366;">Welcome to Baddie Castings! 👑</h1>
                                <p>Hi ${form.fullName},</p>
                                <p>We're thrilled to have you on board! Our team will review your application within 48 hours.</p>
                                <a href="${window.location.origin}/dashboard" style="background:#ff3366;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">
                                    Go to Dashboard
                                </a>
                                <p style="margin-top:30px;font-size:14px;color:#777;">Stay glowing,<br/>The Baddie Castings Team</p>
                            </div>
                        `,
                    }),
                });
            } catch { /* email failure is non-fatal */ }

            setFlowStep('done');
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className={styles.page}>
            <div className={styles.bg} />

            <div className={styles.logo}>
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <span className={styles.logoText}>Baddie Castings</span>
                </Link>
                <span className={styles.logoTag}>Apply for Access</span>
            </div>

            {/* ── Step: Category ── */}
            {flowStep === 'category' && (
                <div className={styles.panel}>
                    <h1 className={styles.title}>Choose Your Role</h1>
                    <p className={styles.subtitle}>How will you be using the platform?</p>

                    <div className={styles.roleGrid}>
                        {ROLES.map((r) => (
                            <button
                                key={r.id}
                                className={`${styles.roleCard} ${category === r.id ? styles.roleSelected : ''}`}
                                onClick={() => setCategory(r.id)}
                            >
                                <span className={styles.roleEmoji}>{r.emoji}</span>
                                <div className={styles.roleBody}>
                                    <div className={styles.roleTitleRow}>
                                        <p className={styles.roleTitle}>{r.title}</p>
                                        <span className={`badge ${r.badgeClass}`}>{r.badge}</span>
                                    </div>
                                    <p className={styles.roleSub}>{r.sub}</p>
                                    <p className={styles.roleDesc}>{r.desc}</p>
                                </div>
                                {category === r.id && <span className={styles.checkmark}>✓</span>}
                            </button>
                        ))}
                    </div>

                    <button
                        className="btn-primary"
                        onClick={handleCategoryNext}
                        disabled={!category}
                        style={{ width: '100%', marginTop: 8, opacity: category ? 1 : 0.4 }}
                    >
                        Continue →
                    </button>

                    <p className={styles.loginLink}>
                        Already have an account?{' '}
                        <Link href="/login" className={styles.link}>Sign In →</Link>
                    </p>
                </div>
            )}

            {/* ── Step: Service Industry Sub-role ── */}
            {flowStep === 'service_subrole' && (
                <div className={styles.panel}>
                    <button className={styles.back} onClick={() => { setFlowStep('category'); setRole(''); setError(''); }}>← Back</button>

                    <div className={styles.selectedRole}>
                        <span>🎪</span>
                        <span>Service Industry</span>
                    </div>

                    <h1 className={styles.title}>Your Position</h1>
                    <p className={styles.subtitle}>Choose your specific role to continue</p>

                    <div className={styles.roleGrid}>
                        {SERVICE_SUBROLES.map((r) => (
                            <button
                                key={r.id}
                                className={`${styles.roleCard} ${role === r.id ? styles.roleSelected : ''}`}
                                onClick={() => setRole(r.id)}
                            >
                                <span className={styles.roleEmoji}>{r.emoji}</span>
                                <div className={styles.roleBody}>
                                    <div className={styles.roleTitleRow}>
                                        <p className={styles.roleTitle}>{r.title}</p>
                                        <span className={`badge ${r.badgeClass}`}>{r.badge}</span>
                                    </div>
                                    <p className={styles.roleSub}>{r.sub}</p>
                                    <p className={styles.roleDesc}>{r.desc}</p>
                                    {r.onboardingFee > 0 && (
                                        <p className={styles.roleFee}>Onboarding Fee: ${r.onboardingFee}</p>
                                    )}
                                </div>
                                {role === r.id && <span className={styles.checkmark}>✓</span>}
                            </button>
                        ))}
                    </div>

                    <button
                        className="btn-primary"
                        onClick={handleSubRoleNext}
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

            {/* ── Step: Basic Info ── */}
            {flowStep === 'info' && (
                <div className={styles.panel}>
                    <ProgressBar step={2} />
                    <button className={styles.back} onClick={() => {
                        setError('');
                        setFlowStep(category === 'service_industry' ? 'service_subrole' : 'category');
                    }}>← Back</button>

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
                            <input type="text" className="input" placeholder="Jasmine Carter" value={form.fullName} onChange={setField('fullName')} required />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Email Address *</label>
                            <input type="email" className="input" placeholder="you@email.com" value={form.email} onChange={setField('email')} required />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Password *</label>
                            <input type="password" className="input" placeholder="Min. 6 characters" value={form.password} onChange={setField('password')} required />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Confirm Password *</label>
                            <input type="password" className="input" placeholder="••••••••" value={form.confirmPassword} onChange={setField('confirmPassword')} required />
                        </div>
                        <div className={styles.fieldRow}>
                            <div className={styles.field}>
                                <label className={styles.label}>City</label>
                                <input type="text" className="input" placeholder="Atlanta, GA" value={form.city} onChange={setField('city')} />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Instagram</label>
                                <input type="text" className="input" placeholder="@handle" value={form.instagram} onChange={setField('instagram')} />
                            </div>
                        </div>
                        <button className="btn-primary" type="button" onClick={handleInfoNext} style={{ width: '100%' }}>
                            Continue →
                        </button>
                    </div>
                </div>
            )}

            {/* ── Step: Role Details ── */}
            {flowStep === 'details' && (
                <div className={styles.panel}>
                    <ProgressBar step={3} />
                    <button className={styles.back} onClick={() => { setFlowStep('info'); setError(''); }}>← Back</button>

                    <div className={styles.selectedRole}>
                        <span>{selectedRole?.emoji}</span>
                        <span>Applying as {selectedRole?.title}</span>
                    </div>

                    <h1 className={styles.title}>
                        {role === 'talent' && 'Your Measurements'}
                        {role === 'creator' && 'Your Services'}
                        {(role === 'agent' || role === 'agency') && 'Your Company'}
                        {SERVICE_ROLES.includes(role) && 'Your Experience'}
                    </h1>
                    <p className={styles.subtitle}>
                        {role === 'talent' && 'Help agents find the right fit for their casting.'}
                        {role === 'creator' && 'Let brands know what you offer.'}
                        {(role === 'agent' || role === 'agency') && 'Tell us about your company or agency.'}
                        {SERVICE_ROLES.includes(role) && 'Tell us about your experience and availability.'}
                    </p>

                    {error && <div className={styles.errorBox}>⚠️ {error}</div>}

                    <form className={styles.form} onSubmit={handleSubmit}>
                        {/* Talent */}
                        {role === 'talent' && (
                            <>
                                <div className={styles.fieldRow}>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Dress Size</label>
                                        <select className="input" value={details.dressSize} onChange={setDetail('dressSize')}>
                                            <option value="">Select</option>
                                            {['XS (0)', 'S (2-4)', 'M (6-8)', 'L (10-12)', 'XL (14-16)', 'XXL (18+)'].map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Shoe Size</label>
                                        <select className="input" value={details.shoeSize} onChange={setDetail('shoeSize')}>
                                            <option value="">Select</option>
                                            {['5','5.5','6','6.5','7','7.5','8','8.5','9','9.5','10','10.5','11'].map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Height</label>
                                    <select className="input" value={details.height} onChange={setDetail('height')}>
                                        <option value="">Select</option>
                                        {["4'10\"","4'11\"","5'0\"","5'1\"","5'2\"","5'3\"","5'4\"","5'5\"","5'6\"","5'7\"","5'8\"","5'9\"","5'10\"","5'11\"","6'0\"","6'1\"","6'2\""].map(h => <option key={h}>{h}</option>)}
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

                        {/* Creator */}
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
                                    <input type="text" className="input" placeholder="e.g. $150/hr" value={details.hourlyRate} onChange={setDetail('hourlyRate')} />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Portfolio / Website URL</label>
                                    <input type="url" className="input" placeholder="https://yourportfolio.com" value={details.portfolioUrl} onChange={setDetail('portfolioUrl')} />
                                </div>
                            </>
                        )}

                        {/* Service Industry */}
                        {SERVICE_ROLES.includes(role) && (
                            <>
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
                                <div className={styles.field}>
                                    <label className={styles.label}>Availability</label>
                                    <select className="input" value={details.availability} onChange={setDetail('availability')}>
                                        <option value="">Select</option>
                                        <option>Weekends Only</option>
                                        <option>Weekdays Only</option>
                                        <option>Weekdays & Weekends</option>
                                        <option>Flexible</option>
                                    </select>
                                </div>
                                {FEE_ROLES.includes(role) && (
                                    <div className={styles.feeBox}>
                                        <div className={styles.feeRow}>
                                            <span className={styles.feeLabel}>One-Time Onboarding Fee</span>
                                            <span className={styles.feeAmount}>${selectedSubRole?.onboardingFee}</span>
                                        </div>
                                        <p className={styles.feeNote}>Collected upon approval. Covers account setup and platform onboarding.</p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Agent / Agency */}
                        {(role === 'agent' || role === 'agency') && (
                            <>
                                <div className={styles.field}>
                                    <label className={styles.label}>{role === 'agency' ? 'Agency Name *' : 'Company / Brand Name *'}</label>
                                    <input type="text" className="input"
                                        placeholder={role === 'agency' ? 'Elite Talent Group' : 'Club Onyx VIP'}
                                        value={details.companyName} onChange={setDetail('companyName')} required />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Type</label>
                                    <select className="input" value={details.companyType} onChange={setDetail('companyType')}>
                                        <option value="">Select</option>
                                        {role === 'agency'
                                            ? ['Talent Agency','Management Company','Booking Agency','Entertainment Group'].map(t => <option key={t}>{t}</option>)
                                            : ['Nightclub / Venue','Brand / Clothing','Event Company','Photographer / Studio','Restaurant / Lounge','Other'].map(t => <option key={t}>{t}</option>)
                                        }
                                    </select>
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Website</label>
                                    <input type="url" className="input" placeholder="https://yoursite.com" value={details.website} onChange={setDetail('website')} />
                                </div>
                            </>
                        )}

                        <div className={styles.terms}>
                            By applying you agree to our{' '}
                            <span className={styles.link}>Terms of Service</span>{' '}
                            and{' '}
                            <span className={styles.link}>Privacy Policy</span>.
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}
                            style={{ width: '100%', opacity: loading ? 0.6 : 1 }}>
                            {loading ? 'Submitting...' : 'Submit Application →'}
                        </button>
                    </form>
                </div>
            )}

            {/* ── Step: Success ── */}
            {flowStep === 'done' && (
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
                        {FEE_ROLES.includes(role) && (
                            <div className={styles.successRow}>
                                <span className={styles.successLabel}>Onboarding Fee</span>
                                <span className={styles.successValue}>${selectedSubRole?.onboardingFee} due on approval</span>
                            </div>
                        )}
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
