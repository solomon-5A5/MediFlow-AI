import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext'; // 👈 Needed for User ID
import { useNavigate } from 'react-router-dom';
import {
    Search, MapPin, Upload, CloudLightning, CheckCircle,
    Home, Building2, Plus, Loader2, FileText,
    Microscope, ShoppingBag, Clock, Calendar, X, AlertTriangle // 🟢 ADDED AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

const LabTests = () => {
    const { addToCart, cart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    // --- STATE ---
    const [labTests, setLabTests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Location & Filters
    const [location, setLocation] = useState(localStorage.getItem('mediFlow_location') || '');
    const [showLocationModal, setShowLocationModal] = useState(!localStorage.getItem('mediFlow_location'));
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    // AI
    const [aiStatus, setAiStatus] = useState('idle');
    const [aiResults, setAiResults] = useState(null); // 🟢 NEW: Holds the PDF results

    // 🟢 NEW: Booking Modal State
    const [selectedTest, setSelectedTest] = useState(null); // Which test is being booked?
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('');

    // --- 1. FETCH REAL DATA ---
    useEffect(() => {
        const fetchLabs = async () => {
            try {
                const res = await fetch("http://localhost:5001/api/lab-tests");
                const data = await res.json();
                if (Array.isArray(data)) setLabTests(data);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load lab tests");
            } finally {
                setLoading(false);
            }
        };
        fetchLabs();
    }, []);

    // --- 2. LOCATION LOGIC (Syncs to Admin) ---
    const saveLocationToBackend = async (loc) => {
        if (!user?.id) return;
        try {
            await fetch(`http://localhost:5001/api/users/${user.id}/location`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ location: loc })
            });
            console.log("📍 Location synced to Super Admin");
        } catch (err) {
            console.error("Location Sync Error", err);
        }
    };

    const handleDetectLocation = () => {
        if (!navigator.geolocation) return toast.error("Not supported");

        const toastId = toast.loading("Locating...");
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Reverse Geocoding
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    const city = data.address.city || data.address.town || "Unknown City";
                    const detectedLoc = `${city}, ${data.address.state}`;

                    // Save
                    setLocation(detectedLoc);
                    localStorage.setItem('mediFlow_location', detectedLoc);
                    setShowLocationModal(false);
                    saveLocationToBackend(detectedLoc); // 👈 SYNC TO DB

                    toast.success(`Location set: ${detectedLoc}`, { id: toastId });
                } catch (err) {
                    toast.error("Could not determine city", { id: toastId });
                }
            },
            () => toast.error("Permission denied", { id: toastId })
        );
    };

    // --- 3. BOOKING LOGIC ---
    const openBookingModal = (test) => {
        setSelectedTest(test);
        setBookingDate(new Date().toISOString().split('T')[0]); // Default today
    };

    const confirmBooking = async () => {
        if (!bookingTime) return toast.error("Please select a time slot");
        if (!user) return toast.error("Please log in to book a test"); // Ensure user is logged in

        const toastId = toast.loading("Reserving your slot...");

        try {
            // 🟢 1. SEND DATA TO THE DATABASE
            const res = await fetch("http://localhost:5001/api/labs/book", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    patientId: user.id, // From AuthContext
                    labTestId: selectedTest._id,
                    date: bookingDate,
                    timeSlot: bookingTime
                })
            });

            if (res.ok) {
                // 🟢 2. IF SUCCESSFUL, ADD TO CART FOR PAYMENT
                addToCart({
                    ...selectedTest,
                    bookingDate,
                    bookingTime,
                    isLabTest: true
                });

                toast.success("Test booked! Please checkout via cart.", { id: toastId });
                setSelectedTest(null); // Close modal
            } else {
                toast.error("Failed to reserve slot.", { id: toastId });
            }
        } catch (err) {
            console.error(err);
            toast.error("Server error. Try again.", { id: toastId });
        }
    };

    // Filter Logic
    const filteredTests = labTests.filter(test => {
        // If we don't have a 'type' field in DB yet, assume 'home' for demo
        const testType = test.type || 'home';
        const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || testType === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="min-h-screen bg-[#f6f6f8] font-sans relative">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
      `}</style>

            {/* 🟢 SLOT BOOKING MODAL */}
            {selectedTest && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 relative">
                        <button onClick={() => setSelectedTest(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>

                        <h3 className="text-xl font-bold font-display mb-1">{selectedTest.name}</h3>
                        <p className="text-sm text-slate-500 mb-6">Schedule your sample collection</p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase block mb-2">Select Date</label>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-[#5747e6]" />
                                    <input
                                        type="date"
                                        value={bookingDate}
                                        onChange={(e) => setBookingDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="bg-transparent border-none outline-none text-sm font-bold w-full"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase block mb-2">Select Time</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {["08:00 AM", "10:00 AM", "02:00 PM", "04:00 PM", "06:00 PM"].map(slot => (
                                        <button
                                            key={slot}
                                            onClick={() => setBookingTime(slot)}
                                            className={`text-xs py-2 rounded-lg font-bold border transition-all ${bookingTime === slot
                                                ? 'bg-[#5747e6] text-white border-[#5747e6]'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-[#5747e6]'
                                                }`}
                                        >
                                            {slot}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 mt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm text-slate-500">Total Price</span>
                                    <span className="text-xl font-bold text-[#5747e6]">₹{selectedTest.price}</span>
                                </div>
                                <button onClick={confirmBooking} className="w-full py-3 bg-[#5747e6] text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                                    Confirm Slot
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 📍 LOCATION MODAL (Same as before) */}
            {showLocationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#5747e6] mb-6 mx-auto">
                            <MapPin className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2 font-display">Locate Nearby Labs</h2>
                        <p className="text-slate-500 mb-6 text-sm">We need your location to show tests available for Home Collection.</p>
                        <button onClick={handleDetectLocation} className="w-full py-3.5 bg-[#5747e6] text-white rounded-xl font-bold flex items-center justify-center gap-2 mb-4">
                            <MapPin className="w-5 h-5" /> Use Current Location
                        </button>
                        <button onClick={() => setShowLocationModal(false)} className="text-slate-400 text-sm font-bold hover:text-slate-600">Skip for now</button>
                    </div>
                </div>
            )}

            {/* 🟢 AI LAB ANALYSIS RESULTS MODAL */}
            {aiResults && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden relative">

                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#5747e6]/10 rounded-xl flex items-center justify-center text-[#5747e6]">
                                    <CloudLightning className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 font-display leading-tight">Smart Lab Analysis</h2>
                                    <p className="text-xs text-slate-500 font-medium">Deterministic Rule Engine Output</p>
                                </div>
                            </div>
                            <button onClick={() => setAiResults(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="p-6 overflow-y-auto bg-slate-50/50 space-y-6">

                            {/* 🟢 NEW: SUMMARY DASHBOARD */}
                            <div className={`p-5 rounded-2xl border ${aiResults.summary.riskLevel === 'Low' ? 'bg-emerald-50 border-emerald-100' : aiResults.summary.riskLevel === 'Moderate' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                        {aiResults.summary.riskLevel !== 'Low' ? <AlertTriangle className={`w-5 h-5 ${aiResults.summary.riskLevel === 'High' ? 'text-red-500' : 'text-amber-500'}`} /> : <CheckCircle className="w-5 h-5 text-emerald-500" />}
                                        Clinical Summary
                                    </h3>
                                    <div className="text-right">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Risk Score</span>
                                        <div className="flex items-end gap-1 justify-end">
                                            <span className={`text-2xl font-bold font-display leading-none ${aiResults.summary.riskLevel === 'Low' ? 'text-emerald-600' : aiResults.summary.riskLevel === 'Moderate' ? 'text-amber-600' : 'text-red-600'}`}>{aiResults.summary.riskScore}</span>
                                            <span className="text-sm font-bold text-slate-400">/ 10</span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                    {aiResults.summary.paragraph}
                                </p>

                                {/* Abnormality Chips */}
                                {aiResults.summary.abnormalities.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-black/5 flex flex-wrap gap-2">
                                        {aiResults.summary.abnormalities.map((abn, idx) => (
                                            <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/60 text-xs font-bold border border-black/10 shadow-sm">
                                                <div className={`w-1.5 h-1.5 rounded-full ${abn.status.includes('Critical') ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                                                {abn.testName}: {abn.value} {abn.unit}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* INDIVIDUAL PANELS */}
                            {aiResults.panels.length === 0 ? (
                                <div className="text-center p-8 text-slate-500">No recognizable lab panels found in this document.</div>
                            ) : (
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Extracted Metrics</h4>
                                    {aiResults.panels.map((panelResult, idx) => (
                                        <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                                                <h3 className="font-bold text-slate-800 uppercase tracking-wide text-sm">{panelResult.panel} Panel</h3>
                                                <span className="text-xs font-bold text-slate-500">{panelResult.metrics.length} Metrics Analyzed</span>
                                            </div>
                                            <div className="divide-y divide-slate-50">
                                                {panelResult.metrics.map((metric, mIdx) => {
                                                    const isNormal = metric.status === "Normal";
                                                    const isCritical = metric.status.includes("Critical");

                                                    let statusColor = "bg-amber-100 text-amber-700 border-amber-200";
                                                    if (isNormal) statusColor = "bg-emerald-100 text-emerald-700 border-emerald-200";
                                                    if (isCritical) statusColor = "bg-red-100 text-red-700 border-red-200 animate-pulse";
                                                    if (metric.status === "Reference Missing") statusColor = "bg-slate-100 text-slate-600 border-slate-200";

                                                    return (
                                                        <div key={mIdx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                            <div>
                                                                <p className="font-bold text-slate-900">{metric.testName}</p>
                                                                <p className="text-xs text-slate-400 font-mono">Code: {metric.testCode}</p>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-right">
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-lg font-bold font-display text-slate-800">{metric.value}</span>
                                                                    <span className="text-xs text-slate-500">{metric.unit}</span>
                                                                </div>
                                                                <div className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider w-24 text-center ${statusColor}`}>
                                                                    {metric.status}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 bg-white text-center">
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest flex items-center justify-center gap-1">
                                <CheckCircle className="w-3 h-3 text-[#5747e6]" /> Verified via MediFlow Multi-Panel Orchestrator
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/dashboard')} 
                        className="flex items-center justify-center p-2 mr-2 rounded-xl text-slate-400 hover:text-[#5747e6] hover:bg-[#5747e6]/10 transition-all border border-transparent hover:border-[#5747e6]/20"
                        title="Back to Dashboard"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </button>
                    <div className="w-10 h-10 bg-[#5747e6]/10 rounded-xl flex items-center justify-center text-[#5747e6]">
                        <Microscope className="w-6 h-6" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display">MediFlow Diagnostics</h1>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setShowLocationModal(true)} className="hidden md:flex items-center gap-2 text-sm font-bold text-[#5747e6] bg-[#5747e6]/5 px-4 py-2 rounded-full">
                        <MapPin className="w-4 h-4" /> {location || "Select Location"}
                    </button>
                    <button onClick={() => navigate('/cart')} className="relative p-2 text-slate-600 hover:text-[#5747e6] transition-colors">
                        <ShoppingBag className="w-6 h-6" />
                        {cart.length > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <div className="max-w-7xl mx-auto p-6 lg:p-8 flex flex-col gap-10">

                {/* HERO */}
                <section className="relative rounded-3xl bg-gradient-to-r from-[#e0e7ff] to-[#e0f2fe] p-10 overflow-hidden">
                    <div className="relative z-10 max-w-xl">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4 font-display">Diagnostics, <span className="text-[#5747e6]">Simplified.</span></h2>

                        {/* Search */}
                        <div className="bg-white p-2 rounded-2xl shadow-xl shadow-indigo-100/50 flex items-center">
                            <Search className="w-5 h-5 text-slate-400 ml-4" />
                            <input
                                type="text"
                                placeholder="Search for tests..."
                                className="w-full p-3 bg-transparent border-none outline-none font-medium text-slate-700"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                {/* AI SECTION (Now Connected to Backend) */}
                <section className="bg-white rounded-3xl p-1 shadow-sm border border-slate-200">
                    <div className="bg-gradient-to-r from-[#5747e6] to-blue-600 rounded-[20px] p-8 text-white">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <CloudLightning className="text-yellow-300 w-6 h-6" />
                                <h3 className="text-2xl font-bold font-display">Smart Lab Analysis</h3>
                            </div>
                            {aiStatus === 'loading' && <Loader2 className="w-6 h-6 animate-spin text-white" />}
                        </div>
                        <p className="text-indigo-100 mb-6">Upload your PDF lab report. Our Deterministic Rule Engine will extract and analyze your metrics instantly.</p>

                        <label className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all block ${aiStatus === 'loading' ? 'border-white/20 bg-white/5 pointer-events-none' : 'border-white/40 bg-white/10 hover:bg-white/20'}`}>
                            <input
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;

                                    setAiStatus('loading');
                                    const toastId = toast.loading("Extracting data from PDF...");

                                    const formData = new FormData();
                                    formData.append("report", file);

                                    try {
                                        const res = await fetch("http://localhost:5001/api/labs/analyze-pdf", {
                                            method: "POST",
                                            body: formData // Note: Do NOT set Content-Type header with FormData, browser does it automatically!
                                        });

                                        const data = await res.json();

                                        if (res.ok) {
                                            toast.success("Analysis Complete!", { id: toastId });
                                            console.log("📊 PDF ANALYSIS RESULTS:", data);
                                            setAiResults(data.data); // 🟢 SAVE RESULTS TO STATE
                                            // TODO: Build a beautiful modal to display these results!
                                        } else {
                                            toast.error(data.message || "Analysis failed", { id: toastId });
                                        }
                                    } catch (err) {
                                        toast.error("Server connection error", { id: toastId });
                                    } finally {
                                        setAiStatus('idle');
                                        e.target.value = null; // Reset input
                                    }
                                }}
                            />
                            <div className="flex items-center justify-center gap-3">
                                <Upload className="w-6 h-6" />
                                <span className="font-bold">
                                    {aiStatus === 'loading' ? 'Analyzing Document...' : 'Upload PDF Report'}
                                </span>
                            </div>
                        </label>
                    </div>
                </section>

                {/* TEST GRID */}
                <section>
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                        <h2 className="text-2xl font-bold text-slate-900 font-display">Available Tests</h2>
                        {/* Filter Tabs */}
                        <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                            {['all', 'home', 'lab'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${filterType === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? <div className="col-span-3 text-center py-10">Loading tests...</div> :
                            filteredTests.map(test => (
                                <div key={test._id} className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-xl transition-all flex flex-col group">

                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 ${test.type === 'lab' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                                            {test.type === 'lab' ? <Building2 className="w-3 h-3" /> : <Home className="w-3 h-3" />}
                                            {test.type === 'lab' ? "Center Visit" : "Home Visit"}
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 line-through">₹{test.price + 200}</span>
                                    </div>

                                    <h4 className="text-lg font-bold text-slate-900 mb-1 font-display">{test.name}</h4>
                                    <p className="text-slate-500 text-xs mb-4 line-clamp-2">{test.description}</p>

                                    <div className="flex flex-wrap gap-2 mb-6">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-50 text-slate-500 text-[10px] font-bold border border-slate-100">
                                            <Clock className="w-3 h-3" /> {test.turnaroundTime} Report
                                        </span>
                                    </div>

                                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                                        <span className="text-xl font-bold text-[#5747e6]">₹{test.price}</span>
                                        <button
                                            onClick={() => openBookingModal(test)} // 👈 OPEN MODAL
                                            className="w-10 h-10 rounded-full bg-slate-50 hover:bg-[#5747e6] hover:text-white flex items-center justify-center transition-all"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default LabTests;