"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-md p-8 bg-white shadow-xl rounded-2xl"
      >
        <ShieldAlert className="w-14 h-14 mx-auto text-red-500 mb-4" />

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          403 – Unauthorized
        </h1>
        <p className="text-gray-600 mb-6">
          You do not have permission to access this page.
        </p>

        <Button
          size="lg"
          className="w-full"
          onClick={() => (window.location.href = "/login")}
        >
          Go to Login
        </Button>
      </motion.div>
    </div>
  );
}
