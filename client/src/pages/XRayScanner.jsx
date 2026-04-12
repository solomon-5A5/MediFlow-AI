import React, { useState, useRef, useEffect } from 'react';
import {
    Activity, Upload, AlertTriangle, CheckCircle,
    User, Image as ImageIcon, Loader2, Thermometer,
    Wind, ClipboardList, Layers, Sparkles, Network, Cpu, ScanSearch
} from 'lucide-react';
import toast from 'react-hot-toast';

const XRayScanner = ({ patient, setGlobalAiResult }) => { // 🟢 Added prop here
    // --- STATE ---
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showHeatmap, setShowHeatmap] = useState(false);
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
        setShowHeatmap(false);
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
        setShowHeatmap(false);
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
        formData.append("file", selectedFile);
        formData.append("clinical_data", JSON.stringify(clinicalDataPayload));

        try {
            const res = await fetch("http://localhost:8000/api/vision/analyze", {
                method: "POST",
                body: formData,
            });
            const responseData = await res.json();
            if (res.ok) {
                toast.success("Triage Analysis Complete", { id: toastId });
                
                const finalResult = responseData.data || responseData;
                setAiResult(finalResult); 
                
                // 🟢 NEW: Push the result up to the global dashboard state!
                if (setGlobalAiResult) setGlobalAiResult(finalResult);

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
                    consensus_panel: aiResult.consensus_panel,
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
        // 🟢 NEW: Clear the global state too
        if (setGlobalAiResult) setGlobalAiResult(null);
    };

    const isNormal = aiResult?.overall_status === "Normal Evaluation";

    return (
        <div className="w-full flex flex-col font-sans pb-10 space-y-8">
            {/* Header Area */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Multimodal Triage</h1>
                    <p className="text-slate-500 text-sm mt-1">Upload imaging and input clinical context for AI analysis.</p>
                </div>
                <div className="flex items-center gap-3">
                    {previewUrl && (
                        <button onClick={resetScanner} className="px-4 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all">
                            Clear Session
                        </button>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#5747e6] rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all">
                        <Upload className="w-4 h-4" />
                        {previewUrl ? 'Change X-Ray' : 'Upload X-Ray'}
                    </button>
                </div>
            </div>

            {/* Main Content Split */}
            <section className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                
                {/* 🟢 LEFT COLUMN: X-Ray Viewer */}
                <div className="xl:col-span-7 space-y-6">
                    <div className="relative group aspect-square lg:aspect-auto lg:h-[600px] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
                        {/* Status Badge */}
                        <div className="absolute top-6 left-6 z-20">
                            <div className="bg-black/50 backdrop-blur-md rounded-lg px-3 py-1.5 flex items-center gap-2 border border-white/10 text-white/90">
                                <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-amber-400 animate-pulse' : aiResult ? 'bg-emerald-400' : 'bg-slate-400'}`}></div>
                                <span className="text-xs font-bold tracking-wide uppercase">
                                    {isAnalyzing ? 'Analyzing Image & Vitals...' : aiResult ? 'Analysis Complete' : 'Awaiting Image'}
                                </span>
                            </div>
                        </div>

                        {previewUrl ? (
                            <>
                                <img
                                    src={showHeatmap && aiResult?.heatmap_image ? aiResult.heatmap_image : previewUrl}
                                    alt="X-Ray Scan"
                                    className="w-full h-full object-contain opacity-90 p-4 transition-all duration-500 ease-in-out"
                                />

                                {isAnalyzing && (
                                    <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
                                        <div className="absolute left-0 right-0 h-1 bg-[#5747e6] shadow-[0_0_30px_rgba(87,71,230,1)] animate-scan" />
                                    </div>
                                )}

                                {/* Floating Control Bar */}
                                {aiResult?.heatmap_image && (
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xl px-2 py-2 rounded-2xl border border-white/20 flex gap-2 items-center shadow-2xl">
                                        <button 
                                            onClick={() => setShowHeatmap(!showHeatmap)}
                                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                                showHeatmap ? 'bg-white text-black' : 'bg-transparent text-white hover:bg-white/10'
                                            }`}
                                        >
                                            <Layers className={`w-4 h-4 ${showHeatmap ? 'text-[#5747e6]' : 'text-slate-300'}`} />
                                            {showHeatmap ? 'Original' : `Show ${aiResult.heatmap_target} Heatmap`}
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center flex flex-col items-center">
                                <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
                                    <ImageIcon className="w-8 h-8 text-slate-600" />
                                </div>
                                <p className="text-slate-400 font-medium">No Image Loaded</p>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none"></div>
                    </div>
                </div>

                {/* 🟢 RIGHT COLUMN: Clinical Inputs & Final Results */}
                <div className="xl:col-span-5 flex flex-col gap-6">
                    
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

                    {/* Clinical Parameters Form */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-[#5747e6]" />
                            Clinical Parameters
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Age & Sex</label>
                                <div className="flex gap-2 mt-1">
                                    <input type="number" name="age" value={clinicalData.age} onChange={handleVitalChange} className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm font-medium focus:ring-2 focus:ring-[#5747e6] outline-none" />
                                    <select name="sex" value={clinicalData.sex} onChange={handleVitalChange} className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm font-medium focus:ring-2 focus:ring-[#5747e6] outline-none">
                                        <option>Male</option>
                                        <option>Female</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1"><Thermometer className="w-3 h-3"/> Temp (°C)</label>
                                <input type="number" step="0.1" name="temperature" value={clinicalData.temperature} onChange={handleVitalChange} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#5747e6] outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1"><Wind className="w-3 h-3"/> SpO2 (%)</label>
                                <input type="number" name="o2_saturation" value={clinicalData.o2_saturation} onChange={handleVitalChange} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#5747e6] outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Heart Rate</label>
                                <input type="number" name="heart_rate" value={clinicalData.heart_rate} onChange={handleVitalChange} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-[#5747e6] outline-none" />
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
                                            ? 'bg-indigo-100 border-indigo-200 text-[#5747e6]' 
                                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                        }`}
                                    >
                                        {symptom.replace(/_/g, ' ').toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action Area / Overall Results */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col flex-1">
                        {!aiResult && !isAnalyzing ? (
                            <div className="flex-1 flex flex-col justify-center">
                                <button 
                                    onClick={analyzeXRay} 
                                    disabled={!previewUrl}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ScanSearch className="w-5 h-5" /> Run Multimodal Triage
                                </button>
                                {!previewUrl && <p className="text-center text-sm text-slate-400 mt-3 font-medium">Upload an image to begin analysis</p>}
                            </div>
                        ) : isAnalyzing ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500 gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-[#5747e6]" />
                                <p className="font-bold text-sm">Fusing Image & Clinical Vectors...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full justify-between gap-4">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-bold text-slate-900">Overall Findings</h3>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isNormal ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            {isNormal ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                            {aiResult.overall_status}
                                        </span>
                                    </div>

                                    {/* Risk Score Compact */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between mb-4">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Triage Risk Score</h4>
                                            <p className="text-sm font-bold text-slate-800 mt-0.5">{aiResult.risk_score.interpretation}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-bold text-slate-900 leading-none">
                                                {aiResult.risk_score.value}<span className="text-sm text-slate-400">/10</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Primary Flag Compact */}
                                    <div className={`rounded-xl p-4 border ${isNormal ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Primary Target</span>
                                            <span className={`text-xl font-bold ${isNormal ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {(aiResult.flag_confidence * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <span className="text-base font-bold text-slate-800 block">{aiResult.primary_flag}</span>
                                    </div>
                                </div>

                                <button onClick={finalizeReport} disabled={isSaving} className="w-full flex justify-center items-center gap-2 py-3.5 text-sm font-bold text-white bg-[#5747e6] rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 disabled:opacity-50">
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                    Finalize Patient Report
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* 🟢 FULL WIDTH BOTTOM: AI Consensus Board */}
            {aiResult?.consensus_panel && (
                <section className="mt-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                            <Sparkles className="text-[#5747e6] w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">AI Consensus Board</h2>
                        <div className="h-px flex-1 bg-slate-200 mx-4"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Gemini Vision Card (Agent 3) */}
                        <div className="md:col-span-1 p-6 rounded-3xl border border-indigo-100 shadow-lg shadow-indigo-900/5 bg-white relative overflow-hidden flex flex-col">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16"></div>
                            <div className="flex items-center gap-4 mb-6 relative">
                                <div className="w-12 h-12 rounded-xl bg-[#5747e6] flex items-center justify-center text-white shadow-md shadow-indigo-200">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-slate-900 leading-tight">Agent 3: Gemini</h4>
                                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Clinical Synthesis</span>
                                </div>
                            </div>
                            <div className="flex-1 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                                <p className="text-sm leading-relaxed text-slate-700 font-medium">
                                    {aiResult.consensus_panel.gemini_clinical_synthesis}
                                </p>
                            </div>
                        </div>

                        {/* Local Models Column */}
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            
                            {/* DenseNet Card (Agent 1) */}
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100">
                                            <Network className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg text-slate-900 leading-tight">Agent 1: DenseNet</h4>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Texture Analysis</span>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Target Prediction</span>
                                            <span className="text-lg font-bold text-slate-800">
                                                {(aiResult.consensus_panel.densenet.confidence * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden mb-3">
                                            <div className="h-full bg-[#5747e6] rounded-full transition-all duration-1000" style={{ width: `${aiResult.consensus_panel.densenet.confidence * 100}%` }}></div>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900 block">{aiResult.consensus_panel.densenet.primary_finding}</span>
                                    </div>
                                </div>
                            </div>

                            {/* ResNet Card (Agent 2) */}
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100">
                                            <Cpu className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg text-slate-900 leading-tight">Agent 2: ResNet-50</h4>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Structural Analysis</span>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Target Prediction</span>
                                            <span className="text-lg font-bold text-slate-800">
                                                {(aiResult.consensus_panel.resnet.confidence * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden mb-3">
                                            <div className="h-full bg-[#5747e6] rounded-full transition-all duration-1000" style={{ width: `${aiResult.consensus_panel.resnet.confidence * 100}%` }}></div>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900 block">{aiResult.consensus_panel.resnet.primary_finding}</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default XRayScanner;