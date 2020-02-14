import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanLoad, Route, RouterStateSnapshot } from '@angular/router';
import { LoginRedirect } from '@app/core/auth/state/auth.actions';
import { AuthState } from '@app/core/auth/state/auth.state';
import { Store } from '@ngxs/store';

@Injectable()
export class AuthGuard implements CanActivate, CanLoad {
  constructor(private store: Store) {}

  public canActivate(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): boolean {
    return this.checkUser();
  }

  public canLoad(route: Route): boolean {
    return this.checkUser();
  }

  private checkUser(): boolean {
    const user = this.store.selectSnapshot(AuthState.user);

    if (!user) {
      this.store.dispatch(new LoginRedirect());
      return false;
    }

    return true;
  }
}
