import {
  Input,
  Directive,
  OnChanges,
  TemplateRef,
  SimpleChanges,
  EmbeddedViewRef,
  ViewContainerRef,
} from '@angular/core';

import { Policy } from '../classes';
import { PolicyStore } from '../stores';
import { checkPolicy } from '../helpers';


@Directive({
  selector: '[puvPolicy][puvPolicyCan]',
})
export class PolicyDirective implements OnChanges {

  @Input()
  public set puvPolicy(name: string) {
    this._policy = this._policyStore.getPolicy(name);
  }

  @Input()
  public set puvPolicyContext(target: unknown) {
    this._policyContext = target;
  }

  @Input()
  public set puvPolicyCan(action: string) {
    this._policyAction = action;
  }

  @Input()
  public set puvPolicyThen(templateRef: TemplateRef<void>) {
    this._thenViewRef = null;
    this._thenTemplateRef = templateRef;
  }

  @Input()
  public set puvPolicyElse(templateRef: TemplateRef<void>) {
    this._elseViewRef = null;
    this._elseTemplateRef = templateRef;
  }

  private _policy: Policy;
  private _policyAction: string;
  private _policyContext: unknown;

  private _thenViewRef: EmbeddedViewRef<void>;
  private _thenTemplateRef: TemplateRef<void>;
  private _elseViewRef: EmbeddedViewRef<void>;
  private _elseTemplateRef: TemplateRef<void>;

  constructor(
    templateRef: TemplateRef<void>,
    private readonly _viewContainerRef: ViewContainerRef,
    private readonly _policyStore: PolicyStore,
  ) {
    this._thenTemplateRef = templateRef;
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this._updateView();
  }

  private _updateView(): void {
    const checkPolicyResult = checkPolicy(
      this._policy,
      this._policyAction,
      this._policyContext,
    );

    if (checkPolicyResult && !this._thenViewRef) {
      this._elseViewRef = null;

      this._viewContainerRef.clear();

      if (this._thenTemplateRef) {
        this._thenViewRef = this._viewContainerRef.createEmbeddedView(this._thenTemplateRef);
      }
    } else if (!checkPolicyResult && !this._elseViewRef) {
      this._thenViewRef = null;

      this._viewContainerRef.clear();

      if (this._elseTemplateRef) {
        this._elseViewRef = this._viewContainerRef.createEmbeddedView(this._elseTemplateRef);
      }
    }
  }

}
