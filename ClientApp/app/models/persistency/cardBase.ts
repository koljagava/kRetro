import {User} from './user';

export class CardBase {
    Id: number;
    Message: string;
    User: User;
    CreationDateTime: Date;
    Visible: boolean;
}