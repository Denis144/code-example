import { Directive, Input, Optional, OnChanges, SimpleChanges } from '@angular/core';
import { NgControl } from '@angular/forms';

import { Policy } from '../classes';
import { PolicyStore } from '../stores';
import { checkPolicy } from '../helpers';


@Directive({
  selector: '[puvPolicy][puvPolicyEnable]',
  host: {
    '[attr.disabled]': '!enabled || null',
  },
})
export class PolicyEnableDirective implements OnChanges {

  @Input()
  set puvPolicy(name: string) {
    this._policy = this._policyStore.getPolicy(name);
  }

  @Input()
  set puvPolicyEnable(action: string) {
    this._policyAction = action;
  }

  @Input()
  set puvPolicyContext(context: unknown) {
    this._policyContext = context;
  }

  private _policy: Policy;
  private _policyAction: string;
  private _policyContext: unknown;

  private _enabled = true;

  constructor(
    @Optional() private readonly _ngControl: NgControl,
    private readonly _policyStore: PolicyStore,
  ) {}

  public get enabled(): boolean {
    return this._enabled;
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this._checkPolicy();
  }

  private _checkPolicy(): void {
    this._enabled = checkPolicy(
      this._policy,
      this._policyAction,
      this._policyContext,
    );

    if (this._ngControl && this._ngControl.control) {
      if (this._enabled) {
        this._ngControl.control.enable();
      } else {
        this._ngControl.control.disable();
      }
    }
  }

}
