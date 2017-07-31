import * as bcrypt from "bcrypt-nodejs";
import * as mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    authtype: String,
    local: {
        username: { type: String, unique: true },
        password: String,
        email: String,
    },
    facebook: {
        id: String,
        username: String,
        token: String,
        email: String,
    },
});

UserSchema.methods.generateHash = (password: string) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
UserSchema.methods.validPassword = (password: string) => {
    return bcrypt.compareSync(password, this.local.password);
};

export const User = mongoose.model("User", UserSchema);
