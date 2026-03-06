import React, { useState, useRef, useEffect } from 'react';
import {
    Activity, Search, ChevronRight, Upload,
    ZoomIn, ZoomOut, SunMedium, AlertTriangle, CheckCircle,
    User, Image as ImageIcon, Loader2, Stethoscope,
    Thermometer, HeartPulse, Wind, ClipboardList, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

const XRayScanner = ({ patient }) => {
    // --- STATE ---
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showHeatmap, setShowHeatmap] = useState(false); // 🟢 NEW: Heatmap Toggle State
    const fileInputRef = useRef(null);

    // Clinical Data State
    const [clinicalData, setClinicalData] = useState({
        age: 45,
        sex: 'Male',
        temperature: 37.0,
        o2_saturation: 98,
        heart_rate: 75,
        symptoms: {
            cough: false, fever: false, shortness_of_breath: false,
            chest_pain: false, fatigue: false, wheezing: false,
            night_sweats: false, weight_loss: false, hemoptysis: false,
            sputum_production: false
        }
    });

    useEffect(() => {
        if (patient) {
            setClinicalData(prev => ({
                ...prev,
                age: patient.age || prev.age,
                sex: patient.gender || prev.sex,
                temperature: patient.vitals?.temperature || prev.temperature,
                o2_saturation: patient.vitals?.o2_saturation || prev.o2_saturation,
                heart_rate: patient.vitals?.heart_rate || prev.heart_rate,
            }));
        }
    }, [patient]);

    // --- HANDLERS ---
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return toast.error("Please upload a valid image file");
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setAiResult(null);
        setShowHeatmap(false); // Reset heatmap on new image
    };

    const handleVitalChange = (e) => {
        const { name, value } = e.target;
        setClinicalData(prev => ({ ...prev, [name]: value }));
    };

    const toggleSymptom = (symptomKey) => {
        setClinicalData(prev => ({
            ...prev,
            symptoms: { ...prev.symptoms, [symptomKey]: !prev.symptoms[symptomKey] }
        }));
    };

    const analyzeXRay = async () => {
        if (!selectedFile) return toast.error("Please select an X-Ray first.");

        setIsAnalyzing(true);
        setShowHeatmap(false); // Hide heatmap while analyzing
        const toastId = toast.loading("Analyzing Multimodal Data & Generating Heatmap...");

        const clinicalDataPayload = {
            age: Number(clinicalData.age),
            sex: clinicalData.sex === 'Male' ? 1 : 0,
            temperature: Number(clinicalData.temperature),
            o2_saturation: Number(clinicalData.o2_saturation),
            heart_rate: Number(clinicalData.heart_rate),
            cough: clinicalData.symptoms.cough ? 1 : 0,
            fever: clinicalData.symptoms.fever ? 1 : 0,
            shortness_of_breath: clinicalData.symptoms.shortness_of_breath ? 1 : 0,
            chest_pain: clinicalData.symptoms.chest_pain ? 1 : 0,
            fatigue: clinicalData.symptoms.fatigue ? 1 : 0,
            wheezing: clinicalData.symptoms.wheezing ? 1 : 0,
            night_sweats: clinicalData.symptoms.night_sweats ? 1 : 0,
            weight_loss: clinicalData.symptoms.weight_loss ? 1 : 0,
            hemoptysis: clinicalData.symptoms.hemoptysis ? 1 : 0,
            sputum_production: clinicalData.symptoms.sputum_production ? 1 : 0
        };

        const formData = new FormData();
        formData.append("xray", selectedFile); 
        formData.append("clinical_data", JSON.stringify(clinicalDataPayload));

        try {
            const res = await fetch("http://localhost:5001/api/vision/analyze-v2", {
                method: "POST",
                body: formData,
            });
            const responseData = await res.json();
            if (res.ok) {
                toast.success("Triage Analysis Complete", { id: toastId });
                setAiResult(responseData.data || responseData); 
                
                // Auto-show heatmap if an abnormality is detected
                if ((responseData.data || responseData).heatmap_image) {
                    setTimeout(() => setShowHeatmap(true), 500);
                }
            } else {
                toast.error(responseData.message || "Analysis Failed", { id: toastId });
            }
        } catch (error) {
            toast.error("Failed to reach AI Server", { id: toastId });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const finalizeReport = async () => {
        if (!aiResult) return;
        setIsSaving(true);
        const toastId = toast.loading("Saving Multimodal Report...");

        try {
            const res = await fetch("http://localhost:5001/api/vision/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prediction: aiResult.primary_flag,
                    confidence: aiResult.flag_confidence,
                    high_priority_findings: aiResult.high_priority_findings,
                    secondary_anomalies: aiResult.secondary_anomalies,
                    evaluated_negative: aiResult.evaluated_negative || [],
                    risk_score: aiResult.risk_score,
                    clinical_suggestion: aiResult.clinical_suggestion,
                    overall_status: aiResult.overall_status,
                    patientId: patient?._id || null
                }),
            });
            if (res.ok) {
                toast.success("Report Finalized!", { id: toastId });
                resetScanner();
            } else {
                toast.error("Failed to save report.", { id: toastId });
            }
        } catch (error) {
            toast.error("Database error.", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const resetScanner = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setAiResult(null);
        setShowHeatmap(false);
    };

    const isNormal = aiResult?.overall_status === "Normal Evaluation";

    return (
        <div className="w-full flex flex-col font-sans pb-10">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-display">Multimodal Triage</h1>
                    <p className="text-slate-500 text-sm">Upload imaging and input clinical context for AI analysis.</p>
                </div>
                <div className="flex items-center gap-3">
                    {previewUrl && (
                        <button onClick={resetScanner} className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-all">
                            Clear
                        </button>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#5747e6] rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all">
                        <Upload className="w-4 h-4" />
                        {previewUrl ? 'Change X-Ray' : 'Upload X-Ray'}
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                
                {/* 🟢 LEFT COLUMN: INPUTS (Image + Clinical) */}
                <div className="flex-1 w-full flex flex-col gap-6">
                    
                    {/* Visual Scanner */}
                    <section className="relative group overflow-hidden bg-slate-900 rounded-3xl shadow-xl shadow-indigo-900/10 border border-slate-800 flex flex-col h-[400px]">
                        <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-start">
                            <div className="bg-black/40 backdrop-blur-md rounded-lg px-3 py-1.5 flex items-center gap-2 border border-white/10 text-white/80">
                                <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-amber-400 animate-pulse' : aiResult ? 'bg-emerald-400' : 'bg-slate-400'}`}></div>
                                <span className="text-xs font-bold tracking-wide uppercase">
                                    {isAnalyzing ? 'Analyzing...' : aiResult ? 'Analysis Complete' : 'Awaiting Image'}
                                </span>
                            </div>
                        </div>

                        <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
                            {previewUrl ? (
                                <>
                                    {/* 🟢 NEW: Dynamic Image Tag */}
                                    <img 
                                        src={showHeatmap && aiResult?.heatmap_image ? aiResult.heatmap_image : previewUrl} 
                                        alt="X-Ray Scan" 
                                        className="w-full h-full object-contain opacity-80 mix-blend-screen p-4 transition-all duration-500 ease-in-out" 
                                    />
                                    
                                    {isAnalyzing && (
                                        <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
                                            <div className="absolute left-0 right-0 h-1 bg-[#5747e6]/80 shadow-[0_0_20px_rgba(87,71,230,0.8)] animate-scan" />
                                        </div>
                                    )}

                                    {/* 🟢 NEW: Grad-CAM Toggle Button */}
                                    {aiResult?.heatmap_image && (
                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                                            <button 
                                                onClick={() => setShowHeatmap(!showHeatmap)}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-black/70 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-bold shadow-xl hover:bg-black/90 transition-all hover:scale-105 active:scale-95"
                                            >
                                                <Layers className={`w-4 h-4 ${showHeatmap ? 'text-amber-400' : 'text-[#5747e6]'}`} />
                                                {showHeatmap ? 'View Original X-Ray' : `Show ${aiResult.heatmap_target} Heatmap`}
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center flex flex-col items-center">
                                    <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                                        <ImageIcon className="w-10 h-10 text-slate-500" />
                                    </div>
                                    <p className="text-slate-400 font-medium">No X-Ray Selected</p>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
                        </div>
                    </section>

                    {/* Clinical Parameters Form */}
                    <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-[#5747e6]" />
                            Clinical Parameters
                        </h3>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Age</label>
                                <input type="number" name="age" value={clinicalData.age} onChange={handleVitalChange} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#5747e6] outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Sex</label>
                                <select name="sex" value={clinicalData.sex} onChange={handleVitalChange} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#5747e6] outline-none">
                                    <option>Male</option>
                                    <option>Female</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1"><Thermometer className="w-3 h-3"/> Temp (°C)</label>
                                <input type="number" step="0.1" name="temperature" value={clinicalData.temperature} onChange={handleVitalChange} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#5747e6] outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1"><Wind className="w-3 h-3"/> SpO2 (%)</label>
                                <input type="number" name="o2_saturation" value={clinicalData.o2_saturation} onChange={handleVitalChange} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#5747e6] outline-none" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Presenting Symptoms</label>
                            <div className="flex flex-wrap gap-2">
                                {Object.keys(clinicalData.symptoms).map((symptom) => (
                                    <button 
                                        key={symptom}
                                        onClick={() => toggleSymptom(symptom)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                                            clinicalData.symptoms[symptom] 
                                            ? 'bg-indigo-100 border-indigo-200 text-indigo-700' 
                                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                        }`}
                                    >
                                        {symptom.replace(/_/g, ' ').toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>

                {/* 🟢 RIGHT COLUMN: AI RESULTS (Sticky) */}
                <section className="lg:w-[400px] xl:w-[480px] w-full flex flex-col gap-6 lg:sticky lg:top-6">
                    
                    {/* Patient Context Card */}
                    <div className={`rounded-2xl p-4 border shadow-sm flex items-center gap-4 ${patient ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-200'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${patient ? 'bg-[#5747e6] text-white' : 'bg-slate-100 text-slate-400'}`}>
                            <User className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            {patient ? (
                                <>
                                    <h3 className="text-sm font-bold text-slate-900">{patient.fullName || patient.name || "Unknown Patient"}</h3>
                                    <p className="text-xs text-[#5747e6] font-bold mt-0.5">ID: {patient._id ? patient._id.substring(0, 8).toUpperCase() : "N/A"}</p>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-sm font-bold text-slate-900">Patient Data Unlinked</h3>
                                    <p className="text-xs text-slate-500">Scan will be saved anonymously.</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 flex flex-col gap-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">AI Findings</h2>
                                <p className="text-slate-500 text-sm mt-1 font-medium">MediFlow Multimodal Core</p>
                            </div>
                            {aiResult && (
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${isNormal ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                    {isNormal ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                    {isNormal ? 'Clear Scan' : 'Review Recommended'}
                                </span>
                            )}
                        </div>

                        {previewUrl && !aiResult && !isAnalyzing && (
                            <button onClick={analyzeXRay} className="w-full py-4 bg-gradient-to-r from-[#5747e6] to-indigo-500 text-white rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-indigo-200 transition-all flex justify-center items-center gap-2">
                                <Activity className="w-5 h-5" /> Run Multimodal Diagnostics
                            </button>
                        )}

                        {isAnalyzing && (
                            <div className="flex flex-col items-center justify-center p-10 text-slate-500 gap-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <Loader2 className="w-10 h-10 animate-spin text-[#5747e6]" />
                                <p className="font-bold text-sm">Fusing Image & Clinical Vectors...</p>
                            </div>
                        )}

                        {aiResult && (
                            <div className="space-y-4">
                                {aiResult.risk_score && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Triage Risk Score</h4>
                                            <p className="text-sm font-bold text-slate-800 mt-0.5">{aiResult.risk_score.interpretation}</p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-3xl font-bold font-display text-slate-900 leading-none">
                                                {aiResult.risk_score.value}<span className="text-sm text-slate-400 font-sans">/10</span>
                                            </span>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mt-1.5 ${
                                                aiResult.risk_score.level === 'Critical' || aiResult.risk_score.level === 'High' ? 'bg-red-100 text-red-700' :
                                                aiResult.risk_score.level === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                                                'bg-emerald-100 text-emerald-700'
                                            }`}>
                                                {aiResult.risk_score.urgency}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className={`rounded-2xl p-5 border shadow-sm ${
                                    aiResult.overall_status === "Review Recommended" ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
                                }`}>
                                    <div className="flex justify-between items-end mb-3">
                                        <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                                            Primary Target
                                        </span>
                                        <span className={`text-2xl font-bold font-display ${
                                            aiResult.overall_status === "Review Recommended" ? 'text-amber-600' : 'text-emerald-600'
                                        }`}>
                                            {(aiResult.flag_confidence * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-3">
                                        <div className={`h-full rounded-full transition-all duration-1000 ${
                                            aiResult.overall_status === "Review Recommended" ? 'bg-amber-500' : 'bg-emerald-500'
                                        }`} style={{ width: `${(aiResult.flag_confidence * 100).toFixed(1)}%` }}></div>
                                    </div>
                                    <span className="text-sm font-bold text-slate-800">{aiResult.primary_flag}</span>
                                </div>

                                {aiResult.high_priority_findings?.length > 0 && (
                                    <div className="bg-red-50/50 rounded-2xl p-4 border border-red-100">
                                        <h4 className="text-xs font-bold text-red-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                                            <AlertTriangle className="w-3.5 h-3.5" /> High Priority Flags
                                        </h4>
                                        <div className="space-y-2">
                                            {aiResult.high_priority_findings.map((f, i) => (
                                                <div key={i} className="flex justify-between items-center text-sm">
                                                    <span className="font-semibold text-slate-800">{f.disease}</span>
                                                    <span className="font-bold text-red-600">{(f.confidence * 100).toFixed(1)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 mt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                                    <button onClick={resetScanner} className="px-4 py-3 text-sm font-bold text-[#5747e6] bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                                        Discard
                                    </button>
                                    <button onClick={finalizeReport} disabled={isSaving} className="flex justify-center items-center gap-2 px-4 py-3 text-sm font-bold text-white bg-[#5747e6] rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 disabled:opacity-50">
                                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                        Finalize
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default XRayScanner;