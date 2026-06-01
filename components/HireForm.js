'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import styles from './Form.module.css';

const QUESTIONS = [
    { key: 'instagram',      label: "What's your Instagram handle?",             type: 'text',     placeholder: '@yourprofile',               required: true  },
    { key: 'age',            label: "How old are you?",                          type: 'text',     placeholder: 'e.g. 23',                    required: true  },
    { key: 'location',       label: "What city are you based in?",               type: 'text',     placeholder: 'Atlanta, GA',                required: true  },
    { key: 'email',          label: "What's your email address?",                type: 'email',    placeholder: 'you@email.com',              required: true  },
    { key: 'phone',          label: "And your phone number?",                    type: 'tel',      placeholder: '(555) 000-0000',             required: true  },
    { key: 'experience',     label: "Tell us about your experience",             type: 'textarea', placeholder: 'Modeling, bottle service, events...', required: true  },
    { key: 'transportation', label: "Do you have reliable transportation?",      type: 'options',  required: true, options: ['Yes', 'No'] },
];

export default function HireForm({ onComplete }) {
    const [step, setStep]       = useState(0);
    const [loading, setLoading] = useState(false);
    const [sent, setSent]       = useState(false);
    const [form, setForm]       = useState({
        instagram: '', age: '', location: '', email: '',
        phone: '', experience: '', transportation: '',
    });
    const inputRef = useRef(null);
    const q = QUESTIONS[step];

    useEffect(() => {
        if (inputRef.current && q.type !== 'options') {
            inputRef.current.focus();
        }
    }, [step]);

    const canAdvance = () => {
        if (!q.required) return true;
        const val = form[q.key];
        return typeof val === 'string' ? val.trim() : val;
    };

    const next = () => {
        if (!canAdvance()) return;
        if (step < QUESTIONS.length - 1) setStep(s => s + 1);
    };

    const back = () => {
        if (step > 0) setStep(s => s - 1);
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && q.type !== 'textarea') {
            e.preventDefault();
            next();
        }
    };

    const pickOption = (val) => {
        setForm(f => ({ ...f, [q.key]: val }));
        if (step < QUESTIONS.length - 1) setTimeout(() => setStep(s => s + 1), 150);
    };

    const handleSubmit = async () => {
        setLoading(true);
        const res = await fetch('/api/submit-form', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ form_name: 'Hire Form (Talent)', email: form.email, fields: form }),
        });
        if (res.ok) {
            setSent(true);
            if (onComplete) onComplete();
        } else {
            alert('Something went wrong. Please try again.');
        }
        setLoading(false);
    };

    if (sent) {
        return (
            <div className={styles.success}>
                <CheckCircle size={64} color="var(--accent-purple)" />
                <h2>Application Sent!</h2>
                <p>Thanks for applying! We'll check out <strong>{form.instagram}</strong> and get in touch.</p>
            </div>
        );
    }

    const isLast = step === QUESTIONS.length - 1;
    const pct = ((step + 1) / QUESTIONS.length) * 100;
    const accentColor = 'var(--accent-purple)';

    return (
        <div className={styles.formContainer}>
            <div className={styles.progress}>
                <div className={styles.progressBar} style={{ width: `${pct}%`, background: accentColor }} />
            </div>

            <div className={styles.questionWrap}>
                <span className={styles.questionCounter} style={{ color: accentColor }}>
                    {step + 1} / {QUESTIONS.length}
                </span>

                <p className={styles.questionText}>{q.label}</p>

                {q.type === 'options' ? (
                    <div className={styles.optionGrid}>
                        {q.options.map(opt => (
                            <button
                                key={opt}
                                type="button"
                                className={`${styles.optionBtn} ${form[q.key] === opt ? styles.optionBtnSelected : ''}`}
                                onClick={() => pickOption(opt)}
                                style={form[q.key] === opt ? { borderColor: accentColor, color: accentColor, background: 'rgba(155,89,255,0.15)' } : {}}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                ) : q.type === 'textarea' ? (
                    <>
                        <textarea
                            ref={inputRef}
                            className={`${styles.questionInput} ${styles.questionTextarea}`}
                            name={q.key}
                            value={form[q.key]}
                            onChange={e => setForm(f => ({ ...f, [q.key]: e.target.value }))}
                            placeholder={q.placeholder || ''}
                            rows={3}
                            style={{ borderBottomColor: accentColor }}
                        />
                        <span className={styles.hint}>Press the button below when done</span>
                    </>
                ) : (
                    <>
                        <input
                            ref={inputRef}
                            className={styles.questionInput}
                            type={q.type}
                            name={q.key}
                            value={form[q.key]}
                            onChange={e => setForm(f => ({ ...f, [q.key]: e.target.value }))}
                            placeholder={q.placeholder || ''}
                            onKeyDown={handleKey}
                            required={q.required}
                            style={{ borderBottomColor: accentColor }}
                        />
                        <span className={styles.hint}>Press Enter ↵ to continue</span>
                    </>
                )}

                <div className={styles.qNav}>
                    <button type="button" className={styles.qBack} onClick={back} style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>
                        <ChevronLeft size={14} /> Back
                    </button>

                    {isLast ? (
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={handleSubmit}
                            disabled={loading || (q.required && !canAdvance())}
                            style={{ background: accentColor }}
                        >
                            {loading ? 'Submitting…' : 'Apply Now'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={next}
                            disabled={q.required && !canAdvance()}
                            style={{ padding: '10px 20px', background: accentColor }}
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
