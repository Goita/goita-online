import * as SocketIO from "socket.io";
export default function aaa(io: SocketIO.Server) {
    io.on("connection", (socket: SocketIO.Socket) => {
        return;
    });
}
