"use client";

import React, { useState, useEffect } from "react";
import api from "../utils/api";
import bannerImage from "../assets/visitor-banner.jpg";

const departments = ["HR", "IT", "Finance", "Admin", "Operations"];

const VisitorRegistrationForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    company: "",
    nid: "",
    address: "",
    department: "",
    employee: "",
    purpose: "",
    timeSlot: "",
    building: "",
  });

  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [selectedEmployeePhone, setSelectedEmployeePhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ---------------- FETCH MASTER DATA ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, bldRes] = await Promise.all([
          api.get("/employees"),
          api.get("/buildings"),
        ]);
        setEmployees(empRes.data);
        setBuildings(bldRes.data);
      } catch (err) {
        console.warn("Using fallback data");
      }
    };
    fetchData();
  }, []);

  /* ---------------- FILTER EMPLOYEES ---------------- */
  useEffect(() => {
    if (!formData.department) {
      setFilteredEmployees([]);
      return;
    }
    setFilteredEmployees(
      employees.filter((e) => e.department === formData.department)
    );
  }, [formData.department, employees]);

  /* ---------------- HANDLERS ---------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      await api.post("/visitor/create", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        host: formData.employee, // 👈 REQUIRED
        gate: formData.building, // 👈 REQUIRED
      });

      setMessage("Visitor registered successfully. Awaiting admin approval.");

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        gender: "",
        company: "",
        nid: "",
        address: "",
        department: "",
        employee: "",
        purpose: "",
        timeSlot: "",
        building: "",
      });
    } catch (err) {
      console.error("Submission failed:", err);
      setMessage(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${bannerImage})` }}
    >
      <div className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full max-w-4xl">
        <h2 className="text-3xl font-semibold text-center mb-2">
          Visitor Registration
        </h2>
        <p className="text-center text-gray-600 mb-6">
          All visits require admin approval
        </p>

        {message && (
          <p className="text-center text-blue-700 font-medium mb-4">
            {message}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {[
            ["firstName", "First Name"],
            ["lastName", "Last Name"],
            ["email", "Email"],
            ["phone", "Phone"],
            ["company", "Company"],
            ["nid", "Aadhaar Number"],
            ["address", "Address"],
            ["purpose", "Purpose of Visit"],
          ].map(([name, label]) => (
            <input
              key={name}
              name={name}
              placeholder={label}
              value={formData[name]}
              onChange={handleChange}
              className="input-style"
              required={[
                "firstName",
                "lastName",
                "email",
                "phone",
                "nid",
              ].includes(name)}
            />
          ))}

          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="input-style"
            required
          >
            <option value="">Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>

          <input
            type="time"
            name="timeSlot"
            value={formData.timeSlot}
            onChange={handleChange}
            className="input-style"
            required
          />

          <select
            name="building"
            value={formData.building}
            onChange={handleChange}
            className="input-style"
            required
          >
            <option value="">Select Building</option>
            {buildings.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="input-style"
            required
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>

          <select
            name="employee"
            value={formData.employee}
            onChange={(e) => {
              const emp = employees.find((x) => x.name === e.target.value);
              setSelectedEmployeePhone(emp?.phone || "");
              handleChange(e);
            }}
            className="input-style"
            required
          >
            <option value="">Whom to Meet</option>
            {filteredEmployees.map((e) => (
              <option key={e.name}>{e.name}</option>
            ))}
          </select>

          <div className="md:col-span-2">
            <button
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-medium hover:opacity-90 transition"
            >
              {submitting ? "Submitting..." : "Register Visitor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VisitorRegistrationForm;