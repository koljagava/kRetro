import { CardBase } from "./cardBase";

export enum ActionStatus {
    New = 0,
    Open = 1,
    Done = 3
}

export class Action {
    Id: number;
    Description: string;
    InChargeTo: string;
    WhoChecks: string;
    Card: CardBase;
    Status: ActionStatus;
}