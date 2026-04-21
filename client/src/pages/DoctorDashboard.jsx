import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    LayoutDashboard, Calendar, FlaskConical, Folder,
    MessageSquare, Settings, Bell, Search, Activity,
    Clock, Users, Video, XCircle, FileText, Eye, CheckCircle, PenTool,
    Scan, User, Download, ActivitySquare
} from 'lucide-react';
import PrescriptionModal from '../components/PrescriptionModal';
import XRayScanner from './XRayScanner';
import LabTests from './LabTests';
import ClinicalReportBuilder from '../components/ClinicalReportBuilder'; 
import VideoConsultation from '../components/VideoConsultation'; 
import MedicalChatbot from '../components/MedicalChatbot'; 

const DoctorDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // --- STATE ---
    const [currentAiResult, setCurrentAiResult] = useState(null); // 🟢 NEW: Global AI State
    const [activeTab, setActiveTab] = useState('schedule');
    const [activePatient, setActivePatient] = useState(null); 
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppointmentForRx, setSelectedAppointmentForRx] = useState(null);
    const [activeCallLink, setActiveCallLink] = useState(null); 

    // 🛡️ SECURITY BOUNCER
    useEffect(() => {
        if (user && user.role !== 'doctor') navigate("/dashboard");
    }, [user, navigate]);

    const fetchSchedule = async () => {
        if (!user?.id) return;
        try {
            const res = await fetch(`http://localhost:5001/api/appointments/doctor/${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setAppointments(data);
            }
        } catch (error) {
            console.error("Error fetching schedule:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'doctor') fetchSchedule();
    }, [user]);

    const trackFileAccess = async (patientName, reportName) => {
        const toastId = toast.loading("Decrypting Secure File...");
        try {
            await fetch("http://localhost:5001/api/admin/log-access", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    doctorId: user.id,
                    patientId: "65d4c8f9a2b3c4d5e6f7a8b9",
                    details: `Opened report: ${reportName} for ${patientName}`
                })
            });
            toast.success("Access Authorized & Logged", { id: toastId });
        } catch (err) {
            console.error("Spy failed:", err);
            toast.error("Access Error", { id: toastId });
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <div className="flex h-screen bg-[#f6f6f8] font-sans text-[#100e1b] overflow-hidden">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
                .font-display { font-family: 'Space Grotesk', sans-serif; }
                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #d3d1e6; border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: #5747e6; }
            `}</style>

            {/* 🟢 SIDEBAR NAVIGATION */}
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col py-6 px-4 hidden md:flex z-20 shadow-sm">
                <div className="flex items-center gap-3 px-2 mb-8">
                    <div className="w-10 h-10 bg-[#5747e6]/10 rounded-xl flex items-center justify-center text-[#5747e6]">
                        <Activity className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight font-display">MediFlow AI</h2>
                </div>

                <nav className="flex flex-col gap-2 font-display">
                    <SidebarItem icon={LayoutDashboard} label="Overview" onClick={() => { setActiveTab('schedule'); setActivePatient(null); }} active={activeTab === 'schedule' || activeTab === 'profile'} />
                    <SidebarItem icon={FlaskConical} label="Smart Lab Analysis" onClick={() => { setActiveTab('research'); setActivePatient(null); }} active={activeTab === 'research'} />
                    <SidebarItem icon={Scan} label="Vision AI (X-Ray)" onClick={() => { setActiveTab('xray'); setActivePatient(null); }} active={activeTab === 'xray'} isSpecial />
                    <SidebarItem 
                        icon={Folder} 
                        label="Patient Records" 
                        onClick={() => { setActiveTab('records'); setActivePatient(null); }} 
                        active={activeTab === 'records'} 
                    />
                    <SidebarItem 
                        icon={MessageSquare} 
                        label="Consultations" 
                        onClick={() => { setActiveTab('consultations'); setActivePatient(null); }} 
                        active={activeTab === 'consultations'} 
                    />
                </nav>

                <div className="mt-auto">
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#575095] hover:bg-red-50 hover:text-red-600 transition-all w-full font-display">
                        <Settings className="w-5 h-5" />
                        <span className="text-sm font-medium">Log Out</span>
                    </button>
                </div>
            </aside>

            {/* 🔵 MAIN CONTENT */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">

                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
                    <div className="flex items-center bg-[#f6f6f8] rounded-xl px-4 py-2.5 w-96">
                        <Search className="w-5 h-5 text-[#575095]" />
                        <input type="text" placeholder="Search patients..." className="bg-transparent border-none outline-none text-sm ml-3 w-full placeholder-[#575095]/50 font-display" />
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right hidden xl:block font-display">
                            <p className="text-sm font-bold text-[#100e1b] leading-tight">Dr. {user?.fullName || "Sarah Chen"}</p>
                            <p className="text-xs text-[#575095] font-medium">Specialist</p>
                        </div>
                        <div className="w-10 h-10 bg-[#5747e6] rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-[#5747e6]/20">
                            {user?.fullName?.charAt(0) || "D"}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 font-display">
                    <div className="max-w-7xl mx-auto pb-12">

                        {/* PAGE HEADER (Hidden if on profile page to save space) */}
                        {activeTab !== 'profile' && activeTab !== 'xray' && (
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-[#5747e6]/10 text-[#5747e6] px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                                            {activeTab === 'research' ? 'Lab Analysis Mode' : 'Dashboard'}
                                        </span>
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-bold text-[#100e1b] tracking-tight">
                                        {activeTab === 'research' ? 'Smart Lab Reports' : 
                                         activeTab === 'records' ? 'Patient Directory' :
                                         activeTab === 'consultations' ? 'Consultation History' :
                                         'My Schedule & Queue'}
                                    </h1>
                                </div>
                            </div>
                        )}

                        {/* 🔀 DYNAMIC ROUTING LOGIC */}
                        {activeTab === 'profile' && activePatient ? (
                            <PatientProfileView
                                patient={activePatient}
                                appointments={appointments}
                                onBack={() => {
                                    setActiveTab('schedule');
                                    setActivePatient(null);
                                }}
                                onStartXRay={(patientData) => {
                                    setActivePatient(patientData);
                                    setActiveTab('xray');
                                }}
                                onWriteReport={(patientData) => {
                                    setActivePatient(patientData);
                                    setActiveTab('report');
                                }}
                            />
                        ) : activeTab === 'report' && activePatient ? (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <ClinicalReportBuilder
                                    patient={activePatient}
                                    onBack={() => setActiveTab('profile')}
                                    onSave={(payload) => {
                                        console.log("Saving to DB...", payload);
                                        setActiveTab('profile');
                                    }}
                                />
                            </div>
                        ) : activeTab === 'research' ? (
                            <LabResearchView
                                appointments={appointments}
                                onViewReport={trackFileAccess}
                                onRunAI={() => setActiveTab('lab-ai')}
                            />
                        ) : activeTab === 'lab-ai' ? (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <LabTests />
                            </div>
                        ) : activeTab === 'xray' ? (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* 🟢 NEW: CONTEXTUAL BACK BUTTON FOR XRAY TAB */}
                                {activePatient && (
                                    <button 
                                        onClick={() => setActiveTab('profile')} 
                                        className="flex items-center gap-2 text-[#575095] hover:text-[#5747e6] font-bold mb-6 transition-colors"
                                    >
                                        ← Back to {activePatient.fullName || activePatient.name}'s Profile
                                    </button>
                                )}
                                <XRayScanner patient={activePatient} setGlobalAiResult={setCurrentAiResult} />
                            </div>
                        ) : activeTab === 'records' ? (
                            <PatientRecordsView 
                                appointments={appointments} 
                                onViewProfile={(patientData) => {
                                    setActivePatient(patientData);
                                    setActiveTab('profile');
                                }} 
                            />
                        ) : activeTab === 'consultations' ? (
                            <ConsultationsView appointments={appointments} />
                        ) : (
                            <ScheduleView
                                appointments={appointments}
                                loading={loading}
                                refresh={fetchSchedule}
                                onWriteRx={setSelectedAppointmentForRx}
                                onViewProfile={(patientData) => {
                                    setActivePatient(patientData);
                                    setActiveTab('profile');
                                }}
                            />
                        )}

                        <PrescriptionModal
                            isOpen={!!selectedAppointmentForRx}
                            appointment={selectedAppointmentForRx}
                            onClose={() => setSelectedAppointmentForRx(null)}
                            onSuccess={() => fetchSchedule()}
                        />

                    </div>
                </div>
            </main>

            {/* 🟢 RENDER VIDEO CALL IF ACTIVE */}
            {activeCallLink && (
                <VideoConsultation 
                    meetLink={activeCallLink}
                    userName={user?.fullName || user?.name || "Dr. MediFlow"}
                    onEndCall={() => setActiveCallLink(null)}
                />
            )}

            {/* 🟢 THE NEW FLOATING AI CHATBOT */}
            <MedicalChatbot patient={activePatient} aiResult={currentAiResult} /> 

        </div>
    );
};

// --- 🧩 SUB-COMPONENTS ---

const SidebarItem = ({ icon: Icon, label, active, isSpecial, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group w-full ${active ? 'bg-[#f6f6f8] text-[#100e1b] font-bold' : 'text-[#575095] hover:bg-[#f6f6f8]'
            } ${isSpecial && !active ? 'bg-[#5747e6]/5 text-[#5747e6]' : ''}`}
    >
        <Icon className={`w-5 h-5 ${active || isSpecial ? 'text-[#5747e6]' : 'group-hover:text-[#5747e6] transition-colors'}`} />
        <span className={`text-sm font-medium ${active ? 'font-bold' : ''}`}>{label}</span>
    </button>
);

// --- 📅 SCHEDULE VIEW ---
const ScheduleView = ({ appointments, loading, refresh, onWriteRx, onViewProfile }) => {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard icon={Users} label="Total Patients" value={appointments.length} color="text-blue-600" bg="bg-blue-50" />
                <StatCard icon={Clock} label="Pending" value={appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length} color="text-amber-600" bg="bg-amber-50" />
                <StatCard icon={CheckCircle} label="Completed" value={appointments.filter(a => a.status === 'completed').length} color="text-emerald-600" bg="bg-emerald-50" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-2px_rgba(87,71,230,0.08)] overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-[#100e1b]">Upcoming Appointments</h3>
                </div>
                <div className="divide-y divide-gray-50">
                    {loading ? (
                        <div className="p-12 text-center text-[#575095] animate-pulse">Loading schedule...</div>
                    ) : appointments.length === 0 ? (
                        <div className="p-12 text-center text-[#575095]">No appointments found.</div>
                    ) : (
                        appointments.map(appt => {
                            const isCancelled = appt.status === 'cancelled';
                            const isCompleted = appt.status === 'completed';
                            const patientData = appt.patientId || { _id: appt._id, fullName: "Unknown Patient" };

                            return (
                                <div key={appt._id} className={`p-6 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group ${isCancelled ? 'bg-gray-50 opacity-60' : 'hover:bg-[#f6f6f8]'}`}>

                                    <div className="flex items-center gap-6">
                                        <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl font-display shrink-0 ${isCancelled ? 'bg-gray-200 text-gray-500' : 'bg-[#5747e6]/5 text-[#5747e6]'}`}>
                                            <span className="text-lg font-bold">{appt.timeSlot ? appt.timeSlot.split(' ')[0] : '10:00'}</span>
                                            <span className="text-[10px] uppercase font-bold tracking-wider">{appt.timeSlot ? appt.timeSlot.split(' ')[1] : 'AM'}</span>
                                        </div>

                                        <div>
                                            <h4 className="text-lg font-bold text-[#100e1b] flex items-center gap-2">
                                                {patientData.fullName || patientData.name || "Unknown Patient"}
                                                {isCancelled && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase">Cancelled</span>}
                                                {isCompleted && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</span>}
                                            </h4>
                                            <p className="text-sm text-[#575095] flex items-center gap-2 mt-1">
                                                <Calendar className="w-3 h-3" /> {appt.date} • {appt.reason || "General Consultation"}
                                            </p>
                                        </div>
                                    </div>

                                    {!isCancelled && !isCompleted && (
                                        <div className="flex flex-wrap items-center gap-3">
                                            <button
                                                onClick={() => onViewProfile(patientData)}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-[#5747e6] rounded-lg font-bold text-sm hover:bg-indigo-100 transition-all"
                                            >
                                                <User className="w-4 h-4" /> View Profile
                                            </button>

                                            <button
                                                onClick={() => setActiveCallLink(appt.meetLink || `https://meet.jit.si/MediFlow_Legacy_${appt._id}`)}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#100e1b] rounded-lg font-bold text-sm hover:border-[#5747e6] hover:text-[#5747e6] transition-all"
                                            >
                                                <Video className="w-4 h-4" /> Start Call
                                            </button>

                                            <button
                                                onClick={() => onWriteRx(appt)}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-[#5747e6] text-white rounded-lg font-bold text-sm shadow-lg shadow-[#5747e6]/20 hover:bg-[#4638b9] transition-all"
                                            >
                                                <PenTool className="w-4 h-4" /> Write Rx
                                            </button>
                                        </div>
                                    )}

                                    {isCompleted && (
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => onViewProfile(patientData)}
                                                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-[#5747e6] rounded-lg font-bold text-sm hover:bg-indigo-100 transition-all"
                                            >
                                                <User className="w-4 h-4" /> View Profile
                                            </button>
                                            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-bold text-sm cursor-not-allowed">
                                                <FileText className="w-4 h-4" /> Rx Issued
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

// --- 👤 PATIENT PROFILE VIEW ---
const PatientProfileView = ({ patient, appointments, onBack, onStartXRay, onWriteReport }) => {

    const pastLabs = appointments.filter(appt =>
        (appt.patientId?._id === patient._id || appt.patientId === patient._id) &&
        appt.attachedReportUrl
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button onClick={onBack} className="flex items-center gap-2 text-[#575095] hover:text-[#5747e6] font-bold mb-6 transition-colors">
                ← Back to Schedule
            </button>

            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-[#5747e6]/10 text-[#5747e6] rounded-2xl flex items-center justify-center text-3xl font-bold font-display">
                        {patient?.fullName?.charAt(0) || patient?.name?.charAt(0) || "P"}
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-[#100e1b] font-display">{patient?.fullName || patient?.name || "Patient Name"}</h2>
                        <p className="text-sm text-[#575095] font-medium mt-1">Patient ID: {patient?._id || "N/A"} • Profile Access Verified</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onWriteReport(patient)}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-[#5747e6] text-[#5747e6] rounded-xl font-bold shadow-sm hover:bg-indigo-50 transition-all">
                        <FileText className="w-5 h-5" />
                        Write Clinical Report
                    </button>
                    <button
                        onClick={() => onStartXRay(patient)}
                        className="flex items-center gap-2 px-6 py-3 bg-[#5747e6] text-white rounded-xl font-bold shadow-lg shadow-[#5747e6]/20 hover:bg-indigo-700 transition-all">
                        <Scan className="w-5 h-5" />
                        New AI X-Ray Scan
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-[#100e1b] mb-4 flex items-center gap-2">
                        <FlaskConical className="w-5 h-5 text-[#5747e6]" /> Diagnostic Lab Reports
                    </h3>
                    <div className="space-y-3">
                        {pastLabs.length > 0 ? pastLabs.map(lab => (
                            <div key={lab._id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-[#f6f6f8] transition-colors group">
                                <div>
                                    <p className="font-bold text-sm text-[#100e1b]">{lab.attachedReportName || "Lab Report PDF"}</p>
                                    <p className="text-xs text-[#575095] mt-1">{lab.date}</p>
                                </div>
                                <button
                                    onClick={() => window.open(lab.attachedReportUrl, "_blank")}
                                    className="p-2 bg-white border border-gray-200 rounded-lg text-[#575095] group-hover:text-[#5747e6] group-hover:border-[#5747e6] transition-all shadow-sm">
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        )) : (
                            <p className="text-sm text-slate-500 italic p-4 text-center">No lab reports attached to this profile.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-[#100e1b] mb-4 flex items-center gap-2">
                        <ActivitySquare className="w-5 h-5 text-[#5747e6]" /> Vision AI Imaging
                    </h3>
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Scan className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-600">No previous imaging records.</p>
                        <p className="text-xs text-slate-500 mt-1">Run a new AI scan to append to record.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 🧪 LAB RESEARCH VIEW ---
const LabResearchView = ({ appointments, onViewReport, onRunAI }) => { 
    const reports = appointments.filter(appt => appt.attachedReportUrl);

    return (
        <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-3 text-indigo-700 mb-4">
                <Activity className="w-5 h-5" />
                <span className="text-sm font-bold">Secure Access Mode: All file interactions are logged for compliance.</span>
            </div>

            {reports.length === 0 && (
                <div className="p-10 text-center bg-white rounded-xl border border-dashed border-gray-200 text-gray-500">
                    No lab reports have been uploaded by patients yet.
                </div>
            )}

            {reports.map((report) => {
                const patientName = report.patientId?.fullName || report.patientId?.name || "Unknown Patient";

                return (
                    <div key={report._id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-500">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-900">{report.attachedReportName || "Lab Report PDF"}</h3>
                                <p className="text-slate-500 text-sm">Patient: <span className="font-bold text-slate-700">{patientName}</span></p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-700">
                                Pending AI Analysis
                            </span>

                            <button
                                onClick={() => {
                                    window.open(report.attachedReportUrl, "_blank");
                                    onViewReport(patientName, report.attachedReportName);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-bold text-sm hover:border-[#5747e6] hover:text-[#5747e6] transition-colors"
                            >
                                <Eye className="w-4 h-4" /> View PDF
                            </button>

                            <button
                                onClick={onRunAI}
                                className="flex items-center gap-2 px-4 py-2 bg-[#5747e6] text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                                <Activity className="w-4 h-4" /> Run Lab AI
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bg} ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-[#575095] text-xs font-bold uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-[#100e1b] font-display">{value}</p>
        </div>
    </div>
);

// --- 📁 PATIENT RECORDS VIEW ---
const PatientRecordsView = ({ appointments, onViewProfile }) => {
    // Extract unique patients from the doctor's appointment history
    const uniquePatients = [];
    const seenIds = new Set();
    
    appointments.forEach(appt => {
        const p = appt.patientId;
        if (p && p._id && !seenIds.has(p._id)) {
            seenIds.add(p._id);
            uniquePatients.push(p);
        }
    });

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {uniquePatients.length === 0 ? (
                    <div className="col-span-full p-12 bg-white rounded-2xl border border-dashed border-gray-200 text-center text-[#575095]">
                        <Folder className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p>No patient records found in your recent history.</p>
                    </div>
                ) : (
                    uniquePatients.map(patient => (
                        <div key={patient._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#5747e6]/30 transition-all group">
                            <div className="flex items-center gap-4 mb-6">
                                 <div className="w-14 h-14 bg-[#5747e6]/10 text-[#5747e6] rounded-xl flex items-center justify-center text-2xl font-bold font-display group-hover:bg-[#5747e6] group-hover:text-white transition-colors">
                                    {patient.fullName?.charAt(0) || patient.name?.charAt(0) || "P"}
                                 </div>
                                 <div>
                                     <h3 className="font-bold text-lg text-[#100e1b]">{patient.fullName || patient.name || "Unknown"}</h3>
                                     <p className="text-xs text-[#575095] font-medium mt-0.5">ID: {patient._id.substring(0, 8).toUpperCase()}</p>
                                 </div>
                            </div>
                            <button 
                                onClick={() => onViewProfile(patient)} 
                                className="w-full py-2.5 bg-indigo-50 text-[#5747e6] rounded-xl font-bold text-sm hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                            >
                                <User className="w-4 h-4" /> Open Full Record
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// --- 💬 CONSULTATIONS HISTORY VIEW ---
const ConsultationsView = ({ appointments }) => {
    // Show only completed or past consultations
    const pastConsults = appointments.filter(a => a.status === 'completed' || a.status === 'past');

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-2px_rgba(87,71,230,0.08)] overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="font-bold text-lg text-[#100e1b] flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-[#5747e6]" /> Consultation Log
                    </h3>
                </div>
                
                <div className="divide-y divide-gray-50">
                    {pastConsults.length === 0 ? (
                        <div className="p-12 text-center text-[#575095]">
                            <ActivitySquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
                            <p>No past consultations found in the system.</p>
                        </div>
                    ) : (
                        pastConsults.map(appt => {
                            const patientName = appt.patientId?.fullName || appt.patientId?.name || "Unknown Patient";
                            return (
                                <div key={appt._id} className="p-6 hover:bg-[#f6f6f8] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                                            <CheckCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-[#100e1b] text-lg">{patientName}</h4>
                                            <p className="text-sm text-[#575095] flex items-center gap-2 mt-1">
                                                <Calendar className="w-3 h-3" /> {appt.date} • {appt.timeSlot || 'Past'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold uppercase tracking-wider">
                                            Completed
                                        </span>
                                        <button className="p-2 bg-white border border-gray-200 text-[#575095] rounded-lg hover:text-[#5747e6] hover:border-[#5747e6] transition-all" title="View Summary">
                                            <FileText className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;