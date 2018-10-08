import {User} from './user';
import {CardGood} from "./cardGood";
import {CardBad} from './cardBad';
import {Action} from "./action";

export enum BoardStatus {
    New = 0,
    WhatWorksOpened = 1,
    WhatWorksClosed = 2,
    WhatDesntOpened = 3,
    WhatDesntClosed = 4,
    ActionsOpened = 5,
    ActionsClosed = 6,
    Closed = 7
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