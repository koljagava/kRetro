import { Team } from "./team";

export class User {
    public id: number|null = null;
    public username: string|null = null;
    public password: string|null = null;
    public firstName: string|null = null;
    public lastName: string|null = null;
    public teams : Array<Team> = new Array<Team>();
}