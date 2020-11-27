import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableGroupsComponent } from './table-groups.component';
import { TableModule } from '../table';
import { TableCellActionsModule } from '../table-cell-actions';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PipesModule } from '@app/shared/pipes/pipes.module';
import {MatSortModule} from '@angular/material/sort';

@NgModule({
  imports: [
    CommonModule,
    TableModule,
    TableCellActionsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatTooltipModule,
    PipesModule,
    MatSortModule
  ],
  declarations: [TableGroupsComponent],
  exports: [TableGroupsComponent]
})
export class TableGroupsModule { }
