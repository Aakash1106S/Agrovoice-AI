import React, { useState, useEffect } from 'react';
import { callsApi, farmersApi, alertsApi, settingsApi } from '../services/api.js';
import { useNotification } from '../context/NotificationContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import AudioPlayer from '../components/AudioPlayer.jsx';
import {
  PhoneCall,
  PhoneForwarded,
  ShieldAlert,
  Play,
  RotateCcw,
  CheckCircle,
  Radio,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function VoiceCalls() {
  const [telephonyMode, setTelephonyMode] = useState('test');
  const [farmers, setFarmers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [useTestPhone, setUseTestPhone] = useState(false);
  const [language, setLanguage] = useState('ta');
  const [messageSource, setMessageSource] = useState('standard');
  const [selectedAlertId, setSelectedAlertId] = useState('');
  const [customScript, setCustomScript] = useState('');
  const [calling, setCalling] = useState(false);

  // Active / Simulated Call Inspection
  const [activeCall, setActiveCall] = useState(null);
  const [simulatingKey, setSimulatingKey] = useState(false);

  const { success, error, info } = useNotification();

  useEffect(() => {
    Promise.all([
      settingsApi.getSettings(),
      farmersApi.list({ consent: true, optedOut: false, limit: 50 }),
      alertsApi.list({ limit: 20 }),
    ])
      .then(([settingsRes, farmersRes, alertsRes]) => {
        setTelephonyMode(settingsRes.data.data?.telephony?.mode || 'test');
        setFarmers(farmersRes.data.data || []);
        setAlerts(alertsRes.data.data || []);
        if (farmersRes.data.data?.length > 0) {
          setSelectedFarmerId(farmersRes.data.data[0]._id);
        }
      })
      .catch((err) => {
        error('Failed to load telephony context.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleTriggerCall = async (e) => {
    e.preventDefault();
    setCalling(true);

    let scriptText = customScript;
    if (messageSource === 'alert' && selectedAlertId) {
      const a = alerts.find((al) => al._id === selectedAlertId);
      if (a) {
        scriptText = language === 'en' ? a.englishScript : a.tamilScript;
      }
    }

    try {
      const res = await callsApi.placeCall({
        farmerId: useTestPhone ? undefined : selectedFarmerId,
        testPhone: useTestPhone ? customPhone : undefined,
        language,
        scriptText: scriptText || undefined,
        alertId: selectedAlertId || undefined,
      });

      setActiveCall(res.data.data);
      success(`Voice call initiated in ${res.data.data.mode.toUpperCase()} mode!`);
    } catch (err) {
      error(err.response?.data?.error || 'Failed to initiate call.');
    } finally {
      setCalling(false);
    }
  };

  const handleSimulateKeypadPress = async (digit) => {
    if (!activeCall) return;
    setSimulatingKey(true);
    try {
      const res = await callsApi.simulateDtmf(activeCall._id, digit);
      setActiveCall(res.data.data);
      success(`Keypad '${digit}' processed: ${res.data.data.dtmfResult}`);
    } catch (err) {
      error('Failed to process DTMF input.');
    } finally {
      setSimulatingKey(false);
    }
  };

  const isLive = telephonyMode === 'real';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Prominent Telephony Mode Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-agro-sand-900 tracking-tight">Voice Calls Dispatch & Test Rig</h2>
          <p className="text-sm text-agro-sand-600 mt-0.5">
            Trigger individual outbound voice calls with DTMF keypad acknowledgment verification.
          </p>
        </div>

        {/* PROMINENT CARRIER INDICATOR */}
        <div
          className={`px-4 py-2 rounded-2xl border flex items-center gap-2.5 text-xs font-black shadow-xs ${
            isLive
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-purple-50 text-purple-950 border-purple-200'
          }`}
        >
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLive ? 'bg-emerald-400' : 'bg-purple-400'}`} />
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isLive ? 'bg-emerald-600' : 'bg-purple-600'}`} />
          </span>
          <div>
            <div className="uppercase font-mono tracking-wider">
              {isLive ? 'CURRENT MODE: LIVE CARRIER' : 'CURRENT MODE: TEST MODE (SIMULATED)'}
            </div>
            <div className="text-[10px] font-normal text-agro-sand-500">
              {isLive ? 'Real Exotel SIP Trunk • Dials Mobile Network' : 'No carrier charges • Full DTMF Keypad Simulation'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Initiate Outbound Call */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-agro-sand-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-agro-sand-100">
            <PhoneForwarded className="w-5 h-5 text-agro-forest-700" />
            <h3 className="text-base font-bold text-agro-sand-900">Initiate Outbound Call</h3>
          </div>

          <form onSubmit={handleTriggerCall} className="space-y-4 text-xs text-agro-sand-700">
            {/* Recipient Mode Toggle */}
            <div className="flex items-center justify-between p-3 bg-agro-sand-50 rounded-xl border border-agro-sand-200">
              <span className="font-semibold text-agro-sand-800">Destination Selection:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setUseTestPhone(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    !useTestPhone
                      ? 'bg-agro-forest-700 text-white shadow-xs'
                      : 'bg-white text-agro-sand-600 border border-agro-sand-200'
                  }`}
                >
                  Registered Farmer
                </button>
                <button
                  type="button"
                  onClick={() => setUseTestPhone(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    useTestPhone
                      ? 'bg-agro-forest-700 text-white shadow-xs'
                      : 'bg-white text-agro-sand-600 border border-agro-sand-200'
                  }`}
                >
                  Custom Allow-listed Number
                </button>
              </div>
            </div>

            {/* Recipient Input */}
            {!useTestPhone ? (
              <div>
                <label className="font-semibold block mb-1">Select Consented Registered Farmer *</label>
                <select
                  value={selectedFarmerId}
                  onChange={(e) => setSelectedFarmerId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-agro-sand-300 text-sm focus:outline-none focus:ring-2 focus:ring-agro-forest-600 bg-white"
                >
                  {farmers.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name} — {f.district} ({f.phone}) • {f.crops?.join(', ')}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-agro-sand-500 mt-1">
                  Only active farmers with recorded voice consent who have not opted out appear in this dialer.
                </p>
              </div>
            ) : (
              <div>
                <label className="font-semibold block mb-1">Allow-listed Test Mobile Number * (E.164)</label>
                <input
                  type="text"
                  placeholder="+919842100001"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-agro-sand-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-agro-forest-600"
                />
                <p className="text-[11px] text-agro-sand-500 mt-1">
                  Per strict security rules, test numbers must belong to a consented registered farmer.
                </p>
              </div>
            )}

            {/* Spoken Language */}
            <div>
              <label className="font-semibold block mb-1">Spoken Voice Advisory Language</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLanguage('ta')}
                  className={`p-3 rounded-xl text-xs font-bold border transition-all text-left ${
                    language === 'ta'
                      ? 'bg-agro-forest-50 text-agro-forest-900 border-agro-forest-600 ring-2 ring-agro-forest-600/20'
                      : 'bg-white text-agro-sand-700 border-agro-sand-200'
                  }`}
                >
                  <div className="font-bold text-sm font-tamil">தமிழ் (Tamil)</div>
                  <div className="text-[11px] text-agro-sand-500 font-normal mt-0.5">
                    Served via &lt;Play&gt; telephony audio
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`p-3 rounded-xl text-xs font-bold border transition-all text-left ${
                    language === 'en'
                      ? 'bg-agro-forest-50 text-agro-forest-900 border-agro-forest-600 ring-2 ring-agro-forest-600/20'
                      : 'bg-white text-agro-sand-700 border-agro-sand-200'
                  }`}
                >
                  <div className="font-bold text-sm">English</div>
                  <div className="text-[11px] text-agro-sand-500 font-normal mt-0.5">
                    Served via &lt;Say&gt; Indian English voice
                  </div>
                </button>
              </div>
            </div>

            {/* Advisory Message Source */}
            <div>
              <label className="font-semibold block mb-1">Advisory Message Content Source</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setMessageSource('standard')}
                  className={`p-2 rounded-lg text-xs font-bold border ${
                    messageSource === 'standard'
                      ? 'bg-agro-sand-800 text-white border-agro-sand-900'
                      : 'bg-white text-agro-sand-700 border-agro-sand-200'
                  }`}
                >
                  Standard Telephony Test Audio
                </button>
                <button
                  type="button"
                  onClick={() => setMessageSource('alert')}
                  className={`p-2 rounded-lg text-xs font-bold border ${
                    messageSource === 'alert'
                      ? 'bg-agro-sand-800 text-white border-agro-sand-900'
                      : 'bg-white text-agro-sand-700 border-agro-sand-200'
                  }`}
                >
                  Use Approved Alert Script
                </button>
              </div>

              {messageSource === 'alert' && (
                <div className="mt-2">
                  <select
                    value={selectedAlertId}
                    onChange={(e) => setSelectedAlertId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-agro-sand-300 text-xs bg-white font-medium text-agro-sand-800"
                  >
                    <option value="">-- Choose Weather Alert --</option>
                    {alerts.map((al) => (
                      <option key={al._id} value={al._id}>
                        {al.district} - {al.type} ({al.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={calling}
                className="w-full py-3 bg-agro-forest-700 hover:bg-agro-forest-800 active:bg-agro-forest-900 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {calling ? (
                  <span>Connecting to Telephony Provider...</span>
                ) : (
                  <>
                    <PhoneCall className="w-4 h-4" />
                    <span>Initiate Voice Advisory Call</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Panel: Interactive Phone Handset & Keypad Simulator */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-agro-sand-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-agro-sand-100">
            <h3 className="text-base font-bold text-agro-sand-900">Handset & Keypad Simulator</h3>
            <span className="text-[11px] font-mono px-2 py-0.5 bg-agro-sand-100 text-agro-sand-600 rounded">
              Interactive DTMF
            </span>
          </div>

          {activeCall ? (
            <div className="space-y-4">
              {/* Call Status Display */}
              <div className="p-4 bg-agro-sand-900 text-white rounded-2xl shadow-inner space-y-2 text-center">
                <div className="text-[11px] font-mono text-agro-leaf-400 uppercase tracking-widest">
                  {activeCall.simulated ? 'SIMULATED OUTBOUND CALL' : 'EXOTEL CARRIER CALL'}
                </div>
                <div className="text-lg font-bold">
                  {activeCall.farmer?.name || 'Farmer Recipient'}
                </div>
                <div className="text-xs font-mono text-agro-sand-300">
                  {activeCall.farmer?.phone || 'Masked Destination'}
                </div>

                <div className="flex justify-center pt-2">
                  <StatusBadge status={activeCall.status} type="callStatus" />
                </div>

                {activeCall.dtmfResult && (
                  <div className="pt-2 border-t border-agro-sand-800">
                    <div className="text-[10px] text-agro-sand-400 uppercase">DTMF Keypad Result:</div>
                    <div className="mt-1 flex justify-center">
                      <StatusBadge status={activeCall.dtmfResult} type="dtmf" />
                    </div>
                  </div>
                )}
              </div>

              {/* Audio advisory preview */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-agro-sand-700">Advisory Spoken to Farmer:</div>
                <AudioPlayer
                  scriptText={activeCall.scriptSpoken}
                  language={activeCall.language || 'ta'}
                />
              </div>

              {/* Simulated DTMF Keypad */}
              <div className="p-4 bg-agro-sand-50 rounded-2xl border border-agro-sand-200 space-y-3">
                <div className="text-xs font-bold text-agro-sand-800 text-center">
                  Farmer Mobile Keypad Interaction:
                </div>
                <p className="text-[11px] text-agro-sand-500 text-center">
                  "Press 1 to acknowledge this advisory, or press 2 to replay."
                </p>

                <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto pt-1">
                  <button
                    onClick={() => handleSimulateKeypadPress('1')}
                    disabled={simulatingKey}
                    className="p-3 bg-white hover:bg-emerald-50 active:scale-95 text-agro-sand-900 border border-agro-sand-300 rounded-xl font-black text-base shadow-xs transition-all flex flex-col items-center"
                  >
                    <span>1</span>
                    <span className="text-[9px] text-emerald-700 font-bold">ACK</span>
                  </button>

                  <button
                    onClick={() => handleSimulateKeypadPress('2')}
                    disabled={simulatingKey}
                    className="p-3 bg-white hover:bg-amber-50 active:scale-95 text-agro-sand-900 border border-agro-sand-300 rounded-xl font-black text-base shadow-xs transition-all flex flex-col items-center"
                  >
                    <span>2</span>
                    <span className="text-[9px] text-amber-700 font-bold">REPLAY</span>
                  </button>

                  <button
                    onClick={() => handleSimulateKeypadPress('3')}
                    disabled={simulatingKey}
                    className="p-3 bg-white hover:bg-agro-sand-100 active:scale-95 text-agro-sand-900 border border-agro-sand-300 rounded-xl font-black text-base shadow-xs transition-all flex flex-col items-center"
                  >
                    <span>3</span>
                    <span className="text-[9px] text-agro-sand-400 font-normal">DEF</span>
                  </button>

                  <button
                    onClick={() => handleSimulateKeypadPress('4')}
                    disabled={simulatingKey}
                    className="p-3 bg-white hover:bg-agro-sand-100 active:scale-95 text-agro-sand-900 border border-agro-sand-300 rounded-xl font-black text-base shadow-xs transition-all flex flex-col items-center"
                  >
                    <span>4</span>
                    <span className="text-[9px] text-agro-sand-400 font-normal">GHI</span>
                  </button>

                  <button
                    onClick={() => handleSimulateKeypadPress('5')}
                    disabled={simulatingKey}
                    className="p-3 bg-white hover:bg-agro-sand-100 active:scale-95 text-agro-sand-900 border border-agro-sand-300 rounded-xl font-black text-base shadow-xs transition-all flex flex-col items-center"
                  >
                    <span>5</span>
                    <span className="text-[9px] text-agro-sand-400 font-normal">JKL</span>
                  </button>

                  <button
                    onClick={() => handleSimulateKeypadPress('6')}
                    disabled={simulatingKey}
                    className="p-3 bg-white hover:bg-agro-sand-100 active:scale-95 text-agro-sand-900 border border-agro-sand-300 rounded-xl font-black text-base shadow-xs transition-all flex flex-col items-center"
                  >
                    <span>6</span>
                    <span className="text-[9px] text-agro-sand-400 font-normal">MNO</span>
                  </button>

                  <button
                    onClick={() => handleSimulateKeypadPress('7')}
                    disabled={simulatingKey}
                    className="p-3 bg-white hover:bg-agro-sand-100 active:scale-95 text-agro-sand-900 border border-agro-sand-300 rounded-xl font-black text-base shadow-xs transition-all flex flex-col items-center"
                  >
                    <span>7</span>
                    <span className="text-[9px] text-agro-sand-400 font-normal">PQRS</span>
                  </button>

                  <button
                    onClick={() => handleSimulateKeypadPress('8')}
                    disabled={simulatingKey}
                    className="p-3 bg-white hover:bg-agro-sand-100 active:scale-95 text-agro-sand-900 border border-agro-sand-300 rounded-xl font-black text-base shadow-xs transition-all flex flex-col items-center"
                  >
                    <span>8</span>
                    <span className="text-[9px] text-agro-sand-400 font-normal">TUV</span>
                  </button>

                  <button
                    onClick={() => handleSimulateKeypadPress('9')}
                    disabled={simulatingKey}
                    className="p-3 bg-white hover:bg-rose-50 active:scale-95 text-agro-sand-900 border border-agro-sand-300 rounded-xl font-black text-base shadow-xs transition-all flex flex-col items-center"
                  >
                    <span>9</span>
                    <span className="text-[9px] text-rose-700 font-bold">OPTOUT</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-agro-sand-500 space-y-2">
              <PhoneCall className="w-8 h-8 text-agro-sand-300 mx-auto" />
              <p>No active call in focus.</p>
              <p className="text-[11px] text-agro-sand-400">
                Trigger an outbound call using the form to test live IVR keypad responses.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
