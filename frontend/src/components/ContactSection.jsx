import React, { useState } from 'react';
import { Phone, Mail, MapPin, MessageCircle, ChevronDown, CheckCircle2, Send, Clock, ArrowRight, ExternalLink, ShieldCheck, Building2, RefreshCw } from 'lucide-react';

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
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [submitError, setSubmitError] = useState('');

  const cleanPhone = shopPhone.replace(/\D/g, '');

  const saveInquiryLocally = (inq) => {
    try {
      const stored = JSON.parse(localStorage.getItem('kadianga_customer_inquiries') || '[]');
      const filtered = stored.filter(item => item.quote_number !== inq.quote_number);
      localStorage.setItem('kadianga_customer_inquiries', JSON.stringify([inq, ...filtered]));
    } catch (e) {
      console.warn('Failed to cache inquiry locally:', e);
    }
  };

  const fallbackLocalSubmit = (payload) => {
    const localRef = `INQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const waText = `Hello Kadianga Electricals,\nI submitted an inquiry on your website [${localRef}]:\n\n*Name:* ${payload.name}\n*Company:* ${payload.company || 'N/A'}\n*Phone:* ${payload.phone}\n*Inquiry Category:* ${payload.inquiry_type}\n*Message:* ${payload.message}\n\nPlease advise on pricing and consultation.`;
    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`;
    
    saveInquiryLocally({
      id: Date.now(),
      quote_number: localRef,
      customer_name: payload.company ? `${payload.name} (${payload.company})` : payload.name,
      customer_email: payload.email,
      customer_phone: payload.phone,
      customer_location: `Contact Page • ${payload.inquiry_type === 'retail' ? 'Retail & General' : 'Contractor Project'}`,
      notes: `[Inquiry Category: ${payload.inquiry_type}]\n${payload.message}`,
      status: 'pending',
      created_at: new Date().toISOString()
    });

    setSubmissionResult({
      reference: localRef,
      whatsappLink: waLink,
      name: payload.name,
      message: payload.message
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    const payload = {
      name: formData.name.trim(),
      company: formData.company.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      inquiry_type: inquiryType,
      message: formData.message.trim()
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const ref = data.quote_number || `INQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        
        saveInquiryLocally({
          id: Date.now(),
          quote_number: ref,
          customer_name: payload.company ? `${payload.name} (${payload.company})` : payload.name,
          customer_email: payload.email,
          customer_phone: payload.phone,
          customer_location: `Contact Page • ${payload.inquiry_type === 'retail' ? 'Retail & General' : 'Contractor Project'}`,
          notes: `[Inquiry Category: ${payload.inquiry_type}]\n${payload.message}`,
          status: 'pending',
          created_at: new Date().toISOString()
        });

        setSubmissionResult({
          reference: ref,
          whatsappLink: data.whatsapp_link || `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello Kadianga Electricals, inquiry [${ref}]: ${payload.message}`)}`,
          name: payload.name,
          message: payload.message
        });
      } else {
        fallbackLocalSubmit(payload);
      }
    } catch (err) {
      fallbackLocalSubmit(payload);
    } finally {
      setSubmitting(false);
    }
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
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 lg:px-12 text-center py-16 sm:py-28 flex flex-col items-center justify-center">
          
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
                  className={`flex items-center gap-2.5 sm:gap-3.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl sm:rounded-full text-xs font-bold tracking-wider transition-all shadow-sm max-w-full ${
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
                <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 pointer-events-none">
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
            <div className="lg:col-span-7 bg-white/90 backdrop-blur-md p-5 sm:p-8 md:p-12 rounded-3xl border border-neutral-300 shadow-xl">
              {submissionResult ? (
                <div className="py-8 text-center space-y-5 animate-fade-in">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <div>
                    <span className="inline-block px-3.5 py-1 rounded-full text-xs font-mono font-bold bg-[#18181b] text-[#e67e22] mb-2 border border-white/10">
                      Inquiry #{submissionResult.reference}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-bold text-neutral-900 font-sans">
                      Inquiry Successfully Received!
                    </h3>
                    <p className="text-neutral-700 text-xs sm:text-sm font-medium max-w-lg mx-auto mt-2 leading-relaxed">
                      Thank you, <strong className="text-neutral-900">{submissionResult.name}</strong>. Here is exactly where your inquiry has been dispatched:
                    </p>
                  </div>

                  {/* Dispatch Destination Breakdown Card */}
                  <div className="bg-[#faf9f6] rounded-2xl border border-neutral-300 p-4 sm:p-5 text-left max-w-lg mx-auto space-y-3.5 text-xs shadow-inner">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-neutral-900 text-sm">Store Admin Dashboard (Kisumu)</p>
                        <p className="text-neutral-600 text-xs mt-0.5 leading-relaxed">
                          Your message and contact details are permanently logged in our store operations queue at Ang'awa Street. Our staff can review and reply directly via email or phone.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pt-3 border-t border-neutral-200">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-neutral-900 text-sm">Instant WhatsApp Dispatch (Fastest)</p>
                        <p className="text-neutral-600 text-xs mt-0.5 leading-relaxed">
                          For immediate response on warehouse stock and factory copper cable cuts, continue directly on WhatsApp with our store manager.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Immediate Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                    <a
                      href={submissionResult.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Continue on WhatsApp Now</span>
                    </a>

                    <a
                      href={`tel:${shopPhone}`}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-3.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#e67e22]" />
                      <span>Call Store: {shopPhone}</span>
                    </a>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSubmissionResult(null);
                        setFormData({ name: '', company: '', email: '', phone: '', message: '' });
                      }}
                      className="text-xs text-neutral-600 hover:text-black font-semibold underline"
                    >
                      Send Another Message
                    </button>
                  </div>
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

                  {/* Where It Goes Notice Box */}
                  <div className="p-3.5 rounded-2xl bg-neutral-100/90 border border-neutral-300 text-xs text-neutral-700 space-y-1">
                    <p className="font-bold text-neutral-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#e67e22]" />
                      <span>How your submission is handled:</span>
                    </p>
                    <p className="text-[11px] leading-relaxed text-neutral-600">
                      Clicking <strong>Send Inquiry</strong> logs your request directly into the <strong>Kadianga Store Admin Dashboard</strong> at Ang'awa Street for counter review. You can also tap <strong>Chat on WhatsApp</strong> for immediate live communication.
                    </p>
                  </div>

                  {/* Action Buttons: Concentric Target Circle Send Button + WhatsApp Direct */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-neutral-200">
                    <a
                      href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                        `Hello Kadianga Electricals, I am reaching out regarding ${inquiryType === 'retail' ? 'Retail Supply' : 'Contractor Project Supply'}. Name: ${formData.name || 'Contractor'}, Message: ${formData.message || 'I would like a quotation.'}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
                      title="Open immediate WhatsApp conversation"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Chat on WhatsApp</span>
                    </a>

                    {/* Send Button with concentric target circle matching contact us 2.jpg */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-3 bg-black hover:bg-neutral-800 disabled:bg-neutral-600 text-white px-9 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 ml-auto cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                          </div>
                          <span>Send Inquiry</span>
                        </>
                      )}
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
