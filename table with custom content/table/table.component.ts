import {
  Component,
  OnInit,
  Input,
  ViewChild,
  AfterViewInit,
  Output,
  EventEmitter,
  QueryList,
  TemplateRef,
  ContentChildren,
  ChangeDetectorRef,
} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import {ITableElementData, ITableColumnDescriptionItem, IPagination} from '@shared/interfaces';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
})
export class TableComponent implements OnInit, AfterViewInit {
  @Input()
  dataSource: ITableElementData[] = [];

  @Input()
  loading: boolean;

  @Input()
  newUI = false;

  @Input()
  columnsDescription: ITableColumnDescriptionItem[] = [];

  @Input()
  pagination$: BehaviorSubject<IPagination>;

  @Input()
  addButtonVisible = false;

  @Input()
  set cellTemplates(value: QueryList<TemplateRef<any>>) {
    this._cellTemplates = value;
  }

  get cellTemplates(): QueryList<TemplateRef<any>> {
    return this._cellTemplates;
  }

  private _cellTemplates: QueryList<TemplateRef<any>>;

  @ContentChildren(TemplateRef)
  set viewCellTemplate(value: QueryList<TemplateRef<any>>) {
    if (!this._cellTemplates && value) {
      this._cellTemplates = value;
    }
  }

  @Output()
  paginationChanged = new EventEmitter<PageEvent>();

  pageSizeOptions = [5, 10, 20, 50];
  paginationInfo: PageEvent;
  displayedColumns: string[];

  templateSortedByKeyList = {};

  constructor(protected changeDetectorRef: ChangeDetectorRef) {
  }

  ngOnInit() {
    if (this.columnsDescription && this.columnsDescription.length) {
      this.displayedColumns = this.columnsDescription.map(({key}) => key);
    }
  }

  ngAfterViewInit() {
    this.cellTemplates.forEach(
      (tabInstance: any) =>
        (this.templateSortedByKeyList[tabInstance._declarationTContainer.localNames[0]] = tabInstance)
    );
    this.changeDetectorRef.detectChanges();
  }

  isNewUI(): boolean {
    return this.newUI;
  }

  paginatorChange(pageEvent: PageEvent) {
    this.paginationInfo = pageEvent;
    this.paginationChanged.emit(pageEvent);
  }
}
