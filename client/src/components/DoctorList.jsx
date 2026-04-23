import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Star, Stethoscope, Calendar as CalendarIcon, X, Upload, XCircle } from 'lucide-react';

const DoctorList = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSlot, setBookingSlot] = useState("");
  const [attachedFile, setAttachedFile] = useState(null); // 🟢 NEW STATE FOR PDF

  // Booked Slots State
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // 1. Fetch Doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/doctors");
        const data = await res.json();
        setDoctors(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  // 2. Fetch Booked Slots
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!selectedDoctor || !bookingDate) return;

      setLoadingSlots(true);
      try {
        const res = await fetch(
          `http://localhost:5001/api/appointments/booked-slots?doctorId=${selectedDoctor._id}&date=${bookingDate}`
        );
        const takenSlots = await res.json();
        setBookedSlots(takenSlots);
      } catch (error) {
        console.error("Error fetching slots:", error);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchBookedSlots();
  }, [bookingDate, selectedDoctor]);

  // Handle Book
  const handleBook = async (e) => {
    e.preventDefault();
    if (!bookingDate || !bookingSlot) return toast.error("Please select date and time");

    const toastId = toast.loading("Confirming Appointment...");

    try {
      // 🟢 CHANGED TO FORMDATA TO HANDLE FILES
      const formData = new FormData();
      formData.append("patientId", user.id || user._id);
      formData.append("doctorId", selectedDoctor._id);
      formData.append("date", bookingDate);
      formData.append("timeSlot", bookingSlot);
      formData.append("reason", "General Checkup");

      if (attachedFile) {
        formData.append("labReport", attachedFile); // Must match backend multer config
      }

      const res = await fetch("http://localhost:5001/api/appointments/book", {
        method: "POST",
        body: formData, // No headers needed, browser auto-sets multipart boundary
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Appointment Confirmed!", { id: toastId });
        setSelectedDoctor(null);
        setBookingDate("");
        setBookingSlot("");
        setAttachedFile(null); // Clear file
        setBookedSlots([]);
        // Ideally, you'd trigger a refresh of appointments in Dashboard here
        window.location.reload();
      } else {
        toast.error(data.message || "Booking Failed", { id: toastId });
      }
    } catch (error) {
      toast.error("Server Error", { id: toastId });
    }
  };

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-100 rounded-2xl"></div>)}
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doc) => {
          const docName = doc.name || doc.userId?.fullName || "Doctor";
          return (
            <div key={doc._id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center">
                    <img src={doc.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${docName}`} alt={docName} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-bold text-amber-700">{doc.rating || "4.8"}</span>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-bold text-lg text-slate-800 group-hover:text-[#5747e6] transition-colors"> {docName}</h3>
                <p className="text-sm text-slate-500 font-medium flex items-center gap-1"><Stethoscope className="w-3 h-3" /> {doc.specialization}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-5 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100"><span className="block text-slate-400 font-bold uppercase mb-0.5">Exp</span><span className="font-bold text-slate-700">{doc.experience} Years</span></div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100"><span className="block text-slate-400 font-bold uppercase mb-0.5">Fee</span><span className="font-bold text-slate-700">₹{doc.consultationFee}</span></div>
              </div>

              <button onClick={() => setSelectedDoctor(doc)} className="w-full py-2.5 bg-[#5747e6] hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                <CalendarIcon className="w-4 h-4" /> Book Appointment
              </button>
            </div>
          );
        })}
      </div>

      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 relative my-8">

            <button onClick={() => { setSelectedDoctor(null); setBookedSlots([]); setBookingDate(""); setAttachedFile(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-display mb-1 text-slate-900"> {selectedDoctor.name || selectedDoctor.userId?.fullName}</h3>
            <p className="text-sm text-slate-500 mb-6 flex items-center gap-1"><Stethoscope className="w-4 h-4" /> {selectedDoctor.specialization}</p>

            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Select Date</label>
                <input type="date" required min={new Date().toISOString().split("T")[0]} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#5747e6] outline-none transition-all" onChange={(e) => setBookingDate(e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Select Time Slot</label>
                {loadingSlots ? (
                  <p className="text-sm text-[#5747e6] animate-pulse">Checking availability...</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {selectedDoctor.availableSlots.map(slot => {
                      const isTaken = bookedSlots.includes(slot);
                      return (
                        <button key={slot} type="button" disabled={isTaken} onClick={() => setBookingSlot(slot)} className={`text-sm py-2 px-1 rounded-lg border font-bold transition-all duration-200 ${isTaken ? "bg-red-50 border-red-100 text-red-400 cursor-not-allowed line-through" : bookingSlot === slot ? "bg-[#5747e6] text-white border-[#5747e6] shadow-md transform scale-105" : "bg-white border-slate-200 hover:border-[#5747e6] text-slate-600"}`}>
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 🟢 NEW: PDF ATTACHMENT ZONE */}
              <div className="mt-4 p-4 border border-dashed border-indigo-200 rounded-xl bg-indigo-50/50">
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <Upload className="w-6 h-6 text-indigo-400 mb-2" />
                  <span className="text-sm font-bold text-slate-700">Attach Lab Report (Optional)</span>
                  <span className="text-xs text-slate-500 mt-1">Upload PDF or JPG (Max 5MB)</span>
                  <input
                    type="file"
                    accept=".pdf, image/jpeg, image/png"
                    className="hidden"
                    onChange={(e) => setAttachedFile(e.target.files[0])}
                  />
                </label>
                {attachedFile && (
                  <div className="mt-3 p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 truncate pr-4">
                      📄 {attachedFile.name}
                    </span>
                    <button onClick={(e) => { e.preventDefault(); setAttachedFile(null); }} className="text-red-500 hover:text-red-700 p-1">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 mt-2">
                <button type="submit" disabled={!bookingSlot} className="w-full py-3 bg-[#5747e6] text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#5747e6]/20 transition-all flex flex-col items-center">
                  <span>Confirm Booking</span>
                  <span className="text-xs font-medium text-indigo-200 mt-0.5">Fee: ₹{selectedDoctor.consultationFee}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default DoctorList;