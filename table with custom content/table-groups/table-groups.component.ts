import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  ElementRef,
  ViewChildren,
  QueryList,
  Renderer2,
  AfterViewInit,
  ChangeDetectorRef,
  ViewChild,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { TableComponent } from '../table/table.component';
import { IPagination, ITableActionInfo, ITableRowFilter } from '@app/shared/interfaces';
import { TableCellActionsComponent } from '../table-cell-actions/table-cell-actions.component';
import { MatRow } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import _ from 'lodash';
import { PageEvent } from '@angular/material/paginator';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-table-groups',
  templateUrl: './table-groups.component.html',
  styleUrls: ['./table-groups.component.less'],
})
export class TableGroupsComponent extends TableComponent implements OnInit, AfterViewInit, OnChanges {
  @Input()
  filter: ITableRowFilter;

  @Input()
  sorting: string[];

  @Input()
  summary: any;

  @Input()
  showSummary = false;

  @Output()
  actionTrigger = new EventEmitter<ITableActionInfo>();

  @Output() updateParams = new EventEmitter<IPagination>();

  @Output() selectionChanged: EventEmitter<any> = new EventEmitter();

  @ViewChildren(TableCellActionsComponent, { read: ElementRef })
  tableCellActionsRefList: QueryList<ElementRef>;

  @ViewChildren(MatRow, { read: ElementRef })
  tableRowRefList: QueryList<ElementRef>;

  @ViewChild(MatSort) sort: MatSort;

  sortedData: any;
  currentSort = { column: '', direction: '' };

  get hasSummary(): boolean {
    return !!this.summary;
  }

  constructor(private renderer: Renderer2, protected changeDetectorRef: ChangeDetectorRef) {
    super(changeDetectorRef);
  }

  ngOnInit() {
    super.ngOnInit();
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.sort?.sortChange.subscribe(() => {
      let param = this.pageInfo();
      if (this.sort.direction) {
        param = { ...param, sort: `${this.sort.direction === 'asc' ? '+' : '-'}${this.sort.active}` };
      }
      this.updateParams.emit(param);
    });
    this.pagination$?.pipe(filter((params) => !!params)).subscribe(({ sort }) => {
      if (sort) {
        this.currentSort = {
          column: sort.substring(1),
          direction: sort.startsWith('+') ? 'asc' : 'desc',
        };
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    this.displayedColumns = this.columnsDescription.map(({ key }) => key);
  }

  trackByIndex(i) {
    return i;
  }

  onTableRowSelected(rowData: ITableActionInfo, event: Event, rowIndex: number) {
    const currentTableCellActionsRef = this.tableCellActionsRefList.find((_, index) => index === rowIndex);
    const currentTableRowRefList = this.tableRowRefList.find((_, index) => index === rowIndex);
    const isActiveClassExist =
      currentTableRowRefList && currentTableRowRefList.nativeElement.className.includes('table-groups__row_active');
    const isTableCellActionsRef =
      currentTableCellActionsRef && currentTableCellActionsRef.nativeElement.contains(event.target);

    if (isActiveClassExist && !isTableCellActionsRef) {
      this.actionTrigger.emit({ id: rowData?.id?.toString(), actionType: 'open', status: rowData?.status, ...rowData });
    } else {
      this.tableRowRefList.forEach((element) =>
        this.renderer.removeClass(element.nativeElement, 'table-groups__row_active')
      );
      this.renderer.addClass(currentTableRowRefList.nativeElement, 'table-groups__row_active');
    }
    this.selectionChanged.emit(rowData);
  }

  onActionClick({ id, actionType }: ITableActionInfo, row: any) {
    this.actionTrigger.emit({ id, actionType, row });
  }

  getActions(row, column) {
    return row.actions?.length > 1 ? row.actions.filter((item) => item.key === column.key) : row.actions;
  }

  paginatorChange(pageEvent: PageEvent) {
    this.paginationInfo = pageEvent;
    let param = this.pageInfo();
    if (this.sort.direction) {
      param = { ...param, sort: `${this.sort.direction === 'asc' ? '+' : '-'}${this.sort.active}` };
    }

    this.updateParams.emit(param);
    this.paginationChanged.emit(pageEvent);
  }

  private pageInfo(): IPagination {
    const pagination = this.paginationInfo || this.pagination$.getValue();
    const total = pagination['total'] || this.pagination$.getValue()['length'];
    return { pageSize: pagination.pageSize, total, pageIndex: pagination.pageIndex };
  }
}
