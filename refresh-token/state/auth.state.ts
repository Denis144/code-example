import { MatSnackBar } from '@angular/material';
import { IError, IUser } from '@lib/interfaces';
import { Navigate } from '@ngxs/router-plugin';
import { Action, NgxsOnInit, Selector, State, StateContext } from '@ngxs/store';
import { throwError } from 'rxjs';
import { catchError, filter, tap } from 'rxjs/operators';

import { AuthService } from '../shared/auth.service';
import {
  Activate,
  ActivationFailed,
  ActivationSuccess,
  CheckSession,
  Login,
  LoginFailed,
  LoginRedirect,
  LoginSuccess,
  Logout,
  RemoveUser,
  RecoverPassword,
  RecoverSuccess,
  RecoverFailed,
  RefreshToken,
  RefreshTokenFailed,
  AutoLogin
} from './auth.actions';
import { AuthStateModel } from './auth.model';
import { ErrorSnackBarService } from '@app/core/services';

@State<AuthStateModel>({
  name: 'auth',
  defaults: {
    user: null,
    loading: false
  }
})
export class AuthState implements NgxsOnInit {
  @Selector()
  public static user({ user }: AuthStateModel) {
    return user;
  }

  @Selector()
  public static loading({ loading }: AuthStateModel) {
    return loading;
  }

  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private errorSnackBarService: ErrorSnackBarService
  ) {}

  /**
   * Dispatch CheckSession on start
   */
  public ngxsOnInit(ctx: StateContext<AuthStateModel>) {
    ctx.dispatch(new CheckSession());
  }

  /**
   * Commands
   */
  @Action(CheckSession)
  public checkSession(ctx: StateContext<AuthStateModel>) {
    const { user } = ctx.getState();

    if (!user) {
      ctx.dispatch(new LoginRedirect());
      return;
    }

    return this.authService.checkSession().pipe(
      tap(currentUser => {
        currentUser.refreshToken = user.refreshToken;
        ctx.patchState({ user: currentUser });
      }),
      catchError(error => {
        ctx.dispatch(new Logout());
        return throwError(error);
      })
    );
  }

  @Action(RefreshToken)
  public refreshToken(ctx: StateContext<AuthStateModel>, { userId, refreshToken }: RefreshToken) {
    return this.authService.refreshToken(userId, refreshToken).pipe(
      tap(currentUser => {
        ctx.patchState({ user: currentUser });
      }),
      catchError(error => {
        ctx.dispatch(new Logout());
        this.errorSnackBarService.showError('Ошибка аутентификации');
        return throwError(error);
      })
    );
  }

  @Action(Login)
  public login(ctx: StateContext<AuthStateModel>, { email, password }: Login) {
    ctx.patchState({ loading: true });

    return this.authService.login(email, password).pipe(
      filter(user => !!user),
      tap((user: IUser) => ctx.dispatch(new LoginSuccess(user))),
      catchError((errors: IError[]) => {
        ctx.dispatch(new LoginFailed(errors));
        return throwError(errors);
      })
    );
  }

  @Action(AutoLogin)
  public autoLogin(ctx: StateContext<AuthStateModel>, { token }: AutoLogin) {
    ctx.patchState({ loading: true });

    return this.authService.autoLogin(token).pipe(
      filter(user => !!user),
      tap((user: IUser) => ctx.dispatch(new LoginSuccess(user))),
      catchError((errors: IError[]) => {
        ctx.dispatch(new Logout());
        ctx.patchState({ loading: false });
        return throwError(errors);
      })
    );
  }

  @Action(Activate)
  public activate(ctx: StateContext<AuthStateModel>, { token, password }: Activate) {
    ctx.patchState({ loading: true });

    return this.authService.activate(token, password).pipe(
      tap(() => ctx.dispatch(new ActivationSuccess())),
      catchError((errors: IError[]) => {
        ctx.dispatch(new ActivationFailed(errors));
        return throwError(errors);
      })
    );
  }

  @Action(Logout)
  public logout(ctx: StateContext<AuthStateModel>) {
    ctx.dispatch([new RemoveUser(), new LoginRedirect()]);
  }

  @Action(RecoverPassword)
  public recoverPassword(ctx: StateContext<AuthStateModel>, { email }: RecoverPassword) {
    ctx.patchState({ loading: true });

    return this.authService.recoverPassword(email).pipe(
      tap(() => ctx.dispatch(new RecoverSuccess())),
      catchError((errors: IError[]) => {
        ctx.dispatch(new RecoverFailed(errors));
        return throwError(errors);
      })
    );
  }

  @Action(RemoveUser)
  public removeUser(ctx: StateContext<AuthStateModel>) {
    ctx.patchState({ user: null });
  }

  /**
   * Events
   */
  @Action(LoginRedirect)
  public onLoginRedirect(ctx: StateContext<AuthStateModel>) {
    ctx.dispatch(new Navigate(['/auth/sign-in']));
  }

  @Action(LoginSuccess)
  public onLoginSuccess(ctx: StateContext<AuthStateModel>) {
    this.snackBar.open('Вы успешно вошли в систему');
    ctx.dispatch(new Navigate(['/']));
  }

  @Action(LoginSuccess)
  public setUserStateOnSuccess(ctx: StateContext<AuthStateModel>, { user }: LoginSuccess) {
    ctx.patchState({ user, loading: false });
  }

  @Action(LoginFailed)
  public onLoginFailed(ctx: StateContext<AuthStateModel>, { errors }: LoginFailed) {
    this.errorSnackBarService.showError('Не удалось войти в систему');
    ctx.patchState({ loading: false });
    ctx.dispatch(new RemoveUser());
    return throwError(errors);
  }

  @Action(RefreshTokenFailed)
  public onRefreshTokenFailed(ctx: StateContext<AuthStateModel>) {
    this.errorSnackBarService.showError('Ошибка аутентификации');
    ctx.patchState({ loading: false });
  }

  @Action(RecoverSuccess)
  public onRecoverSuccess(ctx: StateContext<AuthStateModel>) {
    this.snackBar.open('Ссылка на восстановление пароля успешно отправлена');
    ctx.patchState({ loading: false });
  }

  @Action(RecoverFailed)
  public onRecoverFailed(ctx: StateContext<AuthStateModel>, { errors }: RecoverFailed) {
    this.errorSnackBarService.showError('Не удалось отправить ссылку на восстановление пароля');
    ctx.patchState({ loading: false });
    return throwError(errors);
  }

  @Action(ActivationSuccess)
  public onActivationSuccess(ctx: StateContext<AuthStateModel>) {
    this.snackBar.open('Пароль успешно создан');
    ctx.patchState({ loading: false });
    ctx.dispatch(new LoginRedirect());
  }

  @Action(ActivationFailed)
  public onActivationFailed(ctx: StateContext<AuthStateModel>, { errors }: ActivationFailed) {
    this.errorSnackBarService.showError('Не удалось создать пароль');
    ctx.patchState({ loading: false });
    return throwError(errors);
  }
}
