import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared/shared.module';
import { ErrorModule } from '../error';
import { CheckboxAutocompleteComponent } from './checkbox-autocomplete.component';

@NgModule({
  imports: [SharedModule, ErrorModule],
  exports: [CheckboxAutocompleteComponent],
  declarations: [CheckboxAutocompleteComponent]
})
export class CheckboxAutocompleteModule {}
