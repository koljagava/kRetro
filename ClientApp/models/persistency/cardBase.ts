import {User} from './user';

export enum CardType{
    Good,
    Bad
}

export class CardBase {
    private _type: CardType
    public get type(): CardType {return this._type};

    public constructor(type: CardType ){
        this._type = type;
    }

    public id: number | undefined;
    public message: string | undefined;
    public user: User | undefined;
    public creationDateTime: Date | undefined;
    public visible: boolean | undefined;
}