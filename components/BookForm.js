'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import styles from './Form.module.css';

const QUESTIONS = [
    { key: 'firstName',     label: "What's your first name?",          type: 'text',    placeholder: 'Jane',             required: true  },
    { key: 'lastName',      label: "And your last name?",              type: 'text',    placeholder: 'Doe',              required: true  },
    { key: 'email',         label: "What's your email address?",       type: 'email',   placeholder: 'jane@example.com', required: true  },
    { key: 'phone',         label: "Best number to reach you?",        type: 'tel',     placeholder: '(555) 000-0000',   required: true  },
    { key: 'date',          label: "When is the event?",               type: 'date',    required: true  },
    { key: 'eventType',     label: "What type of event is it?",        type: 'options', required: true,
      options: ['Nightclub VIP', 'Private Party', 'Music Video', 'Corporate Event', 'Photoshoot', 'Other'] },
    { key: 'location',      label: "Where's the venue located?",       type: 'text',    placeholder: 'Atlanta, GA',      required: true  },
    { key: 'baddiesNeeded', label: "How many Baddies do you need?",    type: 'number',  placeholder: 'e.g. 5',           required: true  },
    { key: 'age',           label: "Last one — what's your age?",      type: 'text',    placeholder: 'e.g. 25',          required: false },
];

export default function BookForm({ onComplete }) {
    const [step, setStep]       = useState(0);
    const [loading, setLoading] = useState(false);
    const [sent, setSent]       = useState(false);
    const [form, setForm]       = useState({
        firstName: '', lastName: '', email: '', phone: '',
        date: '', eventType: '', location: '', baddiesNeeded: '', age: '',
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
        return form[q.key]?.trim?.() || form[q.key];
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
            body: JSON.stringify({ form_name: 'Bookings Form', email: form.email, fields: form }),
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
                <CheckCircle size={64} color="var(--accent-pink)" />
                <h2>Request Received!</h2>
                <p>We've got your booking request for <strong>{form.eventType}</strong>. Our team will reach out shortly.</p>
            </div>
        );
    }

    const isLast = step === QUESTIONS.length - 1;
    const pct = ((step + 1) / QUESTIONS.length) * 100;

    return (
        <div className={styles.formContainer}>
            <div className={styles.progress}>
                <div className={styles.progressBar} style={{ width: `${pct}%` }} />
            </div>

            <div className={styles.questionWrap}>
                <span className={styles.questionCounter}>
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
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
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
                            disabled={loading || (!q.required ? false : !canAdvance())}
                        >
                            {loading ? 'Submitting…' : 'Submit Request'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={next}
                            disabled={q.required && !canAdvance()}
                            style={{ padding: '10px 20px' }}
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
