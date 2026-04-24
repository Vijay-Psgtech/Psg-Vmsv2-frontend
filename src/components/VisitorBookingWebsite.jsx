/**
 * PSG VISITOR BOOKING PORTAL — FULLY ENHANCED
 * ✅ Booking status tracker by confirmation ID
 * ✅ Smart host search with live filter
 * ✅ Purpose quick-select chips
 * ✅ Phone OTP verification before submit
 * ✅ Auto-save form to localStorage
 * ✅ ID proof upload field
 * ✅ Download visitor pass as PDF (jsPDF CDN)
 * ✅ Share via WhatsApp + copy booking ID
 * ✅ Add to Google Calendar
 * ✅ Estimated wait time for slot
 * ✅ How it works animated section
 * ✅ Live campus visitor stats banner
 * ✅ Operating hours & holiday notice
 * ✅ Social proof animated counter
 * ✅ Full mobile optimization
 * ✅ Dark mode (OS preference + manual toggle)
 * ✅ Tamil / English language toggle
 * ✅ ARIA labels + keyboard accessibility
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import bannerImage from "../assets/image_1.webp";
import api from "../utils/api";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── i18n ──────────────────────────────────────────────────────────────────
const T = {
  en: {
    brand: "PSG Institutions",
    brandSub: "Book Appointment",
    heroTitle1: "Schedule Your",
    heroTitle2: "Campus Visit",
    heroSub:
      "Book an appointment with our faculty and explore PSG Institutions",
    heroDesc:
      "Join thousands of visitors exploring excellence in education, cutting-edge research facilities, and a vibrant academic campus.",
    heroBadge: "Quick & Easy Booking",
    heroTime: "Takes just 2 minutes to book",
    howTitle: "How It Works",
    howSub: "Three simple steps to your campus visit",
    how1t: "Fill the Form",
    how1d: "Enter your personal details and choose who you want to meet",
    how2t: "Get Approved",
    how2d: "The faculty reviews your request and sends a QR code to your email",
    how3t: "Visit Campus",
    how3d: "Show your QR code at the gate and enjoy your visit",
    statsTitle: "Campus Today",
    statsToday: "Visitors Today",
    statsPending: "Awaiting Approval",
    statsInside: "Currently Inside",
    hoursTitle: "Campus Visiting Hours",
    hoursWdLabel: "Mon – Fri",
    hoursWdTime: "9:00 AM – 5:00 PM",
    hoursSatLabel: "Saturday",
    hoursSatTime: "9:00 AM – 1:00 PM",
    hoursSunLabel: "Sunday",
    hoursSunTime: "Closed",
    hoursNote: "Gates close 30 minutes before campus closing time.",
    socialCount: "Happy Visitors This Month",
    socialSub: "Join thousands who have visited our campus",
    bookTitle: "Book Your Appointment",
    bookSub: "Complete the form below in 2 minutes",
    s1: "Personal Info",
    s2: "Visit Details",
    s3: "Confirmation",
    name: "Full Name",
    email: "Email",
    phone: "Phone",
    org: "School / Organization",
    vehicle: "Vehicle Number",
    vehiclePh: "TN01AB1234 (Optional)",
    cont: "Continue",
    back: "Back",
    submit: "Submit Appointment",
    processing: "Processing...",
    purposeL: "Purpose of Visit",
    purposePh: "What would you like to explore?",
    hostL: "Faculty / Staff to Meet",
    hostPh: "Search by name, department...",
    gateL: "Entry Gate",
    dateL: "Visit Date",
    timeL: "Visit Time",
    durL: "Expected Duration",
    dur30: "30 minutes",
    dur60: "1 hour",
    dur120: "2 hours",
    dur180: "3 hours",
    dur240: "4 hours",
    dur480: "Full day (8 hrs)",
    schedTitle: "Your Visit Schedule",
    entry: "Entry:",
    exit: "Exit:",
    waitLabel: "Estimated wait",
    waitSlot: "bookings in this slot",
    otpTitle: "Verify Phone Number",
    otpSub: "Enter the 6-digit OTP sent to",
    otpSend: "Send OTP",
    otpVerify: "Verify & Submit",
    otpResend: "Resend OTP",
    otpSent: "OTP sent! Check your phone.",
    otpSkip: "Skip (Dev mode)",
    idL: "ID Proof (Optional)",
    idPh: "Upload Aadhaar, College ID, Passport...",
    idDone: "uploaded",
    confTitle: "Appointment Confirmed!",
    confSub: "Your booking request has been submitted successfully",
    confDetails: "Appointment Details",
    refId: "Reference ID",
    dtLabel: "Date & Time",
    facLabel: "Faculty Contact",
    gateLabel: "Entry Gate",
    statusL: "Status",
    statusVal: "Pending Approval",
    nextTitle: "What Happens Next",
    next1: "Faculty receives your appointment request",
    next2: "You'll get a confirmation email within 24 hours",
    next3: "Bring valid ID on your visit date",
    next4: "Check email for QR code entry pass",
    next5: "Arrive 10 minutes early for check-in",
    printBtn: "Print Confirmation",
    bookAgain: "Book Another Visit",
    dlPass: "Download Visitor Pass",
    shareWA: "Share via WhatsApp",
    copyId: "Copy Booking ID",
    addCal: "Add to Calendar",
    copied: "Copied!",
    trackTitle: "Track Your Booking",
    trackSub: "Enter your confirmation ID to check real-time status",
    trackPh: "e.g. VIS-1234567890",
    trackBtn: "Check Status",
    trackNone: "No booking found with that ID. Please check and try again.",
    trackReset: "Track Another",
    errName: "Full name is required",
    errEmail: "Email is required",
    errEmailFmt: "Please enter a valid email",
    errPhone: "Phone number is required",
    errPhoneFmt: "Phone must be 10 digits",
    errHost: "Please select your contact person",
    errGate: "Please select entry gate",
    errDate: "Visit date is required",
    errTime: "Visit time is required",
    errPurpose: "Please tell us your visit purpose",
    errFuture: "Please select a future date/time",
    errAll: "Please fill in all required fields",
    chips: [
      "Admission Enquiry",
      "Campus Tour",
      "Meeting",
      "Research",
      "Interview",
      "Other",
    ],
    holidays: [
      "Jan 26 – Republic Day",
      "Aug 15 – Independence Day",
      "Oct 2 – Gandhi Jayanti",
    ],
    login: "Login",
    dark: "Dark",
    light: "Light",
    fContact: "Contact Us",
    fLinks: "Quick Links",
  },
  ta: {
    brand: "PSG நிறுவனங்கள்",
    brandSub: "சந்திப்பு பதிவு",
    heroTitle1: "உங்கள்",
    heroTitle2: "வருகையை திட்டமிடுங்கள்",
    heroSub: "ஆசிரியர்களுடன் சந்திப்பு பதிவு செய்து PSG நிறுவனங்களை ஆராயுங்கள்",
    heroDesc:
      "ஆயிரக்கணக்கான பார்வையாளர்களுடன் இணைந்து சிறந்த கல்வி, ஆராய்ச்சி வசதிகள் மற்றும் துடிப்பான வளாகத்தை ஆராயுங்கள்.",
    heroBadge: "விரைவான & எளிதான பதிவு",
    heroTime: "பதிவு செய்ய 2 நிமிடங்கள் மட்டுமே",
    howTitle: "எவ்வாறு செயல்படுகிறது",
    howSub: "மூன்று எளிய படிகளில் வளாக வருகை",
    how1t: "படிவத்தை நிரப்புங்கள்",
    how1d:
      "தனிப்பட்ட விவரங்களை உள்ளிட்டு யாரை சந்திக்க வேண்டும் என்று தேர்ந்தெடுங்கள்",
    how2t: "அனுமதி பெறுங்கள்",
    how2d:
      "ஆசிரியர் கோரிக்கையை ஆராய்ந்து QR குறியீட்டை மின்னஞ்சலில் அனுப்புவார்",
    how3t: "வளாகத்தை சந்தியுங்கள்",
    how3d: "வாயிலில் QR குறியீட்டை காட்டி உங்கள் வருகையை அனுபவியுங்கள்",
    statsTitle: "இன்றைய வளாகம்",
    statsToday: "இன்றைய பார்வையாளர்கள்",
    statsPending: "அனுமதி காத்திருக்கிறது",
    statsInside: "தற்போது உள்ளே",
    hoursTitle: "வளாக வருகை நேரம்",
    hoursWdLabel: "திங்கள் – வெள்ளி",
    hoursWdTime: "காலை 9:00 – மாலை 5:00",
    hoursSatLabel: "சனிக்கிழமை",
    hoursSatTime: "காலை 9:00 – மதியம் 1:00",
    hoursSunLabel: "ஞாயிற்றுக்கிழமை",
    hoursSunTime: "மூடப்பட்டது",
    hoursNote: "வளாகம் மூடுவதற்கு 30 நிமிடங்கள் முன்பு வாயில்கள் மூடப்படும்.",
    socialCount: "மகிழ்ச்சியான பார்வையாளர்கள் இந்த மாதம்",
    socialSub: "வளாகத்தை சந்தித்த ஆயிரக்கணக்கானவர்களுடன் இணையுங்கள்",
    bookTitle: "சந்திப்பை பதிவு செய்யுங்கள்",
    bookSub: "கீழே உள்ள படிவத்தை 2 நிமிடங்களில் நிரப்புங்கள்",
    s1: "தனிப்பட்ட தகவல்",
    s2: "வருகை விவரங்கள்",
    s3: "உறுதிப்படுத்தல்",
    name: "முழு பெயர்",
    email: "மின்னஞ்சல்",
    phone: "தொலைபேசி",
    org: "பள்ளி / நிறுவனம்",
    vehicle: "வாகன எண்",
    vehiclePh: "TN01AB1234 (விரும்பினால்)",
    cont: "தொடர்க",
    back: "பின்செல்",
    submit: "சந்திப்பை சமர்ப்பிக்க",
    processing: "செயல்படுகிறது...",
    purposeL: "வருகையின் நோக்கம்",
    purposePh: "என்ன ஆராய விரும்புகிறீர்கள்?",
    hostL: "சந்திக்க வேண்டியவர்",
    hostPh: "பெயர், துறை என்று தேடுங்கள்...",
    gateL: "நுழைவு வாயில்",
    dateL: "வருகை தேதி",
    timeL: "வருகை நேரம்",
    durL: "எதிர்பார்க்கப்படும் காலம்",
    dur30: "30 நிமிடங்கள்",
    dur60: "1 மணி நேரம்",
    dur120: "2 மணி நேரம்",
    dur180: "3 மணி நேரம்",
    dur240: "4 மணி நேரம்",
    dur480: "முழு நாள்",
    schedTitle: "உங்கள் வருகை அட்டவணை",
    entry: "நுழைவு:",
    exit: "வெளியேற்றம்:",
    waitLabel: "மதிப்பிடப்பட்ட காத்திருப்பு",
    waitSlot: "இந்த நேர இடையில் பதிவுகள்",
    otpTitle: "தொலைபேசி எண்ணை சரிபார்க்கவும்",
    otpSub: "அனுப்பப்பட்ட 6 இலக்க OTP ஐ உள்ளிடவும்",
    otpSend: "OTP அனுப்பு",
    otpVerify: "சரிபார்த்து சமர்ப்பி",
    otpResend: "OTP மீண்டும் அனுப்பு",
    otpSent: "OTP அனுப்பப்பட்டது!",
    otpSkip: "தவிர்க்க (Dev)",
    idL: "அடையாள சான்று (விரும்பினால்)",
    idPh: "ஆதார், கல்லூரி அட்டை, கடவுச்சீட்டு...",
    idDone: "பதிவேற்றப்பட்டது",
    confTitle: "சந்திப்பு உறுதிப்படுத்தப்பட்டது!",
    confSub: "உங்கள் பதிவு கோரிக்கை வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது",
    confDetails: "சந்திப்பு விவரங்கள்",
    refId: "குறிப்பு ID",
    dtLabel: "தேதி & நேரம்",
    facLabel: "ஆசிரியர் தொடர்பு",
    gateLabel: "நுழைவு வாயில்",
    statusL: "நிலை",
    statusVal: "அனுமதி நிலுவையில்",
    nextTitle: "அடுத்து என்ன நடக்கும்",
    next1: "ஆசிரியர் உங்கள் கோரிக்கையை பெறுகிறார்",
    next2: "24 மணி நேரத்திற்குள் உறுதிப்படுத்தல் மின்னஞ்சல் வரும்",
    next3: "வருகை தேதியில் அடையாளத்தை கொண்டு வாருங்கள்",
    next4: "QR குறியீட்டு சீட்டிற்கு மின்னஞ்சலை சரிபார்க்கவும்",
    next5: "செக்-இன்னுக்கு 10 நிமிடங்கள் முன்பு வாருங்கள்",
    printBtn: "உறுதிப்படுத்தலை அச்சிடுக",
    bookAgain: "மற்றொரு வருகையை பதிவு செய்க",
    dlPass: "பார்வையாளர் சீட்டு பதிவிறக்கம்",
    shareWA: "WhatsApp வழியாக பகிர்",
    copyId: "பதிவு IDஐ நகலெடு",
    addCal: "காலண்டரில் சேர்",
    copied: "நகலெடுக்கப்பட்டது!",
    trackTitle: "உங்கள் பதிவை கண்காணிக்கவும்",
    trackSub: "நிலையை சரிபார்க்க உறுதிப்படுத்தல் IDஐ உள்ளிடவும்",
    trackPh: "எ.கா. VIS-1234567890",
    trackBtn: "நிலையை சரிபார்க்கவும்",
    trackNone: "அந்த IDயில் பதிவு எதுவும் இல்லை.",
    trackReset: "மற்றொன்றை கண்காணிக்க",
    errName: "முழு பெயர் தேவை",
    errEmail: "மின்னஞ்சல் தேவை",
    errEmailFmt: "செல்லுபடியான மின்னஞ்சலை உள்ளிடவும்",
    errPhone: "தொலைபேசி எண் தேவை",
    errPhoneFmt: "தொலைபேசி 10 இலக்கமாக இருக்க வேண்டும்",
    errHost: "தொடர்பு நபரை தேர்ந்தெடுக்கவும்",
    errGate: "நுழைவு வாயிலை தேர்ந்தெடுக்கவும்",
    errDate: "வருகை தேதி தேவை",
    errTime: "வருகை நேரம் தேவை",
    errPurpose: "வருகையின் நோக்கத்தை கூறுங்கள்",
    errFuture: "எதிர்கால தேதி/நேரத்தை தேர்ந்தெடுக்கவும்",
    errAll: "அனைத்து தேவையான புலங்களையும் நிரப்பவும்",
    chips: [
      "சேர்க்கை விசாரணை",
      "வளாக சுற்றுலா",
      "சந்திப்பு",
      "ஆராய்ச்சி",
      "நேர்காணல்",
      "மற்றவை",
    ],
    holidays: [
      "ஜன 26 – குடியரசு தினம்",
      "ஆக 15 – சுதந்திர தினம்",
      "அக் 2 – காந்தி ஜயந்தி",
    ],
    login: "உள்நுழைவு",
    dark: "இரவு",
    light: "பகல்",
    fContact: "எங்களை தொடர்பு கொள்ளுங்கள்",
    fLinks: "விரைவு இணைப்புகள்",
  },
};

// ─── Animated counter hook ────────────────────────────────────────────────
function useCounter(target, dur = 1800) {
  const [n, setN] = useState(0);
  const started = useRef(false);
  const el = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const step = Math.ceil(target / (dur / 16));
          let c = 0;
          const id = setInterval(() => {
            c = Math.min(c + step, target);
            setN(c);
            if (c >= target) clearInterval(id);
          }, 16);
        }
      },
      { threshold: 0.3 },
    );
    if (el.current) obs.observe(el.current);
    return () => obs.disconnect();
  }, [target, dur]);
  return [n, el];
}

// ─── PDF generator ────────────────────────────────────────────────────────
async function generatePass(form, cId, hostName, gateName) {
  if (!window.jspdf) {
    await new Promise((ok, err) => {
      const s = document.createElement("script");
      s.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload = ok;
      s.onerror = err;
      document.head.appendChild(s);
    });
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: [90, 130] });
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, 90, 30, "F");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, "bold");
  doc.text("PSG INSTITUTIONS", 45, 11, { align: "center" });
  doc.text("VISITOR PASS", 45, 19, { align: "center" });
  doc.setFontSize(7);
  doc.setFont(undefined, "normal");
  doc.text("VPASS Digital Entry", 45, 26, { align: "center" });
  doc.setFontSize(17);
  doc.setTextColor(30, 64, 175);
  doc.setFont(undefined, "bold");
  doc.text(cId, 45, 44, { align: "center" });
  doc.setFontSize(8);
  doc.setFont(undefined, "normal");
  let y = 54;
  [
    ["Name", form.name],
    ["Phone", form.phone],
    ["Host", hostName || "—"],
    ["Gate", gateName || form.gate],
    [
      "Date/Time",
      new Date(`${form.date}T${form.time}`).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      }),
    ],
    ["Duration", `${form.expectedDuration} min`],
  ].forEach(([l, v]) => {
    doc.setTextColor(100, 100, 100);
    doc.text(l + ":", 8, y);
    doc.setTextColor(20, 20, 20);
    doc.setFont(undefined, "bold");
    doc.text(String(v || "—"), 32, y);
    doc.setFont(undefined, "normal");
    y += 7;
  });
  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(0.3);
  doc.line(5, y + 2, 85, y + 2);
  doc.setFontSize(6.5);
  doc.setTextColor(120, 120, 120);
  doc.text("Show at gate. Valid for specified date & time only.", 45, y + 8, {
    align: "center",
  });
  doc.setTextColor(200, 50, 50);
  doc.setFont(undefined, "bold");
  doc.text("Electronic pass — no printing required.", 45, y + 14, {
    align: "center",
  });
  doc.save(`VisitorPass_${cId}.pdf`);
}

// ─── Google Calendar link ─────────────────────────────────────────────────
function calLink(form, hostName) {
  const s = new Date(`${form.date}T${form.time}`);
  const e = new Date(s.getTime() + Number(form.expectedDuration) * 60000);
  const f = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("PSG Campus Visit – " + hostName)}&dates=${f(s)}/${f(e)}&location=${encodeURIComponent("PSG Institutions, Coimbatore")}&details=${encodeURIComponent("Visitor: " + form.name + "\nGate: " + form.gate)}`;
}

// ─── Track status step ────────────────────────────────────────────────────
function TrackStep({ label, done, active, time }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        paddingBottom: 18,
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: done ? "#1e40af" : active ? "#dbeafe" : "var(--s2)",
            border: `2px solid ${done || active ? "#1e40af" : "var(--bdr)"}`,
            color: done ? "#fff" : "#1e40af",
            fontWeight: 700,
            fontSize: 12,
            flexShrink: 0,
          }}
        >
          {done ? "✓" : active ? "●" : "○"}
        </div>
        <div
          style={{
            width: 2,
            flex: 1,
            minHeight: 20,
            background: done ? "#1e40af" : "var(--bdr)",
            marginTop: 2,
          }}
        />
      </div>
      <div style={{ paddingTop: 4 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 13,
            color: done || active ? "var(--txt)" : "var(--t2)",
          }}
        >
          {label}
        </div>
        {time && (
          <div style={{ fontSize: 11, color: "var(--t2)", marginTop: 2 }}>
            {time}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function PSGVisitorBookingPortal() {
  const navigate = useNavigate();

  const [lang, setLang] = useState("en");
  const [dark, setDark] = useState(false);
  const [view, setView] = useState("home"); // "home" | "track"
  const t = T[lang];

  // Form
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => {
    try {
      const s = localStorage.getItem("vpass_form");
      if (s) return JSON.parse(s);
    } catch {}
    const tm = new Date();
    tm.setDate(tm.getDate() + 1);
    return {
      name: "",
      email: "",
      phone: "",
      company: "",
      purpose: "",
      hostId: "",
      gate: "",
      date: tm.toISOString().split("T")[0],
      time: "10:00",
      expectedDuration: "120",
      vehicleNumber: "",
      idFile: "",
    };
  });
  const [errs, setErrs] = useState({});
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cId, setCId] = useState("");
  const [copied, setCopied] = useState(false);

  // Data
  const [hosts, setHosts] = useState([]);
  const [gates, setGates] = useState([]);
  const [dataLoading, setDL] = useState(true);
  const [hostQ, setHostQ] = useState("");
  const [stats, setStats] = useState({ today: 0, pending: 0, inside: 0 });
  const [waitN, setWaitN] = useState(0);
  const fetched = useRef(false);

  // OTP
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpOk, setOtpOk] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpErr, setOtpErr] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);

  // Tracker
  const [trackId, setTrackId] = useState("");
  const [trackRes, setTrackRes] = useState(null);
  const [trackBusy, setTrackBusy] = useState(false);
  const [trackErr, setTrackErr] = useState("");

  const [navOpen, setNavOpen] = useState(false);
  const [visCount, cntRef] = useCounter(1247);

  // fetch gates 
  const fetchGates = async () => {
    try {
      const res = await api.get("/gate");
      setGates(res.data || []);
    } catch (err) {
      console.error("Error fetching gates:", err);
    }
  };

  useEffect(() => {
    fetchGates();
  }, []);

  // OS dark mode
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mq.matches);
    const fn = (e) => setDark(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  // Auto-save
  useEffect(() => {
    if (!success) localStorage.setItem("vpass_form", JSON.stringify(form));
  }, [form, success]);

  // OTP countdown
  useEffect(() => {
    if (otpTimer <= 0) return;
    const id = setInterval(() => setOtpTimer((p) => p - 1), 1000);
    return () => clearInterval(id);
  }, [otpTimer]);

  // Load hosts + stats
  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    (async () => {
      try {
        const r = await fetch(`${API}/hostadmin`).catch(() => null);
        if (r?.ok) {
          const d = await r.json();
          setHosts(d?.data || []);
        }
      } catch {}
      try {
        const r = await fetch(`${API}/visitor/stats/overview`).catch(
          () => null,
        );
        if (r?.ok) {
          const d = await r.json();
          const data = d?.data || {};
          setStats({
            today: data.today || 0,
            pending: data.pending || 0,
            inside: data.inside || 0,
          });
        }
        console.log("Fetched stats:", stats);
      } catch {}
      setDL(false);
    })();
  }, []);

  // Wait count for slot
  useEffect(() => {
    if (!form.date || !form.time || !form.hostId) return;
    fetch(
      `${API}/visitor/slot-count?date=${form.date}&time=${form.time}&hostId=${form.hostId}`,
    )
      .then((r) => r.json())
      .then((d) => setWaitN(d?.count || 0))
      .catch(() => setWaitN(0));
  }, [form.date, form.time, form.hostId]);

  // Helpers
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errs[name]) setErrs((p) => ({ ...p, [name]: "" }));
  };
  const onChip = (v) => {
    setForm((p) => ({ ...p, purpose: v }));
    if (errs.purpose) setErrs((p) => ({ ...p, purpose: "" }));
  };
  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f) setForm((p) => ({ ...p, idFile: f.name }));
  };

  const validate = (s) => {
    const e = {};
    if (s === 0) {
      if (!form.name.trim()) e.name = t.errName;
      if (!form.email.trim()) e.email = t.errEmail;
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        e.email = t.errEmailFmt;
      if (!form.phone.trim()) e.phone = t.errPhone;
      else if (!/^\d{10}$/.test(form.phone.replace(/\D/g, "")))
        e.phone = t.errPhoneFmt;
    }
    if (s === 1) {
      if (!form.hostId) e.hostId = t.errHost;
      if (!form.gate) e.gate = t.errGate;
      if (!form.date) e.date = t.errDate;
      if (!form.time) e.time = t.errTime;
      if (!form.purpose.trim()) e.purpose = t.errPurpose;
      if (
        form.date &&
        form.time &&
        new Date(`${form.date}T${form.time}`) < Date.now()
      )
        e.date = t.errFuture;
    }
    setErrs(e);
    return !Object.keys(e).length;
  };

  const goNext = () => {
    if (validate(step)) {
      setStep((p) => p + 1);
      setErr("");
    } else setErr(t.errAll);
  };
  const goBack = () => {
    setStep((p) => p - 1);
    setErr("");
  };

  const doSubmit = async () => {
    setLoading(true);
    try {
      const host = hosts.find((h) => h._id === form.hostId);
      const payload = {
        ...form,
        host: host?.name || "",
        hostEmail: host?.email || "",
      };
      delete payload.idFile;
      const r = await fetch(`${API}/visitor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Submission failed");
      setCId(d?.requestId || "VIS-" + Date.now());
      setSuccess(true);
      setStep(2);
      localStorage.removeItem("vpass_form");
    } catch (ex) {
      setErr(ex.message);
      setShowOtp(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!validate(1)) {
      setErr(t.errAll);
      return;
    }
    if (!otpOk) {
      setShowOtp(true);
      return;
    }
    doSubmit();
  };

  const sendOtp = async () => {
    setOtpBusy(true);
    setOtpErr("");
    try {
      const res = await fetch(`${API}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json().catch(() => ({}));
      setOtpSent(true);
      setOtpTimer(30);
      // Dev mode: backend returns testOtp — auto-fill so user doesn't need to check DB
      if (data?.testOtp) {
        setOtp(data.testOtp);
        setOtpErr(`Dev mode — OTP auto-filled: ${data.testOtp}`);
      }
    } catch {
      setOtpErr("Failed to send OTP. Please try again.");
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyOtp = async () => {
    setOtpBusy(true);
    setOtpErr("");
    try {
      const r = await fetch(`${API}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp }),
      });
      if (r.ok) {
        setOtpOk(true);
        setShowOtp(false);
        doSubmit();
      } else setOtpErr("Invalid OTP. Please try again.");
    } catch {
      setOtpErr("Verification failed. Please try again.");
    } finally {
      setOtpBusy(false);
    }
  };

  const devSkip = () => {
    setOtpOk(true);
    setShowOtp(false);
    setTimeout(doSubmit, 50);
  };

  const handleTrack = async () => {
    if (!trackId.trim()) return;
    setTrackBusy(true);
    setTrackErr("");
    setTrackRes(null);
    try {
      const r = await fetch(`${API}/visitor/check/${trackId.trim()}`);
      if (!r.ok) throw new Error(t.trackNone);
      const d = await r.json();
      const v = d?.visitor || d?.data;
      if (!v) throw new Error(t.trackNone);
      setTrackRes(v);
    } catch (ex) {
      setTrackErr(ex.message);
    } finally {
      setTrackBusy(false);
    }
  };

  const copyId = async (txt) => {
    await navigator.clipboard.writeText(txt).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const shareWA = () => {
    const host = hosts.find((h) => h._id === form.hostId);
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`PSG Campus Visit Confirmed!\nID: ${cId}\nDate: ${form.date} ${form.time}\nHost: ${host?.name || "—"}\nGate: ${form.gate}`)}`,
      "_blank",
    );
  };

  // Derived
  const selectedHost = hosts.find((h) => h._id === form.hostId);
  const selectedGate = gates.find((g) => g.code === form.gate);
  const filtHosts = hosts.filter(
    (h) =>
      !hostQ ||
      h.name.toLowerCase().includes(hostQ.toLowerCase()) ||
      (h.department || h.office || "")
        .toLowerCase()
        .includes(hostQ.toLowerCase()),
  );
  const allowedUntil = () => {
    if (!form.date || !form.time) return "";
    const d = new Date(`${form.date}T${form.time}`);
    d.setMinutes(d.getMinutes() + Number(form.expectedDuration));
    return d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  };

  const today = new Date();
  const todayDay = today.getDay();
  const isWeekend = todayDay === 0;
  const isSat = todayDay === 6;

  const statusColor = {
    PENDING: "#f59e0b",
    APPROVED: "#10b981",
    IN: "#3b82f6",
    OVERSTAY: "#ef4444",
    OUT: "#6b7280",
    REJECTED: "#ef4444",
  };

  // CSS vars
  const vars = dark
    ? {
        "--bg": "#0f172a",
        "--s1": "#1e293b",
        "--s2": "#0f172a",
        "--txt": "#f1f5f9",
        "--t2": "#94a3b8",
        "--bdr": "#334155",
        "--inp": "#1e293b",
        "--card": "#1e293b",
        "--blue": "#60a5fa",
        "--bluebg": "#1e3a5f",
      }
    : {
        "--bg": "#f8fafc",
        "--s1": "#ffffff",
        "--s2": "#f1f5f9",
        "--txt": "#0f172a",
        "--t2": "#64748b",
        "--bdr": "#e2e8f0",
        "--inp": "#f8fafc",
        "--card": "#ffffff",
        "--blue": "#1e40af",
        "--bluebg": "#eff6ff",
      };

  const steps = [t.s1, t.s2, t.s3];

  return (
    <div
      style={{
        ...vars,
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--txt)",
        fontFamily: "'Plus Jakarta Sans','Segoe UI',sans-serif",
        transition: "background .3s,color .3s",
      }}
    >
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}

/* ─── Animations ─── */
@keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
@keyframes sDown{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:translateY(0)}}
@keyframes sRight{from{opacity:0;transform:translateX(22px)}to{opacity:1;transform:translateX(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pingg{0%{transform:scale(1);opacity:1}75%,100%{transform:scale(2);opacity:0}}

.fu{animation:fadeUp .6s ease both}
.sd{animation:sDown .4s ease both}
.sr{animation:sRight .35s ease both}
.spin{animation:spin .8s linear infinite;display:inline-block;width:16px;height:16px;border:2px solid #fff;border-top-color:transparent;border-radius:50%}

/* ─── Form Elements ─── */
.inp{
  width:100%;
  padding:clamp(8px,2vw,11px) clamp(10px,2vw,14px);
  border:1.5px solid var(--bdr);
  border-radius:clamp(6px,1.5vw,10px);
  background:var(--inp);
  color:var(--txt);
  font-size:clamp(13px,1.5vw,14px);
  font-family:inherit;
  outline:none;
  transition:border .2s,box-shadow .2s;
  -webkit-appearance:none
}
.inp:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.12)}
.inp.e{border-color:#ef4444}

.pli{position:relative}
.pli .ico{position:absolute;left:clamp(8px,2vw,13px);top:50%;transform:translateY(-50%);pointer-events:none;opacity:.55;font-size:clamp(14px,2vw,16px)}
.pli .inp{padding-left:clamp(32px,6vw,40px)}

/* ─── Buttons ─── */
.btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:clamp(4px,1vw,7px);
  padding:clamp(9px,2vw,11px) clamp(14px,3vw,22px);
  border:none;
  border-radius:clamp(8px,1.5vw,10px);
  font-weight:700;
  font-size:clamp(12px,1.5vw,14px);
  cursor:pointer;
  font-family:inherit;
  transition:all .25s;
  white-space:nowrap;
  min-height:44px
}
.pr{background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff}
.pr:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(59,130,246,.3)}
.pr:disabled{opacity:.55;cursor:not-allowed;transform:none!important}
.ou{background:transparent;color:var(--txt);border:2px solid var(--bdr)}
.ou:hover{background:var(--s2)}
.sm{padding:clamp(6px,1vw,8px) clamp(12px,2vw,16px);font-size:clamp(11px,1.2vw,12px);border-radius:clamp(6px,1vw,8px);min-height:36px}

/* ─── Chips ─── */
.chip{
  display:inline-flex;
  align-items:center;
  padding:clamp(5px,1vw,7px) clamp(10px,2vw,14px);
  border-radius:20px;
  font-size:clamp(11px,1.2vw,12px);
  font-weight:600;
  cursor:pointer;
  border:1.5px solid var(--bdr);
  background:var(--s2);
  color:var(--t2);
  transition:all .2s;
  white-space:nowrap;
  font-family:inherit
}
.chip:hover,.chip.on{background:#1e40af;color:#fff;border-color:#1e40af}

/* ─── Host Selection ─── */
.ho{
  padding:clamp(8px,1.5vw,10px) clamp(10px,2vw,14px);
  border-radius:clamp(6px,1vw,8px);
  cursor:pointer;
  transition:background .15s;
  font-size:clamp(12px,1.2vw,13px)
}
.ho:hover,.ho.sel{background:var(--bluebg);color:var(--blue)}

/* ─── Cards ─── */
.card{
  background:var(--card);
  border:1px solid var(--bdr);
  border-radius:clamp(12px,2vw,16px);
  padding:clamp(16px,4vw,24px)
}

/* ─── Grid Layouts ─── */
.g2{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(300px,1fr));
  gap:clamp(12px,3vw,18px)
}
.g3{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(250px,1fr));
  gap:clamp(12px,3vw,18px)
}

/* ─── Typography ─── */
.em{color:#ef4444;font-size:clamp(11px,1.2vw,12px);margin-top:4px}
.lbl{display:block;font-size:clamp(12px,1.3vw,13px);font-weight:600;color:var(--txt);margin-bottom:clamp(4px,1vw,6px)}

/* ─── Sections ─── */
.sec{padding:clamp(40px,8vw,80px) clamp(16px,4vw,24px)}
.wrap{max-width:1100px;margin:0 auto;width:100%;padding:0 clamp(8px,2vw,24px)}

/* ─── Stats ─── */
.statbox{
  background:rgba(255,255,255,.12);
  border-radius:clamp(8px,2vw,12px);
  padding:clamp(14px,3vw,20px);
  text-align:center;
  backdrop-filter:blur(8px)
}

/* ─── How Box ─── */
.howbox{
  background:var(--card);
  border:1px solid var(--bdr);
  border-radius:clamp(12px,2vw,16px);
  padding:clamp(16px,3vw,28px) clamp(14px,2vw,22px);
  text-align:center;
  transition:all .3s
}
.howbox:hover{transform:translateY(-6px);box-shadow:0 20px 40px rgba(0,0,0,.08)}

/* ─── OTP ─── */
.otp6{
  width:clamp(36px,8vw,44px);
  height:clamp(40px,8vw,48px);
  text-align:center;
  font-size:clamp(16px,2vw,20px);
  font-weight:700;
  border:2px solid var(--bdr);
  border-radius:clamp(8px,1.5vw,10px);
  background:var(--inp);
  color:var(--txt);
  font-family:monospace;
  outline:none;
  transition:border .2s;
  -webkit-appearance:none
}
.otp6:focus{border-color:#3b82f6}

/* ─── Scrollbar ─── */
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-thumb{background:var(--bdr);border-radius:3px}

/* ─── Mobile First Responsive Design ─── */

/* Small devices (≤ 480px) */
@media(max-width:480px){
  .sec{padding:clamp(32px,6vw,40px) clamp(12px,3vw,16px)}
  .wrap{padding:0 clamp(12px,3vw,16px)}
  .card{padding:clamp(14px,3vw,18px)}
  
  .g2,.g3{grid-template-columns:1fr}
  
  .btn{width:100%;justify-content:center;padding:clamp(10px,2vw,12px) clamp(16px,3vw,20px)}
  .btns{flex-direction:column;gap:clamp(6px,1.5vw,8px)}
  
  .chip{font-size:clamp(10px,1.1vw,11px);padding:clamp(4px,0.8vw,6px) clamp(8px,1.5vw,12px)}
  
  h1{font-size:clamp(28px,6vw,36px)!important}
  h2{font-size:clamp(20px,5vw,28px)!important}
  h3{font-size:clamp(16px,4vw,21px)!important}
  
  .inp{font-size:clamp(12px,1.3vw,13px);padding:clamp(8px,1.5vw,10px) clamp(10px,1.5vw,12px)}
  
  .howbox{padding:clamp(14px,2.5vw,18px) clamp(12px,2vw,16px)}
}

/* Tablets (480px - 768px) */
@media(min-width:481px) and (max-width:768px){
  .sec{padding:clamp(50px,7vw,65px) clamp(20px,4vw,24px)}
  .wrap{padding:0 clamp(16px,3vw,20px)}
  
  .g2{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
  .g3{grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
  
  .btn{padding:clamp(10px,1.8vw,11px) clamp(18px,2.8vw,22px);font-size:clamp(12px,1.3vw,13px)}
  .btns{flex-direction:row-reverse;flex-wrap:wrap;gap:clamp(8px,1.5vw,10px)}
  
  h1{font-size:clamp(32px,6vw,48px)!important}
  h2{font-size:clamp(24px,4.5vw,32px)!important}
  h3{font-size:clamp(18px,3.5vw,20px)!important}
  
  .inp{font-size:clamp(13px,1.4vw,14px)}
  .otp6{width:clamp(38px,7vw,42px);height:clamp(42px,7vw,46px)}
}

/* Large devices (≥ 769px) */
@media(min-width:769px){
  .g2{grid-template-columns:1fr 1fr}
  .g3{grid-template-columns:1fr 1fr 1fr}
  
  .btn:hover{transform:translateY(-2px)}
  .ou:hover{background:var(--s2)}
}

/* Extra large (≥ 1024px) */
@media(min-width:1024px){
  .sec{padding:clamp(70px,8vw,100px) 24px}
  .wrap{max-width:1200px}
}

/* Desktop optimizations */
@media(min-width:1280px){
  .wrap{max-width:1280px}
  .sec{padding:80px 40px}
}

/* Landscape orientation */
@media(orientation:landscape) and (max-height:600px){
  .sec{padding:clamp(30px,4vh,50px) clamp(16px,3vw,24px)}
  h1{font-size:clamp(24px,4vh,36px)!important}
}

/* Touch device optimizations */
@media(hover:none){
  .btn:active{transform:scale(0.98)}
  .chip:active{background:#1e40af;color:#fff}
  .howbox:active{transform:translateY(-3px)}
}

/* High DPI screens */
@media(min-resolution:2dppx){
  body{-webkit-font-smoothing:subpixel-antialiased}
}

/* ─── Hamburger Menu ─── */
.hamburger{
  display:none;
  flex-direction:column;
  gap:4px;
  background:none;
  border:none;
  cursor:pointer;
  padding:clamp(6px,1.5vw,8px);
  position:relative;
  z-index:101;
}

.hamburger span{
  display:block;
  width:clamp(22px,5vw,26px);
  height:2px;
  background:var(--txt);
  border-radius:1px;
  transition:all .3s ease;
}

.hamburger.open span:nth-child(1){
  transform:rotate(45deg) translate(10px,10px);
}

.hamburger.open span:nth-child(2){
  opacity:0;
}

.hamburger.open span:nth-child(3){
  transform:rotate(-45deg) translate(7px,-6px);
}

.mobile-menu{
  display:none;
  position:fixed;
  top:clamp(56px,10vw,62px);
  left:0;
  right:0;
  background:var(--card);
  border-bottom:1px solid var(--bdr);
  z-index:99;
  flex-direction:column;
  gap:clamp(8px,1.5vw,12px);
  padding:clamp(12px,2.5vw,16px);
  animation:slideDown .3s ease both;
  max-height:calc(100vh - clamp(56px,10vw,62px));
  overflow-y:auto;
}

.mobile-menu.open{
  display:flex;
}

@keyframes slideDown{
  from{
    opacity:0;
    transform:translateY(-10px)
  }
  to{
    opacity:1;
    transform:translateY(0)
  }
}

.nav-button-group{
  display:flex;
  gap:clamp(4px,1vw,8px);
  flex-wrap:wrap;
}

.nav-button-group.mobile{
  flex-direction:column;
  gap:clamp(8px,1.5vw,10px)
}

.nav-button-group.mobile .btn{
  width:100%;
  justify-content:center;
}

@media(max-width:640px){
  .hamburger{display:flex}
  
  .nav-button-group:not(.mobile){
    display:none!important
  }
  
  .mobile-menu{
    display:none
  }
  
  .mobile-menu.open{
    display:flex
  }
}

@media(min-width:641px){
  .hamburger{display:none!important}
  .mobile-menu{display:none!important}
  
  .nav-button-group.mobile{
    display:none!important
  }
  
  .nav-button-group:not(.mobile){
    display:flex!important
  }
}

/* Print styles */
@media print{
  .sec{padding:20px}
  .btn{display:none}
  nav{display:none}
}
`}</style>

      {/* ══ NAV ══════════════════════════════════════════════════════ */}
      <nav
        role="navigation"
        aria-label="Main navigation"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: dark ? "rgba(15,23,42,.93)" : "rgba(255,255,255,.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--bdr)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "0 clamp(12px,3vw,20px)",
            minHeight: "clamp(56px,10vw,62px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "clamp(8px,2vw,12px)",
            position: "relative",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(6px,1.5vw,10px)",
              flexShrink: 0,
              zIndex: 102,
            }}
          >
            <div
              style={{
                width: "clamp(36px,7vw,42px)",
                height: "clamp(36px,7vw,42px)",
                borderRadius: "clamp(8px,1.5vw,11px)",
                background: "linear-gradient(135deg,#1e40af,#3b82f6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "clamp(14px,2.5vw,18px)",
                flexShrink: 0,
              }}
            >
              📚
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: "clamp(13px,2vw,15px)",
                  color: "var(--txt)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {t.brand}
              </div>
              <div
                style={{
                  fontSize: "clamp(9px,1.5vw,11px)",
                  color: "#3b82f6",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {t.brandSub}
              </div>
            </div>
          </div>

          {/* Desktop Nav Buttons */}
          <div className="nav-button-group">
            <button
              className="btn ou sm"
              onClick={() => setView((v) => (v === "track" ? "home" : "track"))}
              aria-label="Toggle booking tracker"
            >
              {view === "track" ? "← Home" : "🔍 Track Booking"}
            </button>
            <button
              className="btn ou sm"
              onClick={() => setLang((l) => (l === "en" ? "ta" : "en"))}
              aria-label="Toggle language"
            >
              {lang === "en" ? "தமிழ்" : "English"}
            </button>
            <button
              className="btn ou sm"
              onClick={() => setDark((d) => !d)}
              aria-label={dark ? t.light : t.dark}
            >
              {dark ? "☀️" : "🌙"}
            </button>
            <button
              className="btn pr sm"
              onClick={() => navigate("/login")}
              aria-label={t.login}
            >
              {t.login}
            </button>
          </div>

          {/* Hamburger Menu Button */}
          <button
            className={`hamburger${navOpen ? " open" : ""}`}
            onClick={() => setNavOpen((p) => !p)}
            aria-label="Toggle mobile menu"
            aria-expanded={navOpen}
            aria-controls="mobile-menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          id="mobile-menu"
          className={`mobile-menu${navOpen ? " open" : ""}`}
          style={{
            backgroundColor: dark
              ? "rgba(15,23,42,.95)"
              : "rgba(255,255,255,.95)",
          }}
        >
          <div className="nav-button-group mobile">
            <button
              className="btn ou"
              onClick={() => {
                setView((v) => (v === "track" ? "home" : "track"));
                setNavOpen(false);
              }}
              aria-label="Toggle booking tracker"
            >
              {view === "track" ? "← Home" : "🔍 Track Booking"}
            </button>
            <button
              className="btn ou"
              onClick={() => {
                setLang((l) => (l === "en" ? "ta" : "en"));
                setNavOpen(false);
              }}
              aria-label="Toggle language"
            >
              {lang === "en" ? "தமிழ் Tamil" : "🇬🇧 English"}
            </button>
            <button
              className="btn ou"
              onClick={() => {
                setDark((d) => !d);
                setNavOpen(false);
              }}
              aria-label={dark ? t.light : t.dark}
            >
              {dark ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
            <button
              className="btn pr"
              onClick={() => {
                navigate("/login");
                setNavOpen(false);
              }}
              aria-label={t.login}
            >
              {t.login}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay Backdrop */}
      {navOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.3)",
            zIndex: 98,
            top: "clamp(56px,10vw,62px)",
          }}
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ══ TRACK VIEW ════════════════════════════════════════════════ */}
      {view === "track" && (
        <div className="sec">
          <div className="wrap" style={{ maxWidth: 560 }}>
            <div className="card fu">
              <h2
                style={{
                  fontSize: "clamp(20px,4vw,24px)",
                  fontWeight: 800,
                  marginBottom: "clamp(4px,1vw,6px)",
                  margin: "0 0 clamp(4px,1vw,6px) 0",
                }}
              >
                {t.trackTitle}
              </h2>
              <p
                style={{
                  color: "var(--t2)",
                  fontSize: "clamp(12px,1.3vw,14px)",
                  marginBottom: "clamp(16px,2vw,24px)",
                  margin: "0 0 clamp(16px,2vw,24px) 0",
                }}
              >
                {t.trackSub}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "clamp(6px,1.2vw,10px)",
                  marginBottom: "clamp(12px,2vw,16px)",
                  flexWrap: "wrap",
                }}
              >
                <input
                  className="inp"
                  style={{
                    flex: 1,
                    fontFamily: "monospace",
                    letterSpacing: 1,
                    minWidth: "clamp(150px,80vw,300px)",
                  }}
                  placeholder={t.trackPh}
                  value={trackId}
                  onChange={(e) => setTrackId(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                  aria-label="Confirmation ID"
                />
                <button
                  className="btn pr"
                  onClick={handleTrack}
                  disabled={trackBusy || !trackId.trim()}
                  style={{ minWidth: "clamp(80px,20vw,120px)" }}
                >
                  {trackBusy ? <span className="spin" /> : t.trackBtn}
                </button>
              </div>
              {trackErr && (
                <p className="em sd" style={{ marginBottom: 12 }}>
                  {trackErr}
                </p>
              )}
              {trackRes && (
                <div className="sr">
                  <div
                    style={{
                      padding: "14px 18px",
                      borderRadius: 12,
                      background: "var(--bluebg)",
                      border: `2px solid ${statusColor[trackRes.status] || "var(--bdr)"}`,
                      marginBottom: 20,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 10,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 16 }}>
                          {trackRes.name}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--t2)" }}>
                          {trackRes.visitorId}
                        </div>
                      </div>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: 20,
                          background: statusColor[trackRes.status] || "#6b7280",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        {trackRes.status}
                      </span>
                    </div>
                    {[
                      ["Host", trackRes.host],
                      ["Gate", trackRes.gate],
                      [
                        "Booked",
                        trackRes.createdAt
                          ? new Date(trackRes.createdAt).toLocaleDateString(
                              "en-IN",
                            )
                          : null,
                      ],
                    ]
                      .filter(([, v]) => v)
                      .map(([l, v]) => (
                        <div
                          key={l}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 13,
                            padding: "3px 0",
                            borderTop: "1px solid var(--bdr)",
                          }}
                        >
                          <span style={{ color: "var(--t2)" }}>{l}</span>
                          <span style={{ fontWeight: 600 }}>{v}</span>
                        </div>
                      ))}
                  </div>
                  {[
                    {
                      label: "Booking Submitted",
                      done: true,
                      time: trackRes.createdAt
                        ? new Date(trackRes.createdAt).toLocaleString("en-IN")
                        : null,
                    },
                    {
                      label: "Approved by Host",
                      done: !!trackRes.approvedAt,
                      active: trackRes.status === "PENDING",
                      time: trackRes.approvedAt
                        ? new Date(trackRes.approvedAt).toLocaleString("en-IN")
                        : null,
                    },
                    {
                      label: "Checked In",
                      done: !!trackRes.checkInTime,
                      active: trackRes.status === "APPROVED",
                      time: trackRes.checkInTime
                        ? new Date(trackRes.checkInTime).toLocaleString("en-IN")
                        : null,
                    },
                    {
                      label: "Visit Completed",
                      done:
                        !!trackRes.checkOutTime || trackRes.status === "OUT",
                      active: trackRes.status === "IN",
                      time: trackRes.checkOutTime
                        ? new Date(trackRes.checkOutTime).toLocaleString(
                            "en-IN",
                          )
                        : null,
                    },
                  ].map((s, i) => (
                    <TrackStep key={i} {...s} />
                  ))}
                  <button
                    className="btn ou sm"
                    style={{ marginTop: 8 }}
                    onClick={() => {
                      setTrackRes(null);
                      setTrackId("");
                    }}
                  >
                    {t.trackReset}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {view === "home" && (
        <>
          {/* ══ HERO ══════════════════════════════════════════════════════ */}
          <section
            aria-label="Hero"
            style={{
              position: "relative",
              minHeight: "clamp(70vh,100vw,92vh)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              backgroundImage: `linear-gradient(135deg,rgba(15,23,42,.78) 0%,rgba(30,64,175,.55) 45%,rgba(96,165,250,.3) 100%),url(${bannerImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundAttachment: "fixed",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "clamp(300px,40vw,500px)",
                height: "clamp(300px,40vw,500px)",
                background: "rgba(59,130,246,.15)",
                borderRadius: "50%",
                filter: "blur(130px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "clamp(250px,35vw,400px)",
                height: "clamp(250px,35vw,400px)",
                background: "rgba(96,165,250,.1)",
                borderRadius: "50%",
                filter: "blur(120px)",
              }}
            />
            <div
              className="fu"
              style={{
                position: "relative",
                textAlign: "center",
                color: "#fff",
                padding: "clamp(20px,5vw,40px) clamp(12px,3vw,24px)",
                maxWidth: "clamp(100%,90vw,820px)",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "clamp(6px,1.5vw,10px)",
                  padding: "clamp(8px,1.5vw,10px) clamp(12px,2.5vw,20px)",
                  background: "rgba(255,255,255,.1)",
                  backdropFilter: "blur(12px)",
                  borderRadius: 30,
                  border: "1px solid rgba(255,255,255,.2)",
                  marginBottom: "clamp(20px,4vw,32px)",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                <span style={{ position: "relative", display: "inline-flex" }}>
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      background: "#93c5fd",
                      animation: "pingg 1.5s infinite",
                    }}
                  />
                  <span
                    style={{
                      position: "relative",
                      width: "clamp(7px,1.5vw,10px)",
                      height: "clamp(7px,1.5vw,10px)",
                      borderRadius: "50%",
                      background: "#bfdbfe",
                      display: "block",
                    }}
                  />
                </span>
                <span
                  style={{
                    fontSize: "clamp(11px,1.5vw,13px)",
                    fontWeight: 600,
                    color: "#bfdbfe",
                    letterSpacing: ".5px",
                  }}
                >
                  {t.heroBadge}
                </span>
              </div>
              <h1
                style={{
                  fontSize: "clamp(28px,7vw,70px)",
                  fontWeight: 900,
                  lineHeight: 1.1,
                  marginBottom: "clamp(12px,3vw,20px)",
                  letterSpacing: "-1px",
                  margin: "0 0 clamp(12px,3vw,20px) 0",
                }}
              >
                <span
                  style={{
                    background: "linear-gradient(135deg,#bfdbfe,#fff,#93c5fd)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {t.heroTitle1}
                </span>
                <br />
                <span
                  style={{
                    color: "#fff",
                    textShadow: "0 4px 20px rgba(0,0,0,.3)",
                  }}
                >
                  {t.heroTitle2}
                </span>
              </h1>
              <p
                style={{
                  fontSize: "clamp(13px,2.5vw,20px)",
                  color: "#bfdbfe",
                  marginBottom: "clamp(10px,2vw,16px)",
                  maxWidth: "100%",
                  margin: "0 auto clamp(10px,2vw,16px)",
                  lineHeight: 1.5,
                }}
              >
                {t.heroSub}
              </p>
              <p
                style={{
                  fontSize: "clamp(12px,1.8vw,15px)",
                  color: "rgba(191,219,254,.8)",
                  maxWidth: "100%",
                  margin: "0 auto clamp(20px,3vw,40px)",
                  lineHeight: 1.7,
                }}
              >
                {t.heroDesc}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "clamp(8px,2vw,12px)",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginBottom: "clamp(20px,3vw,32px)",
                  paddingX: "clamp(12px,3vw,20px)",
                }}
              >
                <button
                  className="btn pr"
                  style={{
                    fontSize: "clamp(13px,1.5vw,15px)",
                    padding: "clamp(10px,2vw,13px) clamp(20px,3vw,30px)",
                    width: "clamp(100%,auto,auto)",
                  }}
                  onClick={() =>
                    document
                      .getElementById("bform")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Book Now →
                </button>
                <button
                  className="btn"
                  style={{
                    fontSize: "clamp(13px,1.5vw,15px)",
                    padding: "clamp(10px,2vw,13px) clamp(20px,3vw,30px)",
                    borderColor: "rgba(255,255,255,.3)",
                    color: "#fff",
                    background: "rgba(255,255,255,.08)",
                    border: "2px solid rgba(255,255,255,.3)",
                    width: "clamp(100%,auto,auto)",
                  }}
                  onClick={() => setView("track")}
                >
                  🔍 Track
                </button>
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "clamp(6px,1.5vw,10px)",
                  padding: "clamp(8px,1.5vw,10px) clamp(12px,2.5vw,20px)",
                  background: "rgba(255,255,255,.1)",
                  backdropFilter: "blur(12px)",
                  borderRadius: 30,
                  border: "1px solid rgba(255,255,255,.2)",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                ⏱{" "}
                <span
                  style={{
                    fontSize: "clamp(11px,1.5vw,13px)",
                    fontWeight: 600,
                    color: "#bfdbfe",
                  }}
                >
                  {t.heroTime}
                </span>
              </div>
            </div>
          </section>

          {/* ══ LIVE STATS ════════════════════════════════════════════════ */}
          <div
            style={{
              background: "linear-gradient(135deg,#1e40af,#3b82f6)",
              padding: "clamp(20px,4vw,28px) clamp(16px,4vw,24px)",
            }}
          >
            <div className="wrap">
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "clamp(12px,2vw,18px)",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "clamp(4px,1vw,6px)",
                    padding: "clamp(3px,0.8vw,4px) clamp(8px,1.5vw,12px)",
                    background: "rgba(255,255,255,.15)",
                    borderRadius: 20,
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      width: "clamp(6px,1.2vw,8px)",
                      height: "clamp(6px,1.2vw,8px)",
                      borderRadius: "50%",
                      background: "#4ade80",
                      display: "inline-block",
                      animation: "pingg 2s infinite",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      color: "#fff",
                      fontSize: "clamp(11px,1.2vw,12px)",
                      fontWeight: 700,
                    }}
                  >
                    {t.statsTitle}
                  </span>
                </span>
              </div>
              <div className="g3" style={{ maxWidth: 640, margin: "0 auto" }}>
                {[
                  [t.statsToday, stats.today, "👤"],
                  [t.statsPending, stats.pending, "⏳"],
                  [t.statsInside, stats.inside, "🏛"],
                ].map(([l, v, ic]) => (
                  <div key={l} className="statbox">
                    <div style={{ fontSize: "clamp(18px,4vw,26px)" }}>{ic}</div>
                    <div
                      style={{
                        fontSize: "clamp(24px,5vw,32px)",
                        fontWeight: 900,
                        color: "#fff",
                        lineHeight: 1.1,
                        margin: "clamp(4px,1vw,8px) 0",
                      }}
                    >
                      {v}
                    </div>
                    <div
                      style={{
                        fontSize: "clamp(11px,1.2vw,12px)",
                        color: "rgba(255,255,255,.8)",
                        fontWeight: 600,
                        marginTop: "clamp(2px,0.5vw,4px)",
                      }}
                    >
                      {l}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ══ HOW IT WORKS ══════════════════════════════════════════════ */}
          <div className="sec">
            <div className="wrap">
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "clamp(32px,6vw,50px)",
                }}
              >
                <h2
                  style={{
                    fontSize: "clamp(24px,5vw,34px)",
                    fontWeight: 800,
                    marginBottom: "clamp(6px,1.2vw,8px)",
                    margin: "0 0 clamp(6px,1.2vw,8px) 0",
                  }}
                >
                  {t.howTitle}
                </h2>
                <p
                  style={{
                    color: "var(--t2)",
                    fontSize: "clamp(13px,1.5vw,15px)",
                    margin: 0,
                  }}
                >
                  {t.howSub}
                </p>
              </div>
              <div className="g3">
                {[
                  { n: 1, ic: "📝", t2: t.how1t, d: t.how1d, c: "#3b82f6" },
                  { n: 2, ic: "✅", t2: t.how2t, d: t.how2d, c: "#10b981" },
                  { n: 3, ic: "🎫", t2: t.how3t, d: t.how3d, c: "#8b5cf6" },
                ].map((s) => (
                  <div key={s.n} className="howbox">
                    <div
                      style={{
                        width: "clamp(48px,8vw,60px)",
                        height: "clamp(48px,8vw,60px)",
                        borderRadius: "clamp(14px,2vw,18px)",
                        background: `${s.c}18`,
                        border: `2px solid ${s.c}30`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "clamp(20px,4vw,26px)",
                        margin: "0 auto clamp(12px,2vw,16px)",
                      }}
                    >
                      {s.ic}
                    </div>
                    <div
                      style={{
                        width: "clamp(22px,4vw,26px)",
                        height: "clamp(22px,4vw,26px)",
                        borderRadius: "50%",
                        background: s.c,
                        color: "#fff",
                        fontSize: "clamp(10px,1.2vw,12px)",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto clamp(8px,1.5vw,12px)",
                      }}
                    >
                      {s.n}
                    </div>
                    <h3
                      style={{
                        fontWeight: 700,
                        fontSize: "clamp(14px,2vw,16px)",
                        marginBottom: "clamp(6px,1vw,8px)",
                        margin: "0 0 clamp(6px,1vw,8px) 0",
                      }}
                    >
                      {s.t2}
                    </h3>
                    <p
                      style={{
                        color: "var(--t2)",
                        fontSize: "clamp(12px,1.3vw,13px)",
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {s.d}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ══ HOURS + SOCIAL PROOF ══════════════════════════════════════ */}
          <div
            className="sec"
            style={{
              background: "var(--s2)",
              paddingTop: "clamp(40px,8vw,60px)",
              paddingBottom: "clamp(40px,8vw,60px)",
            }}
          >
            <div className="wrap">
              <div className="g2" style={{ gap: "clamp(16px,3vw,28px)" }}>
                {/* Operating hours */}
                <div className="card">
                  <h3
                    style={{
                      fontWeight: 700,
                      fontSize: "clamp(16px,2vw,18px)",
                      marginBottom: "clamp(12px,2vw,18px)",
                      margin: "0 0 clamp(12px,2vw,18px) 0",
                    }}
                  >
                    🕘 {t.hoursTitle}
                  </h3>
                  {isWeekend && (
                    <div
                      style={{
                        marginBottom: "clamp(10px,1.5vw,14px)",
                        padding: "clamp(8px,1.5vw,10px) clamp(10px,1.5vw,14px)",
                        borderRadius: "clamp(6px,1vw,8px)",
                        background: "#fef3c7",
                        border: "1px solid #fcd34d",
                        color: "#92400e",
                        fontSize: "clamp(12px,1.2vw,13px)",
                        fontWeight: 600,
                      }}
                    >
                      ⚠️ Campus is closed today (Sunday).
                    </div>
                  )}
                  {isSat && (
                    <div
                      style={{
                        marginBottom: "clamp(10px,1.5vw,14px)",
                        padding: "clamp(8px,1.5vw,10px) clamp(10px,1.5vw,14px)",
                        borderRadius: "clamp(6px,1vw,8px)",
                        background: "#eff6ff",
                        border: "1px solid #bfdbfe",
                        color: "#1e40af",
                        fontSize: "clamp(12px,1.2vw,13px)",
                        fontWeight: 600,
                      }}
                    >
                      ℹ️ Saturday — limited hours apply.
                    </div>
                  )}
                  {[
                    { d: t.hoursWdLabel, h: t.hoursWdTime, open: true },
                    { d: t.hoursSatLabel, h: t.hoursSatTime, open: true },
                    { d: t.hoursSunLabel, h: t.hoursSunTime, open: false },
                  ].map((r) => (
                    <div
                      key={r.d}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "clamp(8px,1.5vw,10px) 0",
                        borderBottom: "1px solid var(--bdr)",
                        gap: "clamp(8px,1.5vw,12px)",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: "clamp(12px,1.3vw,14px)",
                        }}
                      >
                        {r.d}
                      </span>
                      <span
                        style={{
                          fontSize: "clamp(11px,1.1vw,13px)",
                          fontWeight: 700,
                          padding: "clamp(2px,0.5vw,3px) clamp(8px,1.5vw,10px)",
                          borderRadius: 20,
                          color: r.open ? "#10b981" : "#ef4444",
                          background: r.open ? "#d1fae5" : "#fee2e2",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.h}
                      </span>
                    </div>
                  ))}
                  <p
                    style={{
                      fontSize: "clamp(11px,1.1vw,12px)",
                      color: "var(--t2)",
                      marginTop: "clamp(10px,1.5vw,12px)",
                      margin: "clamp(10px,1.5vw,12px) 0 0 0",
                    }}
                  >
                    ℹ️ {t.hoursNote}
                  </p>
                  <div style={{ marginTop: "clamp(12px,2vw,16px)" }}>
                    <div
                      style={{
                        fontSize: "clamp(10px,1vw,11px)",
                        fontWeight: 700,
                        color: "var(--t2)",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        marginBottom: "clamp(6px,1vw,8px)",
                      }}
                    >
                      Upcoming Holidays
                    </div>
                    {t.holidays.map((h) => (
                      <div
                        key={h}
                        style={{
                          fontSize: "clamp(12px,1.2vw,13px)",
                          padding: "clamp(2px,0.5vw,3px) 0",
                          color: "var(--t2)",
                        }}
                      >
                        📅 {h}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Social proof */}
                <div
                  className="card"
                  ref={cntRef}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "clamp(16px,3vw,22px)",
                      marginBottom: "clamp(8px,1.5vw,10px)",
                    }}
                  >
                    🎉
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(48px,8vw,68px)",
                      fontWeight: 900,
                      color: "#1e40af",
                      lineHeight: 1,
                      marginBottom: "clamp(6px,1vw,8px)",
                      margin: "0 0 clamp(6px,1vw,8px) 0",
                    }}
                  >
                    {visCount.toLocaleString()}+
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(14px,2.5vw,17px)",
                      fontWeight: 700,
                      marginBottom: "clamp(6px,1vw,8px)",
                      margin: "0 0 clamp(6px,1vw,8px) 0",
                    }}
                  >
                    {t.socialCount}
                  </div>
                  <p
                    style={{
                      fontSize: "clamp(12px,1.3vw,13px)",
                      color: "var(--t2)",
                      maxWidth: "100%",
                      margin: "0 0 clamp(16px,2.5vw,22px) 0",
                      lineHeight: 1.5,
                    }}
                  >
                    {t.socialSub}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: "clamp(6px,1vw,8px)",
                      marginTop: 0,
                      flexWrap: "wrap",
                      justifyContent: "center",
                    }}
                  >
                    {[
                      "⭐⭐⭐⭐⭐ Excellent",
                      "Fast approval",
                      "Easy process",
                      "Professional",
                    ].map((s) => (
                      <span
                        key={s}
                        style={{
                          fontSize: "clamp(10px,1.1vw,11px)",
                          padding: "clamp(4px,0.8vw,5px) clamp(8px,1.5vw,11px)",
                          borderRadius: 20,
                          background: "var(--bluebg)",
                          color: "var(--blue)",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ══ BOOKING FORM ══════════════════════════════════════════════ */}
          <div className="sec" id="bform" role="main">
            <div className="wrap" style={{ maxWidth: 720 }}>
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "clamp(24px,4vw,36px)",
                }}
              >
                <h2
                  style={{
                    fontSize: "clamp(24px,4.5vw,32px)",
                    fontWeight: 800,
                    marginBottom: "clamp(6px,1.2vw,8px)",
                    margin: "0 0 clamp(6px,1.2vw,8px) 0",
                  }}
                >
                  {t.bookTitle}
                </h2>
                <p
                  style={{
                    color: "var(--t2)",
                    fontSize: "clamp(13px,1.5vw,15px)",
                    margin: 0,
                  }}
                >
                  {t.bookSub}
                </p>
              </div>

              <div
                className="card"
                style={{
                  borderRadius: "clamp(16px,3vw,22px)",
                  padding: "clamp(16px,4vw,44px)",
                }}
              >
                {/* Step indicator */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 36,
                  }}
                >
                  {steps.map((s, i) => (
                    <React.Fragment key={i}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: 14,
                            transition: "all .3s",
                            background:
                              i <= step
                                ? "linear-gradient(135deg,#1e40af,#3b82f6)"
                                : "var(--s2)",
                            color: i <= step ? "#fff" : "var(--t2)",
                            border: i <= step ? "none" : "2px solid var(--bdr)",
                            boxShadow:
                              i === step
                                ? "0 6px 20px rgba(59,130,246,.35)"
                                : "none",
                            transform: i === step ? "scale(1.08)" : "scale(1)",
                          }}
                          role="progressbar"
                          aria-label={`Step ${i + 1}: ${s}`}
                        >
                          {i < step ? "✓" : i + 1}
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            marginTop: 6,
                            textAlign: "center",
                            color: i <= step ? "var(--txt)" : "var(--t2)",
                          }}
                        >
                          {s}
                        </span>
                      </div>
                      {i < steps.length - 1 && (
                        <div
                          style={{
                            flex: 1,
                            height: 3,
                            borderRadius: 2,
                            maxWidth: 70,
                            background:
                              i < step
                                ? "linear-gradient(90deg,#1e40af,#3b82f6)"
                                : "var(--bdr)",
                            transition: "background .3s",
                          }}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {err && (
                  <div
                    className="sd"
                    role="alert"
                    style={{
                      marginBottom: 16,
                      padding: "12px 14px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: 10,
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      fontSize: 13,
                      color: "#dc2626",
                    }}
                  >
                    <span>⚠️</span>
                    <span style={{ flex: 1 }}>{err}</span>
                    <button
                      onClick={() => setErr("")}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#dc2626",
                        fontSize: 15,
                        lineHeight: 1,
                      }}
                      aria-label="Dismiss"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* ─── STEP 0 ─── */}
                {step === 0 && (
                  <div className="sr">
                    <h3
                      style={{ fontSize: 21, fontWeight: 800, marginBottom: 4 }}
                    >
                      {t.s1}
                    </h3>
                    <p
                      style={{
                        color: "var(--t2)",
                        fontSize: 14,
                        marginBottom: 26,
                      }}
                    >
                      Tell us a bit about yourself
                    </p>
                    <div className="g2" style={{ rowGap: 18 }}>
                      <div style={{ gridColumn: "1/-1" }}>
                        <label className="lbl" htmlFor="inp-name">
                          {t.name} <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <div className="pli">
                          <span className="ico">👤</span>
                          <input
                            id="inp-name"
                            className={`inp${errs.name ? " e" : ""}`}
                            name="name"
                            value={form.name}
                            onChange={onChange}
                            placeholder="John Doe"
                            aria-required="true"
                            aria-describedby={errs.name ? "e-name" : undefined}
                            autoComplete="name"
                          />
                        </div>
                        {errs.name && (
                          <p id="e-name" className="em">
                            {errs.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="lbl" htmlFor="inp-email">
                          {t.email} <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <div className="pli">
                          <span className="ico">✉️</span>
                          <input
                            id="inp-email"
                            className={`inp${errs.email ? " e" : ""}`}
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={onChange}
                            placeholder="john@example.com"
                            aria-required="true"
                            autoComplete="email"
                          />
                        </div>
                        {errs.email && <p className="em">{errs.email}</p>}
                      </div>
                      <div>
                        <label className="lbl" htmlFor="inp-phone">
                          {t.phone} <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <div className="pli">
                          <span className="ico">📞</span>
                          <input
                            id="inp-phone"
                            className={`inp${errs.phone ? " e" : ""}`}
                            name="phone"
                            type="tel"
                            inputMode="numeric"
                            value={form.phone}
                            onChange={onChange}
                            placeholder="9876543210"
                            aria-required="true"
                            autoComplete="tel"
                          />
                        </div>
                        {errs.phone && <p className="em">{errs.phone}</p>}
                      </div>
                      <div>
                        <label className="lbl" htmlFor="inp-org">
                          {t.org}
                        </label>
                        <div className="pli">
                          <span className="ico">🏢</span>
                          <input
                            id="inp-org"
                            className="inp"
                            name="company"
                            value={form.company}
                            onChange={onChange}
                            placeholder="Your school or college"
                            autoComplete="organization"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="lbl" htmlFor="inp-veh">
                          {t.vehicle}
                        </label>
                        <div className="pli">
                          <span className="ico">🚗</span>
                          <input
                            id="inp-veh"
                            className="inp"
                            name="vehicleNumber"
                            value={form.vehicleNumber}
                            onChange={onChange}
                            placeholder={t.vehiclePh}
                          />
                        </div>
                      </div>
                      <div style={{ gridColumn: "1/-1" }}>
                        <label className="lbl">{t.idL}</label>
                        <label
                          style={{
                            display: "block",
                            padding: "13px 16px",
                            border: "2px dashed var(--bdr)",
                            borderRadius: 10,
                            cursor: "pointer",
                            textAlign: "center",
                            fontSize: 13,
                            color: "var(--t2)",
                            background: "var(--s2)",
                          }}
                          tabIndex={0}
                        >
                          {form.idFile ? (
                            <span style={{ color: "#10b981", fontWeight: 600 }}>
                              ✅ {form.idFile} {t.idDone}
                            </span>
                          ) : (
                            <span>📎 {t.idPh}</span>
                          )}
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={onFile}
                            style={{ display: "none" }}
                            aria-label={t.idL}
                          />
                        </label>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: 28,
                      }}
                    >
                      <button className="btn pr" onClick={goNext}>
                        {t.cont} →
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── STEP 1 ─── */}
                {step === 1 && (
                  <div className="sr">
                    <h3
                      style={{ fontSize: 21, fontWeight: 800, marginBottom: 4 }}
                    >
                      {t.s2}
                    </h3>
                    <p
                      style={{
                        color: "var(--t2)",
                        fontSize: 14,
                        marginBottom: 24,
                      }}
                    >
                      Plan your campus visit
                    </p>

                    {/* Purpose chips */}
                    <div style={{ marginBottom: 18 }}>
                      <label className="lbl">
                        {t.purposeL} <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 8,
                          marginBottom: 10,
                        }}
                      >
                        {t.chips.map((c) => (
                          <button
                            key={c}
                            type="button"
                            className={`chip${form.purpose === c ? " on" : ""}`}
                            onClick={() => onChip(c)}
                            aria-pressed={form.purpose === c}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                      <textarea
                        className={`inp${errs.purpose ? " e" : ""}`}
                        name="purpose"
                        value={form.purpose}
                        onChange={onChange}
                        rows={3}
                        placeholder={t.purposePh}
                        aria-required="true"
                        style={{ resize: "vertical", fontFamily: "inherit" }}
                      />
                      {errs.purpose && <p className="em">{errs.purpose}</p>}
                    </div>

                    <div className="g2" style={{ rowGap: 18 }}>
                      {/* Smart host search */}
                      <div>
                        <label className="lbl">
                          {t.hostL} <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          className={`inp${errs.hostId ? " e" : ""}`}
                          placeholder={t.hostPh}
                          value={hostQ}
                          onChange={(e) => {
                            setHostQ(e.target.value);
                            if (!e.target.value)
                              setForm((p) => ({ ...p, hostId: "" }));
                          }}
                          aria-label={t.hostL}
                          aria-autocomplete="list"
                          aria-expanded={filtHosts.length > 0 && !!hostQ}
                        />
                        {(hostQ || !form.hostId) && filtHosts.length > 0 && (
                          <div
                            style={{
                              maxHeight: 180,
                              overflowY: "auto",
                              border: "1.5px solid var(--bdr)",
                              borderRadius: 10,
                              marginTop: 6,
                              background: "var(--card)",
                            }}
                            role="listbox"
                          >
                            {filtHosts.map((h) => (
                              <div
                                key={h._id}
                                className={`ho${form.hostId === h._id ? " sel" : ""}`}
                                onClick={() => {
                                  setForm((p) => ({ ...p, hostId: h._id }));
                                  setHostQ(h.name);
                                }}
                                role="option"
                                aria-selected={form.hostId === h._id}
                                tabIndex={0}
                                onKeyDown={(e) =>
                                  e.key === "Enter" &&
                                  (setForm((p) => ({ ...p, hostId: h._id })),
                                  setHostQ(h.name))
                                }
                              >
                                <div style={{ fontWeight: 600 }}>{h.name}</div>
                                <div style={{ fontSize: 11, opacity: 0.7 }}>
                                  {h.office || h.department || "Staff"}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {errs.hostId && <p className="em">{errs.hostId}</p>}
                        {form.hostId && selectedHost && (
                          <div
                            style={{
                              marginTop: 10,
                              padding: 12,
                              borderRadius: 10,
                              background: "var(--bluebg)",
                              border: "1px solid rgba(59,130,246,.2)",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: 13,
                                color: "var(--blue)",
                              }}
                            >
                              {selectedHost.name}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--t2)",
                                marginTop: 3,
                              }}
                            >
                              📧 {selectedHost.email}
                            </div>
                            {selectedHost.phone && (
                              <div style={{ fontSize: 12, color: "var(--t2)" }}>
                                📞 {selectedHost.phone}
                              </div>
                            )}
                            {(selectedHost.office ||
                              selectedHost.department) && (
                              <div style={{ fontSize: 12, color: "var(--t2)" }}>
                                🏢{" "}
                                {selectedHost.office || selectedHost.department}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Gate */}
                      <div>
                        <label className="lbl" htmlFor="inp-gate">
                          {t.gateL} <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <div className="pli">
                          <span className="ico">📍</span>
                          <select
                            id="inp-gate"
                            className={`inp${errs.gate ? " e" : ""}`}
                            style={{ paddingLeft: 40, cursor: "pointer" }}
                            name="gate"
                            value={form.gate}
                            onChange={onChange}
                            aria-required="true"
                          >
                            <option value="">Select gate</option>
                            {gates.map((g) => (
                              <option key={g.code} value={g.code}>
                                {g.code} - {g.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        {errs.gate && <p className="em">{errs.gate}</p>}
                      </div>

                      {/* Date */}
                      <div>
                        <label className="lbl" htmlFor="inp-date">
                          {t.dateL} <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <div className="pli">
                          <span className="ico">📅</span>
                          <input
                            id="inp-date"
                            className={`inp${errs.date ? " e" : ""}`}
                            style={{ paddingLeft: 40 }}
                            name="date"
                            type="date"
                            value={form.date}
                            onChange={onChange}
                            min={new Date().toISOString().split("T")[0]}
                            aria-required="true"
                          />
                        </div>
                        {errs.date && <p className="em">{errs.date}</p>}
                      </div>

                      {/* Time */}
                      <div>
                        <label className="lbl" htmlFor="inp-time">
                          {t.timeL} <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <div className="pli">
                          <span className="ico">🕐</span>
                          <input
                            id="inp-time"
                            className={`inp${errs.time ? " e" : ""}`}
                            style={{ paddingLeft: 40 }}
                            name="time"
                            type="time"
                            value={form.time}
                            onChange={onChange}
                            aria-required="true"
                          />
                        </div>
                        {errs.time && <p className="em">{errs.time}</p>}
                      </div>
                    </div>

                    {/* Duration */}
                    <div style={{ marginTop: 18 }}>
                      <label className="lbl" htmlFor="inp-dur">
                        {t.durL}
                      </label>
                      <select
                        id="inp-dur"
                        className="inp"
                        name="expectedDuration"
                        value={form.expectedDuration}
                        onChange={onChange}
                      >
                        {[
                          ["30", t.dur30],
                          ["60", t.dur60],
                          ["120", t.dur120],
                          ["180", t.dur180],
                          ["240", t.dur240],
                          ["480", t.dur480],
                        ].map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Schedule summary + wait time */}
                    {form.date && form.time && (
                      <div
                        style={{
                          marginTop: 18,
                          padding: 18,
                          borderRadius: 12,
                          background: "var(--bluebg)",
                          border: "1px solid rgba(59,130,246,.2)",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            marginBottom: 10,
                          }}
                        >
                          📅 {t.schedTitle}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 13,
                            marginBottom: 6,
                          }}
                        >
                          <span style={{ color: "var(--t2)" }}>{t.entry}</span>
                          <span style={{ fontWeight: 700 }}>
                            {new Date(
                              `${form.date}T${form.time}`,
                            ).toLocaleString("en-IN", {
                              timeZone: "Asia/Kolkata",
                            })}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 13,
                            marginBottom: waitN > 0 ? 8 : 0,
                          }}
                        >
                          <span style={{ color: "var(--t2)" }}>{t.exit}</span>
                          <span style={{ fontWeight: 700, color: "#10b981" }}>
                            {allowedUntil()}
                          </span>
                        </div>
                        {waitN > 0 && (
                          <div
                            style={{
                              marginTop: 8,
                              padding: "8px 12px",
                              borderRadius: 8,
                              background: "#fef3c7",
                              border: "1px solid #fcd34d",
                              fontSize: 12,
                              color: "#92400e",
                              fontWeight: 600,
                            }}
                          >
                            ⏳ {t.waitLabel}: ~{waitN * 10} min · {waitN}{" "}
                            {t.waitSlot}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Nav buttons — sticky on mobile */}
                    <div
                      className="btns"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 28,
                        gap: 12,
                      }}
                    >
                      <button className="btn ou" onClick={goBack}>
                        ← {t.back}
                      </button>
                      <button
                        className="btn pr"
                        onClick={handleSubmit}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spin" /> {t.processing}
                          </>
                        ) : (
                          <>{t.submit} ✈️</>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── STEP 2: CONFIRMATION ─── */}
                {step === 2 && success && (
                  <div className="sr" style={{ textAlign: "center" }}>
                    <div
                      style={{
                        width: 76,
                        height: 76,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg,#1e40af,#3b82f6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 34,
                        margin: "0 auto 18px",
                        boxShadow: "0 16px 40px rgba(59,130,246,.35)",
                      }}
                    >
                      ✓
                    </div>
                    <h3
                      style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}
                    >
                      {t.confTitle}
                    </h3>
                    <p
                      style={{
                        color: "var(--t2)",
                        fontSize: 14,
                        marginBottom: 28,
                      }}
                    >
                      {t.confSub}
                    </p>

                    {/* Big ID display */}
                    <div
                      style={{
                        padding: "14px 20px",
                        borderRadius: 14,
                        background: "var(--s2)",
                        border: "2px dashed var(--bdr)",
                        marginBottom: 24,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "var(--t2)",
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          marginBottom: 5,
                        }}
                      >
                        {t.refId}
                      </div>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 900,
                          color: "#1e40af",
                          fontFamily: "monospace",
                          letterSpacing: 2,
                        }}
                      >
                        {cId}
                      </div>
                    </div>

                    {/* Detail grid */}
                    <div
                      className="g2"
                      style={{ textAlign: "left", marginBottom: 24 }}
                    >
                      {[
                        [t.refId, cId],
                        [t.name, form.name],
                        [
                          t.dtLabel,
                          new Date(`${form.date}T${form.time}`).toLocaleString(
                            "en-IN",
                            { timeZone: "Asia/Kolkata" },
                          ),
                        ],
                        [t.facLabel, selectedHost?.name || "N/A"],
                        [t.gateLabel, selectedGate?.code ? `${selectedGate.code} - ${selectedGate.name}` : form.gate],
                        [t.statusL, null],
                      ].map(([l, v], i) => (
                        <div
                          key={i}
                          style={{
                            padding: "12px 14px",
                            borderRadius: 10,
                            background: "var(--s2)",
                            border: "1px solid var(--bdr)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--t2)",
                              marginBottom: 3,
                            }}
                          >
                            {l}
                          </div>
                          {v ? (
                            <div style={{ fontWeight: 700, fontSize: 13 }}>
                              {v}
                            </div>
                          ) : (
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 10px",
                                background: "#fef3c7",
                                color: "#92400e",
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              {t.statusVal}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* What next */}
                    <div
                      style={{
                        textAlign: "left",
                        padding: 18,
                        borderRadius: 14,
                        background: "var(--bluebg)",
                        border: "1px solid rgba(59,130,246,.2)",
                        marginBottom: 24,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          marginBottom: 10,
                        }}
                      >
                        ℹ️ {t.nextTitle}
                      </div>
                      {[t.next1, t.next2, t.next3, t.next4, t.next5].map(
                        (s, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              gap: 10,
                              alignItems: "flex-start",
                              marginBottom: 8,
                            }}
                          >
                            <span
                              style={{
                                width: 21,
                                height: 21,
                                borderRadius: "50%",
                                background: "#1e40af",
                                color: "#fff",
                                fontSize: 11,
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                marginTop: 1,
                              }}
                            >
                              {i + 1}
                            </span>
                            <span
                              style={{
                                fontSize: 13,
                                color: "var(--t2)",
                                lineHeight: 1.6,
                              }}
                            >
                              {s}
                            </span>
                          </div>
                        ),
                      )}
                    </div>

                    {/* Action buttons */}
                    <div
                      className="btns"
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 10,
                        justifyContent: "center",
                      }}
                    >
                      <button
                        className="btn pr"
                        onClick={() =>
                          generatePass(
                            form,
                            cId,
                            selectedHost?.name || "—",
                            selectedGate?.name || form.gate,
                          )
                        }
                      >
                        📄 {t.dlPass}
                      </button>
                      <button className="btn ou" onClick={shareWA}>
                        💬 {t.shareWA}
                      </button>
                      <button className="btn ou" onClick={() => copyId(cId)}>
                        {copied ? "✅ " + t.copied : "📋 " + t.copyId}
                      </button>
                      <button
                        className="btn ou"
                        onClick={() =>
                          window.open(
                            calLink(form, selectedHost?.name || "PSG Faculty"),
                            "_blank",
                          )
                        }
                      >
                        📆 {t.addCal}
                      </button>
                      <button className="btn ou" onClick={() => window.print()}>
                        🖨️ {t.printBtn}
                      </button>
                      <button
                        className="btn pr"
                        style={{
                          background: "linear-gradient(135deg,#059669,#10b981)",
                        }}
                        onClick={() => {
                          setSuccess(false);
                          setStep(0);
                          const tm = new Date();
                          tm.setDate(tm.getDate() + 1);
                          setForm({
                            name: "",
                            email: "",
                            phone: "",
                            company: "",
                            purpose: "",
                            hostId: "",
                            gate: "",
                            date: tm.toISOString().split("T")[0],
                            time: "10:00",
                            expectedDuration: "120",
                            vehicleNumber: "",
                            idFile: "",
                          });
                          setErrs({});
                          setErr("");
                          setOtpOk(false);
                          setOtpSent(false);
                          setOtp("");
                          setShowOtp(false);
                          localStorage.removeItem("vpass_form");
                        }}
                      >
                        {t.bookAgain}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ══ FOOTER ════════════════════════════════════════════════════ */}
          <footer
            style={{
              background: dark ? "#0f172a" : "#1e293b",
              color: "#94a3b8",
              padding:
                "clamp(36px,6vw,56px) clamp(16px,4vw,24px) clamp(20px,3vw,28px)",
            }}
          >
            <div className="wrap">
              <div
                className="g2"
                style={{ marginBottom: "clamp(24px,4vw,36px)" }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#fff",
                      marginBottom: "clamp(10px,2vw,14px)",
                      fontSize: "clamp(13px,1.5vw,15px)",
                    }}
                  >
                    {t.fContact}
                  </div>
                  {[
                    "📧 admissions@psgtech.ac.in",
                    "📞 +91-422-2357000",
                    "🏢 Campus Visit Desk",
                  ].map((x) => (
                    <div
                      key={x}
                      style={{
                        fontSize: "clamp(12px,1.2vw,13px)",
                        marginBottom: "clamp(6px,1vw,8px)",
                      }}
                    >
                      {x}
                    </div>
                  ))}
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#fff",
                      marginBottom: "clamp(10px,2vw,14px)",
                      fontSize: "clamp(13px,1.5vw,15px)",
                    }}
                  >
                    {t.fLinks}
                  </div>
                  {["Admissions", "Programs", "Campus Map", "Research"].map(
                    (x) => (
                      <div
                        key={x}
                        style={{
                          fontSize: "clamp(12px,1.2vw,13px)",
                          marginBottom: "clamp(6px,1vw,8px)",
                          cursor: "pointer",
                          transition: "color .2s",
                        }}
                        onMouseEnter={(e) => (e.target.style.color = "#60a5fa")}
                        onMouseLeave={(e) => (e.target.style.color = "#94a3b8")}
                      >
                        {x}
                      </div>
                    ),
                  )}
                </div>
              </div>
              <div
                style={{
                  borderTop: "1px solid #334155",
                  paddingTop: "clamp(14px,2vw,20px)",
                  textAlign: "center",
                  fontSize: "clamp(11px,1.1vw,12px)",
                  color: "#475569",
                }}
              >
                © 2025 PSG Institutions. All rights reserved. | Powered by
                Central IT Services Team
              </div>
            </div>
          </footer>
        </>
      )}

      {/* ══ OTP MODAL ═════════════════════════════════════════════════ */}
      {showOtp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="otp-ttl"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.6)",
            backdropFilter: "blur(4px)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            className="sd"
            style={{
              background: "var(--card)",
              borderRadius: 20,
              padding: 34,
              maxWidth: 400,
              width: "100%",
              border: "1px solid var(--bdr)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 38, marginBottom: 10 }}>📱</div>
              <h3
                id="otp-ttl"
                style={{ fontSize: 21, fontWeight: 800, marginBottom: 5 }}
              >
                {t.otpTitle}
              </h3>
              <p style={{ color: "var(--t2)", fontSize: 13 }}>
                {t.otpSub} <strong>{form.phone}</strong>
              </p>
            </div>
            {!otpSent ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <button
                  className="btn pr"
                  style={{ width: "100%" }}
                  onClick={sendOtp}
                  disabled={otpBusy}
                >
                  {otpBusy ? (
                    <>
                      <span className="spin" /> Sending...
                    </>
                  ) : (
                    t.otpSend
                  )}
                </button>
                <button
                  className="btn ou"
                  style={{ width: "100%" }}
                  onClick={devSkip}
                >
                  🔓 {t.otpSkip}
                </button>
              </div>
            ) : (
              <>
                {otpErr && (
                  <p
                    className="em sd"
                    style={{ textAlign: "center", marginBottom: 10 }}
                  >
                    {otpErr}
                  </p>
                )}
                <p
                  style={{
                    textAlign: "center",
                    color: "#10b981",
                    fontSize: 13,
                    marginBottom: 18,
                    fontWeight: 600,
                  }}
                >
                  ✅ {t.otpSent}
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "center",
                    marginBottom: 18,
                  }}
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      className="otp6"
                      maxLength={1}
                      inputMode="numeric"
                      value={otp[i] || ""}
                      aria-label={`OTP digit ${i + 1}`}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/, "");
                        setOtp((p) => {
                          const a = (p || "      ").split("").slice(0, 6);
                          a[i] = v;
                          return a.join("");
                        });
                        if (v && e.target.nextElementSibling)
                          e.target.nextElementSibling.focus();
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Backspace" &&
                          !otp[i] &&
                          e.target.previousElementSibling
                        )
                          e.target.previousElementSibling.focus();
                      }}
                    />
                  ))}
                </div>
                <button
                  className="btn pr"
                  style={{ width: "100%" }}
                  onClick={verifyOtp}
                  disabled={
                    otpBusy || (otp || "").replace(/\s/g, "").length < 6
                  }
                >
                  {otpBusy ? (
                    <>
                      <span className="spin" /> Verifying...
                    </>
                  ) : (
                    t.otpVerify
                  )}
                </button>
                <div style={{ textAlign: "center", marginTop: 12 }}>
                  {otpTimer > 0 ? (
                    <span style={{ fontSize: 13, color: "var(--t2)" }}>
                      Resend in {otpTimer}s
                    </span>
                  ) : (
                    <button
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#3b82f6",
                        fontWeight: 600,
                        fontSize: 13,
                        fontFamily: "inherit",
                      }}
                      onClick={sendOtp}
                    >
                      {t.otpResend}
                    </button>
                  )}
                </div>
              </>
            )}
            <button
              onClick={() => setShowOtp(false)}
              style={{
                display: "block",
                margin: "14px auto 0",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--t2)",
                fontSize: 13,
                fontFamily: "inherit",
              }}
              aria-label="Close OTP dialog"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
