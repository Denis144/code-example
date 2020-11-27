import { Injector, Injectable, OnDestroy } from '@angular/core';

import { Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { PermissionManager } from '@lib/permissions';
import { CurrentUser, Session } from '@lib/auth';


@Injectable()
export abstract class Policy implements OnDestroy {

  public abstract readonly name: string;

  private _currentUser: CurrentUser | null;

  private readonly _session: Session;
  private readonly _permissions: PermissionManager;

  private readonly _destroy$ = new Subject<void>();

  constructor(injector: Injector) {
    this._session = injector.get(Session);
    this._permissions = injector.get(PermissionManager);

    this._listenPayloadChange();
  }

  public get currentUser(): CurrentUser | null {
    return this._currentUser;
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private _listenPayloadChange(): void {
    this._session.payload$
      .pipe(
        distinctUntilChanged((prev, next) => {
          return prev && next && prev.user.uuid === next.user.uuid;
        }),
        takeUntil(this._destroy$),
      )
      .subscribe((payload) => {
        this._currentUser = payload
          ? new CurrentUser(this._session, this._permissions)
          : null;
      });
  }

}
