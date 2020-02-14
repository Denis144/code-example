import { FormControl, FormArray } from '@angular/forms';
import { Component, Input } from '@angular/core';
import {
  Controls,
  NgxFormWithArrayControls,
  NgxSubFormRemapComponent,
  ArrayPropertyKey,
  ArrayPropertyValue,
  subformComponentProviders
} from 'ngx-sub-form';
import { ICianAdFilters } from '@lib/interfaces';
import { Observable } from 'rxjs';

interface ICianAdFeedForm {
  cianAdFilters: ICianAdFilters[];
}

@Component({
  selector: 'app-cian-feed-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss'],
  providers: subformComponentProviders(CianFeedFiltersComponent)
})
export class CianFeedFiltersComponent extends NgxSubFormRemapComponent<ICianAdFilters[], ICianAdFeedForm>
  implements NgxFormWithArrayControls<ICianAdFeedForm> {
  @Input()
  public formSubmitted$: Observable<any> = null;

  @Input()
  public loading = false;

  protected getFormControls(): Controls<ICianAdFeedForm> {
    return {
      cianAdFilters: new FormArray([])
    };
  }

  protected transformToFormGroup(obj: ICianAdFilters[] | null): ICianAdFeedForm | null {
    return {
      cianAdFilters: !obj ? [] : obj
    };
  }

  protected transformFromFormGroup(formValue: ICianAdFeedForm): ICianAdFilters[] | null {
    return formValue.cianAdFilters;
  }

  public removeFeedFilter(index: number): void {
    this.formGroupControls.cianAdFilters.removeAt(index);
  }

  public addFurnishVariant(): void {
    this.formGroupControls.cianAdFilters.push(
      this.createFormArrayControl('cianAdFilters', {
        flatsType: 'all',
        rooms: [],
        minCost: null,
        maxCost: null,
        firstStartFloor: null,
        firstFinishFloor: null,
        rangeFloors: []
      })
    );
  }

  public createFormArrayControl(
    key: ArrayPropertyKey<ICianAdFeedForm> | undefined,
    value: ArrayPropertyValue<ICianAdFeedForm>
  ): FormControl {
    return new FormControl(value);
  }
}
