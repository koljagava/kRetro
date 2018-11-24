import { CardBase } from "./cardBase";

export enum RetroActionStatus {
    New = 0,
    Open = 1,
    Done = 3
}

export class RetroAction {
    public id: number = 0;
    public description: string = "";
    public inChargeTo: string = "";
    public whoChecks: string = "";
    public card: CardBase;
    public status: RetroActionStatus = RetroActionStatus.New;

    public constructor (card : CardBase){
        this.card = card;
    }
}