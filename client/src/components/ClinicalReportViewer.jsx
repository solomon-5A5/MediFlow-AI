import React from 'react';
import { X, Download, FileCheck, User, Activity, Stethoscope } from 'lucide-react';

const ClinicalReportViewer = ({ isOpen, report, onClose }) => {
    if (!isOpen || !report) return null;

    const handleDownloadPDF = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:bg-white print:p-0">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 print:shadow-none print:max-w-none print:max-h-none print:overflow-visible">
                
                {/* Header (Hidden on Print) */}
                <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-100 bg-white/90 backdrop-blur-md print:hidden z-10">
                    <h2 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-[#5747e6]" /> Official Clinical Report
                    </h2>
                    <div className="flex items-center gap-3">
                        <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-[#5747e6] text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm">
                            <Download className="w-4 h-4" /> Save PDF
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* THE ACTUAL REPORT */}
                <div className="p-10 print:p-0">
                    
                    {/* Document Header */}
                    <div className="border-b-2 border-slate-200 pb-6 mb-8 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 text-[#5747e6] mb-2">
                                <Activity className="w-8 h-8" />
                                <h1 className="text-2xl font-bold font-display text-slate-900">MediFlow Clinical Summary</h1>
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mt-4">Patient: {report.patientId?.fullName || "Unknown"}</h2>
                            <p className="text-sm text-slate-500 mt-1">Patient ID: {report.patientId?._id || "N/A"}</p>
                        </div>
                        <div className="text-right text-sm text-slate-600">
                            <p className="font-bold text-slate-900">Date of Visit: {new Date(report.createdAt).toLocaleDateString()}</p>
                            <p>Attending: Dr. {report.doctorId?.fullName || report.doctorId?.name || "Unknown"}</p>
                            <p className="mt-2 font-mono text-xs text-slate-400">Record Ref: {report._id}</p>
                        </div>
                    </div>

                    {/* SOAP SECTIONS */}
                    <div className="space-y-8">
                        <div>
                            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 border-b border-slate-100 pb-2">
                                <User className="w-4 h-4 text-[#5747e6]" /> 1. Subjective
                            </h3>
                            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed pl-6">{report.soap?.subjective || "No subjective data recorded."}</p>
                        </div>

                        <div>
                            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 border-b border-slate-100 pb-2">
                                <Activity className="w-4 h-4 text-[#5747e6]" /> 2. Objective & AI Diagnostics
                            </h3>
                            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed pl-6">{report.soap?.objective || "No objective data recorded."}</p>
                        </div>

                        <div>
                            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 border-b border-slate-100 pb-2">
                                <Stethoscope className="w-4 h-4 text-[#5747e6]" /> 3. Assessment
                            </h3>
                            <p className="text-slate-900 font-medium whitespace-pre-wrap leading-relaxed pl-6 bg-slate-50 p-4 rounded-xl border border-slate-100 print:bg-transparent print:border-none print:p-0 print:pl-6">{report.soap?.assessment || "No assessment provided."}</p>
                        </div>

                        <div>
                            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 border-b border-slate-100 pb-2">
                                <FileCheck className="w-4 h-4 text-[#5747e6]" /> 4. Plan & Treatment
                            </h3>
                            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed pl-6">{report.soap?.plan || "No plan recorded."}</p>
                        </div>
                    </div>

                    {/* Footer Validation */}
                    <div className="mt-16 pt-8 border-t border-slate-200 text-sm text-slate-500 text-center">
                        <p>Electronically generated and signed via MediFlow AI Clinical Systems.</p>
                        <p>This document is intended solely for the referenced patient and authorized medical personnel.</p>
                        <p className="mt-2 text-xs font-bold uppercase tracking-widest text-emerald-600">Status: {report.status}</p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ClinicalReportViewer;