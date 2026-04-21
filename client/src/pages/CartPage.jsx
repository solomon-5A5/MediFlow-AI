import React, { useState, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    ArrowLeft, Search, ShoppingCart, Bell, Trash2,
    Minus, Plus, Lock, ArrowRight, CheckCircle,
    Clock, Package, Truck, MapPin
} from 'lucide-react';

// Helper to dynamically load the Razorpay script
const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const CartPage = () => {
    // 🟢 CHANGE 1: Import updateQuantity
    const { cart, removeFromCart, updateQuantity, clearCart } = useCart();

    const { user } = useAuth();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [orderId, setOrderId] = useState(null);

    // 🟢 UPDATED: Cart is already grouped by Context
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = cartTotal * 0.08;
    const finalTotal = cartTotal + tax;

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return;
        setIsProcessing(true);
        const toastId = toast.loading("Initializing Payment gateway...");

        // 1. Load Razorpay
        const res = await loadRazorpayScript();
        if (!res) {
            toast.error("Payment gateway failed to load. Please check your connection.", { id: toastId });
            setIsProcessing(false);
            return;
        }

        try {
            // 2. Ask Node.js backend to create a Razorpay Order ID
            const orderResponse = await fetch("http://localhost:5001/api/payments/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: finalTotal })
            });

            const orderData = await orderResponse.json();

            if (!orderData || !orderData.id) {
                throw new Error("Failed to create order on backend");
            }

            toast.dismiss(toastId); // Clear the loading toast

            // 3. Configure and Open the Razorpay Popup
            const options = {
                key: "rzp_test_Scgpbv1xV27qxi", // 👈 Replace with your actual Razorpay Test Key ID
                amount: orderData.amount,
                currency: "INR",
                name: "MediFlow AI Pharmacy",
                description: "Wellness Essentials Order",
                order_id: orderData.id,
                handler: async function (response) {
                    // 🟢 THIS RUNS ONLY IF PAYMENT IS SUCCESSFUL!
                    const successToastId = toast.loading("Securing your order...");

                    try {
                        // Now we save the actual order to your database just like you did before
                        const dbRes = await fetch("http://localhost:5001/api/orders/create", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                patientId: user.id || user._id,
                                paymentId: response.razorpay_payment_id, // Save the transaction ID!
                                items: cart.map(item => ({
                                    medicineId: item._id,
                                    name: item.name,
                                    price: item.price,
                                    quantity: item.quantity
                                })),
                                totalAmount: finalTotal
                            })
                        });

                        const dbData = await dbRes.json();

                        if (dbRes.ok) {
                            toast.success("Payment Successful! Order Placed.", { id: successToastId });
                            clearCart();
                            setOrderId(dbData.order?._id || response.razorpay_payment_id);
                            setOrderPlaced(true); // Triggers your beautiful success screen
                        } else {
                            toast.error("Payment succeeded, but order tracking failed.", { id: successToastId });
                        }
                    } catch (err) {
                        toast.error("Error saving order.", { id: successToastId });
                    }
                },
                prefill: {
                    name: user?.fullName || "Solomon Pattapu", // Uses context if available
                    email: user?.email || "patient@mediflow.com",
                    contact: "9999999999",
                },
                theme: {
                    color: "#6354e8", // Matches your exact UI hex code
                },
                modal: {
                    ondismiss: function() {
                        setIsProcessing(false);
                        toast.error("Payment cancelled");
                    }
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();

        } catch (err) {
            console.error(err);
            toast.error("Failed to initialize payment.", { id: toastId });
            setIsProcessing(false);
        }
    };

    // SUCCESS VIEW
    if (orderPlaced) {
        return (
            <div className="min-h-screen bg-[#f6f6f8] flex flex-col items-center justify-center p-6 font-sans">
                <div className="bg-white max-w-2xl w-full p-8 rounded-3xl shadow-xl border border-slate-200 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 animate-bounce">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-2 font-display">Order Confirmed!</h2>
                    <p className="text-slate-500 mb-8 text-lg">Your wellness essentials are on the way.</p>

                    <div className="bg-slate-50 rounded-xl p-4 mb-10 border border-slate-100 inline-block px-8">
                        <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Tracking ID</span>
                        <p className="text-xl font-bold text-[#6354e8] font-mono">{orderId}</p>
                    </div>

                    <div className="relative flex items-center justify-between mb-12 px-4 md:px-10">
                        <div className="absolute left-0 top-1/2 w-full h-1 bg-slate-100 -z-0"></div>
                        <div className="absolute left-0 top-1/2 w-1/4 h-1 bg-green-500 -z-0 transition-all duration-1000 ease-out" style={{ width: '35%' }}></div>

                        {[
                            { icon: Clock, label: "Placed", active: true },
                            { icon: Package, label: "Processing", active: true },
                            { icon: Truck, label: "Shipped", active: false },
                            { icon: MapPin, label: "Delivered", active: false }
                        ].map((step, i) => (
                            <div key={i} className="relative z-10 bg-white p-2">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${step.active ? 'bg-green-500 border-green-100 text-white shadow-lg shadow-green-200' : 'bg-slate-100 border-white text-slate-300'}`}>
                                    <step.icon className="w-5 h-5" />
                                </div>
                                <p className={`absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-bold whitespace-nowrap ${step.active ? 'text-green-600' : 'text-slate-300'}`}>{step.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4 justify-center">
                        <button onClick={() => navigate('/pharmacy')} className="bg-[#6354e8] hover:bg-[#5042c5] text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#6354e8]/30">
                            Back to Shop
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // CART VIEW
    return (
        <div className="min-h-screen bg-[#f6f6f8] text-gray-900 font-display transition-colors duration-200 flex flex-col">
            <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between gap-4">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6354e8]/10 text-[#6354e8]">
                                <ShoppingCart className="w-6 h-6" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-gray-900 hidden sm:block">MediFlow AI</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#6354e8] text-white flex items-center justify-center font-bold border-2 border-white shadow-sm">
                                {user?.fullName?.charAt(0)}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 flex items-center gap-4">
                    <button onClick={() => navigate('/pharmacy')} className="bg-white p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 mb-1">Your Wellness Cart</h1>
                        <p className="text-gray-500 text-lg">Review your medical essentials.</p>
                    </div>
                </div>

                {cart.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                        <ShoppingCart className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                        <button onClick={() => navigate('/pharmacy')} className="mt-4 text-[#6354e8] font-bold hover:underline">Browse Medicines</button>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8 items-start relative">
                        {/* LEFT COLUMN */}
                        <div className="flex-1 w-full space-y-4">
                            <div className="hidden sm:flex justify-between px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                <span>Product Details</span>
                                <span className="mr-16">Quantity</span>
                            </div>

                            {cart.map((item) => (
                                <div key={item._id} className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-transparent hover:shadow-md hover:border-[#6354e8]/20 transition-all duration-300">
                                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-50 p-2">
                                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-contain mix-blend-multiply" />
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#6354e8] transition-colors">{item.name}</h3>
                                                <p className="text-sm text-gray-500 mt-0.5">{item.category}</p>
                                            </div>
                                        </div>
                                        <p className="text-[#6354e8] font-bold mt-2">₹{item.price}</p>
                                    </div>
                                    <div className="flex items-center gap-6 mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                                        <div className="flex items-center rounded-lg bg-gray-50 border border-gray-200 p-1">

                                            {/* 🟢 CHANGE 2: THIS BUTTON IS FIXED */}
                                            <button
                                                onClick={() => updateQuantity(item._id, 'decrease')}
                                                className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-white hover:shadow-sm transition-all"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>

                                            <input className="w-10 bg-transparent text-center text-sm font-semibold border-none focus:ring-0 p-0 text-gray-900" readOnly type="text" value={item.quantity} />

                                            <button
                                                onClick={() => updateQuantity(item._id, 'increase')}
                                                className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-white hover:shadow-sm transition-all"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* 🟢 CHANGE 3: This one calls the Nuclear Option (Remove All) */}
                                        <button
                                            onClick={() => removeFromCart(item._id)}
                                            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all"
                                            title="Remove All"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="w-full lg:w-[380px] shrink-0">
                            <div className="lg:sticky lg:top-24 rounded-2xl p-6 md:p-8 bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl ring-1 ring-black/5">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Subtotal</span>
                                        <span className="font-medium">₹{cartTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Shipping</span>
                                        <span className="text-green-600 font-medium">Free</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Tax (8%)</span>
                                        <span className="font-medium">₹{tax.toFixed(2)}</span>
                                    </div>
                                    <div className="my-4 border-t border-gray-200 border-dashed"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-base font-bold text-gray-900">Total</span>
                                        <span className="text-2xl font-black text-[#6354e8]">₹{finalTotal.toFixed(2)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={isProcessing}
                                    className="w-full py-4 px-6 bg-[#6354e8] hover:bg-[#5042c5] text-white font-bold rounded-xl shadow-lg shadow-[#6354e8]/25 hover:shadow-[#6354e8]/40 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? <span>Processing...</span> : <><span>Checkout</span><ArrowRight className="w-5 h-5" /></>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CartPage;