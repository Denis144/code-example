import { NgModule } from '@angular/core';

import {
  PolicyDirective,
  PolicyEnableDirective,
  PolicyDisableDirective,
} from './directives';


@NgModule({
  exports: [
    PolicyDirective,
    PolicyEnableDirective,
    PolicyDisableDirective,
  ],
  declarations: [
    PolicyDirective,
    PolicyEnableDirective,
    PolicyDisableDirective,
  ],
})
export class PolicyModule {}
