import * as bcrypt from "bcrypt-nodejs";
import * as mongoose from "mongoose";

export type UserModel = mongoose.Document & {
    userid: string,
    public: boolean,
    authprovider: string,

    name: string,
    email: string,
    icon: string,
    settings: {
        displayname: string,
        gravatar: string,
    },
    token: string,
    rate: number,
    generateHash: (password: string) => string,
    validPassword: (password: string) => boolean,
};

const UserSchema = new mongoose.Schema({
    userid: { type: String, unique: true, index: true },
    public: Boolean,
    authprovider: String,

    name: String,
    email: String,
    icon: String,
    settings: {
        displayname: String,
        gravatar: String,
    },
    token: String,
    rate: { type: Number, default: 1300 },
}, {
        collection: "users",
    });

UserSchema.methods.generateHash = (password: string) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
};

// checking if password is valid
UserSchema.methods.validPassword = (password: string) => {
    return bcrypt.compareSync(password, this.password);
};

export const User = mongoose.model<UserModel>("User", UserSchema);
