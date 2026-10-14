import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/useAuthStore.js';
import { usePlannerStore } from '../stores/usePlannerStore.js';

interface PeerMember {
  socketId: string;
  studentId: string;
  name: string;
}

export const StudyRoom: React.FC = () => {
  const { student } = useAuthStore();
  const { pet, addPetXp } = usePlannerStore();
  const [roomId, setRoomId] = useState('engineering-focus-room-1');
  const [joined, setJoined] = useState(false);
  const [peers, setPeers] = useState<PeerMember[]>([]);

  // Synchronized timer state
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5001', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // connected
    });

    socket.on('room:presence', (data: { members: PeerMember[]; timer?: { remaining: number; isRunning: boolean } }) => {
      setPeers(data.members || []);
      if (data.timer) {
        setTimeLeft(data.timer.remaining);
        setIsRunning(data.timer.isRunning);
      }
    });

    socket.on('timer:tick', (data: { remaining: number }) => {
      setTimeLeft(data.remaining);
      setIsRunning(true);
    });

    socket.on('timer:state', (data: { remaining: number; isRunning: boolean }) => {
      setTimeLeft(data.remaining);
      setIsRunning(data.isRunning);
    });

    socket.on('timer:end', () => {
      setIsRunning(false);
      setTimeLeft(25 * 60);
      addPetXp(35);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleJoin = () => {
    if (!socketRef.current) return;
    socketRef.current.emit('room:join', {
      roomId,
      studentId: student?._id || 'anon',
      name: student?.name || 'Scholar',
    });
    setJoined(true);
  };

  const handleStartTimer = (durationMinutes = 25) => {
    if (!socketRef.current) return;
    socketRef.current.emit('timer:start', {
      roomId,
      duration: durationMinutes * 60,
    });
  };

  const handlePauseTimer = () => {
    if (!socketRef.current) return;
    socketRef.current.emit('timer:pause', { roomId });
  };

  const handleResetTimer = (minutes = 25) => {
    if (!socketRef.current) return;
    socketRef.current.emit('timer:reset', { roomId, duration: minutes });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Silent Co-Working Study Deck
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Synchronized silent study with active peer presence to eliminate isolation and phone checking.
          </p>
        </div>

        {!joined ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="input"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Room Code"
              style={{ width: '220px' }}
            />
            <button onClick={handleJoin} className="btn btn-primary btn-sm">
              Enter Room ➔
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Room: {roomId}</span>
          </div>
        )}
      </div>

      {!joined ? (
        <div className="card-glass" style={{ textAlign: 'center', padding: '64px 24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎧</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Enter Synchronized Silent Study</h2>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '480px', margin: '8px auto 24px' }}>
            Study alongside classmates with a unified Pomodoro countdown. No text chat or distractions — pure accountability.
          </p>
          <button onClick={handleJoin} className="btn btn-primary btn-lg">
            Connect to {roomId} ➔
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px' }}>
          {/* Synchronized Timer Deck */}
          <div
            className="card-glass"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 32px',
              textAlign: 'center',
              border: isRunning ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
              boxShadow: isRunning ? '0 0 40px rgba(6, 182, 212, 0.15)' : 'none',
            }}
          >
            <span className="badge badge-accent" style={{ marginBottom: '16px' }}>
              {isRunning ? 'SYNCHRONIZED FOCUS IN PROGRESS' : 'STUDY DECK STANDBY'}
            </span>

            <div
              style={{
                fontSize: '5rem',
                fontWeight: 900,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '-0.05em',
                color: isRunning ? 'var(--color-accent)' : 'var(--color-text-primary)',
                margin: '12px 0',
              }}
            >
              {formatTime(timeLeft)}
            </div>

            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>
              Timer ticks synchronously across all connected peers in this room.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              {isRunning ? (
                <button onClick={handlePauseTimer} className="btn btn-secondary btn-lg">
                  Pause Timer
                </button>
              ) : (
                <button onClick={() => handleStartTimer(25)} className="btn btn-primary btn-lg">
                  Start Synchronized 25m Focus
                </button>
              )}
              <button onClick={() => handleResetTimer(25)} className="btn btn-ghost">
                Reset
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
              <button onClick={() => handleStartTimer(5)} className="btn btn-ghost btn-sm">
                5m Break
              </button>
              <button onClick={() => handleStartTimer(15)} className="btn btn-ghost btn-sm">
                15m Break
              </button>
              <button onClick={() => handleStartTimer(50)} className="btn btn-ghost btn-sm">
                50m Deep Flow
              </button>
            </div>
          </div>

          {/* Active Peer Presence Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Peer Presence</h3>
                <span className="badge badge-success">{peers.length} Online</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {peers.map((peer) => (
                  <div
                    key={peer.socketId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      background: 'var(--color-bg-elevated)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        color: '#fff',
                      }}
                    >
                      {peer.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{peer.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#10b981' }}>Studying silently</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Study Pet Mascot in Room */}
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '24px',
                background: 'radial-gradient(circle at 50% 30%, rgba(6, 182, 212, 0.1), transparent 70%), var(--color-bg-surface)',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '8px' }}>
                {isRunning ? '🧘' : '🦉'}
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{pet.name} is keeping pace</div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                +35 XP awarded upon completion of this synchronized study block.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
