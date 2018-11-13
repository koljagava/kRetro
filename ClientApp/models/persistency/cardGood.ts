import {User} from './user';
import {CardBase, CardType} from './cardBase';

export class CardGood extends CardBase {
    constructor(){
        super(CardType.Good);
    }
    public votes: Array<User> | undefined;
}