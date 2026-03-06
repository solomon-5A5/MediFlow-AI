import React, { useState } from 'react';
import { 
    FileText, Save, Printer, User, Activity, 
    Stethoscope, FileCheck, Pill, ChevronLeft, BrainCircuit
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext'; // 🟢 ADD THIS

const ClinicalReportBuilder = ({ patient, appointment, aiResult, onBack, onSave }) => {
    const { user } = useAuth(); // 🟢 Get the logged-in Doctor's ID

    const [soap, setSoap] = useState({
        subjective: '',
        objective: aiResult ? `MediFlow Vision Core: ${aiResult.prediction} (${(aiResult.confidence * 100).toFixed(1)}% Confidence)` : '',
        assessment: '',
        plan: ''
    });

    const handleChange = (field, value) => {
        setSoap(prev => ({ ...prev, [field]: value }));
    };

    // --- 🟢 UPDATED ACTIONS ---
    const handleFinalize = async () => {
        if (!soap.assessment || !soap.plan) {
            return toast.error("Assessment and Plan are required for compliance.");
        }

        // 1. Build the strict JSON payload matching your Mongoose Schema
        const payload = {
            patientId: patient?._id,
            doctorId: user?.id || user?._id, // Secured from AuthContext
            appointmentId: appointment?._id || null,
            soap: soap,
            status: "finalized"
        };
        
        const toastId = toast.loading("Encrypting & Saving to MediFlow DB...");
        
        try {
            // 2. Send the POST request to your new Node route
            const res = await fetch("http://localhost:5001/api/reports/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Standardized Report Finalized!", { id: toastId });
                if (onSave) onSave(data.report); // Triggers the screen to switch back to the profile
            } else {
                toast.error(data.message || "Failed to save report.", { id: toastId });
            }
        } catch (error) {
            console.error("Database Save Error:", error);
            toast.error("Server connection failed.", { id: toastId });
        }
    };

    const handleDownloadPDF = () => {
        // Triggers the browser's native print engine.
        // Tailwind's "print:" classes will strip away the UI and format it beautifully!
        window.print(); 
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
            
            {/* TOOLBAR (Hidden when printing PDF) */}
            <div className="flex items-center justify-between mb-6 print:hidden">
                <button onClick={onBack} className="flex items-center gap-2 text-[#575095] hover:text-[#5747e6] font-bold transition-colors">
                    <ChevronLeft className="w-5 h-5" /> Back to Profile
                </button>
                <div className="flex items-center gap-3">
                    <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm">
                        <Printer className="w-4 h-4" /> Save as PDF
                    </button>
                    <button onClick={handleFinalize} className="flex items-center gap-2 px-4 py-2 bg-[#5747e6] text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                        <Save className="w-4 h-4" /> Finalize Report
                    </button>
                </div>
            </div>

            {/* RESPONSIVE LAYOUT */}
            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* LEFT PANEL: PATIENT CONTEXT (Hidden when printing PDF) */}
                <div className="lg:w-1/3 w-full flex flex-col gap-4 print:hidden">
                    <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-indigo-900/10 border border-slate-800">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-xl font-bold font-display">
                                {patient?.fullName?.charAt(0) || "P"}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold font-display">{patient?.fullName || "Patient Name"}</h2>
                                <p className="text-sm text-slate-400">ID: {patient?._id?.substring(0,8).toUpperCase() || "N/A"}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Appointment Reason</p>
                                <p className="text-sm font-medium">{appointment?.reason || "General Consultation"}</p>
                            </div>
                            
                            {/* 🟢 AI CONTEXT INJECTION */}
                            <div className={`p-4 rounded-xl border ${aiResult ? 'bg-[#5747e6]/20 border-[#5747e6]/30' : 'bg-white/5 border-white/10'}`}>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <BrainCircuit className="w-4 h-4" /> AI Diagnostics
                                </p>
                                {aiResult ? (
                                    <p className="text-sm font-bold text-white flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-emerald-400" />
                                        {aiResult.prediction} detected
                                    </p>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">No AI scans run for this visit.</p>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Link to Prescription */}
                    <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-indigo-900">Medication Required?</h3>
                            <p className="text-xs text-indigo-700 mt-1">Generate a separate Rx order.</p>
                        </div>
                        <button className="p-3 bg-white text-[#5747e6] rounded-xl shadow-sm hover:shadow border border-indigo-100 transition-all">
                            <Pill className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* RIGHT PANEL: THE SOAP EDITOR (This is what prints to the PDF!) */}
                <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 print:border-none print:shadow-none print:p-0">
                    
                    {/* Official Document Header (Only visible on Screen or PDF) */}
                    <div className="border-b border-slate-100 pb-6 mb-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2 text-[#5747e6]">
                                <Activity className="w-6 h-6" />
                                <h1 className="text-xl font-bold font-display">MediFlow Clinical Summary</h1>
                            </div>
                            <div className="text-right text-sm text-slate-500">
                                <p className="font-bold text-slate-900">Date: {new Date().toLocaleDateString()}</p>
                                <p>Record: #{Math.floor(Math.random() * 100000)}</p>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Patient: {patient?.fullName || "Patient Name"}</h2>
                    </div>

                    {/* SOAP SECTIONS */}
                    <div className="space-y-6">
                        
                        {/* SUBJECTIVE */}
                        <div className="group">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
                                <User className="w-4 h-4 text-[#5747e6]" /> 1. Subjective (Symptoms & History)
                            </label>
                            {/* Editor View */}
                            <textarea 
                                value={soap.subjective}
                                onChange={(e) => handleChange('subjective', e.target.value)}
                                placeholder="Patient reports..."
                                className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5747e6] outline-none transition-all print:hidden resize-none"
                            />
                            {/* PDF View */}
                            <p className="hidden print:block text-slate-800 text-sm whitespace-pre-wrap">{soap.subjective || "No subjective notes provided."}</p>
                        </div>

                        {/* OBJECTIVE */}
                        <div className="group">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
                                <Activity className="w-4 h-4 text-[#5747e6]" /> 2. Objective (Vitals & AI Data)
                            </label>
                            <textarea 
                                value={soap.objective}
                                onChange={(e) => handleChange('objective', e.target.value)}
                                placeholder="Vitals, physical exam, lab results..."
                                className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5747e6] outline-none transition-all print:hidden resize-none"
                            />
                            <p className="hidden print:block text-slate-800 text-sm whitespace-pre-wrap">{soap.objective || "No objective notes provided."}</p>
                        </div>

                        {/* ASSESSMENT */}
                        <div className="group">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
                                <Stethoscope className="w-4 h-4 text-[#5747e6]" /> 3. Assessment (Diagnosis)
                            </label>
                            <textarea 
                                value={soap.assessment}
                                onChange={(e) => handleChange('assessment', e.target.value)}
                                placeholder="Primary diagnosis and clinical reasoning..."
                                className="w-full h-24 p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-[#5747e6] outline-none transition-all print:hidden resize-none"
                            />
                            <p className="hidden print:block text-slate-800 text-sm whitespace-pre-wrap font-medium">{soap.assessment || "Pending diagnosis."}</p>
                        </div>

                        {/* PLAN */}
                        <div className="group">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
                                <FileCheck className="w-4 h-4 text-[#5747e6]" /> 4. Plan (Treatment & Follow-up)
                            </label>
                            <textarea 
                                value={soap.plan}
                                onChange={(e) => handleChange('plan', e.target.value)}
                                placeholder="Prescriptions, referrals, follow-up timeline..."
                                className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5747e6] outline-none transition-all print:hidden resize-none"
                            />
                            <p className="hidden print:block text-slate-800 text-sm whitespace-pre-wrap">{soap.plan || "No treatment plan outlined."}</p>
                        </div>

                    </div>
                    
                    {/* PDF Footer Validation */}
                    <div className="hidden print:block mt-16 pt-8 border-t border-slate-200 text-sm text-slate-500 text-center">
                        <p>Electronically generated and signed via MediFlow AI Clinical Systems.</p>
                        <p>This document is intended solely for the referenced patient and authorized medical personnel.</p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ClinicalReportBuilder;