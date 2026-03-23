import React, { useState } from "react";
import axios from "axios";
import bannerImage from "../assets/visitor-banner.jpg";

const VisitorAppointment = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    whomToMeet: "",
    purpose: "",
    address: "",
    visitDate: "",
    timeSlot: "",
  });

  const [photo, setPhoto] = useState(null);
  const [document, setDocument] = useState(null);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const form = new FormData();
      Object.entries(formData).forEach(([k, v]) => form.append(k, v));
      if (photo) form.append("photo", photo);
      if (document) form.append("document", document);

      const res = await axios.post(
        "http://localhost:5000/api/visitors/register",
        form
      );
      setMessage(res.data.message || "Appointment submitted successfully!");
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to submit appointment");
    }
  };

  return (
    <div className="font-sans">

      {/* 🔵 Hero Banner */}
      <section
        className="relative h-75 bg-cover bg-center"
        style={{ backgroundImage: `url(${bannerImage})` }}
      >
        <div className="absolute inset-0 bg-black/60 flex flex-col justify-center items-center px-6 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-wide">
            Schedule Your Visit
          </h1>
          <p className="text-lg max-w-2xl leading-relaxed">                                   
            Fill in your details below to book your appointment. Our team will
            review your request and update you soon.
          </p>
        </div>
      </section>

      {/* 🔵 Form Section */}
      <section className="max-w-5xl mx-auto py-12 px-4">
        <h2 className="text-3xl font-bold text-blue-800 text-center mb-4">
          Visitor Appointment Form
        </h2>
        <p className="text-gray-600 text-center max-w-2xl mx-auto mb-10">
          Provide accurate information and upload a valid ID for verification.
          We ensure your data is safe and secured.
        </p>

        {/* 🔥 Form Card */}
        <form
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          className="bg-white shadow-xl rounded-2xl p-10 border border-gray-100 backdrop-blur-lg"
        >

          {/* GRID INPUTS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Input Component */}
            {[
              ["name", "Full Name", true],
              ["email", "Email", true],
              ["phone", "Phone Number", true],
              ["department", "Department / Company", false],
              ["whomToMeet", "Whom to Meet", false],
              ["purpose", "Purpose of Visit", false],
              ["address", "Address", false],
            ].map(([field, placeholder, required]) => (
              <input
                key={field}
                name={field}
                value={formData[field]}
                onChange={handleChange}
                placeholder={placeholder}
                required={required}
                className="p-3 w-full border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 transition"
              />
            ))}

            {/* Date */}
            <input
              type="date"
              name="visitDate"
              value={formData.visitDate}
              onChange={handleChange}
              required
              className="p-3 w-full border rounded-lg shadow-sm text-gray-600 focus:ring-2 focus:ring-blue-500"
            />

            {/* Time Slot */}
            <select
              name="timeSlot"
              value={formData.timeSlot}
              onChange={handleChange}
              required
              className="p-3 w-full border rounded-lg shadow-sm text-gray-700 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Time Slot</option>
              {["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM"].map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          {/* 🔵 Upload Sections */}
          <div className="mt-8 space-y-6">
            <div>
              <label className="font-semibold block mb-1">
                Upload Photo (JPEG/PNG)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files[0])}
                className="w-full p-3 border rounded-lg"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">
                Upload ID Document (PDF/Image)
              </label>
              <input
                type="file"
                onChange={(e) => setDocument(e.target.files[0])}
                className="w-full p-3 border rounded-lg"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="mt-10 w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl text-lg font-semibold shadow-md transition-all"
          >
            Submit Appointment
          </button>

          {/* Success / Error Message */}
          {message && (
            <p className="text-center text-green-700 font-medium mt-4">
              {message}
            </p>
          )}
        </form>
      </section>
    </div>
  );
};

export default VisitorAppointment;
