import {Team} from '../models/persistency/team';
import { Injectable, Inject } from '@angular/core';
import { Http } from '@angular/http';
import {User} from '../models/persistency/user';
import 'rxjs/add/operator/map'
import { Observable, Subscribable} from 'rxjs/Observable';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ReplaySubject } from 'rxjs';
//import * as $ from 'jquery';
import { InjectionToken } from '@angular/core';

export const ORIGIN_URL = new InjectionToken<string>('ORIGIN_URL');

@Injectable()
export class UserService implements CanActivate {
    private _isBrowser : boolean;

    constructor(@Inject(PLATFORM_ID) platformId: Object, private router: Router, private http: Http, @Inject('LOCALSTORAGE') private localStorage: any) { 
        this._isBrowser = isPlatformBrowser(platformId);
    }

    getById(userId: number|null) : Observable<User>  {
        return this.http.post('/api/User/Get', {userId:userId}).map(result => {
            return result.json();
        });
    }

    getUserTeams(userId? : number|null) : Observable<Array<Team>> {
        return this.http.post('/api/User/GetUserTeams', {userId:userId}).map(result => {
            return result.json();
        });
    }

    create(user: User) {
        return this.http.post('/api/User/Create', user);
    }

    update(user: User) {
        return this.http.post('/api/User/Update', user);
    }

    delete(id: number) {
        return this.http.post('/api/User/Delete', id);
    }

    login(username: string, password: string) {
        return this.http.post('/api/User/Authenticate', { Username: username, Password: password })
             .map(res => {
                     var user:User = res.json();
                     // store user details and jwt token in local storage to keep user logged in between page refreshes
                     this.localStorage.setItem('currentUser', user.id);
                 return user;
             });
    }

    public get currentUserId() : number|null
    {
        let uid = this.localStorage.getItem('currentUser');
        return uid == null ? null : Number(uid);
    }

    logout() {
        // remove user from local storage to log user out
        this.localStorage.removeItem('currentUser');
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        if (this._isBrowser && this.currentUserId!= null) {
            return true;
        }

        // not logged in so redirect to login page with the return url
        this.router.navigate(['/login'], { queryParams: { returnUrl: state.url }});
        return false;
    }

    public get isBrowser() : boolean {
        return this._isBrowser;
    }

}