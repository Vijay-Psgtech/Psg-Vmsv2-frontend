// src/utils/pdf.js
import jsPDF from "jspdf";

export function generatePassPDF(visitor) {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text("Visitor Pass", 20, 20);
  doc.setFontSize(12);
  doc.text(`Name: ${visitor.name}`, 20, 40);
  doc.text(`Phone: ${visitor.phone}`, 20, 50);
  doc.text(`Host: ${visitor.host}`, 20, 60);
  doc.text(`Purpose: ${visitor.purpose}`, 20, 70);
  doc.text(`Pass ID: ${visitor.passId || visitor._id}`, 20, 80);
  return doc;
}
