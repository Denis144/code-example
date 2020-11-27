import {
  Router,
  UrlTree,
  CanActivate,
  CanActivateChild,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Injectable } from '@angular/core';

import { PolicyStore } from '../stores';
import { checkPolicy } from '../helpers';
import { IPolicyRouteOptions } from '../interfaces';


@Injectable({ providedIn: 'root' })
export class PolicyGuard implements CanActivate, CanActivateChild {

  constructor(
    private readonly _router: Router,
    private readonly _policyStore: PolicyStore,
  ) {}

  public canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    if (route.data && route.data.policy) {
      const policyConfig: IPolicyRouteOptions = route.data.policy;
      const policy = this._policyStore.getPolicy(policyConfig.name);
      const available = checkPolicy(policy, policyConfig.action, policyConfig.context);

      if (!available) {
        return this._getRedirectForbiddenTo(policyConfig.redirectForbiddenTo);
      }
    }

    return true;
  }

  public canActivateChild(route: ActivatedRouteSnapshot): boolean | UrlTree {
    return this.canActivate(route);
  }

  private _getRedirectForbiddenTo(redirectForbiddenTo: string): UrlTree {
    return this._router.parseUrl(redirectForbiddenTo || '/');
  }

}
