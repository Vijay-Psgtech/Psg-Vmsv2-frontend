import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Building,
  Car,
  MapPin,
  CheckCircle,
  AlertCircle,
  Info,
  Shield,
  ArrowRight,
  ArrowLeft,
  X,
  Home,
  Sparkles,
  Zap,
  Lock,
  Bell,
  Users,
  MessageSquare,
} from "lucide-react";

export default function VisitorBookingWebsite() {
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    purpose: "",
    host: "",
    hostEmail: "",
    gate: "",
    date: "",
    time: "",
    expectedDuration: "120",
    vehicleNumber: "",
  });

  const [employees] = useState([
    { id: "1", name: "John Smith", email: "john@company.com", department: "Engineering" },
    { id: "2", name: "Sarah Johnson", email: "sarah@company.com", department: "HR" },
    { id: "3", name: "Michael Brown", email: "michael@company.com", department: "Sales" },
    { id: "4", name: "Emily Davis", email: "emily@company.com", department: "Marketing" },
  ]);

  const [gates] = useState([
    { id: "GATE-1", name: "Main Gate - Building A" },
    { id: "GATE-2", name: "East Gate - Building B" },
    { id: "GATE-3", name: "West Gate - Building C" },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [confirmationId, setConfirmationId] = useState("");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const steps = ["Personal Info", "Visit Details", "Confirmation"];

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setForm((prev) => ({
      ...prev,
      date: tomorrow.toISOString().split("T")[0],
      time: "09:00",
    }));

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      
      if (name === "host") {
        const selectedEmployee = employees.find((emp) => emp.name === value);
        if (selectedEmployee) {
          updated.hostEmail = selectedEmployee.email;
        }
      }
      
      return updated;
    });
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      if (!form.name.trim()) newErrors.name = "Name is required";
      if (!form.email.trim()) newErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        newErrors.email = "Invalid email format";
      if (!form.phone.trim()) newErrors.phone = "Phone is required";
      else if (!/^\d{10}$/.test(form.phone))
        newErrors.phone = "Phone must be 10 digits";
    }

    if (step === 1) {
      if (!form.host) newErrors.host = "Please select a host";
      if (!form.gate) newErrors.gate = "Please select a gate";
      if (!form.date) newErrors.date = "Date is required";
      if (!form.time) newErrors.time = "Time is required";
      if (!form.purpose.trim()) newErrors.purpose = "Purpose is required";

      const selectedDateTime = new Date(`${form.date}T${form.time}`);
      if (selectedDateTime.getTime() < Date.now()) {
        newErrors.date = "Cannot schedule for past date/time";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
      setError("");
    } else {
      setError("Please fill in all required fields correctly");
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError("");
  };

  const selectedHost = employees.find((e) => e.name === form.host);

  const handleSubmit = async () => {
    if (!validateStep(1)) {
      setError("Please fill in all required fields correctly");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const allowedUntilDate = new Date(`${form.date}T${form.time}`);
      
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        company: form.company || "",
        purpose: form.purpose,
        host: form.host,
        hostEmail: selectedHost?.email || form.hostEmail,
        gate: form.gate,
        allowedUntil: allowedUntilDate.toISOString(),
        expectedDuration: Number(form.expectedDuration),
        vehicleNumber: form.vehicleNumber || "",
      };

      const res = await fetch("http://localhost:5000/api/visitor/public-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Booking failed");
      }

      setConfirmationId(data.visitorId || `VIS-${Date.now()}`);
      setSuccess(true);
      setActiveStep(2);
    } catch (err) {
      setError(err.message || "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getAllowedUntil = () => {
    if (!form.date || !form.time) return "";
    const dt = new Date(`${form.date}T${form.time}`);
    dt.setMinutes(dt.getMinutes() + Number(form.expectedDuration));
    return dt.toLocaleString();
  };

  const resetForm = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setForm({
      name: "",
      email: "",
      phone: "",
      company: "",
      purpose: "",
      host: "",
      hostEmail: "",
      gate: "",
      date: tomorrow.toISOString().split("T")[0],
      time: "09:00",
      expectedDuration: "120",
      vehicleNumber: "",
    });
    setActiveStep(0);
    setSuccess(false);
    setError("");
    setErrors({});
  };

  const handleStaffLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950 via-slate-900 to-cyan-950"></div>
      
      {/* Animated Mesh Gradient */}
      <div 
        className="fixed inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.15) 0%, transparent 50%)`
        }}
      ></div>

      {/* Grid Pattern */}
      <div 
        className="fixed inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      ></div>

      {/* Floating Orbs */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-violet-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="relative z-10">
        {/* Glassmorphic Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-900/50 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  VPASS
                </h1>
                <p className="text-xs text-slate-400">Visitor Management</p>
              </div>
            </div>
            <button
              onClick={handleStaffLogin}
              className="group relative px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/20 rounded-full font-medium transition-all duration-300 flex items-center gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Home className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Staff Login</span>
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="pt-32 pb-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-sm">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-slate-300">Next-Generation Visitor Experience</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight">
                <span className="block bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent">
                  Book Your Visit
                </span>
                <span className="block text-slate-400 text-4xl md:text-5xl lg:text-6xl mt-4">
                  Seamlessly & Instantly
                </span>
              </h1>

              <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                Skip the queues, schedule ahead. Our AI-powered system ensures a frictionless entry experience.
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap justify-center gap-4 pt-6">
                {[
                  { icon: Zap, text: "Instant Approval" },
                  { icon: Lock, text: "Secure Access" },
                  { icon: Bell, text: "Real-time Alerts" },
                  { icon: Users, text: "Host Notification" },
                ].map((feature, idx) => (
                  <div
                    key={idx}
                    className="group relative px-6 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:border-violet-500/50 transition-all duration-300 cursor-default"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-cyan-600/20 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
                    <div className="relative flex items-center gap-2">
                      <feature.icon className="w-5 h-5 text-violet-400" />
                      <span className="font-medium">{feature.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 pb-20">
          {/* Info Cards - Only on Step 0 */}
          {activeStep === 0 && (
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                {
                  icon: MessageSquare,
                  title: "Simple Process",
                  desc: "3-step booking with real-time validation",
                  gradient: "from-violet-500 to-purple-500"
                },
                {
                  icon: Bell,
                  title: "Instant Notification",
                  desc: "Email & SMS alerts for you and your host",
                  gradient: "from-cyan-500 to-blue-500"
                },
                {
                  icon: Shield,
                  title: "Fast-Track Entry",
                  desc: "QR code access at your selected gate",
                  gradient: "from-pink-500 to-rose-500"
                },
              ].map((card, idx) => (
                <div
                  key={idx}
                  className="group relative p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl hover:border-white/20 transition-all duration-500 overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                  <div className="relative">
                    <div className={`inline-flex p-4 bg-gradient-to-br ${card.gradient} rounded-2xl mb-4`}>
                      <card.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{card.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Main Form Card */}
          <div className="relative p-1 rounded-3xl bg-gradient-to-br from-violet-500/20 via-transparent to-cyan-500/20">
            <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-8 md:p-12 border border-white/10">
              {/* Progress Steps */}
              <div className="flex justify-between mb-12">
                {steps.map((step, idx) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1 gap-3">
                      <div
                        className={`relative w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg transition-all duration-500 ${
                          idx <= activeStep
                            ? "bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/50"
                            : "bg-white/5 border border-white/10"
                        }`}
                      >
                        {idx < activeStep ? (
                          <CheckCircle className="w-7 h-7" />
                        ) : (
                          idx + 1
                        )}
                        {idx === activeStep && (
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 animate-pulse opacity-50"></div>
                        )}
                      </div>
                      <span className={`text-sm font-semibold transition-colors hidden sm:block ${
                        idx <= activeStep ? "text-white" : "text-slate-500"
                      }`}>
                        {step}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`h-1 flex-1 mx-4 rounded-full transition-all duration-500 ${
                        idx < activeStep 
                          ? "bg-gradient-to-r from-violet-500 to-cyan-500" 
                          : "bg-white/10"
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl backdrop-blur-sm flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1 text-red-200">{error}</div>
                  <button onClick={() => setError("")} className="text-red-400 hover:text-red-300">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Step 0: Personal Info */}
              {activeStep === 0 && (
                <div className="space-y-6">
                  <div className="mb-8">
                    <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                      Tell us about yourself
                    </h2>
                    <p className="text-slate-400">We need some basic information to get started</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold mb-3 text-slate-300">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          className={`w-full pl-12 pr-4 py-4 bg-white/5 border ${
                            errors.name ? "border-red-500/50" : "border-white/10"
                          } rounded-2xl focus:outline-none focus:border-violet-500 focus:bg-white/10 transition-all text-white placeholder-slate-500`}
                          placeholder="John Doe"
                        />
                      </div>
                      {errors.name && (
                        <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" /> {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-3 text-slate-300">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          className={`w-full pl-12 pr-4 py-4 bg-white/5 border ${
                            errors.email ? "border-red-500/50" : "border-white/10"
                          } rounded-2xl focus:outline-none focus:border-violet-500 focus:bg-white/10 transition-all text-white placeholder-slate-500`}
                          placeholder="john@example.com"
                        />
                      </div>
                      {errors.email ? (
                        <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" /> {errors.email}
                        </p>
                      ) : (
                        <p className="text-slate-500 text-sm mt-2">Confirmation will be sent here</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-3 text-slate-300">
                        Phone Number <span className="text-red-400">*</span>
                      </label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          maxLength={10}
                          className={`w-full pl-12 pr-4 py-4 bg-white/5 border ${
                            errors.phone ? "border-red-500/50" : "border-white/10"
                          } rounded-2xl focus:outline-none focus:border-violet-500 focus:bg-white/10 transition-all text-white placeholder-slate-500`}
                          placeholder="9876543210"
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" /> {errors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-3 text-slate-300">
                        Company/Organization
                      </label>
                      <div className="relative group">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                        <input
                          type="text"
                          name="company"
                          value={form.company}
                          onChange={handleChange}
                          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-violet-500 focus:bg-white/10 transition-all text-white placeholder-slate-500"
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-3 text-slate-300">
                        Vehicle Number
                      </label>
                      <div className="relative group">
                        <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                        <input
                          type="text"
                          name="vehicleNumber"
                          value={form.vehicleNumber}
                          onChange={handleChange}
                          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-violet-500 focus:bg-white/10 transition-all text-white placeholder-slate-500"
                          placeholder="TN01AB1234"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <button
                      onClick={handleNext}
                      className="group relative px-8 py-4 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-violet-500/50 transition-all duration-300 flex items-center gap-3 overflow-hidden"
                    >
                      <span className="relative z-10">Continue</span>
                      <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" />
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 1: Visit Details */}
              {activeStep === 1 && (
                <div className="space-y-6">
                  <div className="mb-8">
                    <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                      Visit Details
                    </h2>
                    <p className="text-slate-400">When and where are you planning to visit?</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-3 text-slate-300">
                      Purpose of Visit <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      name="purpose"
                      value={form.purpose}
                      onChange={handleChange}
                      rows={4}
                      className={`w-full px-4 py-4 bg-white/5 border ${
                        errors.purpose ? "border-red-500/50" : "border-white/10"
                      } rounded-2xl focus:outline-none focus:border-violet-500 focus:bg-white/10 transition-all text-white placeholder-slate-500 resize-none`}
                      placeholder="Brief description of your visit purpose..."
                    />
                    {errors.purpose && (
                      <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {errors.purpose}
                      </p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold mb-3 text-slate-300">
                        Person to Meet (Host) <span className="text-red-400">*</span>
                      </label>
                      <select
                        name="host"
                        value={form.host}
                        onChange={handleChange}
                        className={`w-full px-4 py-4 bg-white/5 border ${
                          errors.host ? "border-red-500/50" : "border-white/10"
                        } rounded-2xl focus:outline-none focus:border-violet-500 focus:bg-white/10 transition-all text-white`}
                      >
                        <option value="" className="bg-slate-800">Select Host</option>
                        {employees.map((e) => (
                          <option key={e.id} value={e.name} className="bg-slate-800">
                            {e.name} — {e.department}
                          </option>
                        ))}
                      </select>
                      {errors.host && (
                        <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" /> {errors.host}
                        </p>
                      )}
                      {form.host && selectedHost && (
                        <div className="mt-3 p-3 bg-violet-500/10 border border-violet-500/30 rounded-xl">
                          <p className="text-sm text-violet-300">
                            📧 Approval request → {selectedHost.email}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-3 text-slate-300">
                        Entry Gate <span className="text-red-400">*</span>
                      </label>
                      <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-violet-400 transition-colors z-10" />
                        <select
                          name="gate"
                          value={form.gate}
                          onChange={handleChange}
                          className={`w-full pl-12 pr-4 py-4 bg-white/5 border ${
                            errors.gate ? "border-red-500/50" : "border-white/10"
                          } rounded-2xl focus:outline-none focus:border-violet-500 focus:bg-white/10 transition-all text-white`}
                        >
                          <option value="" className="bg-slate-800">Select Gate</option>
                          {gates.map((g) => (
                            <option key={g.id} value={g.id} className="bg-slate-800">
                              {g.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.gate && (
                        <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" /> {errors.gate}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-3 text-slate-300">
                        Visit Date <span className="text-red-400">*</span>
                      </label>
                      <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-violet-400 transition-colors z-10" />
                        <input
                          type="date"
                          name="date"
                          value={form.date}
                          onChange={handleChange}
                          min={new Date().toISOString().split("T")[0]}
                          className={`w-full pl-12 pr-4 py-4 bg-white/5 border ${
                            errors.date ? "border-red-500/50" : "border-white/10"
                          } rounded-2xl focus:outline-none focus:border-violet-500 focus:bg-white/10 transition-all text-white`}
                        />
                      </div>
                      {errors.date && (
                        <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" /> {errors.date}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-3 text-slate-300">
                        Visit Time <span className="text-red-400">*</span>
                      </label>
                      <div className="relative group">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-violet-400 transition-colors z-10" />
                        <input
                          type="time"
                          name="time"
                          value={form.time}
                          onChange={handleChange}
                          className={`w-full pl-12 pr-4 py-4 bg-white/5 border ${
                            errors.time ? "border-red-500/50" : "border-white/10"
                          } rounded-2xl focus:outline-none focus:border-violet-500 focus:bg-white/10 transition-all text-white`}
                        />
                      </div>
                      {errors.time && (
                        <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" /> {errors.time}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-3 text-slate-300">
                      Expected Duration
                    </label>
                    <select
                      name="expectedDuration"
                      value={form.expectedDuration}
                      onChange={handleChange}
                      className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-violet-500 focus:bg-white/10 transition-all text-white"
                    >
                      <option value="30" className="bg-slate-800">30 minutes</option>
                      <option value="60" className="bg-slate-800">1 hour</option>
                      <option value="120" className="bg-slate-800">2 hours</option>
                      <option value="180" className="bg-slate-800">3 hours</option>
                      <option value="240" className="bg-slate-800">4 hours</option>
                      <option value="480" className="bg-slate-800">Full day (8 hours)</option>
                    </select>
                  </div>

                  {form.date && form.time && (
                    <div className="p-6 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/30 rounded-2xl backdrop-blur-sm">
                      <p className="text-sm font-bold text-violet-300 mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Your Visit Schedule
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm">
                          <span className="text-sm text-slate-300">Entry: </span>
                          <span className="font-semibold text-white">
                            {new Date(`${form.date}T${form.time}`).toLocaleString()}
                          </span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-500" />
                        <div className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl backdrop-blur-sm">
                          <span className="text-sm text-green-300">Valid until: </span>
                          <span className="font-semibold text-green-200">
                            {getAllowedUntil()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-6">
                    <button
                      onClick={handleBack}
                      className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="group relative px-8 py-4 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-violet-500/50 transition-all duration-300 flex items-center gap-3 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="relative z-10">Processing...</span>
                        </>
                      ) : (
                        <>
                          <span className="relative z-10">Submit Request</span>
                          <CheckCircle className="w-6 h-6 relative z-10 group-hover:scale-110 transition-transform" />
                        </>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Confirmation */}
              {activeStep === 2 && success && (
                <div className="space-y-8">
                  <div className="text-center space-y-6">
                    <div className="relative inline-block">
                      <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-green-500/50">
                        <CheckCircle className="w-14 h-14" />
                      </div>
                      <div className="absolute inset-0 bg-green-500 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
                    </div>
                    
                    <div>
                      <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                        Success!
                      </h2>
                      <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Your visitor request has been submitted for approval. Sit tight while we notify your host.
                      </p>
                    </div>
                  </div>

                  <div className="p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                      <Info className="w-6 h-6 text-violet-400" />
                      Booking Details
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      {[
                        { label: "Request ID", value: confirmationId },
                        { label: "Visitor Name", value: form.name },
                        { label: "Visit Date & Time", value: new Date(`${form.date}T${form.time}`).toLocaleString() },
                        { label: "Host", value: form.host },
                        { label: "Entry Gate", value: gates.find((g) => g.id === form.gate)?.name },
                        { label: "Status", value: "Pending Approval", badge: true },
                      ].map((item, idx) => (
                        <div key={idx} className="p-4 bg-white/5 rounded-2xl">
                          <p className="text-sm text-slate-500 mb-1">{item.label}</p>
                          {item.badge ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-300 font-semibold">
                              <Clock className="w-4 h-4" />
                              {item.value}
                            </span>
                          ) : (
                            <p className="font-bold text-white">{item.value}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-3xl backdrop-blur-sm">
                    <p className="font-bold text-blue-300 mb-4 flex items-center gap-2 text-lg">
                      <Bell className="w-5 h-5" />
                      What happens next?
                    </p>
                    <ul className="space-y-3 text-slate-300">
                      {[
                        `Your host (${form.host}) will receive an approval email`,
                        "Once approved, you'll get a confirmation email with QR code",
                        "Bring a valid government-issued ID on your visit date",
                        "Show your QR code at the security gate for quick entry",
                        "Please arrive 10 minutes before your scheduled time",
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs font-bold">{idx + 1}</span>
                          </div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap justify-center gap-4">
                    <button
                      onClick={() => window.print()}
                      className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-semibold hover:bg-white/10 transition-all"
                    >
                      Print Details
                    </button>
                    <button
                      onClick={resetForm}
                      className="group relative px-8 py-4 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-2xl font-bold hover:shadow-xl hover:shadow-violet-500/50 transition-all duration-300 overflow-hidden"
                    >
                      <span className="relative z-10">Book Another Visit</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 space-y-4">
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <a href="mailto:visitors@company.com" className="text-slate-400 hover:text-violet-400 transition-colors flex items-center gap-2">
                <Mail className="w-4 h-4" />
                visitors@company.com
              </a>
              <span className="text-slate-700">•</span>
              <a href="tel:+911800XXXXXX" className="text-slate-400 hover:text-violet-400 transition-colors flex items-center gap-2">
                <Phone className="w-4 h-4" />
                +91-1800-XXX-XXXX
              </a>
            </div>
            <p className="text-slate-600 text-sm">
              © 2025 VPASS. Powered by next-generation security technology.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}