import {User} from './user';
import {CardBase} from './cardBase';

export enum BadVoteType {
    Facile = 0,
    Sentito = 1,
    Inaspettato = 2
}

export class BadVote {
    public type: BadVoteType | undefined;
    public user: User | undefined;
}

export class CardBad extends CardBase {
    public votes: Array<BadVote> | undefined;
}