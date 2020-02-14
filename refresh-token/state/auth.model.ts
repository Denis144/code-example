import { IUser } from '@lib/interfaces';

export interface AuthStateModel {
  user: IUser;
  loading: boolean;
}
