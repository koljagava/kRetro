import { CardBase } from "./cardBase";

export enum ActionStatus {
    New = 0,
    Open = 1,
    Done = 3
}

export class Action {
    public id: number | undefined;
    public description: string | undefined;
    public inChargeTo: string | undefined;
    public whoChecks: string | undefined;
    public card: CardBase | undefined;
    public status: ActionStatus | undefined;
}