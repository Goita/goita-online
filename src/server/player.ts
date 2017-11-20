import UserData from "./user";

export default class Player {
    /**
     * even if user left, game continues.
     * user will be removed when game finishes.
     */
    public user: UserData;

    public absent: boolean;
    public ready: boolean;
    public maintime: number;
    public subtime: number;

    public constructor() {
        this.user = null;
        this.absent = false;
        this.ready = false;
        this.maintime = 0;
        this.subtime = 0;
    }
}
