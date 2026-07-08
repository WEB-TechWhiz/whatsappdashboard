// const { Server } = require("socket.io");
import { Server } from "socket.io";
// const jwt = require("jsonwebtoken");
import jwt from "jsonwebtoken";

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_ORIGIN, credentials: true },
  });

  // Auth happens at the socket handshake — same JWT used for REST.
  // A dashboard client cannot join another workspace's room even if it
  // guesses the workspace id, because the room name is derived from the
  // verified token, not from anything the client sends.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Missing token"));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.workspaceId = payload.workspaceId;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const room = workspaceRoom(socket.workspaceId);
    socket.join(room);

    socket.on("disconnect", () => {
      // no-op for now — presence/online tracking could hook in here later
    });
  });

  return io;
}

function workspaceRoom(workspaceId) {
  return `workspace:${workspaceId}`;
}

// Called from route handlers after a DB write, to push updates to
// every connected dashboard client for that workspace.
function emitToWorkspace(workspaceId, event, payload) {
  if (!io) return; // socket layer not initialized (e.g. in tests) — fail silently
  io.to(workspaceRoom(workspaceId)).emit(event, payload);
}

export { initSocket, emitToWorkspace };
