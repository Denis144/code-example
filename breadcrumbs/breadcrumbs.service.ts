import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

import { IBreadcrumb } from './breadcrumb.interface';

@Injectable()
export class BreadcrumbsService {
  public breadcrumbs$: Subject<IBreadcrumb[]> = new BehaviorSubject([]);

  private readonly disabledBreadcrumbs = ['external-accesses', 'objects', 'advertisement', 'contests'];
  private readonly multiplePaths = ['edit', 'view', 'upload'];

  constructor(private router: Router) {
    router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
      const paths = event.url.split('/');
      const section = paths[1];
      const breadcrumbs = [];
      paths.splice(0, 2);

      paths
        .filter(path => !+path)
        .forEach((path, index) => {
          const formatedPath = path.split('?')[0];
          const additionalParam = paths[index] && +paths[index] ? `${paths[index]}/` : '';

          const url = breadcrumbs[index - 1]
            ? `${breadcrumbs[index - 1].url}/${additionalParam}${formatedPath}`
            : `/${section}/${formatedPath}${additionalParam}`;
          const name =
            this.multiplePaths.includes(formatedPath) ? `${paths[index - 1]}_${formatedPath}` : formatedPath;
          breadcrumbs.push({ name: name.toUpperCase(), url, disabled: this.disabledBreadcrumbs.includes(name) });
        });

      this.breadcrumbs$.next(paths.length > 1 ? breadcrumbs : []);
    });
  }
}
