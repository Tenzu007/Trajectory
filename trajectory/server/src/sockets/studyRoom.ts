import { Server, Socket } from 'socket.io';

interface RoomMember {
  socketId: string;
  studentId: string;
  name: string;
}

interface RoomState {
  members: Map<string, RoomMember>;
  timerRemaining: number;
  timerTotal: number;
  isTimerRunning: boolean;
  interval?: NodeJS.Timeout;
}

const rooms = new Map<string, RoomState>();

function getOrCreateRoom(roomId: string): RoomState {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      members: new Map(),
      timerRemaining: 25 * 60,
      timerTotal: 25 * 60,
      isTimerRunning: false,
    });
  }
  return rooms.get(roomId)!;
}

export function initStudyRoomSockets(io: Server): void {
  io.on('connection', (socket: Socket) => {
    let currentRoomId: string | null = null;
    let currentStudentId: string | null = null;

    socket.on('room:join', ({ roomId, studentId, name }: { roomId: string; studentId: string; name: string }) => {
      currentRoomId = roomId;
      currentStudentId = studentId;

      socket.join(roomId);
      const room = getOrCreateRoom(roomId);
      room.members.set(socket.id, { socketId: socket.id, studentId, name });

      // Broadcast updated presence
      const membersList = Array.from(room.members.values());
      io.to(roomId).emit('room:presence', {
        members: membersList,
        timer: {
          remaining: room.timerRemaining,
          total: room.timerTotal,
          isRunning: room.isTimerRunning,
        },
      });
    });

    socket.on('timer:start', ({ roomId, duration }: { roomId: string; duration?: number }) => {
      const room = getOrCreateRoom(roomId);
      if (room.isTimerRunning) return;

      const total = duration || room.timerRemaining || 25 * 60;
      room.timerRemaining = total;
      room.timerTotal = total;
      room.isTimerRunning = true;

      io.to(roomId).emit('timer:state', {
        remaining: room.timerRemaining,
        total: room.timerTotal,
        isRunning: true,
      });

      if (room.interval) clearInterval(room.interval);
      room.interval = setInterval(() => {
        room.timerRemaining -= 1;
        io.to(roomId).emit('timer:tick', { remaining: room.timerRemaining });

        if (room.timerRemaining <= 0) {
          clearInterval(room.interval);
          room.isTimerRunning = false;
          room.timerRemaining = 25 * 60;
          io.to(roomId).emit('timer:end', {});
        }
      }, 1000);
    });

    socket.on('timer:pause', ({ roomId }: { roomId: string }) => {
      const room = getOrCreateRoom(roomId);
      if (room.interval) clearInterval(room.interval);
      room.isTimerRunning = false;
      io.to(roomId).emit('timer:state', {
        remaining: room.timerRemaining,
        total: room.timerTotal,
        isRunning: false,
      });
    });

    socket.on('timer:reset', ({ roomId, duration }: { roomId: string; duration?: number }) => {
      const room = getOrCreateRoom(roomId);
      if (room.interval) clearInterval(room.interval);
      room.isTimerRunning = false;
      const total = (duration || 25) * 60;
      room.timerRemaining = total;
      room.timerTotal = total;
      io.to(roomId).emit('timer:state', {
        remaining: total,
        total,
        isRunning: false,
      });
    });

    const cleanup = () => {
      if (currentRoomId && rooms.has(currentRoomId)) {
        const room = rooms.get(currentRoomId)!;
        room.members.delete(socket.id);
        const membersList = Array.from(room.members.values());
        io.to(currentRoomId).emit('room:presence', {
          members: membersList,
          timer: {
            remaining: room.timerRemaining,
            total: room.timerTotal,
            isRunning: room.isTimerRunning,
          },
        });
        if (room.members.size === 0) {
          if (room.interval) clearInterval(room.interval);
          rooms.delete(currentRoomId);
        }
      }
    };

    socket.on('room:leave', cleanup);
    socket.on('disconnect', cleanup);
  });
}
