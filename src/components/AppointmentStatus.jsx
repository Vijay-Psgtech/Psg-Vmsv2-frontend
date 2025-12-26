import React, { useState } from 'react';
import axios from 'axios';

const statusColors = {
  Approved: 'text-green-600 bg-green-100',
  Pending: 'text-yellow-600 bg-yellow-100',
  Rejected: 'text-red-600 bg-red-100',
};

const AppointmentStatus = () => {
  const [visitorId, setVisitorId] = useState('');
  const [appointment, setAppointment] = useState(null);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    try {
      const response = await axios.get(`/api/visitors/appointment/check/${visitorId}`);
      setAppointment(response.data.visitor);
      setError('');
    } catch {
      setAppointment(null);
      setError('❌ No appointment found for this Visitor ID.');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-xl mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Check Your Appointment Status
      </h2>

      <input
        type="text"
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        placeholder="Enter your Visitor ID (e.g., PSG-V001)"
        value={visitorId}
        onChange={(e) => setVisitorId(e.target.value)}
      />

      <button
        onClick={handleCheck}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold transition"
      >
        🔍 Check Status
      </button>

      {error && <p className="mt-4 text-center text-red-600">{error}</p>}

      {appointment && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">📋 Appointment Details</h3>

          <div className="space-y-2 text-gray-700">
            <p><strong>Name:</strong> {appointment.name}</p>
            <p><strong>Email:</strong> {appointment.email}</p>
            <p><strong>Phone:</strong> {appointment.phone}</p>
            <p><strong>Visitor ID:</strong> {appointment.visitorId}</p>
            <p><strong>Whom to Meet:</strong> {appointment.whomToMeet}</p>
            <p><strong>Department:</strong> {appointment.department}</p>
            <p><strong>Purpose:</strong> {appointment.purpose}</p>
            <p><strong>Meeting Date:</strong> {appointment.visitDate}</p>
            <p><strong>Time Slot:</strong> {appointment.timeSlot}</p>
            <p><strong>Location:</strong> {appointment.meetingLocation}</p>

            <p className="flex items-center">
              <strong>Status: </strong>
              <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${statusColors[appointment.status]}`}>
                {appointment.status}
              </span>
            </p>

            {appointment.status === 'Approved' && (
              <p className="mt-4 text-green-700 bg-green-100 p-3 rounded">
                ✅ Please arrive 10 minutes early. Carry your ID card and wear a visitor badge.
              </p>
            )}

            {appointment.status === 'Pending' && (
              <p className="mt-4 text-yellow-700 bg-yellow-100 p-3 rounded">
                ⏳ Your appointment request is still under review. Check again later or contact the office.
              </p>
            )}
            data manipulation 
            {appointment.status === 'Rejected' && (
              <p className="mt-4 text-red-700 bg-red-100 p-3 rounded">
                ❌ Your appointment was not approved. Please contact support or reschedule.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentStatus;

