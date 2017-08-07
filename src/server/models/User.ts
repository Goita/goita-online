import * as bcrypt from "bcrypt-nodejs";
import * as mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    userid: { type: String, unique: true, index: true },
    authtype: String,
    password: String,
    username: String,
    email: String,
    photos: String,
    token: String,
}, {
        collection: "users",
    });

UserSchema.methods.generateHash = (password: string) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
UserSchema.methods.validPassword = (password: string) => {
    return bcrypt.compareSync(password, this.local.password);
};

export const User = mongoose.model("User", UserSchema);
