import { Component, Input, OnInit } from '@angular/core';
import { NgxSubFormComponent, Controls, subformComponentProviders, FormGroupOptions } from 'ngx-sub-form';
import { ICianRangeFloorFilters } from '@lib/interfaces';
import { FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { markAllControlsTouched } from '@lib/forms';

@Component({
  selector: 'app-cian-range-floor',
  templateUrl: './range-floor.component.html',
  styleUrls: ['./range-floor.component.scss'],
  providers: subformComponentProviders(CianRangeFloorComponent)
})
export class CianRangeFloorComponent extends NgxSubFormComponent<ICianRangeFloorFilters> implements OnInit {
  @Input()
  public formSubmitted$: Observable<any> = null;

  public readonly maxAvailableFloors = 300;

  public ngOnInit() {
    this.formSubmitted$
      .pipe(untilDestroyed(this))
      .subscribe(() => markAllControlsTouched<ICianRangeFloorFilters>(this.formGroup, this.formGroupControls));
  }

  protected getFormControls(): Controls<ICianRangeFloorFilters> {
    return {
      startFloor: new FormControl(null, { validators: [Validators.required, Validators.min(1), Validators.max(300)] }),
      finishFloor: new FormControl(null, { validators: [Validators.required, Validators.min(2)] })
    };
  }

  public getFormGroupControlOptions(): FormGroupOptions<ICianRangeFloorFilters> {
    return {
      validators: [
        formGroup => {
          const startFloor = formGroup.get('startFloor');
          const finishFloor = formGroup.get('finishFloor');

          if (startFloor.value && finishFloor.value) {
            const valid = +startFloor.value <= +finishFloor.value && +finishFloor.value <= this.maxAvailableFloors;
            const error = !valid && { matchFloor: true };

            finishFloor.setErrors(error);
            return error;
          }
        }
      ]
    };
  }
}
