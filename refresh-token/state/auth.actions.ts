import { IError, IUser } from '@lib/interfaces';

// Actions
export class Login {
  public static readonly type = '[Auth] Login';
  constructor(public readonly email: string, public readonly password: string) {}
}

export class AutoLogin {
  public static readonly type = '[Auth] AutoLogin';
  constructor(public readonly token: string) {}
}

export class Logout {
  public static readonly type = '[Auth] Logout';
}

export class RecoverPassword {
  public static readonly type = '[Auth] RecoverPassword';
  constructor(public readonly email: string) {}
}

export class CheckSession {
  public static readonly type = '[Auth] CheckSession';
}

export class RefreshToken {
  public static readonly type = '[Auth] RefreshToken';
  constructor(public readonly userId: number, public readonly refreshToken: string) {}
}

export class RemoveUser {
  public static readonly type = '[Auth] RemoveUser';
}

export class Activate {
  public static readonly type = '[Auth] Activate';
  constructor(public readonly token: string, public readonly password: string) {}
}

// Events
export class LoginRedirect {
  public static readonly type = '[Auth] LoginRedirect';
}

export class LoginSuccess {
  public static readonly type = '[Auth] LoginSuccess';
  constructor(public readonly user: IUser) {}
}

export class LoginFailed {
  public static readonly type = '[Auth] LoginFailed';
  constructor(public readonly errors: IError[]) {}
}

export class RefreshTokenFailed {
  public static readonly type = '[Auth] RefreshTokenFailed';
}

export class RecoverSuccess {
  public static readonly type = '[Auth] RecoverSuccess';
}

export class RecoverFailed {
  public static readonly type = '[Auth] RecoverFailed';
  constructor(public readonly errors: IError[]) {}
}

export class ActivationSuccess {
  public static readonly type = '[Auth] ActivationSuccess';
}

export class ActivationFailed {
  public static readonly type = '[Auth] ActivationFailed';
  constructor(public readonly errors: IError[]) {}
}
