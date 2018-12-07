import { Team } from "./team";

export class User {
    public id: number|null = 0;
    public username: string|null = null;
    public password: string|null = null;
    public firstName: string|null = null;
    public lastName: string|null = null;
    public team : Team|null = null;
}