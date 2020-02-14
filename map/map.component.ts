import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  ViewChild,
  ViewEncapsulation,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { Observable } from 'rxjs';

import { Map } from 'yandex-maps';
import { filter, take, switchMap } from 'rxjs/operators';
import { CatalogState, FetchCatalogMap } from '../../state';
import { Select, Store } from '@ngxs/store';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { IMarkerCoordsComplexes } from '@lib/interfaces';

declare const ymaps: any;

@Component({
  selector: 'app-catalog-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogMapComponent implements OnDestroy {
  @Select(CatalogState.mapObjects)
  public mapObjects$: Observable<IMarkerCoordsComplexes[]>;

  @ViewChild('map')
  public mapContainer: ElementRef;

  @Input()
  public loading: boolean;

  public showMap = false;

  private map: Map;
  private clusterer: any;

  constructor(private store: Store, private detector: ChangeDetectorRef) {}

  public ngOnDestroy() {}

  public getMapObjects() {
    this.store
      .dispatch(new FetchCatalogMap())
      .pipe(
        take(1),
        filter(mapObjects => !!mapObjects),
        switchMap(() => this.openMap()),
        switchMap(() =>
          this.mapObjects$.pipe(
            untilDestroyed(this),
            filter(mapObjects => !!mapObjects)
          )
        )
      )
      .subscribe(mapObjects => this.setMarkers(mapObjects));
  }

  public openMap() {
    this.showMap = true;
    this.detector.detectChanges();

    return ymaps.ready().then(() => {
      this.map = new ymaps.Map(
        this.mapContainer.nativeElement,
        {
          center: [47.23, 39.71],
          zoom: 12,
          controls: ['zoomControl', 'fullscreenControl']
        },
        {
          suppressObsoleteBrowserNotifier: true,
          yandexMapDisablePoiInteractivity: true,
          suppressMapOpenBlock: true
        }
      );

      this.map.behaviors.disable('scrollZoom');

      this.clusterer = new ymaps.Clusterer({ groupByCoordinates: false });

      const fullscreenControl = this.map.controls.get('fullscreenControl');

      fullscreenControl.events.add('fullscreenenter', () => this.map.behaviors.enable('scrollZoom'));
      fullscreenControl.events.add('fullscreenexit', () => {
        this.map.behaviors.disable('scrollZoom');
        this.map.balloon.close();
      });
    });
  }

  private setMarkers(mapObjects: IMarkerCoordsComplexes[]) {
    this.clusterer.removeAll();
    this.map.geoObjects.removeAll();

    if (!mapObjects) {
      return;
    }

    const geoObjects = mapObjects.map(
      ({ markerCoords }, i) =>
        new ymaps.Placemark(markerCoords, this.getPointData(mapObjects[i]), {
          preset: 'islands#blueStretchyIcon'
        })
    );

    if (geoObjects.length) {
      this.clusterer.add(geoObjects);
      this.map.geoObjects.add(this.clusterer);

      this.map.setBounds(this.clusterer.getBounds(), { checkZoomRange: true });
      this.map.events.add('click', () => this.map.balloon.close());
      this.map.events.add('touchend', () => this.map.balloon.close());
    }
  }

  private getPointData(complexInfo: IMarkerCoordsComplexes) {
    return {
      iconContent: complexInfo.name,
      balloonContentBody: `
      <a
        id="baloon"
        href="erp/catalog/${complexInfo.id}/view"
        target="_blank"
        data-id="${complexInfo.id}"
        class="catalog-map__baloon"
      >
        <div style="background-image:url(${complexInfo.coverPhoto.image})" class="catalog-map__complex-render"></div>
        <div class="catalog-map__complex-content">
          <div class="catalog-map__complex-price">от ${complexInfo.minFlatPrice || 0} руб</div>
          <div class="catalog-map__complex-name">${complexInfo.name}</div>
        </div>
      </a>`
    };
  }
}
