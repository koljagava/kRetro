import { CardBase } from "./cardBase";
import { User } from "./user";

export enum RetroActionStatus {
    New = 0,
    Open = 1,
    Done = 3
}

export class RetroAction {
    public id: number = 0;
    public description: string = "";
    public inChargeTo: User|null = null;
    public whoChecks: User|null = null;
    public card: CardBase;
    public status: RetroActionStatus = RetroActionStatus.New;

    public constructor (card : CardBase){
        this.card = card;
    }
}