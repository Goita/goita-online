// Type definitions for passport.socketio 3.7.0
// Project: https://github.com/jfromaniello/passport.socketio
// Definitions by: yoskeoka <https://github.com/yoskeoka>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

import * as SocketIo from "socket.io";
import * as passport from "passport";
import * as session from "express-session";

interface AuthorizeOptions {
    passport: passport.PassportStatic,
    cookieParser: any,
    key: string,
    secret: string,
    store: session.Store, //さっきの sessionStore 渡す
    success: (data: any, accept: (data: any, result: boolean) => void) => void,
    fail: (data: any, message: any, error: any, accept: (data: any, result: boolean) => void) => void,
}
declare module "passport.socketio" {
    function authorize(options: AuthorizeOptions): (socket: any, fn: (err?: any) => void) => void;
}

