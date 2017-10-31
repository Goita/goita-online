import UserData from "./user";

export default class Player {
    public user: UserData;
    /**
     * User has left. But game is in progress.
     * User will be removed when game finishes.
     */
    public absent: boolean;
    public ready: boolean;
    public maintime: number;
    public subtime: number;
}
