import React, { useState } from 'react';
import { publicApi } from '../services/api.js';
import { Sprout, PhoneCall, CheckCircle, ShieldCheck, Globe, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const DISTRICTS = [
  { en: 'Thanjavur', ta: 'தஞ்சாவூர்' },
  { en: 'Madurai', ta: 'மதுரை' },
  { en: 'Tiruchirappalli', ta: 'திருச்சிராப்பள்ளி' },
  { en: 'Coimbatore', ta: 'கோயம்புத்தூர்' },
  { en: 'Nagapattinam', ta: 'நாகப்பட்டினம்' },
];

const CROPS = [
  { id: 'Paddy', en: 'Paddy / Rice', ta: 'நெல்' },
  { id: 'Sugarcane', en: 'Sugarcane', ta: 'கரும்பு' },
  { id: 'Banana', en: 'Banana', ta: 'வாழை' },
  { id: 'Cotton', en: 'Cotton', ta: 'பருத்தி' },
];

export default function PublicReg() {
  const [lang, setLang] = useState('ta'); // Default to Tamil for rural farmers
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    village: '',
    district: 'Thanjavur',
    crops: ['Paddy'],
    language: 'ta',
    consent: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);

  const isTa = lang === 'ta';

  const toggleCrop = (cropId) => {
    setFormData((prev) => {
      const exists = prev.crops.includes(cropId);
      const updated = exists ? prev.crops.filter((c) => c !== cropId) : [...prev.crops, cropId];
      return { ...prev, crops: updated.length > 0 ? updated : [cropId] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.consent) {
      setErrorMsg(
        isTa
          ? 'அவசர வானிலை குரல் அழைப்புகளைப் பெற நீங்கள் ஒப்புதல் அளிக்க வேண்டும்.'
          : 'You must provide consent to receive emergency weather phone calls.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await publicApi.register({
        ...formData,
        language: lang,
      });
      setSuccessData(res.data);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error ||
          (isTa ? 'பதிவு செய்வதில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.' : 'Registration failed. Please check your inputs.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-agro-sand-50 py-8 px-4 flex flex-col justify-center items-center">
      {/* Container */}
      <div className="max-w-xl w-full bg-white rounded-3xl border border-agro-sand-200 shadow-xl overflow-hidden">
        {/* Brand Banner with Bilingual Toggle */}
        <div className="bg-agro-forest-900 text-white p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-agro-leaf-500 rounded-xl text-agro-forest-950 shadow-sm">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight flex items-center gap-1.5">
                  AgroVoice <span className="text-agro-leaf-400 text-xs px-1.5 py-0.2 bg-agro-forest-800 rounded font-mono">AI</span>
                </h1>
                <p className="text-xs text-agro-leaf-200">
                  {isTa ? 'தீவிர வானிலை குரல் எச்சரிக்கை சேவை' : 'Tamil Nadu Voice Emergency Shield'}
                </p>
              </div>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center bg-agro-forest-800 p-1 rounded-xl border border-agro-forest-700">
              <button
                type="button"
                onClick={() => {
                  setLang('ta');
                  setFormData((prev) => ({ ...prev, language: 'ta' }));
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  isTa ? 'bg-agro-leaf-500 text-agro-forest-950 shadow-xs' : 'text-agro-leaf-200 hover:text-white'
                }`}
              >
                தமிழ்
              </button>
              <button
                type="button"
                onClick={() => {
                  setLang('en');
                  setFormData((prev) => ({ ...prev, language: 'en' }));
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  !isTa ? 'bg-agro-leaf-500 text-agro-forest-950 shadow-xs' : 'text-agro-leaf-200 hover:text-white'
                }`}
              >
                English
              </button>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-2">
            {isTa ? 'விவசாயிகள் இலவச பதிவு' : 'Farmer Voice Alert Registration'}
          </h2>
          <p className="text-xs sm:text-sm text-agro-sand-200 mt-1">
            {isTa
              ? 'கனமழை, சூறாவளிக் காற்று அல்லது வறட்சி ஏற்படும் முன் உங்கள் சாதாரண மொபைல் போனுக்கு தமிழ் குரல் அழைப்பு வரும்.'
              : 'Direct voice alerts delivered to your mobile phone in your mother tongue before extreme rain, cyclonic winds, or heat.'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          {successData ? (
            /* Success Screen */
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-agro-sand-900">
                  {isTa ? 'பதிவு வெற்றிகரமாக முடிந்தது!' : 'Registration Successful!'}
                </h3>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 font-bold text-base sm:text-lg">
                  {isTa ? (
                    <div>"தீவிர வானிலை ஆபத்து ஏற்படும் போது உங்களுக்கு குரல் அழைப்பு வரும்."</div>
                  ) : (
                    <div>"You will get a call when weather danger is near."</div>
                  )}
                </div>
                <p className="text-xs text-agro-sand-600 max-w-md mx-auto pt-2">
                  {isTa
                    ? 'வானிலை கண்காணிப்பு மையம் உங்கள் பயிர் பகுதிக்கு தீவிர வானிலை எச்சரிக்கையை கண்டறிந்தால், உங்கள் தொலைபேசி ஒலிக்கும். அறிவிப்பை உறுதிப்படுத்த கீபேடில் 1-ஐ அழுத்தவும்.'
                    : 'Whenever automated meteorological sensors detect an emergency in your district, our voice system will phone your number. Press 1 on your keypad to acknowledge.'}
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSuccessData(null);
                    setFormData({
                      name: '',
                      phone: '',
                      village: '',
                      district: 'Thanjavur',
                      crops: ['Paddy'],
                      language: 'ta',
                      consent: false,
                    });
                  }}
                  className="px-6 py-2.5 bg-agro-forest-700 hover:bg-agro-forest-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  {isTa ? 'மற்றொரு விவசாயியைப் பதிவு செய்யவும்' : 'Register Another Farmer'}
                </button>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-4 text-xs text-agro-sand-700">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="font-bold text-agro-sand-900 block mb-1">
                  {isTa ? 'விவசாயியின் பெயர் *' : 'Farmer Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isTa ? 'எ.கா. சுப்பிரமணியன் கே.' : 'e.g. Subramanian K.'}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 rounded-xl border border-agro-sand-300 text-sm focus:outline-none focus:ring-2 focus:ring-agro-forest-600"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="font-bold text-agro-sand-900 block mb-1">
                  {isTa ? 'கைபேசி எண் (10 இலக்கங்கள்) *' : 'Mobile Phone Number (10 Digits) *'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-agro-sand-500 font-mono">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="9842100001"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-agro-sand-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-agro-forest-600"
                  />
                </div>
                <span className="text-[11px] text-agro-sand-500 mt-1 block">
                  {isTa
                    ? 'சாதாரண பட்டன் (Feature) போன் அல்லது ஸ்மார்ட்போன் எண் கொடுக்கலாம்.'
                    : 'Works seamlessly on feature phones as well as smartphones.'}
                </span>
              </div>

              {/* Village & District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-agro-sand-900 block mb-1">
                    {isTa ? 'கிராமம் / ஊர் *' : 'Village / Town *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isTa ? 'எ.கா. திருவையாறு' : 'e.g. Thiruvaiyaru'}
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    className="w-full p-3 rounded-xl border border-agro-sand-300 text-sm focus:outline-none focus:ring-2 focus:ring-agro-forest-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-agro-sand-900 block mb-1">
                    {isTa ? 'மாவட்டம் *' : 'District *'}
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full p-3 rounded-xl border border-agro-sand-300 text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-agro-forest-600"
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d.en} value={d.en}>
                        {isTa ? `${d.ta} (${d.en})` : d.en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Crops Multi-select */}
              <div>
                <label className="font-bold text-agro-sand-900 block mb-1.5">
                  {isTa ? 'பயிரிடப்படும் பயிர்கள் *' : 'Cultivated Crops * (Select all that apply)'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CROPS.map((c) => {
                    const selected = formData.crops.includes(c.id);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => toggleCrop(c.id)}
                        className={`p-3 rounded-xl border text-left font-semibold text-xs transition-all flex items-center justify-between ${
                          selected
                            ? 'bg-agro-forest-50 border-agro-forest-600 text-agro-forest-900 ring-1 ring-agro-forest-600'
                            : 'bg-white border-agro-sand-200 text-agro-sand-700 hover:bg-agro-sand-50'
                        }`}
                      >
                        <div>
                          <div className="font-bold">{isTa ? c.ta : c.en}</div>
                          <div className="text-[10px] text-agro-sand-500 font-normal">{isTa ? c.en : c.ta}</div>
                        </div>
                        {selected && <CheckCircle className="w-4 h-4 text-agro-forest-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Explicit Plain-Language Consent Checkbox */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1.5 mt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.consent}
                    onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                    className="mt-0.5 rounded text-agro-forest-700 focus:ring-agro-forest-600 w-4 h-4 shrink-0"
                  />
                  <div className="text-xs text-emerald-950 font-medium leading-relaxed">
                    {isTa ? (
                      <>
                        <strong>வெளிப்படையான ஒப்புதல்:</strong> கடுமையான மழை, காற்று அல்லது வறட்சி ஏற்படும் தருணங்களில் எனது தொலைபேசிக்கு தானியங்கி குரல் அழைப்புகளைப் பெற ஒப்புக்கொள்கிறேன். நான் எப்போது வேண்டுமானாலும் இந்த சேவையிலிருந்து விலகிக் கொள்ளலாம் (Opt-out) என்பதை அறிவேன்.
                      </>
                    ) : (
                      <>
                        <strong>Explicit Voice Consent:</strong> I agree to receive automated emergency meteorological voice phone calls when extreme weather threatens my crops. I understand I can opt out of this advisory service at any time.
                      </>
                    )}
                  </div>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-agro-forest-700 hover:bg-agro-forest-800 active:bg-agro-forest-900 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {submitting ? (
                  <span>{isTa ? 'பதிவு செய்யப்படுகிறது...' : 'Registering...'}</span>
                ) : (
                  <>
                    <PhoneCall className="w-4 h-4" />
                    <span>{isTa ? 'குரல் எச்சரிக்கை சேவையில் இணையவும்' : 'Join Voice Alert Shield'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Back Link */}
          <div className="mt-6 pt-4 border-t border-agro-sand-100 flex items-center justify-between text-xs text-agro-sand-500">
            <Link to="/login" className="flex items-center gap-1 text-agro-sand-600 hover:text-agro-forest-800 font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isTa ? 'நிர்வாக உள்நுழைவு' : 'Admin Login'}</span>
            </Link>
            <span>AgroVoice AI • Open-Meteo CC BY 4.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
