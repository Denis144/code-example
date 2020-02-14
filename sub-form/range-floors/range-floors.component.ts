import { FormControl, FormArray } from '@angular/forms';
import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import {
  Controls,
  NgxFormWithArrayControls,
  NgxSubFormRemapComponent,
  ArrayPropertyKey,
  ArrayPropertyValue,
  subformComponentProviders
} from 'ngx-sub-form';
import { ICianRangeFloorFilters } from '@lib/interfaces';
import { Observable } from 'rxjs';

interface ICianRangeFloorForm {
  rangeFloors: ICianRangeFloorFilters[];
}

@Component({
  selector: 'app-cian-range-floors',
  templateUrl: './range-floors.component.html',
  styleUrls: ['./range-floors.component.scss'],
  providers: subformComponentProviders(CianRangeFloorsComponent)
})
export class CianRangeFloorsComponent extends NgxSubFormRemapComponent<ICianRangeFloorFilters[], ICianRangeFloorForm>
  implements NgxFormWithArrayControls<ICianRangeFloorForm> {
  @Input()
  public formSubmitted$: Observable<any> = null;

  protected getFormControls(): Controls<ICianRangeFloorForm> {
    return {
      rangeFloors: new FormArray([])
    };
  }

  protected transformToFormGroup(filters: ICianRangeFloorFilters[] | null): ICianRangeFloorForm | null {
    return {
      rangeFloors: filters || []
    };
  }

  protected transformFromFormGroup(formValue: ICianRangeFloorForm): ICianRangeFloorFilters[] | null {
    return formValue.rangeFloors;
  }

  public removeFloor(index: number): void {
    this.formGroupControls.rangeFloors.removeAt(index);
  }

  public addFloor(): void {
    this.formGroupControls.rangeFloors.push(
      this.createFormArrayControl('rangeFloors', {
        startFloor: null,
        finishFloor: null
      })
    );
  }

  public createFormArrayControl(
    key: ArrayPropertyKey<ICianRangeFloorForm> | undefined,
    value: ArrayPropertyValue<ICianRangeFloorForm>
  ): FormControl {
    return new FormControl(value);
  }
}
