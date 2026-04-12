import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Calendar, Video, Download, Heart, Activity, Scale,
  LogOut, History as HistoryIcon, Search, Bell, Clock, AlertTriangle, Pill, FileText, CheckCircle, BrainCircuit // Added FileText, CheckCircle, BrainCircuit
} from 'lucide-react';
import DoctorList from '../components/DoctorList'; // 👈 Our shiny new component
import PrescriptionViewer from '../components/PrescriptionViewer';
import VideoConsultation from '../components/VideoConsultation'; // 🟢 ADD IMPORT

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // --- STATE ---
  const [myAppointments, setMyAppointments] = useState([]);
  const [myReports, setMyReports] = useState([]); // 🟢 NEW STATE
  const [loading, setLoading] = useState(true);

  // Cancellation Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [selectedAppointmentForView, setSelectedAppointmentForView] = useState(null); // 🟢 State for viewer
  const [activeCallLink, setActiveCallLink] = useState(null); // 🟢 ADD STATE

  // --- SECURITY ---
  useEffect(() => {
    if (user?.role === 'doctor') navigate("/doctor-dashboard");
  }, [user, navigate]);

  const getUserId = () => {
    if (!user) return null;
    return user.id || user._id;
  };

  // --- DATA FETCHING (Only fetching Appointments now, DoctorList fetches doctors) ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      const userId = getUserId();
      if (!userId) return;

      try {
        // Fetch Appointments
        const apptRes = await fetch(`http://localhost:5001/api/appointments/patient/${userId}`);
        const apptData = await apptRes.json();
        if (Array.isArray(apptData)) setMyAppointments(apptData);

        // 🟢 NEW: Fetch AI Imaging Reports
        const reportsRes = await fetch(`http://localhost:5001/api/vision/patient/${userId}`);
        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          setMyReports(reportsData);
        }
      } catch (error) {
        console.error("Network Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  // --- ACTIONS ---

  // Confirm Cancellation
  const confirmCancellation = async () => {
    if (!appointmentToCancel) return;

    const toastId = toast.loading("Cancelling...");
    try {
      const res = await fetch(`http://localhost:5001/api/appointments/cancel/${appointmentToCancel}`, {
        method: "PUT"
      });

      if (res.ok) {
        toast.success("Appointment Cancelled", { id: toastId });
        setShowCancelModal(false);
        setAppointmentToCancel(null);
        // Optimistically remove from UI
        setMyAppointments(prev => prev.map(appt => appt._id === appointmentToCancel ? { ...appt, status: 'cancelled' } : appt));
      } else {
        toast.error("Failed to cancel", { id: toastId });
      }
    } catch (err) {
      toast.error("Server Error", { id: toastId });
    }
  };

  // Filter Upcoming Appointments
  const upcomingAppointments = myAppointments
    .filter(a => new Date(a.date) >= new Date().setHours(0, 0, 0, 0) && a.status !== 'cancelled')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const pastAppointments = myAppointments
    .filter(a => a.status === 'completed')
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort newest first

  return (
    <div className="flex h-screen bg-[#f6f6f8] text-slate-900 font-sans overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Noto+Sans:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
      `}</style>

      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-72 h-full bg-white border-r border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="size-10 rounded-xl bg-[#5747e6] flex items-center justify-center text-white shadow-lg shadow-[#5747e6]/30">
            <Activity className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight font-display">MediFlow AI</h1>
        </div>

        <nav className="flex flex-col gap-2 flex-1 font-display">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#5747e6] text-white shadow-md shadow-[#5747e6]/25 transition-all">
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Overview</span>
          </a>
          <a href="#doctors" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#5747e6] transition-colors">
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
          <a href="/pharmacy" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#5747e6] transition-colors">
            <Pill className="w-5 h-5" />
            <span className="font-medium">Pharmacy</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#5747e6] transition-colors">
            <HistoryIcon className="w-5 h-5" />
            <span className="font-medium">History</span>
          </a>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-[#5747e6] font-bold text-lg border border-slate-200">
              {user?.fullName?.charAt(0)}
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-bold text-slate-900 line-clamp-1">{user?.fullName}</p>
              <p className="text-xs text-slate-500">#{getUserId()?.slice(-5)}</p>
            </div>
            <button onClick={() => { logout(); navigate("/"); }} className="ml-auto text-slate-400 hover:text-red-500 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 h-full overflow-y-auto bg-[#f6f6f8]">

        {/* Top Header */}
        <header className="sticky top-0 z-20 h-16 flex items-center justify-between px-6 lg:px-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="flex items-center gap-4 w-full max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input className="block w-full pl-10 pr-3 py-2 border-none rounded-xl bg-slate-100 focus:ring-2 focus:ring-[#5747e6] focus:bg-white transition-all text-sm placeholder-slate-400" placeholder="Search..." type="text" />
            </div>
          </div>
          <button className="size-10 rounded-full bg-white flex items-center justify-center text-slate-600 shadow-sm border border-slate-200 relative hover:bg-slate-50 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </header>

        <div className="max-w-6xl mx-auto p-6 md:p-10 flex flex-col gap-10">

          {/* 1. WELCOME & VITALS */}
          <section className="flex flex-col gap-6">
            <header className="flex flex-wrap justify-between items-end gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight font-display">Hello, {user?.fullName?.split(' ')[0]}</h2>
                <p className="text-slate-500 text-lg">Here is your health summary.</p>
              </div>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
                <Download className="w-4 h-4" /> Download Report
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-rose-500"><Heart className="w-5 h-5" /><span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Heart Rate</span></div>
                <div className="flex items-end gap-2"><span className="text-4xl font-bold font-display text-slate-800">--</span><span className="text-sm text-slate-500 mb-1 font-medium">bpm</span></div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-blue-500"><Activity className="w-5 h-5" /><span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Blood Pressure</span></div>
                <div className="flex items-end gap-2"><span className="text-4xl font-bold font-display text-slate-800">--/--</span><span className="text-sm text-slate-500 mb-1 font-medium">mmHg</span></div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-indigo-500"><Scale className="w-5 h-5" /><span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Weight</span></div>
                <div className="flex items-end gap-2"><span className="text-4xl font-bold font-display text-slate-800">--</span><span className="text-sm text-slate-500 mb-1 font-medium">kg</span></div>
              </div>
            </div>
          </section>

          {/* 2. OUR NEW DOCTOR COMPONENT (Handles Booking) */}
          <section id="doctors" className="pt-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-display text-slate-800">Find a Specialist</h2>
              <button className="text-sm font-bold text-[#5747e6] hover:underline">View All Directory</button>
            </div>

            <DoctorList />
          </section>

          {/* 3. UPCOMING APPOINTMENTS */}
          <section className="flex flex-col gap-4 pt-4">
            <h3 className="text-2xl font-bold text-slate-900 font-display">
              Upcoming Appointments ({upcomingAppointments.length})
            </h3>

            {loading ? (
              <div className="animate-pulse bg-slate-200 h-32 rounded-xl w-full"></div>
            ) : upcomingAppointments.length > 0 ? (
              <div className="flex flex-col gap-4">
                {upcomingAppointments.map((appt) => (
                  <div key={appt._id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch gap-6 hover:border-[#5747e6]/30 transition-colors">

                    {/* Date Block */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center bg-[#5747e6]/10 rounded-lg w-24 h-24 border border-[#5747e6]/20">
                      <span className="text-[#5747e6] font-bold text-lg uppercase font-display">{new Date(appt.date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-[#5747e6] font-black text-3xl font-display">{new Date(appt.date).getDate()}</span>
                    </div>

                    {/* Details */}
                    <div className="flex-grow flex flex-col justify-center gap-1">
                      <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-1 bg-slate-50 w-fit px-2 py-1 rounded-md">
                        <Clock className="w-4 h-4" /> {appt.timeSlot} • Video Consultation
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 font-display">Dr. {appt.doctorId?.userId?.fullName || "Doctor"}</h4>
                      <p className="text-slate-500 text-sm">{appt.doctorId?.specialization || "General"}</p>

                      {/* 🟢 UPDATED: Clickable link to open the PDF */}
                      {appt.attachedReportUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevents triggering other clicks on the card
                            window.open(appt.attachedReportUrl, "_blank");
                          }}
                          className="flex items-center gap-1.5 w-fit text-xs font-bold text-[#5747e6] mt-1 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-all"
                          title="View your attached report"
                        >
                          <FileText className="w-3 h-3" /> View Attached Report
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      {/* 🟢 PATIENT VIDEO BUTTON */}
                      <button onClick={() => setActiveCallLink(appt.meetLink)} className="w-full sm:w-auto bg-[#5747e6] hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-lg transition-all shadow-lg shadow-[#5747e6]/30 flex gap-2 items-center justify-center">
                        <Video className="w-5 h-5" /> Join Call
                      </button>
                      <button
                        onClick={() => {
                          setAppointmentToCancel(appt._id);
                          setShowCancelModal(true);
                        }}
                        className="w-full sm:w-auto bg-white border border-red-200 text-red-500 hover:bg-red-50 font-medium py-2.5 px-6 rounded-lg transition-all flex gap-2 items-center justify-center"
                      >
                        Cancel
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-10 rounded-xl border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-3">
                <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                  <Calendar className="w-8 h-8" />
                </div>
                <p className="text-slate-500 font-medium">You have no upcoming appointments.</p>
                <button onClick={() => document.getElementById('doctors').scrollIntoView({ behavior: 'smooth' })} className="text-[#5747e6] font-bold hover:underline">Book one now</button>
              </div>
            )}
          </section>

          {/* 🟢 COMPLETED APPOINTMENTS (PAST) */}
          {pastAppointments.length > 0 && (
            <section className="flex flex-col gap-4 pt-6 border-t border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 font-display">
                Past Consultations & Records
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastAppointments.map((appt) => (
                  <div key={appt._id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">Dr. {appt.doctorId?.name || appt.doctorId?.userId?.fullName || "Doctor"}</h4>
                          <p className="text-xs text-slate-500 font-medium">{appt.date} • {appt.timeSlot}</p>
                        </div>
                      </div>
                      <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Completed
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedAppointmentForView(appt._id)}
                      className="w-full py-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-indigo-600 font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" /> View Prescription
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 🟢 NEW: AI DIAGNOSTIC REPORTS */}
          {myReports.length > 0 && (
            <section className="flex flex-col gap-4 pt-6 border-t border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 font-display flex items-center gap-2">
                <Activity className="w-6 h-6 text-[#5747e6]" /> My AI Diagnostic Reports
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myReports.map((report) => {
                  // Determine styling based on the AI's finding
                  const isNormal = report.prediction.toUpperCase() === "NORMAL";

                  return (
                    <div key={report._id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4 hover:border-[#5747e6]/40 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isNormal ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            <Activity className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{report.scanType || "Chest X-Ray"}</h4>
                            <p className="text-xs text-slate-500 font-medium">{new Date(report.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Clinical Finding</p>
                        <p className={`text-sm font-bold flex items-center gap-1.5 ${isNormal ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {isNormal ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                          {report.prediction}
                        </p>
                      </div>

                      <div className="mt-1">
                        <p className="text-xs text-slate-600 italic">
                          "{report.radiologistNotes || "AI findings verified by attending radiologist."}"
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 🟢 THE PRESCRIPTION VIEWER MODAL */}
          <PrescriptionViewer
            isOpen={!!selectedAppointmentForView}
            appointmentId={selectedAppointmentForView}
            onClose={() => setSelectedAppointmentForView(null)}
          />

          <footer className="mt-8 py-6 text-center text-slate-400 text-sm border-t border-slate-200">
            © 2026 MediFlow AI Inc. All rights reserved.
          </footer>
        </div>
      </main>

      {/* 🔴 CANCEL MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 flex flex-col items-center text-center gap-4">
              <div className="size-12 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Cancel Appointment?</h3>
                <p className="text-sm text-slate-500">The slot will be freed for other patients immediately.</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex gap-3">
              <button onClick={() => { setShowCancelModal(false); setAppointmentToCancel(null); }} className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-100 transition-colors">
                Keep It
              </button>
              <button onClick={confirmCancellation} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 RENDER VIDEO CALL IF ACTIVE */}
      {activeCallLink && (
        <VideoConsultation 
          meetLink={activeCallLink}
          userName={user?.fullName || user?.name || "MediFlow User"}
          onEndCall={() => setActiveCallLink(null)} // Closes the overlay
        />
      )}

    </div>
  );
};

export default Dashboard;