import { Component, Input, OnInit } from '@angular/core';
import { NgxSubFormComponent, Controls, subformComponentProviders, FormGroupOptions } from 'ngx-sub-form';
import { ICianAdFilters } from '@lib/interfaces';
import { FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { FLAT_TYPES, FLAT_ROOMS } from '@lib/constants/feed-filters';
import { markAllControlsTouched } from '@lib/forms';

@Component({
  selector: 'app-cian-feed-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss'],
  providers: subformComponentProviders(CianFeedFilterComponent)
})
export class CianFeedFilterComponent extends NgxSubFormComponent<ICianAdFilters> implements OnInit {
  @Input()
  public formSubmitted$: Observable<any> = null;

  @Input()
  public filterIndex = 0;

  @Input()
  public formDataFilters: ICianAdFilters;

  public readonly flatTypes = FLAT_TYPES;
  public readonly flatRooms = FLAT_ROOMS;
  public readonly maxAvailableCost = 1000000000;
  public readonly maxAvailableFloors = 300;

  public ngOnInit() {
    this.formSubmitted$
      .pipe(untilDestroyed(this))
      .subscribe(() => markAllControlsTouched<ICianAdFilters>(this.formGroup, this.formGroupControls));
  }

  protected getFormControls(): Controls<ICianAdFilters> {
    return {
      flatsType: new FormControl('all'),
      rooms: new FormControl([]),
      minCost: new FormControl(null, {
        validators: [Validators.required, Validators.min(0), Validators.max(1000000000)]
      }),
      maxCost: new FormControl(null, {
        validators: [Validators.required, Validators.min(1)]
      }),
      firstStartFloor: new FormControl(null, {
        validators: [Validators.required, Validators.min(1), Validators.max(300)]
      }),
      firstFinishFloor: new FormControl(null, {
        validators: [Validators.required, Validators.min(2)]
      }),
      rangeFloors: new FormControl([])
    };
  }

  public getFormGroupControlOptions(): FormGroupOptions<ICianAdFilters> {
    return {
      validators: [
        formGroup => {
          const minCost = formGroup.get('minCost');
          const maxCost = formGroup.get('maxCost');

          if (minCost.value && maxCost.value) {
            const valid = +minCost.value <= +maxCost.value && +maxCost.value <= this.maxAvailableCost;
            const error = !valid && { matchCost: true };

            maxCost.setErrors(error);
            return error;
          }
        },
        formGroup => {
          const firstStartFloor = formGroup.get('firstStartFloor');
          const firstFinishFloor = formGroup.get('firstFinishFloor');

          if (firstStartFloor.value && firstFinishFloor.value) {
            const valid =
              +firstStartFloor.value <= +firstFinishFloor.value && +firstFinishFloor.value <= this.maxAvailableFloors;
            const error = !valid && { matchFloor: true };

            firstFinishFloor.setErrors(error);
            return error;
          }
        }
      ]
    };
  }
}
