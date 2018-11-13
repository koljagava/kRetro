import {User} from './user';
import {CardBase, CardType} from './cardBase';

export enum BadVoteType {
    Easy = 0,
    Significant = 1,
    Unexpected = 2
}

export class BadVote {
    public type: BadVoteType | undefined;
    public user: User | undefined;
}

export class CardBad extends CardBase {
    constructor(){
        super(CardType.Bad);
    }
    public votes: Array<BadVote> | undefined;
}