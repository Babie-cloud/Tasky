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
import { CategoryManager } from './components/category-manager/category-manager';
export const routes: Routes = [
  { path: '', component: Homepage },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: 'resetpassword', component: Resetpassword },
  { path: 'pricing', component: Pricing },
  { path: 'add-task', component: AddTask },
  { path: 'category-manager', component: CategoryManager },
  { path: 'dashboard-user', component: DashboardUser, canActivate: [authGuard] },
  { path: 'board/:boardId', component: TacheCard, canActivate: [authGuard] },
  { path: 'board/:boardId/add-task', component: AddTask, canActivate: [authGuard] },
  { path: 'boards/accept-invite', component: AcceptInvite, canActivate: [authGuard] },
  { path: 'profile', component: Profile },
  { path: 'terms', component: Terms },
  { path: 'policy-privacy', component: PolicyPrivacy },
];