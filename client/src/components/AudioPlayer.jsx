import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, RotateCcw } from 'lucide-react';

export default function AudioPlayer({ audioUrl, scriptText = '', language = 'ta', className = '' }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    // If audioUrl is available, use HTML5 audio
    if (audioUrl) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play().then(() => setIsPlaying(true)).catch((e) => {
          console.warn('Audio element play failed, using web speech synthesis fallback:', e);
          speakFallback();
        });
      }
    } else {
      speakFallback();
    }
  };

  const speakFallback = () => {
    if ('speechSynthesis' in window && scriptText) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(scriptText);
        utterance.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
        utterance.rate = 0.95;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    }
  };

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      togglePlay();
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={`flex items-center gap-3 p-3 bg-agro-sand-100/80 border border-agro-sand-200 rounded-xl ${className}`}>
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}
      
      <button
        type="button"
        onClick={togglePlay}
        className="w-9 h-9 rounded-full bg-agro-forest-700 hover:bg-agro-forest-800 text-white flex items-center justify-center shadow transition-transform active:scale-95 shrink-0"
        title={isPlaying ? 'Pause advisory' : 'Play voice advisory'}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      <button
        type="button"
        onClick={restart}
        className="p-1.5 rounded-lg text-agro-sand-500 hover:text-agro-sand-800 hover:bg-agro-sand-200 transition-colors shrink-0"
        title="Replay from start"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center text-[11px] text-agro-sand-500 font-mono mb-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration || 12)}</span>
        </div>
        <div className="w-full bg-agro-sand-200 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-agro-forest-600 h-full rounded-full transition-all duration-100"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : isPlaying ? 50 : 0}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-agro-sand-600 font-medium px-2 py-1 bg-white rounded-md border border-agro-sand-200 shrink-0">
        <Volume2 className="w-3.5 h-3.5 text-agro-forest-600" />
        <span>{language === 'ta' ? 'குரல் (Tamil)' : 'Voice (EN)'}</span>
      </div>
    </div>
  );
}
