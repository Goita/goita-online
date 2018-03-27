import { UserModel } from "./models/User";

export default class UserData {
    /** same as User model */
    public id: string;

    /** public display name */
    public name: string;

    /** rating */
    public rate: number;

    /** model's icon image url. null for non-public */
    public icon: string;

    /** room No. */
    public roomNo: number;

    /** datetime for joined room */
    public joinedTime: Date;

    public constructor(model: UserModel) {
        this.id = model.userid;
        this.name = model.name;
        this.rate = model.rate;
        this.icon = model.icon;
        this.joinedTime = new Date(Date.now());
        this.roomNo = 0;
    }

    public get isInRoom(): boolean {
        return this.roomNo > 0;
    }
}
