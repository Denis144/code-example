import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent } from './table.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorIntlTranslate } from '@shared/ui/table/mat-paginator.translate';
import { PipesModule } from '@app/shared/pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatTooltipModule,
    PipesModule
  ],
  declarations: [TableComponent],
  exports: [TableComponent, MatTableModule, MatPaginatorModule, MatIconModule],
  providers: [{
    provide: MatPaginatorIntl,
    useClass: MatPaginatorIntlTranslate
  }]
})
export class TableModule { }
