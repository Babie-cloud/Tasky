import { Routes } from '@angular/router';
//import { Landingpage } from './auth/landingpage/landingpage';
import { Login } from './auth/login/login';
import { Signup } from './auth/signup/signup';
import { Resetpassword } from './auth/resetpassword/resetpassword';
import { DashboardUser } from './components/dashboard-user/dashboard-user';
import { TacheCard } from './components/tache-card/tache-card';
import { AddTask } from './components/add-task/add-task';
import { Homepage } from './components/homepage/homepage';
import { Pricing } from './components/pricing/pricing';
export const routes: Routes = [
    //{ path: '', component: Landingpage },
    { path: '', component: Homepage },
    { path: 'login', component: Login},
    { path: 'signup', component: Signup},
    { path: 'resetpassword', component: Resetpassword},
    { path:'dashboard-user', component: DashboardUser},
    { path:'tache-card', component: TacheCard},
    { path: 'add-task', component: AddTask },
    { path : 'pricing', component: Pricing },
];
 