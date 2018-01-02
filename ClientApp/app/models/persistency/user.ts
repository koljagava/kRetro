import { Team } from "./team";

export class User {
    id: number;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    teams : Array<Team>;
}