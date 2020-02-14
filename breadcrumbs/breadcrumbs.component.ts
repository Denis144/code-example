import { Component } from '@angular/core';
import { BreadcrumbsService } from '@app/core/breadcrumbs/breadcrumbs.service';

@Component({
  selector: 'app-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.scss']
})
export class BreadcrumbsComponent {
  constructor(public breadcrumbsService: BreadcrumbsService) {}
}
