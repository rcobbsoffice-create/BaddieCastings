'use client';

import { useState, useEffect } from 'react';
import { X, ShoppingCart, Plus, Minus, Zap, CreditCard, AlertCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import AppShell from '@/components/AppShell';
import styles from './page.module.css';

const products = [
    {
        id: 1,
        name: 'Signature Uniform',
        emoji: '👗',
        price: 120,
        description: 'Elite bottle service attire. Approved for all major venues.',
        badge: 'Top Pick',
        badgeClass: 'badge-pink'
    },
    {
        id: 2,
        name: 'VIP Heels (Black)',
        emoji: '👠',
        price: 85,
        description: 'High-comfort, high-shine performance heels.',
        badge: 'Comfort+',
        badgeClass: 'badge-purple'
    },
    {
        id: 3,
        name: 'Glam Accessory Kit',
        emoji: '✨',
        price: 45,
        description: 'Branded LED items and utility pouch for shifts.',
    },
    {
        id: 4,
        name: 'Agency Fast-Track',
        emoji: '⚡',
        price: 50,
        description: 'Skip the line. Get your application reviewed in 24h.',
        badge: 'Priority',
        badgeClass: 'badge-gold'
    },
    {
        id: 6,
        name: 'Executive Onboarding',
        emoji: '🛡️',
        price: 50,
        description: 'Required verification and identity check processing.',
        badge: 'Required',
        badgeClass: 'badge-red'
    },
    {
        id: 5,
        name: 'Portfolio Refresh',
        emoji: '📸',
        price: 150,
        description: 'Professional shoot + 5 edited headshots for your profile.',
    }
];

function StripePaymentForm({ cart, total, onSuccess, onClose }) {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setProcessing(true);
        setError(null);

        const { error: submitError } = await elements.submit();
        if (submitError) {
            setError(submitError.message);
            setProcessing(false);
            return;
        }

        const res = await fetch('/api/stripe/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: total,
                items: Object.entries(cart).map(([id, qty]) => {
                    const p = products.find(prod => prod.id === parseInt(id));
                    return { name: p.name, qty, price: p.price };
                }),
            }),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
            setError(data.error || 'Payment setup failed.');
            setProcessing(false);
            return;
        }

        const { error: confirmError } = await stripe.confirmPayment({
            elements,
            clientSecret: data.clientSecret,
            confirmParams: { return_url: window.location.href },
            redirect: 'if_required',
        });

        if (confirmError) {
            setError(confirmError.message);
            setProcessing(false);
        } else {
            onSuccess(cart);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement options={{ layout: 'tabs' }} />
            {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ff4d6d', fontSize: '0.82rem', marginTop: 12 }}>
                    <AlertCircle size={14} />
                    <span>{error}</span>
                </div>
            )}
            <button
                type="submit"
                className="btn-gold"
                style={{ width: '100%', marginTop: 20 }}
                disabled={!stripe || processing}
            >
                {processing ? 'Processing...' : `Pay Now · $${total}`}
            </button>
        </form>
    );
}

function CheckoutModal({ cart, total, onClose, onClearCart }) {
    const [step, setStep] = useState('summary');
    const [stripePromise, setStripePromise] = useState(null);
    const [clientSecret, setClientSecret] = useState(null);
    const [initError, setInitError] = useState(null);
    const [loadingIntent, setLoadingIntent] = useState(false);

    const handleProceedToPayment = async () => {
        setLoadingIntent(true);
        setInitError(null);
        try {
            const res = await fetch('/api/stripe/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: total,
                    items: Object.entries(cart).map(([id, qty]) => {
                        const p = products.find(prod => prod.id === parseInt(id));
                        return { name: p.name, qty, price: p.price };
                    }),
                }),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Failed to initialize payment.');
            setClientSecret(data.clientSecret);
            setStripePromise(loadStripe(data.publishableKey));
            setStep('payment');
        } catch (err) {
            setInitError(err.message);
        }
        setLoadingIntent(false);
    };

    const handleSuccess = (paidCart) => {
        const hasOnboarding = Object.keys(paidCart).includes('6');
        if (hasOnboarding) localStorage.setItem('onboardingPaid', 'true');

        const newPayments = Object.entries(paidCart).map(([id, qty]) => {
            const product = products.find(p => p.id === parseInt(id));
            return {
                label: product.name,
                amount: -(product.price * qty),
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                status: 'Paid',
            };
        });
        const storedHistory = JSON.parse(localStorage.getItem('paymentHistory') || '[]');
        localStorage.setItem('paymentHistory', JSON.stringify([...newPayments, ...storedHistory]));

        onClearCart();
        setStep('success');
    };

    const stripeAppearance = {
        theme: 'night',
        variables: {
            colorPrimary: '#FF007A',
            colorBackground: '#12121e',
            colorText: '#ffffff',
            colorDanger: '#ff4d6d',
            fontFamily: 'system-ui, sans-serif',
            borderRadius: '10px',
        },
    };

    return (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget && step !== 'payment') onClose(); }}>
            <div className={styles.modal}>
                {step !== 'success' && (
                    <button className={styles.modalClose} onClick={onClose}>
                        <X size={18} />
                    </button>
                )}

                {step === 'summary' && (
                    <>
                        <h2 className={styles.modalTitle}>Checkout Summary</h2>
                        <div className={styles.summaryList}>
                            {Object.entries(cart).map(([id, qty]) => {
                                const p = products.find(prod => prod.id === parseInt(id));
                                return (
                                    <div key={id} className={styles.summaryItem}>
                                        <span>{p.name} x {qty}</span>
                                        <span>${p.price * qty}</span>
                                    </div>
                                );
                            })}
                            <div className={styles.summaryTotal}>
                                <span>Total</span>
                                <span>${total}</span>
                            </div>
                        </div>
                        {initError && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ff4d6d', fontSize: '0.82rem', marginTop: 12, padding: '10px 14px', background: 'rgba(255,77,109,0.1)', borderRadius: 8 }}>
                                <AlertCircle size={14} />
                                <span>{initError}</span>
                            </div>
                        )}
                        <button
                            className="btn-gold"
                            style={{ width: '100%', marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                            onClick={handleProceedToPayment}
                            disabled={loadingIntent}
                        >
                            <CreditCard size={16} />
                            {loadingIntent ? 'Connecting...' : `Continue to Payment · $${total}`}
                        </button>
                    </>
                )}

                {step === 'payment' && stripePromise && clientSecret && (
                    <>
                        <h2 className={styles.modalTitle}>Secure Payment</h2>
                        <div className={styles.summaryTotal} style={{ marginBottom: 20 }}>
                            <span>Total</span>
                            <span>${total}</span>
                        </div>
                        <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
                            <StripePaymentForm cart={cart} total={total} onSuccess={handleSuccess} onClose={onClose} />
                        </Elements>
                    </>
                )}

                {step === 'success' && (
                    <div className={styles.success}>
                        <div className={styles.successIcon}>✓</div>
                        <h2 className={styles.modalTitle}>Payment Received!</h2>
                        <p className={styles.successMsg}>Your order has been confirmed. Items will be dispatched to your primary venue.</p>
                        <button className="btn-primary" style={{ width: '100%', marginTop: 24 }} onClick={onClose}>
                            Return to Shop
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ShopPage() {
    const [cart, setCart] = useState({});
    const [showCheckout, setShowCheckout] = useState(false);

    const add = (id) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
    const remove = (id) => setCart(c => {
        const n = { ...c };
        if (n[id] <= 1) delete n[id]; else n[id]--;
        return n;
    });

    const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
    const totalPrice = products.reduce((sum, p) => sum + (cart[p.id] || 0) * p.price, 0);

    return (
        <AppShell>
            <div className="page-header">
                <div className={styles.headerRow}>
                    <div>
                        <h1 className="page-title">Shop</h1>
                        <p className="page-subtitle">Uniforms, add-ons &amp; VIP bundles</p>
                    </div>
                    {totalItems > 0 && (
                        <div className={styles.cartBubble} id="cart-bubble">
                            <ShoppingCart size={16} />
                            <span>{totalItems}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.content}>
                {/* Shop Hero */}
                <div className={styles.shopHero}>
                    <img src="/shop-hero.png" alt="Baddie Castings –  Shop" className={styles.heroImg} />
                    <div className={styles.heroCover} />
                    <div className={styles.heroText}>
                        <p className={styles.heroLabel}>Premium Add-Ons</p>
                        <p className={styles.heroTitle}>Elevate Your <em>Look</em></p>
                    </div>
                </div>

                {/* Products */}
                <div className={styles.productGrid}>
                    {products.map((p) => (
                        <div key={p.id} className={`card ${styles.productCard}`}>
                            <div className={styles.productEmoji}>{p.emoji}</div>
                            {p.badge && <span className={`badge ${p.badgeClass} ${styles.productBadge}`}>{p.badge}</span>}
                            <h3 className={styles.productName}>{p.name}</h3>
                            <p className={styles.productDesc}>{p.description}</p>
                            <div className={styles.productFooter}>
                                <p className={styles.productPrice}>${p.price}</p>
                                {!cart[p.id] ? (
                                    <button
                                        className="btn-primary"
                                        id={`btn-add-to-cart-${p.id}`}
                                        onClick={() => add(p.id)}
                                        style={{ padding: '10px 18px', fontSize: '0.82rem' }}
                                    >
                                        <Plus size={14} /> Add
                                    </button>
                                ) : (
                                    <div className={styles.qtyRow}>
                                        <button className={styles.qtyBtn} id={`btn-remove-${p.id}`} onClick={() => remove(p.id)}><Minus size={14} /></button>
                                        <span className={styles.qtyNum}>{cart[p.id]}</span>
                                        <button className={styles.qtyBtn} id={`btn-add-${p.id}`} onClick={() => add(p.id)}><Plus size={14} /></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Cart summary */}
                {totalItems > 0 && (
                    <div className={styles.cartBar} id="cart-summary-bar">
                        <div>
                            <p className={styles.cartItems}>{totalItems} item{totalItems > 1 ? 's' : ''} in cart</p>
                            <p className={styles.cartTotal}>${totalPrice}</p>
                        </div>
                        <button className="btn-gold" id="btn-checkout" onClick={() => setShowCheckout(true)}>
                            <Zap size={15} /> Checkout
                        </button>
                    </div>
                )}
            </div>

            {showCheckout && (
                <CheckoutModal
                    cart={cart}
                    total={totalPrice}
                    onClose={() => setShowCheckout(false)}
                    onClearCart={() => setCart({})}
                />
            )}
        </AppShell>
    );
}
