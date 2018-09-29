import {User} from './user';
import {CardGood} from "./cardGood";
import {CardBad} from './cardBad';
import {Action} from "./action";

export enum BoardStatus {
    New = 0,
    OpenWhatWorks = 1,
    CloseWhatWorks = 2,
    OpenWhatDont = 3,
    CloseWhatDont = 4,
    OpenActions = 5,
    CloseActions = 6,
    Close = 7
};

export class Board {
    public id: number | undefined;
    public name: string | undefined;
    public date: Date | undefined;
    public status: BoardStatus | undefined;
    public whatWorks: Array<CardGood> | undefined;
    public whatDont: Array<CardBad> | undefined;
    public actions: Array<Action> | undefined;
    public manager: User | undefined;
};