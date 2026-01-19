"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";

export default function TermsAndConditions() {
  const router = useRouter();

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
              Terms and Conditions
            </h1>
            <div className="w-24 h-1 bg-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Welcome to <span className="font-semibold text-blue-600">localvan.in</span>. By accessing or using our platform, you agree to the following terms and conditions. Please read them carefully. If you do not agree, you should discontinue using the website or app.
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-10">
            {/* Section 1 */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">1</span>
                Introduction
              </h2>
              <p className="text-gray-700 ml-11">
                <span className="font-semibold text-blue-600">localvan.in</span> is an online platform that connects users with vehicle owners offering travellers, tempo travellers, tourist buses, and other travel-related vehicles across Kerala. We act as a facilitator, not a transportation provider. All bookings, services, and operations are carried out directly by the respective vehicle owners.
              </p>
            </section>

            {/* Section 2 */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">2</span>
                User Responsibilities
              </h2>
              <p className="text-gray-700 mb-3 ml-11">By using <span className="font-semibold text-blue-600">localvan.in</span>, you agree to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-15">
                <li>Provide accurate and truthful information while creating bookings or enquiries.</li>
                <li>Use the platform only for lawful purposes.</li>
                <li>Not engage in misuse, fraud, or any activity that disrupts platform operations.</li>
                <li>Respect the privacy and rights of vehicle owners and other users.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">3</span>
                Vehicle Owner Responsibilities
              </h2>
              <p className="text-gray-700 mb-3 ml-11">Vehicle owners listing on the platform agree to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-15">
                <li>Provide accurate vehicle details, documents, and photos.</li>
                <li>Ensure the vehicle is legally permitted and safe to operate.</li>
                <li>Honour confirmed bookings and communicate clearly with customers.</li>
                <li>Maintain responsible behaviour by their drivers and sub-users.</li>
              </ul>
              <p className="text-gray-900 font-semibold mt-4 ml-11">
                <span className="text-blue-600">localvan.in</span> is not responsible for the conduct, quality, safety, or performance of any vehicle or service provided by the owners.
              </p>
            </section>

            {/* Section 4 */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">4</span>
                Booking and Payments
              </h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-11">
                <li>Bookings are made directly between the user and the vehicle owner.</li>
                <li>Any advance or part payments collected through the platform are transferred to the respective owner according to the selected payment flow.</li>
                <li>Users must review all trip details before confirming a booking.</li>
                <li>Cancellation, refunds, and rescheduling are subject to the owner's policies.</li>
                <li><span className="font-semibold text-blue-600">localvan.in</span> is not liable for disputes arising from cancellations, no-shows, delays, or service issues.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">5</span>
                Platform Role and Limitations
              </h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-11">
                <li>We are not a transport agency or travel operator.</li>
                <li>We do not control or guarantee vehicle availability, pricing, punctuality, or service quality.</li>
                <li>All operational accountability lies with the respective owners and drivers.</li>
                <li>The platform may modify or remove listings that violate policies.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">6</span>
                Communication and Notifications
              </h2>
              <p className="text-gray-700 ml-11">
                By using <span className="font-semibold text-blue-600">localvan.in</span>, you consent to receive updates, alerts, and booking-related notifications through WhatsApp, SMS, email, or phone. You can disable promotional messages at any time.
              </p>
            </section>

            {/* Section 7 */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">7</span>
                Content and Intellectual Property
              </h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-11">
                <li>All platform content, design, and branding belong to <span className="font-semibold text-blue-600">localvan.in</span>.</li>
                <li>Users and owners may not copy, modify, or distribute any material without permission.</li>
                <li>User reviews, comments, and uploads may be used by <span className="font-semibold text-blue-600">localvan.in</span> for quality and marketing purposes.</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">8</span>
                Privacy and Data Protection
              </h2>
              <div className="ml-11 space-y-3">
                <p className="text-gray-700">
                  We value your privacy. Information is collected only to improve user experience and support booking operations. Personal data is handled in line with applicable laws. We do not sell or share personal information with unauthorised third parties.
                </p>
                <p className="text-gray-700">
                  A detailed{" "}
                  <button
                    onClick={() => router.push("/privacy")}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Privacy Policy
                  </button>{" "}
                  will explain how data is collected and used.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">9</span>
                Liability Disclaimer
              </h2>
              <p className="text-gray-700 mb-3 ml-11">
                <span className="font-semibold text-blue-600">localvan.in</span> is not responsible for:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-15">
                <li>Delays, accidents, or incidents involving listed vehicles.</li>
                <li>Loss of personal belongings during a trip.</li>
                <li>Miscommunication or disputes between users and owners.</li>
                <li>Service interruptions caused by technical or external factors.</li>
              </ul>
              <p className="text-gray-900 font-semibold mt-4 ml-11">
                Users agree to use the platform at their own discretion.
              </p>
            </section>

            {/* Section 10 */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">10</span>
                Account Suspension and Termination
              </h2>
              <p className="text-gray-700 mb-3 ml-11">We may suspend or terminate accounts that:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-15">
                <li>Provide false information</li>
                <li>Engage in fraudulent or abusive behaviour</li>
                <li>Violate platform guidelines or legal requirements</li>
              </ul>
              <p className="text-gray-900 font-semibold mt-4 ml-11">
                <span className="text-blue-600">localvan.in</span> reserves the right to remove any content or user that harms platform integrity.
              </p>
            </section>

            {/* Section 11 */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">11</span>
                Changes to Terms
              </h2>
              <p className="text-gray-700 ml-11">
                <span className="font-semibold text-blue-600">localvan.in</span> may update these terms periodically. Your continued use of the platform means you accept the revised conditions.
              </p>
            </section>

            {/* Section 12 */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">12</span>
                Contact
              </h2>
              <p className="text-gray-700 mb-3 ml-11">
                For questions or concerns regarding these terms:
              </p>
              <div className="ml-11 space-y-2">
                <p className="text-gray-700">
                  <span className="font-semibold">Email:</span>{" "}
                  <a href="mailto:support@localvan.in" className="text-blue-600 hover:underline">
                    support@localvan.in
                  </a>
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Phone:</span>{" "}
                  <a href="tel:+917511177227" className="text-blue-600 hover:underline">
                    +91 75111 77227
                  </a>
                </p>
              </div>
            </section>
          </div>

          {/* Last Updated */}
          <div className="mt-8 text-center text-gray-500 text-sm">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
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
