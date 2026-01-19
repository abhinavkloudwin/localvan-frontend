"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What is localvan.in?",
    answer: "localvan.in helps you find and book travellers, tempo travellers, and tourist buses anywhere in Kerala. You can compare options and book trips easily.",
  },
  {
    question: "How do I book a vehicle?",
    answer: "Enter your trip details, browse the available vehicles, and submit a booking request. The vehicle owner will confirm your request.",
  },
  {
    question: "Is advance payment required?",
    answer: "Most bookings require an advance payment to secure the vehicle. The remaining amount is settled with the owner.",
  },
  {
    question: "How will I know if my booking is confirmed?",
    answer: "You will receive a confirmation notification along with vehicle and driver details once the owner accepts your booking.",
  },
  {
    question: "Can I cancel my booking?",
    answer: "Yes, cancellations are allowed, but refund eligibility depends on the timing. Check our Refund and Cancellation Policy.",
  },
  {
    question: "What if the owner cancels my booking?",
    answer: "You will receive a full refund for any advance you paid. We will also try to help you find another vehicle.",
  },
  {
    question: "How do I contact support?",
    answer: "Email us at support@localvan.in or use the help section on the platform.",
  },
  {
    question: "Are the vehicles verified?",
    answer: "Vehicle owners must provide required documents before their listing is approved. You can also check ratings and reviews for confidence.",
  },
  {
    question: "Is my personal information kept private?",
    answer: "Yes, your data is used only for booking-related communication. We follow a strict privacy policy.",
  },
  {
    question: "What should I do if something goes wrong during the trip?",
    answer: "Contact the vehicle owner or driver first. If the issue continues, reach our support team for guidance.",
  },
];

export default function FAQ() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
        <div className="w-full px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <Logo />
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-3 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h1>
            <div className="w-24 h-1 bg-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Find answers to common questions about using{" "}
              <span className="font-semibold text-blue-600">localvan.in</span>. If you need more help, feel free to contact our support team.
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg overflow-hidden transition-all hover:shadow-md"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <span className="bg-blue-100 text-blue-600 font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 pr-4">
                        {faq.question}
                      </h3>
                    </div>
                    <svg
                      className={`w-6 h-6 text-blue-600 flex-shrink-0 transition-transform ${
                        openIndex === index ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {openIndex === index && (
                    <div className="px-5 pb-5 pt-2 bg-gray-50 border-t border-gray-200">
                      <p className="text-gray-700 leading-relaxed ml-12">
                        {faq.answer.includes("Refund and Cancellation Policy") ? (
                          <>
                            Yes, cancellations are allowed, but refund eligibility depends on the timing. Check our{" "}
                            <button
                              onClick={() => router.push("/refund")}
                              className="text-blue-600 hover:underline font-semibold"
                            >
                              Refund and Cancellation Policy
                            </button>
                            .
                          </>
                        ) : faq.answer.includes("support@localvan.in") ? (
                          <>
                            Email us at{" "}
                            <a
                              href="mailto:support@localvan.in"
                              className="text-blue-600 hover:underline font-semibold"
                            >
                              support@localvan.in
                            </a>{" "}
                            or use the help section on the platform.
                          </>
                        ) : faq.answer.includes("privacy policy") ? (
                          <>
                            Yes, your data is used only for booking-related communication. We follow a strict{" "}
                            <button
                              onClick={() => router.push("/privacy")}
                              className="text-blue-600 hover:underline font-semibold"
                            >
                              privacy policy
                            </button>
                            .
                          </>
                        ) : (
                          faq.answer
                        )}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Support Section */}
          <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">Still Have Questions?</h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Our support team is here to help you with any questions or concerns you may have about using localvan.in.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push("/contact")}
                className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Contact Support
              </button>
              <a
                href="mailto:support@localvan.in"
                className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-400 transition-colors border border-white"
              >
                Email Us
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <button
              onClick={() => router.push("/privacy")}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow text-center group"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Privacy Policy</h4>
              <p className="text-sm text-gray-600">Learn how we protect your data</p>
            </button>

            <button
              onClick={() => router.push("/terms")}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow text-center group"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Terms & Conditions</h4>
              <p className="text-sm text-gray-600">Read our terms of service</p>
            </button>

            <button
              onClick={() => router.push("/refund")}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow text-center group"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Refund Policy</h4>
              <p className="text-sm text-gray-600">Understand our refund process</p>
            </button>
          </div>
        </div>
      </main>      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="w-full px-3 sm:px-6 lg:px-8 py-10">
          {/* All Sections in One Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8 mb-8 max-w-7xl mx-auto">
            {/* LocalVan */}
            <div>
              <h3 className="text-white font-bold text-base mb-3">LocalVan</h3>
              <p className="text-gray-400 text-xs mb-3 leading-relaxed">
                Your trusted partner for premium vehicle rentals across Kerala.
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>+91 75111 77227</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="break-all">support@localvan.in</span>
                </div>
                <div className="flex items-start gap-1.5 text-gray-400 text-xs mt-2">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="leading-relaxed">
                    <p className="font-semibold text-white">INFYSAINT AI SOLUTIONS</p>
                    <p>Suite No. B29, Door No. 63/700</p>
                    <p>D Space, 6th Floor, Sky Tower</p>
                    <p>Mavoor Road Junction</p>
                    <p>Bank Road, Kozhikode – 673001</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-bold text-base mb-3">Quick Links</h3>
              <ul className="space-y-1.5">
                <li>
                  <button
                    onClick={() => router.push("/about")}
                    className="text-gray-400 hover:text-white transition-colors text-xs text-left cursor-pointer hover:underline"
                  >
                    About Us
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/faq")}
                    className="text-gray-400 hover:text-white transition-colors text-xs text-left cursor-pointer hover:underline"
                  >
                    FAQs
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/blogs")}
                    className="text-gray-400 hover:text-white transition-colors text-xs text-left cursor-pointer hover:underline"
                  >
                    Blogs
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/")}
                    className="text-gray-400 hover:text-white transition-colors text-xs text-left cursor-pointer hover:underline"
                  >
                    Become a Partner
                  </button>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-xs cursor-pointer hover:underline">
                    Careers
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/contact")}
                    className="text-gray-400 hover:text-white transition-colors text-xs text-left cursor-pointer hover:underline"
                  >
                    Contact Us
                  </button>
                </li>
              </ul>
            </div>

            {/* Policies */}
            <div>
              <h3 className="text-white font-bold text-base mb-3">Policies</h3>
              <ul className="space-y-1.5">
                <li>
                  <button
                    onClick={() => router.push("/privacy")}
                    className="text-gray-400 hover:text-white transition-colors text-xs text-left cursor-pointer hover:underline"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/terms")}
                    className="text-gray-400 hover:text-white transition-colors text-xs text-left cursor-pointer hover:underline"
                  >
                    Terms & Conditions
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/refund")}
                    className="text-gray-400 hover:text-white transition-colors text-xs text-left cursor-pointer hover:underline"
                  >
                    Refund Policy
                  </button>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-xs cursor-pointer hover:underline">
                    Cancellation Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-xs cursor-pointer hover:underline">
                    Payment Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-xs cursor-pointer hover:underline">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>

            {/* Vehicle Types */}
            <div>
              <h3 className="text-white font-bold text-base mb-3">Vehicle Types</h3>
              <ul className="space-y-1.5">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs cursor-pointer hover:underline">Sedan Cars</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs cursor-pointer hover:underline">SUV Vehicles</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs cursor-pointer hover:underline">Luxury Cars</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs cursor-pointer hover:underline">Minibus/Van</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs cursor-pointer hover:underline">Tempo Traveller</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs cursor-pointer hover:underline">Ambulance Services</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs cursor-pointer hover:underline">Commercial Vehicles</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs cursor-pointer hover:underline">Wedding Cars</a></li>
              </ul>
            </div>

            {/* Popular Locations */}
            <div>
              <h3 className="text-white font-bold text-base mb-3">Popular Cities</h3>
              <ul className="space-y-1.5">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs cursor-pointer hover:underline">Kochi</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs cursor-pointer hover:underline">Thiruvananthapuram</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs cursor-pointer hover:underline">Thrissur</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs cursor-pointer hover:underline">Kozhikode</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs cursor-pointer hover:underline">Kottayam</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs cursor-pointer hover:underline">Kollam</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs cursor-pointer hover:underline">Palakkad</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-xs cursor-pointer hover:underline">Alappuzha</a></li>
              </ul>
            </div>
          </div>

          {/* Social Media & Copyright */}
          <div className="border-t border-gray-800 pt-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-gray-400 text-xs sm:text-sm">
                © 2025 Infysaint AI Solutions. All rights reserved.
              </p>
              <div className="flex gap-4">
                {/* Facebook */}
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-500 transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                {/* Twitter */}
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                {/* Instagram */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-pink-500 transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                {/* LinkedIn */}
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
