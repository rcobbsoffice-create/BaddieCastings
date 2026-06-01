'use client';

import AppShell from '@/components/AppShell';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, MessageSquare, FileText, Mail, Phone } from 'lucide-react';
import styles from '../settings.module.css';

const faqs = [
    { q: 'How do I get verified?', a: 'Submit your ID and headshots through the Verification Center. Admin reviews within 48 hours.' },
    { q: 'When do I get paid?', a: 'Payments are processed every Friday via Cash App or Zelle after shift confirmation.' },
    { q: 'How do I cancel a shift?', a: 'Message admin at least 48 hours before your shift. Last-minute cancellations may affect your rating.' },
    { q: 'How do I apply for a casting?', a: 'Go to the Castings tab, find a listing, and tap "Apply Now". Agents will contact you directly.' },
];

const contactOptions = [
    { icon: MessageSquare, label: 'Live Chat', desc: 'Chat with support (9am–9pm EST)', href: '#' },
    { icon: Mail, label: 'Email Support', desc: 'support@baddiecastings.com', href: 'mailto:support@baddiecastings.com' },
    { icon: Phone, label: 'Call Us', desc: '+1 (404) 555-0100', href: 'tel:+14045550100' },
];

export default function HelpPage() {
    const router = useRouter();

    return (
        <AppShell>
            <div className={styles.page}>
                <div className={styles.header}>
                    <button className={styles.back} onClick={() => router.back()}>
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className={styles.title}>Help & Support</h1>
                    <div style={{ width: 36 }} />
                </div>

                {/* Contact */}
                <section className={styles.section}>
                    <p className={styles.groupLabel}>Contact Us</p>
                    <div className={styles.settingsList}>
                        {contactOptions.map(({ icon: Icon, label, desc, href }) => (
                            <a key={label} href={href} className={styles.settingRow}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div className={styles.settingIcon}>
                                        <Icon size={17} color="var(--accent-pink)" />
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{label}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{desc}</p>
                                    </div>
                                </div>
                                <ChevronRight size={16} color="var(--text-muted)" />
                            </a>
                        ))}
                    </div>
                </section>

                {/* FAQ */}
                <section className={styles.section}>
                    <p className={styles.groupLabel}>Frequently Asked Questions</p>
                    <div className={styles.settingsList}>
                        {faqs.map(({ q, a }, i) => (
                            <details key={i} className={styles.faqItem}>
                                <summary className={styles.faqQ}>
                                    <span>{q}</span>
                                    <ChevronRight size={14} color="var(--text-muted)" className={styles.faqChevron} />
                                </summary>
                                <p className={styles.faqA}>{a}</p>
                            </details>
                        ))}
                    </div>
                </section>
            </div>
        </AppShell>
    );
}
