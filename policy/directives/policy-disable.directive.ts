import { Directive, Input, Optional, SimpleChanges, OnChanges } from '@angular/core';
import { NgControl } from '@angular/forms';

import { Policy } from '../classes';
import { PolicyStore } from '../stores';
import { checkPolicy } from '../helpers';


@Directive({
  selector: '[puvPolicy][puvPolicyDisable]',
  host: {
    '[attr.disabled]': 'disabled || null',
  },
})
export class PolicyDisableDirective implements OnChanges {

  @Input()
  set puvPolicy(name: string) {
    this._policy = this._policyStore.getPolicy(name);
  }

  @Input()
  set puvPolicyDisable(action: string) {
    this._policyAction = action;
  }

  @Input()
  set puvPolicyContext(context: unknown) {
    this._policyContext = context;
  }

  private _policy: Policy;
  private _policyAction: string;
  private _policyContext: unknown;

  private _disabled = true;

  constructor(
    @Optional() private readonly _ngControl: NgControl,
    private readonly _policyStore: PolicyStore,
  ) {}

  public get disabled(): boolean {
    return this._disabled;
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this._checkPolicy();
  }

  private _checkPolicy(): void {
    this._disabled = checkPolicy(
      this._policy,
      this._policyAction,
      this._policyContext,
    );

    if (this._ngControl && this._ngControl.control) {
      if (this._disabled) {
        this._ngControl.control.disable();
      } else {
        this._ngControl.control.enable();
      }
    }
  }

}
