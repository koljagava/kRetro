import {User} from './user';
import {CardBase} from './cardBase';

export enum BadVoteType {
    Facile = 0,
    Sentito = 1,
    Inaspettato = 2
}

export class BadVote {
    Type: BadVoteType;
    User: User;
}

export class CardBad extends CardBase {
    Votes: BadVote[];
}