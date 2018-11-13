import {User} from './user';
import {CardGood} from "./cardGood";
import {CardBad} from './cardBad';
import {Action} from "./action";

export enum BoardStatus {
    New = 0,
    WhatWorksOpened = 1,
    WhatWorksClosed = 2,
    WhatDoesntOpened = 3,
    WhatDoesntClosed = 4,
    ActionsOpened = 5,
    ActionsClosed = 6,
    Closed = 7
};


export class WhatWorksUserVoteStatus{
    public id : number;
    public count: number;
}

export class WhatDoesntUserVoteStatus{
    public id : number;
    public count: Array<number>;
}

export class Board {
    public id: number | undefined;
    public name: string | undefined;
    public date: Date | undefined;
    public status: BoardStatus | undefined;
    public whatWorks: Array<CardGood> | undefined;
    public whatDoesnt: Array<CardBad> | undefined;
    public actions: Array<Action> | undefined;
    public manager: User | undefined;
    public whatWorksUserVoteStatues : Array<WhatWorksUserVoteStatus>;
    public whatDoesntUserVoteStatues : Array<WhatDoesntUserVoteStatus>;
};