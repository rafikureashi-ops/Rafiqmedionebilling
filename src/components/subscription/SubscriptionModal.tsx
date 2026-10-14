import React, { useState } from 'react';
import { Pharmacy, SubscriptionPlanConfig } from '../../types/pharmacy.js';
import confetti from 'canvas-confetti';
import {
  Check,
  ShieldCheck,
  Sparkles,
  Lock,
  CreditCard,
  QrCode,
  Zap,
  Clock,
  X,
  AlertCircle
} from 'lucide-react';

interface SubscriptionModalProps {
  pharmacy: Pharmacy;
  plans: SubscriptionPlanConfig[];
  remainingSeconds: number;
  onClose: () => void;
  onPlanActivated: (updatedPharmacy: Pharmacy) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  pharmacy,
  plans,
  remainingSeconds,
  onClose,
  onPlanActivated
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    pharmacy.subscriptionPlanId === 'trial' ? 'advance' : pharmacy.subscriptionPlanId
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'payment_method' | 'success'>('details');
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [simUpiId, setSimUpiId] = useState('user@okhdfcbank');
  const [orderData, setOrderData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];

  const formatCountdown = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hours} hours, ${mins} minutes, ${s} seconds remaining`;
  };

  // Step 1: Initiate Payment
  const handleInitiatePayment = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/subscription/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-pharmacy-id': pharmacy.id },
        body: JSON.stringify({ planId: selectedPlanId })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create payment order');
      }

      setOrderData(data.order);
      setShowCheckoutDialog(true);
      setCheckoutStep('details');
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to start checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2: Confirm Payment Simulation & Server Verification
  const handleCompletePayment = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/subscription/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-pharmacy-id': pharmacy.id },
        body: JSON.stringify({
          planId: selectedPlanId,
          orderId: orderData.orderId,
          paymentId: 'pay_rzp_sim_' + Date.now(),
          signature: 'sig_verified_server_hmac'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Payment verification failed');
      }

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      setCheckoutStep('success');
      setTimeout(() => {
        onPlanActivated(data.pharmacy);
        setShowCheckoutDialog(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment could not be verified.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Activate 24h Trial for ₹1
  const handleActivateTrial = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/subscription/activate-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-pharmacy-id': pharmacy.id }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        confetti({ particleCount: 70, spread: 70 });
        onPlanActivated(data.pharmacy);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="MediOneBilling"
              className="w-12 h-12 object-contain rounded-full border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  MediOneBilling Subscription Plans
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Select an annual subscription plan for your pharmacy or explore with the ₹1 Trial.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Plan & Anti-Clock Tampering Notice */}
        <div className="px-6 py-3 bg-teal-50 dark:bg-teal-950/30 border-b border-teal-100 dark:border-teal-900 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-teal-900 dark:text-teal-200 gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              Current Plan: <strong className="uppercase">{pharmacy.subscriptionPlanId}</strong> ·{' '}
              {pharmacy.subscriptionPlanId === 'trial' ? formatCountdown(remainingSeconds) : `Expires: ${new Date(pharmacy.subscriptionExpiresAt).toLocaleDateString('en-IN')}`}
            </span>
          </div>
          <span className="text-[11px] text-teal-700 dark:text-teal-300 font-mono">
            Verified by Server Timestamp (Anti-Tamper Active)
          </span>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Plans Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          {plans.map(plan => {
            const isSelected = selectedPlanId === plan.id;
            const isCurrent = pharmacy.subscriptionPlanId === plan.id;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all relative ${
                  isSelected
                    ? 'border-teal-600 ring-2 ring-teal-500/20 bg-teal-50/20 dark:bg-teal-950/20 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                {plan.isPopular && (
                  <span className="absolute -top-2.5 right-3 bg-teal-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                    Most Popular
                  </span>
                )}

                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {plan.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 min-h-[32px] leading-tight">
                    {plan.tagline}
                  </p>

                  <div className="my-3">
                    <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                      ₹{plan.price}
                    </span>
                    <span className="text-xs text-slate-500">
                      {plan.id === 'trial' ? ' / 24 Hours' : ' / Year'}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      + 18% GST (₹{(plan.price * 0.18).toFixed(2)})
                    </span>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-[11px]">
                    <div className="font-semibold text-slate-700 dark:text-slate-300">
                      Devices: Up to {plan.maxDevices} {plan.maxDevices === 1 ? 'terminal' : 'terminals'}
                    </div>
                    {plan.features.slice(0, 5).map((f, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-slate-600 dark:text-slate-400">
                        <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {isCurrent ? (
                    <span className="block text-center text-xs font-bold text-teal-700 dark:text-teal-400 py-1.5 bg-teal-50 dark:bg-teal-950/40 rounded-lg">
                      Active Plan
                    </span>
                  ) : (
                    <span
                      className={`block text-center text-xs font-semibold py-1.5 rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select Plan'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Plan Summary & Checkout Action */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
            <div>
              Selected: <strong className="text-slate-900 dark:text-white">{selectedPlan.name}</strong> (Base: ₹{selectedPlan.price} + GST: ₹{(selectedPlan.price * 0.18).toFixed(2)})
            </div>
            <div className="text-sm font-bold text-teal-800 dark:text-teal-300">
              Total Payable: ₹{(selectedPlan.price * 1.18).toFixed(2)}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {selectedPlan.id === 'trial' ? (
              <button
                onClick={handleActivateTrial}
                disabled={isProcessing}
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
              >
                {isProcessing ? 'Verifying...' : 'Activate ₹1 Trial (24 Hours)'}
              </button>
            ) : (
              <button
                onClick={handleInitiatePayment}
                disabled={isProcessing}
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>{isProcessing ? 'Connecting...' : `Proceed to Pay ₹${(selectedPlan.price * 1.18).toFixed(2)}`}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Razorpay Gateway Checkout Dialog */}
      {showCheckoutDialog && orderData && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Razorpay Brand Bar */}
            <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] tracking-wider uppercase opacity-80 block">Secure Payment Gateway</span>
                <h4 className="text-base font-bold">Razorpay Indian Checkout</h4>
              </div>
              <button onClick={() => setShowCheckoutDialog(false)} className="text-white/80 hover:text-white">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {checkoutStep === 'details' && (
                <>
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Merchant:</span>
                      <strong className="text-slate-800 dark:text-slate-200">MediOneBilling SaaS</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Order ID:</span>
                      <span className="font-mono">{orderData.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Plan:</span>
                      <span>{orderData.planName}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-blue-600 pt-1 border-t">
                      <span>Total Amount:</span>
                      <span>₹{orderData.totalAmount}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Select Payment Instrument:</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('upi')}
                        className={`p-2 border rounded-lg text-center ${selectedMethod === 'upi' ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 font-bold' : ''}`}
                      >
                        UPI / QR
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('card')}
                        className={`p-2 border rounded-lg text-center ${selectedMethod === 'card' ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 font-bold' : ''}`}
                      >
                        Debit / Credit
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('netbanking')}
                        className={`p-2 border rounded-lg text-center ${selectedMethod === 'netbanking' ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 font-bold' : ''}`}
                      >
                        NetBanking
                      </button>
                    </div>
                  </div>

                  {selectedMethod === 'upi' && (
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Virtual Payment Address (VPA):</label>
                      <input
                        type="text"
                        value={simUpiId}
                        onChange={e => setSimUpiId(e.target.value)}
                        placeholder="yourname@okhdfcbank"
                        className="w-full p-2 border rounded-lg dark:text-white"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">Supports Google Pay, PhonePe, Paytm, CRED</span>
                    </div>
                  )}

                  <button
                    onClick={handleCompletePayment}
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm"
                  >
                    {isProcessing ? 'Verifying Gateway Signature...' : `Authorize & Pay ₹${orderData.totalAmount}`}
                  </button>
                </>
              )}

              {checkoutStep === 'success' && (
                <div className="py-8 text-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">Payment Verified Successfully!</h4>
                  <p className="text-slate-500">Subscription upgraded and activated on server.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
