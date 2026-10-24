import React, { useState } from 'react';
import { Phone, Mail, MapPin, MessageCircle, ChevronDown, CheckCircle2, Send, Clock, ArrowRight, ExternalLink } from 'lucide-react';

export default function ContactSection({ 
  shopPhone = "+254712880970", 
  shopEmail = "mikewillmakeit2004@gmail.com", 
  shopAddress = "Old Fire Station (Beside Kakwacha / Hangover Hotel, road to Kentons Square), Ang'awa Street, Kisumu County" 
}) {
  const [inquiryType, setInquiryType] = useState('retail'); // 'retail' or 'mailing'
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const cleanPhone = shopPhone.replace(/\D/g, '');

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', company: '', email: '', phone: '', message: '' });
    }, 6000);
  };

  return (
    <div className="w-full flex flex-col font-sans">
      
      {/* =========================================================================
          SECTION 1: CONTACT HERO SECTION
          Matches the exact height and simple structure of HeroCables.jsx
          Full width, min-h-[50vh] sm:min-h-[56vh], no redundant clutter
         ========================================================================= */}
      <section className="relative w-full min-h-[50vh] sm:min-h-[56vh] flex items-center justify-center overflow-hidden bg-[#181615] text-white border-b border-white/10 select-none">
        
        {/* Background Image: contacthero.jpg */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/contacthero.jpg"
            alt="Kadianga Electricals Engineering & Sales Desk"
            className="w-full h-full object-cover object-center filter brightness-[0.55] contrast-[1.12]"
          />
          {/* Atmospheric overlays for depth, contrast, and high readability */}
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#181615] via-black/20 to-black/60"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50"></div>
        </div>

        {/* Main Hero Content: Clean, focused, matching Power Cables hero */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 text-center py-20 sm:py-28 flex flex-col items-center justify-center">
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-sans font-bold tracking-tight text-white mb-6 drop-shadow-md leading-[1.08]">
            Get In Touch With <br />
            <span className="text-[#f4ebe1]">Our Team</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-neutral-200/90 font-light max-w-2xl leading-relaxed tracking-wide drop-shadow-sm">
            Direct consultation for electrical contractors, bulk underground power cable cuts, architectural chandeliers, and commercial site deliveries across Kenya.
          </p>

        </div>

      </section>


      {/* =========================================================================
          SECTION 2: CONTACT FORM SECTION
          Matches original layout from contact us 2.jpg and contact us.jpg
         ========================================================================= */}
      <section 
        id="contact-form-section" 
        className="relative w-full min-h-screen flex items-center justify-center bg-[#ebe5da] text-[#18181b] py-20 sm:py-28 overflow-hidden border-t border-neutral-300 font-sans"
      >
        {/* Giant Background Watermark "Contact" */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 select-none pointer-events-none opacity-25">
          <span className="font-sans text-[80px] sm:text-[180px] lg:text-[260px] font-black text-white tracking-tighter leading-none">
            Contact
          </span>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Column matching contact us 2.jpg & contact us.jpg */}
            <div className="lg:col-span-5 space-y-8">
              
              {/* Pill Inquiry Selector buttons with concentric target circle */}
              <div className="space-y-3.5">
                <button
                  type="button"
                  onClick={() => setInquiryType('retail')}
                  className={`flex items-center gap-3.5 px-6 py-3 rounded-full text-xs font-bold tracking-wider transition-all shadow-sm ${
                    inquiryType === 'retail'
                      ? 'bg-black text-white'
                      : 'bg-white text-neutral-900 hover:bg-neutral-100 border border-neutral-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center border-2 ${
                    inquiryType === 'retail' ? 'border-white' : 'border-neutral-700'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${inquiryType === 'retail' ? 'bg-white' : 'bg-neutral-800'}`}></div>
                  </div>
                  <span className="uppercase">Retail Enquiries</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInquiryType('mailing')}
                  className={`flex items-center gap-3.5 px-6 py-3 rounded-full text-xs font-bold tracking-wider transition-all shadow-sm ${
                    inquiryType === 'mailing'
                      ? 'bg-black text-white'
                      : 'bg-white text-neutral-900 hover:bg-neutral-100 border border-neutral-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center border-2 ${
                    inquiryType === 'mailing' ? 'border-white' : 'border-neutral-700'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${inquiryType === 'mailing' ? 'bg-white' : 'bg-neutral-800'}`}></div>
                  </div>
                  <span className="uppercase">Join Mailing List &bull; Contractor Desk</span>
                </button>
              </div>

              {/* Address & Contact Information */}
              <div className="pt-2 space-y-3 text-sm text-neutral-800 leading-relaxed bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-neutral-300/80 shadow-sm">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#e67e22] font-bold block mb-1">
                    Direct Contact Details
                  </span>
                  <a 
                    href={`tel:${shopPhone}`}
                    className="font-bold text-lg text-neutral-900 hover:text-[#e67e22] transition-colors block"
                  >
                    {shopPhone}
                  </a>
                </div>

                <div className="border-t border-neutral-200 pt-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#e67e22] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-neutral-900 leading-snug">
                        Old Fire Station
                      </p>
                      <p className="text-xs text-neutral-700 font-medium">
                        Beside Kakwacha / Hangover Hotel, on the road going to Kentons Square
                      </p>
                      <p className="text-xs text-neutral-600 font-medium">
                        Ang'awa Street, Kisumu County
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-3">
                  <a 
                    href={`mailto:${shopEmail}`}
                    className="font-bold text-neutral-900 hover:text-[#e67e22] transition-colors text-sm break-all"
                  >
                    {shopEmail}
                  </a>
                </div>
              </div>

              {/* Interactive Google Map that opens Google Maps on click */}
              <a
                href="https://www.google.com/maps/search/?api=1&query=Old+Fire+Station+Kakwacha+Angawa+Street+Kisumu"
                target="_blank"
                rel="noopener noreferrer"
                className="relative block rounded-2xl overflow-hidden border border-neutral-300 shadow-sm bg-neutral-100 aspect-[16/10] group cursor-pointer hover:shadow-md transition-all"
                title="Click to view Old Fire Station, beside Kakwacha / Hangover Hotel, Ang'awa Street on Google Maps"
              >
                <iframe
                  title="Kadianga Electricals Kisumu Location Map"
                  src="https://maps.google.com/maps?q=Angawa+Avenue+Kisumu+Kenya&t=&z=16&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-full pointer-events-none border-0 filter saturate-[1.1]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors pointer-events-none" />
                <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-neutral-200 shadow-sm flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-[#e67e22] shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-neutral-900 block leading-tight truncate">
                        Old Fire Station (Beside Kakwacha / Hangover Hotel)
                      </span>
                      <span className="text-[10px] text-neutral-600 block truncate">
                        Road to Kentons Square • Ang'awa Street, Kisumu
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#e67e22] group-hover:underline shrink-0">
                    Open Map <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </a>

            </div>

            {/* Right Column: Underline Form matching contact us 2.jpg with 100% visible text */}
            <div className="lg:col-span-7 bg-white/80 backdrop-blur-md p-5 sm:p-8 md:p-12 rounded-3xl border border-neutral-300 shadow-md">
              {submitted ? (
                <div className="py-16 text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h3 className="text-2xl font-bold text-neutral-900">Thank you</h3>
                  <p className="text-neutral-800 text-sm font-semibold max-w-md mx-auto">
                    Your message has been sent. We will get back to you shortly via phone and email.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 px-6 py-2.5 rounded-full bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="border-b border-neutral-300 pb-3 mb-6">
                    <h3 className="text-xl sm:text-2xl font-bold text-neutral-900">
                      {inquiryType === 'retail' ? 'Retail & General Inquiries' : 'Contractor Project & Mailing List'}
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-700 font-medium mt-1">
                      Fill out the form below and an electrical engineer will respond within 2 hours.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900 mb-1.5">
                        Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your full name"
                        className="w-full bg-transparent border-b-2 border-neutral-400 focus:border-black pb-2 text-sm text-neutral-900 font-semibold focus:outline-none transition-colors placeholder-neutral-500"
                      />
                    </div>

                    {/* Company */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900 mb-1.5">
                        Company <span className="text-neutral-600 font-normal lowercase">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Company or site name"
                        className="w-full bg-transparent border-b-2 border-neutral-400 focus:border-black pb-2 text-sm text-neutral-900 font-semibold focus:outline-none transition-colors placeholder-neutral-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900 mb-1.5">
                        Email <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@example.com"
                        className="w-full bg-transparent border-b-2 border-neutral-400 focus:border-black pb-2 text-sm text-neutral-900 font-semibold focus:outline-none transition-colors placeholder-neutral-500"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900 mb-1.5">
                        Phone <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+254 700 000 000"
                        className="w-full bg-transparent border-b-2 border-neutral-400 focus:border-black pb-2 text-sm text-neutral-900 font-semibold focus:outline-none transition-colors placeholder-neutral-500"
                      />
                    </div>
                  </div>

                  {/* Message matching "Want to know more? Drop us a line!" from contact us 2.jpg */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-900 mb-1.5">
                      Want to know more? Drop us a line! <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      rows="3"
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Specify cable sizes, quantities, lighting models, or project requirements..."
                      className="w-full bg-transparent border-b-2 border-neutral-400 focus:border-black pb-2 text-sm text-neutral-900 font-semibold focus:outline-none transition-colors resize-none placeholder-neutral-500"
                    ></textarea>
                  </div>

                  {/* Action Buttons: Concentric Target Circle Send Button + WhatsApp Direct */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-neutral-200">
                    <a
                      href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                        `Hello Kadianga Electricals, I am reaching out regarding ${inquiryType === 'retail' ? 'Retail Supply' : 'Contractor Project Supply'}. Name: ${formData.name || 'Contractor'}, Message: ${formData.message || 'I would like a quotation.'}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat on WhatsApp</span>
                    </a>

                    {/* Send Button with concentric target circle matching contact us 2.jpg */}
                    <button
                      type="submit"
                      className="flex items-center gap-3 bg-black hover:bg-neutral-800 text-white px-9 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 ml-auto"
                    >
                      <div className="w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                      </div>
                      <span>Send</span>
                    </button>
                  </div>

                </form>
              )}
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
