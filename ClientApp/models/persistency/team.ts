import { Board } from "./board";
import { BoardConfig } from "./boardConfig";

export class Team {
    public id: number|null = null;
    public name: string|null=null;
    public boardConfiguration : BoardConfig;
    public boards: Array<Board> = new Array<Board>()
}