import { Injectable, Optional, Inject, SkipSelf } from '@angular/core';

import { Policy } from '../classes';
import { POLICY } from '../providers';


@Injectable({ providedIn: 'root' })
export class PolicyStore {

  private readonly _policies = new Map<string, Policy>();

  constructor(
    @Optional() @SkipSelf() private _parentStore: PolicyStore,
    @Optional() @Inject(POLICY) policies: Policy[],
  ) {
    if (policies) {
      this._attachPoliciesToMap(policies);
    }
  }

  public getPolicy(name: string): Policy {
    let policy = this._policies.get(name);

    if (!policy && this._parentStore) {
      policy = this._parentStore.getPolicy(name);
    }

    if (!policy) {
      throw new Error(`Policy with name ${name} not registered`);
    }

    return policy;
  }

  private _attachPoliciesToMap(policies: Policy[]): void {
    policies.forEach((policy) => {
      this._policies.set(policy.name, policy);
    });
  }

}
