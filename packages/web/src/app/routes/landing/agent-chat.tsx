import { motion } from 'motion/react';
import { Send, Sparkles } from 'lucide-react';
import { useState } from 'react';

/**
 * Interactive AI-agent chat card for the landing product tour.
 *
 * Adapted from the 21st.dev ai-chat community card — animated border, drifting
 * particles, typing indicator — recolored to the Plugr/Stitch blue palette with
 * a scripted Plugr automation reply.
 */

type Message = { sender: 'ai' | 'user'; text: string };

const BLUE = '#0055ff';

const SCRIPTED_REPLY =
  'On it — I’ll watch for new leads, enrich each one, and post a summary to #sales. Want me to add a follow-up email step?';

export function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Hi — I’m your Plugr agent. Tell me what to automate.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const send = () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { sender: 'ai', text: SCRIPTED_REPLY }]);
      setIsTyping(false);
    }, 1100);
  };

  return (
    <div className="relative mx-auto h-[440px] w-full max-w-[380px] overflow-hidden rounded-2xl p-[1.5px]">
      {/* Rotating gradient border */}
      <motion.div
        aria-hidden
        className="absolute inset-[-50%]"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, ${BLUE} 80deg, transparent 160deg, transparent 360deg)`,
        }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      <div
        className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl"
        style={{ backgroundColor: '#0a0b14' }}
      >
        {/* Drifting particles */}
        {Array.from({ length: 14 }).map((_, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute h-1 w-1 rounded-full"
            style={{
              left: `${(i * 37) % 100}%`,
              bottom: '-8%',
              backgroundColor: i % 3 === 0 ? BLUE : 'rgba(255,255,255,0.25)',
            }}
            animate={{ y: ['0%', '-1400%'], opacity: [0, 1, 0] }}
            transition={{
              duration: 5 + (i % 4),
              repeat: Infinity,
              delay: i * 0.45,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Header */}
        <div
          className="relative z-10 flex items-center gap-2 border-b px-4 py-3"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="flex size-7 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${BLUE}1f`, color: BLUE }}
          >
            <Sparkles className="size-4" strokeWidth={1.5} />
          </div>
          <span className="text-sm font-semibold text-white">Plugr Agent</span>
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-white/40">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: '#00c853' }}
            />
            online
          </span>
        </div>

        {/* Messages */}
        <div className="relative z-10 flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4 text-sm">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-[82%] rounded-xl px-3 py-2"
              style={
                msg.sender === 'ai'
                  ? {
                      alignSelf: 'flex-start',
                      backgroundColor: 'rgba(255,255,255,0.07)',
                      color: 'rgba(255,255,255,0.9)',
                    }
                  : {
                      alignSelf: 'flex-end',
                      backgroundColor: BLUE,
                      color: '#ffffff',
                    }
              }
            >
              {msg.text}
            </motion.div>
          ))}
          {isTyping && (
            <div
              className="flex max-w-[40%] items-center gap-1 self-start rounded-xl px-3 py-2.5"
              style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
            >
              {[0, 1, 2].map((d) => (
                <motion.span
                  key={d}
                  className="h-1.5 w-1.5 rounded-full bg-white/70"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div
          className="relative z-10 flex items-center gap-2 border-t p-3"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <input
            className="flex-1 rounded-lg border bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none"
            style={{ borderColor: 'rgba(255,255,255,0.12)' }}
            placeholder="Describe an automation…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button
            onClick={send}
            aria-label="Send message"
            className="flex size-9 items-center justify-center rounded-lg text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: BLUE }}
          >
            <Send className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}