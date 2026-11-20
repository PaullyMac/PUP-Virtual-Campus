import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Navigation, Send, Volume2, VolumeX, X } from 'lucide-react';
import { NpcProfile, TimeOfDayPreset, WeatherPreset } from '../campus/campusData';
import { NpcPortrait } from './NpcPortrait';

interface DialogueMessage {
  role: 'user' | 'assistant';
  text: string;
  suggestedLandmarkId?: string | null;
  suggestedLandmarkName?: string | null;
}

interface NpcDialogueModalProps {
  npc: NpcProfile;
  currentActivity: string;
  playerPosition: { x: number; z: number };
  timeOfDay: TimeOfDayPreset;
  weather: WeatherPreset;
  onSetWaypoint: (landmarkId: string) => void;
  onClose: () => void;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

export const NpcDialogueModal: React.FC<NpcDialogueModalProps> = ({
  npc,
  currentActivity,
  playerPosition,
  timeOfDay,
  weather,
  onSetWaypoint,
  onClose,
}) => {
  const [messages, setMessages] = useState<DialogueMessage[]>([
    { role: 'assistant', text: npc.greeting },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceSpeak, setVoiceSpeak] = useState(false);
  const [listening, setListening] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setMessages([{ role: 'assistant', text: npc.greeting }]);
    setError(null);
    setInput('');
    window.setTimeout(() => inputRef.current?.focus(), 40);
  }, [npc]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakText = (text: string) => {
    if (!voiceSpeak || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-PH';
    utter.rate = 1.02;
    window.speechSynthesis.speak(utter);
  };

  const sendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || loading) return;

    const historyForApi = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/npc/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          npcId: npc.id,
          message: trimmed,
          history: historyForApi,
          playerPosition,
          timeOfDay,
          weather,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Dialogue service returned an error.');
      }
      const replyText = String(data.reply ?? '').trim();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: replyText,
          suggestedLandmarkId: data.suggestedLandmarkId ?? null,
          suggestedLandmarkName: data.suggestedLandmarkName ?? null,
        },
      ]);
      speakText(replyText);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setLoading(false);
    }
  };

  const toggleVoiceInput = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SR =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!SR) {
      setError('Voice recognition is not supported in this browser. Type your message below.');
      return;
    }

    const rec = new SR();
    rec.lang = 'en-PH';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const transcript = e.results?.[0]?.[0]?.transcript;
      if (transcript) {
        setInput(transcript);
        sendMessage(transcript);
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  return (
    <div
      className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4 pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="npc-dialogue-name"
    >
      <div className="w-full max-w-2xl rounded-xl bg-[#171213]/95 border border-[#e5a91a]/40 shadow-2xl overflow-hidden pointer-events-auto">
        {/* Character Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 bg-[#221819] border-b border-white/10">
          <div className="flex items-center gap-3.5 min-w-0">
            <NpcPortrait npc={npc} size={52} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="npc-dialogue-name"
                  className="font-display text-lg font-semibold text-[#f5f2eb] truncate"
                >
                  {npc.name}
                </h2>
                <span className="text-xs text-[#e5a91a] font-medium">{npc.roleCategory}</span>
              </div>
              <p className="text-xs text-[#d6ccbc] truncate">
                {npc.role} · {npc.department}
              </p>
              <p className="text-[11px] text-[#afa391] truncate mt-0.5">
                Currently: {currentActivity}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setVoiceSpeak((v) => !v)}
              aria-label={voiceSpeak ? 'Disable read aloud' : 'Enable read aloud'}
              title={voiceSpeak ? 'Voice playback on' : 'Voice playback off'}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                voiceSpeak
                  ? 'bg-[#7b1113] border-[#e5a91a]/60 text-white'
                  : 'bg-[#1d1718] border-white/10 text-[#cfc4b2] hover:text-white'
              }`}
            >
              {voiceSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="End conversation"
              className="p-2 rounded-lg bg-[#1d1718] border border-white/10 text-[#cfc4b2] hover:text-white hover:bg-[#2c2224] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dialogue History */}
        <div
          ref={scrollRef}
          className="px-5 py-4 space-y-3 max-h-64 overflow-y-auto campus-scroll"
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#7b1113] text-[#f5f2eb]'
                    : 'bg-[#241d1e] text-[#efe9de] border border-white/10'
                }`}
              >
                {msg.text}
              </div>

              {msg.role === 'assistant' && msg.suggestedLandmarkId && msg.suggestedLandmarkName && (
                <button
                  type="button"
                  onClick={() => {
                    onSetWaypoint(msg.suggestedLandmarkId!);
                    onClose();
                  }}
                  className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2a2117] hover:bg-[#3a2d1e] border border-[#e5a91a]/45 text-xs font-medium text-[#f2ca68] transition-colors cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Set Waypoint to {msg.suggestedLandmarkName}
                </button>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#cfc4b2] px-1">
              <span>{npc.name.split(' ')[0]} is thinking...</span>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-lg bg-[#3b1518] border border-[#e05258]/50 px-3.5 py-2.5 text-xs text-[#ffd7d9]"
            >
              {error}
            </div>
          )}
        </div>

        {/* Starter Question Prompts (only on first turn for effortless discovery) */}
        {messages.length <= 1 && !loading && (
          <div className="px-5 pb-2.5 flex flex-wrap gap-1.5">
            {npc.sampleQuestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => sendMessage(q)}
                className="px-2.5 py-1.5 rounded-md bg-[#241c1d] hover:bg-[#332729] border border-white/10 text-xs text-[#dfd6c7] transition-colors cursor-pointer text-left"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex items-center gap-2 px-4 py-3 bg-[#130f10] border-t border-white/10"
        >
          <button
            type="button"
            onClick={toggleVoiceInput}
            aria-label={listening ? 'Stop voice input' : 'Speak to NPC'}
            className={`p-2.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
              listening
                ? 'bg-[#7b1113] border-[#e5a91a] text-white'
                : 'bg-[#211b1c] border-white/10 text-[#d6ccbc] hover:text-white'
            }`}
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${npc.name} about PUP Sta. Mesa, directions, or campus life...`}
            aria-label={`Message to ${npc.name}`}
            disabled={loading}
            className="flex-1 bg-[#211b1c] border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-[#f5f2eb] placeholder-[#9c907f] focus:outline-none focus:border-[#e5a91a]"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#7b1113] hover:bg-[#961619] disabled:opacity-45 text-sm font-semibold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
