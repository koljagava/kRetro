import {User} from './user';
import { CardGood } from "./cardGood";
import {CardBad} from './cardBad';
import { Action } from "./action";

export enum BoardStatus {
    New = 0,
    Open = 1,
    Close = 2
}

export class Board {
    Id: number;
    Name: string;
    Date: Date;
    Status: BoardStatus;
    WhatWorks: CardGood[];
    WhatDont: CardBad[];
    Actions: Action[];
    Manager: User;
}