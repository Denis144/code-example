import {
  Component,
  forwardRef,
  Input,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  ContentChildren,
  QueryList,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter
} from '@angular/core';
import { NG_VALUE_ACCESSOR, FormControl } from '@angular/forms';

import { IEntity } from '@lib/interfaces';
import { MatAutocompleteTrigger, MatAutocomplete, MatError } from '@angular/material';
import { merge, fromEvent } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { untilDestroyed } from 'ngx-take-until-destroy';

@Component({
  selector: 'app-checkbox-autocomplete',
  templateUrl: './checkbox-autocomplete.component.html',
  styleUrls: ['../autocomplete/autocomplete.component.scss', './checkbox-autocomplete.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => CheckboxAutocompleteComponent)
    }
  ]
})
export class CheckboxAutocompleteComponent implements OnInit, OnDestroy {
  public get value(): IEntity {
    return this._value;
  }

  public set value(value: IEntity) {
    this._value = value;
  }

  private _value: IEntity;

  @Input()
  public label: string;

  @Input()
  public displayWith: (value) => string;

  @Input()
  public items: IEntity[];

  @Input()
  public selectedItems: IEntity[];

  @Input()
  public hasColor: boolean;

  @Input()
  public invalid: boolean;

  @Input()
  public required = false;

  @Input()
  public set formControl(value: FormControl) {
    this._formControl = value;
  }

  public get formControl(): FormControl {
    return this._formControl;
  }

  @Output()
  public selectedItemsChange: EventEmitter<IEntity[]> = new EventEmitter();

  @ViewChild('input')
  public inputElem: ElementRef<HTMLInputElement>;

  @ViewChild('input', { read: MatAutocompleteTrigger })
  public autocompleteTrigger: MatAutocompleteTrigger;

  @ViewChild('autocomplete')
  public matAutocomplete: MatAutocomplete;

  @ContentChildren(MatError)
  public matErrors: QueryList<MatError> = new QueryList();

  public readonly chipListControl: FormControl = new FormControl('');

  public readonly inputControl: FormControl = new FormControl('');

  // tslint:disable-next-line:no-magic-numbers
  public readonly separatorKeysCodes: number[] = [9, 13, 16, 37, 38, 39, 40];

  private _formControl: FormControl;

  // tslint:disable-next-line:no-empty
  public onChange = (value: any[] | string) => {};
  public onTouched = () => {};

  public ngOnInit() {
    merge(this.inputControl.valueChanges, fromEvent(this.inputElem.nativeElement, 'focus'))
      .pipe(
        debounceTime(200),
        map(() => this.inputControl.value || ''),
        untilDestroyed(this)
      )
      .subscribe(value => this.onChange(value));

    this.inputControl.setValue(null, { emitEvent: false });
  }

  public ngOnDestroy() {}

  public writeValue(items: IEntity[]): void {
    this.selectedItems = items;
    this.onChange(items);
  }

  public registerOnChange(onChange: (value: any[] | string) => void) {
    this.onChange = onChange;
  }

  public registerOnTouched(onTouched: () => void) {
    this.onTouched = onTouched;
  }

  public onBlur() {
    this.onTouched();
  }

  public itemChecked({ id }: IEntity) {
    return this.selectedItems.map(({ id: selectedItemId }) => selectedItemId).includes(id);
  }

  public onSelect(event: Event, item: IEntity) {
    event.stopPropagation();
    const selectedComplexIndex = this.selectedItems.findIndex(({ id }) => id === item.id);
    const selectedItemIds = this.selectedItems.map(({ id }) => id);

    if (!selectedItemIds.includes(item.id)) {
      this.writeValue([...(this.selectedItems || []), item]);
    } else if (selectedComplexIndex >= 0) {
      this.selectedItems.splice(selectedComplexIndex, 1);
      this.writeValue([...this.selectedItems]);
    }

    this.updateControlValue();
  }

  public onSelectAllChips() {
    const selectedItemIds = this.selectedItems.map(({ id }) => id);
    const additionalItems = this.items.filter(({ id }) => !selectedItemIds.includes(id));

    this.writeValue([...this.selectedItems, ...additionalItems]);
    this.updateControlValue();
  }

  public onRemoveAllChips() {
    this.writeValue([]);
    this.updateControlValue();
  }

  public updateControlValue() {
    this.inputElem.nativeElement.value = '';

    if (typeof this.inputControl.value === 'string') {
      this.inputControl.setValue(null);
    }

    this.selectedItemsChange.emit(this.selectedItems);
  }

  public setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.chipListControl.disable();
    } else {
      this.chipListControl.enable();
    }
  }

  public openPanel() {
    if (this.chipListControl.enabled) {
      this.autocompleteTrigger.openPanel();
    }
  }
}
