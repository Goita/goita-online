import * as SocketIO from "socket.io";
export default function handleAppEvent(io: SocketIO.Server) {
    io.on("connection", (socket: SocketIO.Socket) => {
        if (!socket.request.user || !socket.request.user.logged_in) {
            console.log("not authorized access");
            socket.emit("unauthorized", "Not logged in");
            return;
        }
        const user = socket.request.user;
        socket.emit("login info", { id: user.userid, name: user.name, icon: user.icon });
    });
}
