import React, { useEffect, useState } from 'react';
import { X, Download, Pill, Activity, Loader2, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

const PrescriptionViewer = ({ isOpen, appointmentId, onClose }) => {
    const [prescription, setPrescription] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFillingCart, setIsFillingCart] = useState(false);
    const { addToCart } = useCart();
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen && appointmentId) {
            fetchPrescription();
        }
    }, [isOpen, appointmentId]);

    const fetchPrescription = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`http://localhost:5001/api/prescriptions/appointment/${appointmentId}`);
            if (res.ok) {
                const data = await res.json();
                setPrescription(data.data || data);
            } else {
                toast.error("Failed to load prescription");
                setPrescription(null);
            }
        } catch (error) {
            console.error("Error fetching prescription:", error);
            toast.error("Error loading prescription");
            setPrescription(null);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleDownloadPDF = () => {
        window.print(); 
    };

    const handleAutofillCart = async () => {
        if (!appointmentId) return;
        
        setIsFillingCart(true);
        const toastId = toast.loading("Matching medicines to pharmacy...");
        
        try {
            const res = await fetch(`http://localhost:5001/api/prescriptions/appointment/${appointmentId}/magic-cart`, {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });
            
            if (res.ok) {
                const data = await res.json();
                
                if (data.matchedProducts && data.matchedProducts.length > 0) {
                    // Add each matched product to cart
                    data.matchedProducts.forEach(product => {
                        addToCart(product);
                    });
                    
                    toast.success(
                        `Added ${data.foundCount}/${data.totalCount} medicines to cart!`,
                        { id: toastId }
                    );
                    
                    if (data.missingProducts && data.missingProducts.length > 0) {
                        toast(`Could not find: ${data.missingProducts.join(", ")}`, {
                            icon: "⚠️",
                            duration: 4000
                        });
                    }
                    
                    // Close modal and navigate to cart
                    onClose();
                    navigate("/cart");
                } else {
                    toast.error("No matching products found in pharmacy", { id: toastId });
                }
            } else {
                toast.error("Failed to match medicines", { id: toastId });
            }
        } catch (error) {
            console.error("Autofill Cart Error:", error);
            toast.error("Error filling cart", { id: toastId });
        } finally {
            setIsFillingCart(false);
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <div className="bg-white rounded-3xl p-12 flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-[#5747e6]" />
                    <p className="text-slate-600 font-medium">Loading prescription...</p>
                </div>
            </div>
        );
    }

    if (!prescription) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-4 max-w-sm">
                    <p className="text-slate-600 font-medium">No prescription found for this appointment</p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-[#5747e6] text-white rounded-lg font-bold"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:bg-white print:p-0">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 print:shadow-none print:max-w-none">
                
                {/* Header (Hidden on Print) */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 print:hidden">
                    <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-[#5747e6]" /> Official e-Prescription
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* THE ACTUAL PRESCRIPTION */}
                <div className="p-8 print:p-0">
                    <div className="flex justify-between items-start mb-8 border-b-2 border-[#5747e6] pb-6">
                        <div>
                            <h1 className="text-3xl font-bold font-display text-slate-900">MediFlow AI</h1>
                            <p className="text-sm text-slate-500 mt-1">Digital Telehealth Clinic</p>
                            <p className="text-sm font-bold text-slate-700 mt-4">Patient: {prescription.patientId?.fullName || "Unknown Patient"}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="font-bold text-lg text-slate-900">Dr. {prescription.doctorId?.name || prescription.doctorId?.fullName || "Physician"}</h3>
                            <p className="text-sm text-slate-500 mt-2 font-medium">Date: {new Date(prescription.createdAt).toLocaleDateString()}</p>
                            <p className="text-xs text-slate-400 font-mono mt-1">Ref: {prescription._id}</p>
                        </div>
                    </div>

                    <div className="text-5xl font-serif font-black text-slate-200 mb-6">Rx</div>

                    <div className="space-y-4 mb-8">
                        {prescription.medicines?.map((med, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 print:border-none print:bg-transparent print:p-2">
                                <div className="p-2 bg-indigo-100 text-[#5747e6] rounded-lg print:hidden">
                                    <Pill className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-slate-900">{med.drugName || med.name} <span className="text-sm font-medium text-slate-500 ml-2">{med.dosage}</span></h4>
                                    <p className="text-sm text-slate-600 mt-1 flex items-center gap-4">
                                        <span><strong className="text-slate-700">Freq:</strong> {med.frequency || med.timing}</span>
                                        <span><strong className="text-slate-700">Duration:</strong> {med.duration} days</span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {prescription.diagnosis && (
                        <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-xl print:bg-transparent print:border-none print:p-0">
                            <p className="text-sm font-bold text-amber-800 uppercase tracking-wide mb-1">Diagnosis / Notes</p>
                            <p className="text-sm text-amber-900 print:text-slate-800 italic">{prescription.diagnosis}</p>
                        </div>
                    )}
                    
                    <div className="hidden print:flex justify-end mt-16 pt-8">
                        <div className="text-center">
                            <div className="border-t border-slate-400 w-48 mb-2"></div>
                            <p className="text-sm font-bold">Electronically Signed</p>
                            <p className="text-xs text-slate-500">Dr. {prescription.doctorId?.name || prescription.doctorId?.fullName}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-white flex justify-between print:hidden">
                    <button 
                        onClick={handleAutofillCart} 
                        disabled={isFillingCart}
                        className="flex items-center gap-2 py-3 px-6 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isFillingCart ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <ShoppingCart className="w-5 h-5" />
                        )}
                        {isFillingCart ? "Adding..." : "Autofill Cart"}
                    </button>
                    <button onClick={handleDownloadPDF} className="flex items-center gap-2 py-3 px-6 bg-[#5747e6] text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                        <Download className="w-5 h-5" /> Download / Print PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrescriptionViewer;