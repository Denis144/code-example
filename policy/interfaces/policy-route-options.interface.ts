import { IPolicyOptions } from './policy-options.interface';


export interface IPolicyRouteOptions extends IPolicyOptions {
  redirectForbiddenTo?: string;
}
