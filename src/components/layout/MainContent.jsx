// src/components/layout/MainContent.jsx
import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import GateEntryForm from '../GateEntryForm';
import VisitorRegistrationForm from '../VisitorRegistrationForm';

const MainContent = () => {
  return (
    <main className="flex-1 p-6 md:p-10 overflow-y-auto">
      <Suspense fallback={<div className="text-center text-gray-500 animate-pulse">Loading...</div>}>
        <Routes>
          <Route path="/register" element={<GateEntryForm />} />
          <Route path="/register/:visitorId" element={<VisitorRegistrationForm />} />
          <Route
            path="*"
            element={
              <div className="text-center text-gray-400 mt-20 text-lg">
                🚧 Page not found
              </div>
            }
          />
        </Routes>
      </Suspense>
    </main>
  );
};

export default MainContent;

