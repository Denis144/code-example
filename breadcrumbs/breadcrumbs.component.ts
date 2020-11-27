import { Component, Input, OnInit } from '@angular/core';
import { BreadcrumbsService } from '@app/services/breadcrumbs.service';

@Component({
  selector: 'app-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.less'],
})
export class BreadcrumbsComponent implements OnInit {
  @Input()
  divideIcon: string = 'remove';

  @Input()
  additionalLabels: { [key: string]: { label: string; url: string } };

  constructor(public breadcrumbsService: BreadcrumbsService) {}

  ngOnInit() {}
}
