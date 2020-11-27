import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

@Injectable()
export class MatPaginatorIntlTranslate extends MatPaginatorIntl {

  itemsPerPageLabel = 'Результатов на странице';
  nextPageLabel = 'Следующая страница';
  previousPageLabel = 'Предыдущая страница';
  lastPageLabel = 'Последняя страница';
  firstPageLabel = 'Первая страница';

  getRangeLabel = (page: number, pageSize: number, length: number) =>  {
    if (length === 0 || pageSize === 0) {
      return `0 / ${length}`;
    }
    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    return `${startIndex + 1} - ${endIndex} / ${length}`;
  }
}
