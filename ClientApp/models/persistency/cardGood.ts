import {User} from './user';
import {CardBase} from './cardBase';

export class CardGood extends CardBase {
    public votes: Array<User> | undefined;
}