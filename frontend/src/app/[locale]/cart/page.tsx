'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { AppLocale } from '@/i18n/config';
import { Container } from '@/components/ui/Container';
import { useAuth } from '@/lib/useAuth';
import { useCart } from '@/lib/CartContext';
import {
  ShippingAddress,
  fetchShippingAddress,
  updateShippingAddress,
  initiateProductCheckout,
  OrderCheckoutResponse,
} from '@/lib/api';
import { useCurrency } from '@/lib/useCurrency';
import dynamic from 'next/dynamic';

const RazorpayProductCheckout = dynamic(
  () => import('@/components/payment/RazorpayProductCheckout'),
  { ssr: false },
);

const TEXTS = {
  en: {
    title: 'Shopping Cart',
    empty: 'Your cart is empty',
    emptyDesc: 'Browse our products and add items to your cart.',
    browseProducts: 'Browse Products',
    product: 'Product',
    price: 'Price',
    quantity: 'Quantity',
    subtotal: 'Subtotal',
    actions: 'Actions',
    remove: 'Remove',
    clearCart: 'Clear Cart',
    orderSummary: 'Order Summary',
    items: 'Items',
    total: 'Total',
    currency: '₹',
    proceedToCheckout: 'Proceed to Checkout',
    loginRequired: 'Please login to continue',
    loginBtn: 'Login',
    shippingAddress: 'Shipping Address',
    addressRequired: 'Please add your shipping address before checkout',
    saveAddress: 'Save Address',
    saving: 'Saving…',
    fullName: 'Full Name',
    phone: 'Phone Number',
    addressLine1: 'Address Line 1',
    addressLine2: 'Address Line 2 (optional)',
    city: 'City',
    state: 'State',
    pincode: 'PIN Code',
    country: 'Country',
    editAddress: 'Edit Address',
    backToCart: '← Back to Cart',
    checkout: 'Place Order',
    comingSoon: 'Payment integration coming soon. Your cart has been saved.',
    placingOrder: 'Placing Order…',
    orderSuccess: 'Order placed successfully! You will receive a confirmation email shortly.',
    orderFailed: 'Failed to place order. Please try again.',
    paymentDismissed: 'Payment was cancelled. You can try again.',
    home: 'Home',
    cart: 'Cart',
  },
  hi: {
    title: 'शॉपिंग कार्ट',
    empty: 'आपका कार्ट खाली है',
    emptyDesc: 'हमारे उत्पाद ब्राउज़ करें और कार्ट में आइटम जोड़ें।',
    browseProducts: 'उत्पाद देखें',
    product: 'उत्पाद',
    price: 'मूल्य',
    quantity: 'मात्रा',
    subtotal: 'उप-कुल',
    actions: 'कार्रवाई',
    remove: 'हटाएं',
    clearCart: 'कार्ट खाली करें',
    orderSummary: 'ऑर्डर सारांश',
    items: 'आइटम',
    total: 'कुल',
    currency: '₹',
    proceedToCheckout: 'चेकआउट करें',
    loginRequired: 'जारी रखने के लिए कृपया लॉगिन करें',
    loginBtn: 'लॉगिन',
    shippingAddress: 'शिपिंग पता',
    addressRequired: 'चेकआउट से पहले कृपया अपना शिपिंग पता जोड़ें',
    saveAddress: 'पता सहेजें',
    saving: 'सहेजा जा रहा है…',
    fullName: 'पूरा नाम',
    phone: 'फोन नंबर',
    addressLine1: 'पता पंक्ति 1',
    addressLine2: 'पता पंक्ति 2 (वैकल्पिक)',
    city: 'शहर',
    state: 'राज्य',
    pincode: 'पिन कोड',
    country: 'देश',
    editAddress: 'पता बदलें',
    backToCart: '← कार्ट पर वापस',
    checkout: 'ऑर्डर दें',
    comingSoon: 'भुगतान एकीकरण जल्द आ रहा है। आपका कार्ट सहेजा गया है।',
    placingOrder: 'ऑर्डर दिया जा रहा है…',
    orderSuccess: 'ऑर्डर सफलतापूर्वक दे दिया गया! आपको जल्द ही एक पुष्टिकरण ईमेल प्राप्त होगी।',
    orderFailed: 'ऑर्डर देने में विफल। कृपया पुनः प्रयास करें।',
    paymentDismissed: 'भुगतान रद्द कर दिया गया। आप पुनः प्रयास कर सकते हैं।',
    home: 'होम',
    cart: 'कार्ट',
  },
};

type Step = 'cart' | 'address' | 'checkout';

export default function CartPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as AppLocale) || 'en';
  const txt = TEXTS[locale] || TEXTS.en;
  const { user, accessToken, isAuthenticated, isLoading } = useAuth();
  const { cart, loading: cartLoading, updateQuantity, removeItem, clearAll } = useCart();
  const { format } = useCurrency();

  const [step, setStep] = useState<Step>('cart');
  const [address, setAddress] = useState<ShippingAddress | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<OrderCheckoutResponse | null>(null);
  const [orderPlacing, setOrderPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Address form fields
  const [formFullName, setFormFullName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLine1, setFormLine1] = useState('');
  const [formLine2, setFormLine2] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formPincode, setFormPincode] = useState('');
  const [formCountry, setFormCountry] = useState('India');

  const getLocaleField = (en?: string, hi?: string) =>
    locale === 'hi' && hi ? hi : en || '';

  // Fetch address when moving to address step
  const loadAddress = useCallback(async () => {
    if (!accessToken) return;
    setLoadingAddress(true);
    try {
      const addr = await fetchShippingAddress(accessToken);
      setAddress(addr);
      if (addr) {
        setFormFullName(addr.fullName);
        setFormPhone(addr.phone);
        setFormLine1(addr.addressLine1);
        setFormLine2(addr.addressLine2 || '');
        setFormCity(addr.city);
        setFormState(addr.state);
        setFormPincode(addr.pincode);
        setFormCountry(addr.country);
      }
    } catch {
      // No address yet
    } finally {
      setLoadingAddress(false);
    }
  }, [accessToken]);

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) return;
    setStep('address');
    loadAddress();
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setSavingAddress(true);
    setAddressError(null);
    try {
      const addr = await updateShippingAddress(
        {
          fullName: formFullName,
          phone: formPhone,
          addressLine1: formLine1,
          addressLine2: formLine2 || undefined,
          city: formCity,
          state: formState,
          pincode: formPincode,
          country: formCountry || 'India',
        },
        accessToken,
      );
      setAddress(addr);
      setShowAddressForm(false);
    } catch (err: any) {
      setAddressError(err.message || 'Failed to save address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!accessToken) return;
    setOrderPlacing(true);
    setCheckoutMessage(null);
    try {
      const data = await initiateProductCheckout(accessToken);
      setPaymentData(data);
    } catch (err: any) {
      setCheckoutMessage(err.message || txt.orderFailed);
      setOrderPlacing(false);
    }
  };

  const handlePaymentSuccess = (response: { orderId: string; message: string }) => {
    setPaymentData(null);
    setOrderPlacing(false);
    setOrderSuccess(true);
    setCheckoutMessage(txt.orderSuccess);
    // Clear cart in context
    clearAll();
  };

  const handlePaymentFailure = (error: { message: string }) => {
    setPaymentData(null);
    setOrderPlacing(false);
    setCheckoutMessage(error.message || txt.orderFailed);
  };

  const handlePaymentDismiss = () => {
    setPaymentData(null);
    setOrderPlacing(false);
    setCheckoutMessage(txt.paymentDismissed);
  };

  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    return (
      <div style={{ backgroundColor: 'var(--color-background)' }}>
        <Container className="py-20 text-center">
          <p className="text-5xl mb-4">🔒</p>
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
            {txt.loginRequired}
          </h1>
          <Link
            href={`/${locale}/login?redirect=/${locale}/cart`}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-white font-semibold transition hover:shadow-lg"
            style={{ backgroundColor: 'var(--color-gold)' }}
          >
            {txt.loginBtn}
          </Link>
        </Container>
      </div>
    );
  }

  // Loading
  if (isLoading || cartLoading) {
    return (
      <div style={{ backgroundColor: 'var(--color-background)' }}>
        <Container className="py-12">
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-gold)' }} />
          </div>
        </Container>
      </div>
    );
  }

  const items = cart?.items || [];

  return (
    <div style={{ backgroundColor: 'var(--color-background)' }}>
      <Container className="py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-500 mb-6 gap-2">
          <Link href={`/${locale}`} className="hover:text-orange-600 transition">{txt.home}</Link>
          <span>/</span>
          <span className="text-gray-700 dark:text-gray-300 font-medium">{txt.cart}</span>
        </nav>

        {/* Step: Cart */}
        {step === 'cart' && (
          <>
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
                🛒 {txt.title}
              </h1>
              {items.length > 0 && (
                <button
                  onClick={clearAll}
                  data-testid="clear-cart-btn"
                  className="text-red-500 hover:text-red-700 text-sm font-medium transition"
                >
                  {txt.clearCart}
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div data-testid="empty-cart" className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700">
                <p className="text-5xl mb-4">🛒</p>
                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">{txt.empty}</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">{txt.emptyDesc}</p>
                <Link
                  href={`/${locale}/products`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold transition hover:shadow-lg"
                  style={{ backgroundColor: 'var(--color-gold)' }}
                >
                  {txt.browseProducts}
                </Link>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.productId}
                      data-testid="cart-item"
                      className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 sm:p-6 flex gap-4"
                    >
                      {/* Image */}
                      <Link href={`/${locale}/products/${item.slug}`} className="flex-none w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={getLocaleField(item.title, item.titleHi)} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">🛒</div>
                        )}
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/${locale}/products/${item.slug}`} className="font-semibold text-gray-900 dark:text-white hover:text-orange-600 transition line-clamp-1">
                          {getLocaleField(item.title, item.titleHi)}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg font-bold" style={{ color: 'var(--color-gold)' }}>
                            {format(item.price)}
                          </span>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="text-sm text-gray-400 line-through">{format(item.originalPrice)}</span>
                          )}
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            onClick={() => item.quantity > 1 ? updateQuantity(item.productId, item.quantity - 1) : removeItem(item.productId)}
                            data-testid="qty-decrease"
                            className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm font-bold"
                          >
                            −
                          </button>
                          <span data-testid="item-qty" className="w-8 text-center font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            data-testid="qty-increase"
                            className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm font-bold"
                          >
                            +
                          </button>
                          <span className="ml-auto text-sm text-gray-500">{txt.subtotal}: <span className="font-bold" style={{ color: 'var(--color-gold)' }}>{format(item.subtotal)}</span></span>
                        </div>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="flex-none text-red-400 hover:text-red-600 transition p-1 self-start"
                        title={txt.remove}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6 sticky top-24">
                    <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
                      {txt.orderSummary}
                    </h2>
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>{txt.items} ({cart?.totalItems})</span>
                        <span className="font-medium">{format(cart?.totalAmount || 0)}</span>
                      </div>
                      <div className="border-t dark:border-gray-700 pt-3 flex justify-between font-bold text-lg">
                        <span>{txt.total}</span>
                        <span data-testid="cart-total" style={{ color: 'var(--color-gold)' }}>{format(cart?.totalAmount || 0)}</span>
                      </div>
                    </div>
                    <button
                      onClick={handleProceedToCheckout}
                      data-testid="checkout-btn"
                      className="w-full py-3 rounded-full text-white font-semibold text-lg transition hover:shadow-lg hover:scale-[1.02]"
                      style={{ backgroundColor: 'var(--color-gold)' }}
                    >
                      {txt.proceedToCheckout}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Step: Address */}
        {step === 'address' && (
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setStep('cart')}
              className="text-sm text-gray-500 hover:text-orange-600 mb-4 transition"
            >
              {txt.backToCart}
            </button>

            <h1 className="text-2xl sm:text-3xl font-bold mb-6" style={{ color: 'var(--color-primary)' }}>
              📮 {txt.shippingAddress}
            </h1>

            {loadingAddress ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-gold)' }} />
              </div>
            ) : address && !showAddressForm ? (
              /* Show saved address */
              <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{address.fullName}</h3>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="text-sm font-medium hover:underline"
                    style={{ color: 'var(--color-gold)' }}
                  >
                    {txt.editAddress}
                  </button>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {address.addressLine1}
                  {address.addressLine2 && <><br />{address.addressLine2}</>}
                  <br />
                  {address.city}, {address.state} - {address.pincode}
                  <br />
                  {address.country}
                  <br />
                  📞 {address.phone}
                </p>
                <button
                  onClick={() => setStep('checkout')}
                  className="mt-6 w-full py-3 rounded-full text-white font-semibold text-lg transition hover:shadow-lg"
                  style={{ backgroundColor: 'var(--color-gold)' }}
                >
                  {txt.proceedToCheckout}
                </button>
              </div>
            ) : (
              /* Address form */
              <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
                <p className="text-gray-600 dark:text-gray-400 mb-6">{txt.addressRequired}</p>
                {addressError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                    {addressError}
                  </div>
                )}
                <form onSubmit={handleSaveAddress} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{txt.fullName}</label>
                      <input
                        type="text"
                        value={formFullName}
                        onChange={(e) => setFormFullName(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{txt.phone}</label>
                      <input
                        type="tel"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{txt.addressLine1}</label>
                    <input
                      type="text"
                      value={formLine1}
                      onChange={(e) => setFormLine1(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{txt.addressLine2}</label>
                    <input
                      type="text"
                      value={formLine2}
                      onChange={(e) => setFormLine2(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{txt.city}</label>
                      <input
                        type="text"
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{txt.state}</label>
                      <input
                        type="text"
                        value={formState}
                        onChange={(e) => setFormState(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{txt.pincode}</label>
                      <input
                        type="text"
                        value={formPincode}
                        onChange={(e) => setFormPincode(e.target.value)}
                        required
                        pattern="[0-9]{6}"
                        title="6-digit PIN code"
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{txt.country}</label>
                    <input
                      type="text"
                      value={formCountry}
                      onChange={(e) => setFormCountry(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="w-full py-3 rounded-full text-white font-semibold text-lg transition hover:shadow-lg disabled:opacity-60"
                    style={{ backgroundColor: 'var(--color-gold)' }}
                  >
                    {savingAddress ? txt.saving : txt.saveAddress}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Step: Checkout (Order Confirmation) */}
        {step === 'checkout' && (
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setStep('address')}
              className="text-sm text-gray-500 hover:text-orange-600 mb-4 transition"
            >
              {txt.backToCart}
            </button>

            <h1 className="text-2xl sm:text-3xl font-bold mb-6" style={{ color: 'var(--color-primary)' }}>
              ✅ {txt.checkout}
            </h1>

            {/* Order Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6 mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{txt.orderSummary}</h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {getLocaleField(item.title, item.titleHi)} × {item.quantity}
                    </span>
                    <span className="font-medium">{format(item.subtotal)}</span>
                  </div>
                ))}
                <div className="border-t dark:border-gray-700 pt-3 flex justify-between font-bold text-lg">
                  <span>{txt.total}</span>
                  <span style={{ color: 'var(--color-gold)' }}>{format(cart?.totalAmount || 0)}</span>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            {address && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{txt.shippingAddress}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {address.fullName}, {address.addressLine1}
                  {address.addressLine2 && `, ${address.addressLine2}`}
                  , {address.city}, {address.state} - {address.pincode}, {address.country}
                  <br />📞 {address.phone}
                </p>
              </div>
            )}

            {checkoutMessage && (
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-300 text-sm">
                {checkoutMessage}
              </div>
            )}

            {!orderSuccess && (
              <button
                onClick={handlePlaceOrder}
                disabled={orderPlacing}
                className="w-full py-3 rounded-full text-white font-semibold text-lg transition hover:shadow-lg hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--color-gold)' }}
              >
                {orderPlacing ? txt.placingOrder : `${txt.checkout} — ${format(cart?.totalAmount || 0)}`}
              </button>
            )}

            {/* Razorpay Checkout Component */}
            {paymentData && (
              <RazorpayProductCheckout
                paymentData={paymentData}
                accessToken={accessToken!}
                user={{ email: user?.email || '', name: user?.name || '' }}
                onSuccess={handlePaymentSuccess}
                onFailure={handlePaymentFailure}
                onDismiss={handlePaymentDismiss}
                autoOpen
              />
            )}
          </div>
        )}
      </Container>
    </div>
  );
}
