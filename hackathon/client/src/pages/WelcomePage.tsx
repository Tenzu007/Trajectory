import React from 'react';

interface WelcomePageProps {
  onGetStarted: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/welcome-bg.jpg')" }}
      />

      {/* Gradient overlay – darker at bottom for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />

      {/* Floating nature particles (pure CSS) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/10 animate-pulse"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${2 + i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl mx-auto">
        {/* Logo badge */}
        <div className="mb-6 flex items-center gap-3 bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-6 py-2.5 shadow-lg">
          <span className="text-2xl">🐄</span>
          <span className="text-white/90 font-semibold text-sm tracking-widest uppercase">
            DairyPulse Platform
          </span>
        </div>

        {/* Main heading */}
        <h1
          className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight"
          style={{ fontFamily: "'Playfair Display', serif", textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
        >
          Dairy
          <span className="text-green-300">Pulse</span>
        </h1>

        {/* Tagline */}
        <p
          className="text-lg md:text-xl text-white/85 mb-3 font-light leading-relaxed"
          style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}
        >
          Every Drop Accounted. Every Standard Assured.
        </p>
        <p
          className="text-sm md:text-base text-white/65 mb-10 max-w-xl"
          style={{ textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}
        >
          Real-time monitoring · AI-powered insights · Zero-waste roadmap for modern dairy operations
        </p>

        {/* Stats row */}
        <div className="flex gap-8 mb-10">
          {[
            { label: 'Modules', value: '16+' },
            { label: 'Demo Scenarios', value: '6' },
            { label: 'AI Features', value: '8' },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-bold text-green-300" style={{ textShadow: '0 0 20px rgba(134,239,172,0.4)' }}>
                {value}
              </div>
              <div className="text-white/60 text-xs mt-1 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={onGetStarted}
          className="group relative px-10 py-4 bg-green-500 hover:bg-green-400 text-white text-lg font-semibold rounded-full shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-green-500/40"
          style={{ boxShadow: '0 8px 32px rgba(34,197,94,0.35)' }}
        >
          <span className="relative z-10 flex items-center gap-3">
            Get Started
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>

        {/* Subtle note */}
        <p className="mt-5 text-white/40 text-xs">
          Built for hackathon demo · No IoT hardware required
        </p>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />

      {/* Version tag */}
      <div className="absolute bottom-4 right-6 text-white/30 text-xs">v1.0 · DairyPulse 2024</div>
    </div>
  );
};

export default WelcomePage;

