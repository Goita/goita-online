import * as SocketIO from "socket.io";
export default function handleAppEvent(io: SocketIO.Server) {
    io.on("connection", (socket: SocketIO.Socket) => {
        if (!socket.request.user || !socket.request.user.logged_in) {
            console.log("not authorized access");
            socket.emit("unauthorized", "Not logged in");
            return;
        }
        socket.emit("welcome", "welcome to chat server");
    });
}
