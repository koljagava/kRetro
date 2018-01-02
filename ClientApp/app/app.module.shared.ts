import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './components/app/app.component';
import { NavMenuComponent } from './components/navmenu/navmenu.component';
import { BoardMenuComponent } from './components/boardmenu/boardmenu.component';
import { HomeComponent } from './components/home/home.component';
import { UserService} from './services/user.service';
import { BoardService} from './services/board.service';
import { AlertComponent} from './components/alert/alert.component';
import { AlertService} from './services/alert.service';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { BoardComponent } from './components/board/board.component';

@NgModule({
    declarations: [
        AppComponent,
        NavMenuComponent,
        BoardMenuComponent,
        HomeComponent,
        AlertComponent,
        LoginComponent,
        BoardComponent,
        RegisterComponent        
    ],
    imports: [
        CommonModule,
        HttpModule,
        FormsModule,
        RouterModule.forRoot([
            { path: '', redirectTo: 'home', pathMatch: 'full'},
            { path: 'home', component: HomeComponent, canActivate: [UserService] },
            { path: 'login', component: LoginComponent },
            { path: 'register', component: RegisterComponent },
            { path: 'board/:teamId', component: BoardComponent , canActivate: [UserService] },
            { path: '**', redirectTo: 'home'}
        ])
    ],    
    providers: [
        { provide: 'LOCALSTORAGE', useFactory: getLocalStorage },
        AlertService,
        UserService,
        BoardService
    ]
})
export class AppModuleShared {
}

export function getLocalStorage() {
    return (typeof window !== "undefined") ? window.localStorage : KLocalStorage;
}

export class KLocalStorage{
    public static storage:any = {};

    static setItem(key:string, item:object){
        KLocalStorage.storage[key] = item;
    }

    static getItem(key:string, item:object){
        return KLocalStorage.storage[key];
    }
}