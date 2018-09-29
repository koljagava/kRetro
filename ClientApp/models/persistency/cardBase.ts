import {User} from './user';

export class CardBase {
    public id: number | undefined;
    public message: string | undefined;
    public user: User | undefined;
    public creationDateTime: Date | undefined;
    public visible: boolean | undefined;
}