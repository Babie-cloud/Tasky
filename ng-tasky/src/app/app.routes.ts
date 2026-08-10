import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { Signup } from './auth/signup/signup';
import { Resetpassword } from './auth/resetpassword/resetpassword';
import { DashboardUser } from './components/dashboard-user/dashboard-user';
import { TacheCard } from './components/tache-card/tache-card';
import { AddTask } from './components/add-task/add-task';
import { Homepage } from './components/homepage/homepage';
import { Pricing } from './components/pricing/pricing';
import { AcceptInvite } from './components/accept-invite/accept-invite';
import { authGuard } from './core/guard/auth-guard';
import { Profile } from './components/profile/profile';
import { PolicyPrivacy } from './layout/policy-privacy/policy-privacy';
import { Terms } from './layout/terms/terms';
export const routes: Routes = [
    { path: '', component: Homepage },
    { path: 'login', component: Login},
    { path: 'signup', component: Signup},
    { path: 'resetpassword', component: Resetpassword},
    { path : 'pricing', component: Pricing },
    { path:'dashboard-user', component: DashboardUser, canActivate: [authGuard] },
    { path:'tache-card', component: TacheCard},
    { path: 'add-task', component: AddTask },
    { path: 'boards/accept-invite', component: AcceptInvite, canActivate: [authGuard] },
    { path: 'profile', component: Profile},
     { path: 'terms', component: Terms },
    { path: 'policy-privacy', component: PolicyPrivacy },
  //  { path: 'boards/:id', component: DashboardUser },
];  