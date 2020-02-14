import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DataInput, NgxRootFormComponent, Controls } from 'ngx-sub-form';
import { IMainFeedForm } from '@lib/interfaces';
import { Subject, Observable } from 'rxjs';

@Component({
  selector: 'app-cian-main-feed-form',
  templateUrl: './main-feed-form.component.html',
  styleUrls: ['./main-feed-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CianMainFeedFormComponent extends NgxRootFormComponent<IMainFeedForm> implements OnInit {
  @DataInput()
  // tslint:disable-next-line:no-input-rename
  @Input('feedFilter')
  public dataInput: IMainFeedForm | null | undefined;

  // tslint:disable-next-line:no-output-rename
  @Output('feedFilterUpdated') public dataOutput: EventEmitter<IMainFeedForm> = new EventEmitter();

  @Input()
  public loading = false;

  @Input()
  public isEdit: boolean;

  public $formSubmitted = new Subject<any>();

  public ngOnInit() {
    super.ngOnInit();
  }

  protected getFormControls(): Controls<IMainFeedForm> {
    return {
      enabled: new FormControl(false),
      filters: new FormControl(null)
    };
  }

  public changeFeedToggle() {}

  public onSubmit(): void {
    const mainFormFiltersValue = this.formGroup.get('filters').value.length;

    if (this.formGroup) {
      this.$formSubmitted.next();

      if (this.formGroup.valid && mainFormFiltersValue) {
        this.manualSave();
      }
    }
  }
}
