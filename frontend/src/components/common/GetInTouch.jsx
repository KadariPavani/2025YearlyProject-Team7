import React, { useState } from 'react';
import { Send, MapPin, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function GetInTouch() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        setToast({ type: 'success', msg: 'Message sent successfully!' });
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setToast({ type: 'error', msg: data.message || 'Something went wrong' });
      }
    } catch {
      setToast({ type: 'error', msg: 'Server error. Please try again.' });
    } finally {
      setSending(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <section className="py-8 sm:py-10 md:py-12 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-5 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            Get in Touch
          </h1>
          <p className="text-[10px] sm:text-sm text-gray-500 mt-1 sm:mt-1.5">
            We'd love to hear from you. Fill out the form and we'll respond as soon as possible.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12">

          {/* Form */}
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-1.5">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#5791ED] transition-colors placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-1.5">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#5791ED] transition-colors placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-1.5">
                  Phone <span className="text-red-400">*</span>
                </label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#5791ED] transition-colors placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1 sm:mb-1.5">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  placeholder="How can we help you?"
                  className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#5791ED] transition-colors placeholder:text-gray-300 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2.5 bg-[#5791ED] hover:bg-[#4a7fd4] text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Send Message
                  </>
                )}
              </button>
            </form>

            {toast && (
              <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium ${
                toast.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {toast.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {toast.msg}
              </div>
            )}
          </div>

          {/* Contact info + Map */}
          <div className="w-full lg:w-[280px] shrink-0 space-y-4 sm:space-y-5">
            <div className="space-y-3 sm:space-y-4">
              <a href="tel:+919347132534" className="flex items-center gap-3 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#5791ED]/10 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-[#5791ED]" />
                </div>
                <div>
                  <p className="text-[9px] sm:text-[11px] text-gray-400 font-medium">Phone</p>
                  <p className="text-xs sm:text-sm text-gray-800 font-medium group-hover:text-[#5791ED] transition-colors">+91 9347132534</p>
                </div>
              </a>

              <a href="mailto:kadaripavani1@gmail.com" className="flex items-center gap-3 group">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#5791ED]/10 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-[#5791ED]" />
                </div>
                <div>
                  <p className="text-[9px] sm:text-[11px] text-gray-400 font-medium">Email</p>
                  <p className="text-xs sm:text-sm text-gray-800 font-medium group-hover:text-[#5791ED] transition-colors">kadaripavani1@gmail.com</p>
                </div>
              </a>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#5791ED]/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-[#5791ED]" />
                </div>
                <div>
                  <p className="text-[9px] sm:text-[11px] text-gray-400 font-medium">Address</p>
                  <p className="text-xs sm:text-sm text-gray-800 font-medium">Kakinada, Andhra Pradesh</p>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="rounded-lg overflow-hidden border border-gray-200 h-40 sm:h-48">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.792230604352!2d83.297592!3d17.685411!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a394ca2f9999999%3A0x7e5b4f3e3a3a3a3a!2sKakinada%2C%20Andhra%20Pradesh!5e0!3m2!1sen!2sin!4v1599999999999"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Location"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
