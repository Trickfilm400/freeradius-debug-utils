import * as express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { logger } from "./utils/logger";
import {
  ISocketClientToServerEvents,
  ISocketData,
  ISocketInterServerEvents,
  ISocketServerToClientEvents,
} from "./interfaces/Socket";
import {
  getContainerList,
  logStream,
  restartContainer,
  startContainer,
  stopContainer,
} from "./handlers/socket";
import { dockerAPI } from "./handlers/docker";

const app = express();
const server = createServer(app);
const io = new Server<
  ISocketClientToServerEvents,
  ISocketServerToClientEvents,
  ISocketInterServerEvents,
  ISocketData
>(server, { cors: { origin: "*" } });

// app.get('/', (req, res) => {});

io.on("connection", (socket) => {
  logger.info("a user connected");

  socket.on("startContainer", startContainer);
  socket.on("stopContainer", stopContainer);
  socket.on("restartContainer", restartContainer);
  socket.on("startTrailing", logStream);
  socket.on("getContainerList", getContainerList);
  //on connect, send container list
  dockerAPI
    .getContainerList()
    .then((data) => {
      console.log(data);
      socket.emit("containerList", data);
    })
    .catch(logger.error);
});

server.listen(3000, () => {
  logger.info("server running at http://localhost:3000");
});

export { io };
