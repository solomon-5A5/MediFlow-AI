import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    LayoutDashboard, Calendar, Search, Plus,
    ShoppingCart, Pill, LogOut, Check, Star,
    Sparkles, Package, Info, FlaskConical,
    Activity, BrainCircuit, History as HistoryIcon
} from 'lucide-react';

const Pharmacy = () => {
    const { user, logout } = useAuth();
    const { cart, addToCart, processCheckout } = useCart();
    const navigate = useNavigate();

    // --- STATE ---
    const [medicines, setMedicines] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [category, setCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // --- FETCH MEDICINES ---
    const fetchMedicines = async () => {
        setLoading(true);
        try {
            let url = `http://localhost:5001/api/medicines`;

            const res = await fetch(url);
            const data = await res.json();

            if (Array.isArray(data)) {
                setMedicines(data);
            }
        } catch (err) {
            console.error("Shop Error:", err);
            toast.error("Failed to load medicines");
        } finally {
            setLoading(false);
        }
    };

    // --- FETCH ORDERS ---
    const fetchOrders = async () => {
        if (!user) return;
        try {
            const id = user.id || user._id;
            const res = await fetch(`http://localhost:5001/api/orders/user/${id}`);
            const data = await res.json();
            if (Array.isArray(data)) setOrders(data);
        } catch (err) {
            console.error("Order Fetch Error", err);
        }
    };

    useEffect(() => {
        fetchMedicines();
        fetchOrders();
    }, [user]);

    // 🟢 CHECK FOR THE "AUTO-FILL" SECRET NOTE ON LOAD
    useEffect(() => {
        if (sessionStorage.getItem('autofill_success') === 'true') {
            // Show a premium, custom styled toast!
            toast.success("Magic Cart Auto-Filled Successfully!", {
                duration: 4000,
                position: 'top-center',
                style: {
                    background: '#10B981', // Emerald green
                    color: '#fff',
                    fontWeight: 'bold',
                    padding: '16px'
                },
                icon: '✨',
            });

            // Delete the note so it doesn't fire again on normal page refreshes
            sessionStorage.removeItem('autofill_success');
        }
    }, []);

    // --- CLIENT SIDE FILTERING LOGIC 🧠 ---
    const filteredMedicines = medicines.filter((med) => {
        // 1. Filter by Category
        const categoryMatch = category === 'All' || med.category === category;

        // 2. Filter by Search Term (Name or Description)
        const searchLower = searchTerm.toLowerCase();
        const searchMatch = med.name.toLowerCase().includes(searchLower) ||
            (med.description && med.description.toLowerCase().includes(searchLower));

        return categoryMatch && searchMatch;
    });

    // --- CHECKOUT (Razorpay Integration) ---
    const handleCheckout = async () => {
        if (cart.length === 0) return toast.error("Cart is empty!");

        // Calculate total
        const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);

        // Call the global Razorpay checkout function from Context
        processCheckout(user, totalAmount, () => {
            // This callback runs ONLY if the Razorpay payment succeeds
            toast.success("Order Placed Successfully!");
            
            // Refresh the orders table instantly without reloading the page
            fetchOrders(); 
            
            // Redirect to the success screen
            navigate('/payment-success'); 
        });
    };

    return (
        <div className="flex h-screen w-full bg-[#f6f6f8] text-[#100e1b] font-sans overflow-hidden">
            {/* INJECT FONTS */}
            <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
            .font-display { font-family: 'Space Grotesk', sans-serif; }
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #e9e8f3; border-radius: 4px; }
            ::-webkit-scrollbar-thumb:hover { background: #5747e6; }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

            {/* SIDEBAR */}
            <aside className="hidden md:flex flex-col w-72 h-full bg-white border-r border-slate-200 p-6 z-20">
                <div className="flex items-center gap-3 mb-10">
                    <div className="size-10 rounded-xl bg-[#5747e6] flex items-center justify-center text-white shadow-lg shadow-[#5747e6]/30">
                        <Activity className="w-6 h-6" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight font-display">MediFlow AI</h1>
                </div>

                <nav className="flex flex-col gap-2 flex-1 font-display">
                    <a href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#5747e6] transition-colors">
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="font-medium">Overview</span>
                    </a>
                    <a href="/dashboard#booking" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#5747e6] transition-colors">
                        <Calendar className="w-5 h-5" />
                        <span className="font-medium">Book Appointment</span>
                    </a>
                    <a href="/lab-tests" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#5747e6] transition-colors">
                        <Activity className="w-5 h-5" />
                        <span className="font-medium">Smart Diagnostics</span>
                    </a>
                    <a href="/ai-assistant" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#5747e6] transition-colors">
                        <BrainCircuit className="w-5 h-5" />
                        <span className="font-medium">AI Co-Pilot</span>
                    </a>
                    <a href="/pharmacy" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#5747e6] text-white shadow-md shadow-[#5747e6]/25 transition-all">
                        <Pill className="w-5 h-5" />
                        <span className="font-medium">Pharmacy</span>
                    </a>
                    <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#5747e6] transition-colors">
                        <HistoryIcon className="w-5 h-5" />
                        <span className="font-medium">History</span>
                    </a>
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col gap-4">
                    <button onClick={handleCheckout} className="w-full flex items-center justify-center gap-2 bg-[#5747e6] hover:bg-[#4638b9] text-white py-3 rounded-xl font-bold shadow-lg shadow-[#5747e6]/30 transition-all">
                        <Check className="w-5 h-5" /> Checkout ({cart.length})
                    </button>
                    
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[#5747e6] font-bold text-lg border border-slate-200">
                            {user?.fullName?.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                            <p className="text-sm font-bold text-slate-900 line-clamp-1">{user?.fullName}</p>
                            <p className="text-xs text-slate-500">#{(user?.id || user?._id || '').slice(-5)}</p>
                        </div>
                        <button onClick={() => { logout(); navigate("/"); }} className="ml-auto text-slate-400 hover:text-red-500 transition-colors">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col relative overflow-hidden font-display">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-5 lg:px-10 lg:py-6 bg-[#f6f6f8]/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex flex-col">
                        <h2 className="text-[#100e1b] text-xl lg:text-2xl font-bold leading-tight">Pharmacy Store</h2>
                        <p className="text-[#575095] text-sm hidden sm:block">Find your medicines & supplements</p>
                    </div>
                    <div className="flex items-center gap-4 lg:gap-6">
                        <div className="hidden md:flex items-center bg-white rounded-full px-4 h-12 w-64 lg:w-80 shadow-sm border border-gray-100 focus-within:ring-2 focus-within:ring-[#5747e6]/50 transition-all">
                            <Search className="text-gray-400 w-5 h-5" />
                            <input
                                className="bg-transparent border-none focus:ring-0 text-[#100e1b] text-sm w-full placeholder:text-gray-400 ml-2 outline-none"
                                placeholder="Search medicines..."
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button onClick={() => navigate('/cart')} className="relative p-2 text-[#100e1b] hover:bg-white rounded-full transition-colors group">
                            <ShoppingCart className="w-6 h-6 group-hover:text-[#5747e6]" />

                            {/* 🟢 ANIMATED PULSING RED DOT */}
                            {cart.length > 0 && (
                                <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
                                    {/* The Ping Animation Background */}
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    {/* The Solid Red Dot Foreground */}
                                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-[#f6f6f8]"></span>
                                </span>
                            )}
                        </button>
                        <div className="w-10 h-10 rounded-full bg-[#5747e6] text-white flex items-center justify-center font-bold border-2 border-white shadow-sm">{user?.fullName?.charAt(0) || "U"}</div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-10 lg:px-10">
                    <div className="max-w-7xl mx-auto flex flex-col gap-8 pt-4">

                        {/* Hero Section */}
                        <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#e0e7ff] via-[#eef2ff] to-[#f5f3ff] p-8 lg:p-12 shadow-sm border border-white/50">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-[#5747e6]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="flex flex-col gap-4 max-w-xl">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm w-fit border border-white/20">
                                        <Sparkles className="w-4 h-4 text-[#5747e6]" />
                                        <span className="text-xs font-bold text-[#5747e6] uppercase tracking-wide">Trusted Pharmacy</span>
                                    </div>
                                    <h2 className="text-4xl lg:text-5xl font-bold text-[#100e1b] tracking-tight">Essential Vitamins <br /> <span className="text-[#5747e6]">Daily Refill</span></h2>
                                    <p className="text-[#575095] text-lg max-w-md">Get 20% off on your first recurring order of vitamins and daily supplements.</p>
                                </div>
                            </div>
                        </div>

                        {/* 🟢 FULL CATEGORY FILTER BUTTONS */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                                {[
                                    'All',
                                    'Pain Relief',
                                    'Vitamins',
                                    'Supplements',
                                    'Antibiotics',
                                    'Heart Health',
                                    'Cold & Flu',
                                    'Devices',
                                    'Diabetes',
                                    'Hygiene',
                                    'First Aid',
                                    'Skincare'
                                ].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategory(cat)}
                                        className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${category === cat
                                            ? 'bg-[#100e1b] text-white border-[#100e1b] shadow-md'
                                            : 'bg-white border-gray-200 text-gray-500 hover:border-[#5747e6] hover:text-[#5747e6]'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* MEDICINE GRID */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
                            {loading ? [1, 2, 3, 4].map(i => <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-gray-100"></div>) :
                                filteredMedicines.length === 0 ? (
                                    <div className="col-span-full py-12 text-center text-gray-400">
                                        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No medicines found for "{category}"</p>
                                    </div>
                                ) :
                                    filteredMedicines.map((med) => (
                                        <div
                                            key={med._id}
                                            onClick={() => navigate(`/product/${med._id}`)}
                                            className="group relative flex flex-col bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] hover:shadow-xl transition-all duration-300 overflow-hidden border border-transparent hover:border-[#5747e6] hover:-translate-y-1 cursor-pointer"
                                        >
                                            {/* Image Section */}
                                            <div className="relative h-48 w-full bg-gray-50 flex items-center justify-center overflow-hidden p-6">
                                                <div className="absolute top-3 right-3 z-10 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-sm"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /><span className="text-xs font-bold text-[#100e1b]">{med.rating || 4.8}</span></div>
                                                <img src={med.imageUrl || "https://placehold.co/400x400/e2e8f0/64748b?text=No+Image"} alt={med.name} className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110" />
                                            </div>

                                            {/* Details Section */}
                                            <div className="p-5 flex flex-col flex-1">
                                                <div className="text-[10px] font-bold text-[#5747e6] uppercase mb-1 tracking-wider">{med.category}</div>
                                                <h4 className="text-lg font-bold text-[#100e1b] mb-1 leading-snug truncate">{med.name}</h4>

                                                <p className="text-xs text-gray-500 mb-4 line-clamp-2 h-8 leading-relaxed">
                                                    {med.description || "No description available for this product."}
                                                </p>

                                                <div className="mt-auto flex items-center justify-between">
                                                    <span className="text-xl font-bold text-[#100e1b]">₹{med.price}</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            addToCart(med);
                                                        }}
                                                        className="size-10 flex items-center justify-center bg-[#5747e6] text-white rounded-full hover:bg-[#4638b9] hover:scale-105 transition-all shadow-lg shadow-[#5747e6]/30 group/btn"
                                                    >
                                                        <Plus className="w-5 h-5 transition-transform group-hover/btn:rotate-90" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                            }
                        </div>

                        {/* Order History */}
                        <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-gray-100 mb-10">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-[#100e1b]">Recent Orders</h3>
                                <button onClick={fetchOrders} className="text-[#5747e6] text-sm font-bold hover:underline">Refresh</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="pb-3 text-xs uppercase tracking-wider text-[#575095] font-semibold pl-2">Order ID</th>
                                            <th className="pb-3 text-xs uppercase tracking-wider text-[#575095] font-semibold">Items</th>
                                            <th className="pb-3 text-xs uppercase tracking-wider text-[#575095] font-semibold">Date</th>
                                            <th className="pb-3 text-xs uppercase tracking-wider text-[#575095] font-semibold">Status</th>
                                            <th className="pb-3 text-xs uppercase tracking-wider text-[#575095] font-semibold text-right pr-2">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {orders.length === 0 ? (
                                            <tr><td colSpan="5" className="py-6 text-center text-gray-400">No orders found. Buy something above!</td></tr>
                                        ) : (
                                            orders.map(order => (
                                                <tr key={order._id} className="group hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                                                    <td className="py-4 pl-2 font-medium text-[#100e1b]">#{order._id.slice(-6)}</td>
                                                    <td className="py-4 text-[#575095]">
                                                        <div className="flex items-center gap-2">
                                                            <Package className="w-4 h-4 text-gray-400" />
                                                            {order.items[0]?.name} {order.items.length > 1 && <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">+{order.items.length - 1} more</span>}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-[#575095]">{new Date(order.createdAt).toLocaleDateString()}</td>
                                                    <td className="py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                                            order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-right pr-2 font-bold text-[#100e1b]">₹{order.totalAmount.toFixed(2)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default Pharmacy;