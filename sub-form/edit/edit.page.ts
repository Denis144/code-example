import { Component, OnInit } from '@angular/core';
import { IMainFeedForm, ICianFiltersData } from '@lib/interfaces';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';

import { CianState, UpdateHouseFIlters } from '../../state';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs/operators';

@Component({
  templateUrl: './edit.page.html',
  styleUrls: ['./edit.page.scss']
})
export class CianHouseEditPage implements OnInit {
  @Select(CianState.loading)
  public loading$: Observable<boolean>;

  @Select(CianState.cianFilters)
  public cianFilters$: Observable<ICianFiltersData>;

  public feedFilterForm: IMainFeedForm = { enabled: false, filters: [] };

  constructor(private store: Store, private route: ActivatedRoute) {}

  public ngOnInit() {
    this.cianFilters$.pipe(take(1)).subscribe(({ enabled, filters }) => {
      this.feedFilterForm.enabled = enabled;
      this.feedFilterForm.filters = filters.map(
        ({ studio, oneRoom, twoRooms, threeRooms, fourPlusRooms, minCost, maxCost, floors }) => {
          const rangeFloors = floors.slice(1).map(({ min, max }) => ({ startFloor: min, finishFloor: max }));
          const rooms = [oneRoom && 1, twoRooms && 2, threeRooms && 3, fourPlusRooms && 4].filter(count => !!+count);

          return {
            flatsType: studio !== null ? studio : 'all',
            rooms,
            minCost,
            maxCost,
            firstStartFloor: floors[0] && floors[0].min,
            firstFinishFloor: floors[0] && floors[0].max,
            rangeFloors: floors && floors[1] ? rangeFloors : []
          };
        }
      );
    });
  }

  public onSubmit(value: IMainFeedForm) {
    const feedId = +this.route.snapshot.paramMap.get('id');
    const cianHouseId = +this.route.snapshot.paramMap.get('cianHouseId');
    const data = { enabled: value.enabled, filters: [] };

    data.filters = value.filters.map(
      ({ flatsType, rooms, minCost, maxCost, firstStartFloor, firstFinishFloor, rangeFloors }) => {
        const currentFloors = rangeFloors.map(({ startFloor, finishFloor }) => ({
          min: +startFloor,
          max: +finishFloor
        }));
        currentFloors.push({ min: firstStartFloor, max: firstFinishFloor });

        return {
          ...(flatsType !== 'all' && { studio: flatsType }),
          oneRoom: rooms.includes(1),
          twoRooms: rooms.includes(2),
          threeRooms: rooms.includes(3),
          fourPlusRooms: rooms.includes(4),
          minCost,
          maxCost,
          floors: currentFloors
        };
      }
    );

    this.store.dispatch(new UpdateHouseFIlters(feedId, cianHouseId, data));
  }
}
