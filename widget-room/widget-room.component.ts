import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild, ElementRef, HostListener } from '@angular/core';
import { SessionStateModel } from '@app/modules/auth/state/auth.model';
import { SessionState } from '@app/modules/auth/state/session.state';
import { IRoom } from '@app/modules/rooms/shared/room.interface';
import { DialogService } from '@app/shared/dialog.service';
import { environment } from '@env/environment';
import { IPeer } from '@lib/models';
import { Select, Store } from '@ngxs/store';
import { ConnectionMode, ConnectionOptions, PeerOptions } from '@roomState/connection-options.interface';
import { ConnectionOptionsService } from '@roomState/connection-options.service';
import { JoinRoom, MeState, PeersState, RejoinRoom, MuteRoom } from '@roomState/index';
import { RoomState } from '@roomState/room/room.state';
import { combineLatest, Observable, Subject } from 'rxjs';
import { filter, map, take, takeUntil, tap, distinctUntilChanged } from 'rxjs/operators';
import { IPresenceInfo, IPresence } from '@app/modules/room-state/room/presence.interface';
import { SnackbarService } from '@app/shared/snackbar.service';
import { BanDialogComponent } from '@app/shared/ban-dialog/ban-dialog-component';
import { PeerIdService } from '@app/modules/auth/state/peer-id.service';
import { untilDestroyed } from 'ngx-take-until-destroy';

@Component({
  selector: 'app-widget-room',
  templateUrl: 'widget-room.component.html',
  styleUrls: ['widget-room.component.scss']
})
export class WidgetRoomComponent implements OnInit, OnDestroy {
  @Output()
  public roomChange = new EventEmitter<IRoom>();

  @Select(SessionState)
  private auth$: Observable<SessionStateModel>;

  @Select(PeersState.peers)
  public peers$: Observable<IPeer[]>;

  @Select(MeState.seatIndex)
  public mySeatIndex$: Observable<number>;

  @Select(RoomState.room)
  public room$: Observable<IRoom>;

  @Select(MeState.canUpgradeToSpeaker)
  public canUpgradeToSpeaker$: Observable<boolean>;

  @Select(RoomState.connectionState)
  public connectionState$: Observable<'EMPTY' | 'CONNECTING' | 'FAILED' | 'CONNECTED'>;

  @Select(RoomState.notConnected)
  public notConnected$: Observable<boolean>;

  @Select(RoomState.failedToConnect)
  public failedToConnect$: Observable<boolean>;

  @Select(RoomState.isSpeaker)
  public isSpeaker$: Observable<boolean>;

  @Select(MeState.allOptions)
  public allOptions$: Observable<{ [roomId: string]: ConnectionOptions }>;

  @Select(MeState.mode)
  public mode$: Observable<ConnectionMode>;

  @Select(MeState.peer)
  public me$: Observable<PeerOptions>;

  @Select(RoomState.voteCounts)
  public voteCounts$: Observable<{ [peerId: string]: number }>;

  @Select(RoomState.votes)
  public votes$: Observable<{ [peerId: string]: number }>;

  @Select(RoomState.presences)
  public presences$: Observable<IPresence[]>;

  @Select(RoomState.micProducer)
  public micProducer$: Observable<any[]>;

  public $time: Subject<string> = new Subject();
  public peerSeats$: Observable<number[]>;
  public canPeerBecomeSpeaker$: Observable<boolean>;
  public isVisitorMode$: Observable<boolean>;
  public isRoomMuted = false;
  private unsubscribe$ = new Subject();

  public myPresence$: Observable<IPresenceInfo>;
  public banState$: Observable<boolean>;
  public timerId;

  public indexesPeers$: Observable<{ [seatIndex: number]: IPeer }>;

  constructor(
    public peerIdService: PeerIdService,
    private store: Store,
    private snack: SnackbarService,
    private dialog: DialogService,
    private connectionOptions: ConnectionOptionsService
  ) {}

  public ngOnInit() {
    this.peerSeats$ = this.room$.pipe(
      map(room => {
        const result = Array(room.maxSpeakerCount);
        for (let i = 0; i < result.length; i++) {
          result[i] = i;
        }
        return result;
      })
    );

    this.myPresence$ = this.presences$.pipe(
      map(presences => {
        const presence = presences.find(p => p.metas[0].peer_id === this.peerIdService.peerId);
        return presence && presence.metas[0];
      })
    );

    this.banState$ = this.myPresence$.pipe(filter(p => !!p), map(p => p.is_banned), distinctUntilChanged());
    this.banState$.pipe(untilDestroyed(this)).subscribe(is_banned => {
      if (is_banned) {
        this.snack.openKeys({ key: 'PAGES.ROOM.SPEAKER_BANNED', values: {} }, BanDialogComponent, 0);
      }
    });

    this.canPeerBecomeSpeaker$ = this.canPeerBecomeSpeaker();
    const existingRoom$ = this.room$.pipe(filter(room => !!room));

    this.indexesPeers$ = this.peers$.pipe(
      filter(peers => !!peers),
      map(peers =>
        peers.reduce((acc, peer) => {
          acc[peer.seatIndex] = peer;
          return acc;
        }, {})
      )
    );

    existingRoom$
      .pipe(
        filter(room => !!room),
        tap((room: IRoom) => this.roomChange.emit(room)),
        takeUntil(this.unsubscribe$)
      )
      .subscribe();
    combineLatest([this.allOptions$, this.auth$, existingRoom$])
      .pipe(
        filter(([_allOptions, auth, _room]) => !!auth.socket),
        take(1)
      )
      .subscribe(([allOptions, auth, room]) => {
        const options =
          allOptions[room.slug] || this.connectionOptions.defaultConnectionOptions(ConnectionMode.VISITOR, room.slug);
        this.store.dispatch(new JoinRoom(auth.socket, this.peerIdService.peerId, options));
      });

    this.isVisitorMode$ = this.mode$.pipe(map(mode => mode === ConnectionMode.VISITOR));
  }

  public ngOnDestroy() {
    this.unsubscribe$.next(true);
  }

  public reconnectToRoom() {
    this.auth$.pipe(filter(auth => !!auth.socket)).subscribe(({ socket }) => {
      this.store.dispatch(new RejoinRoom(socket, this.peerIdService.peerId));
    });
  }

  public peerSeats(room: IRoom): number[] {
    return Array(room.speakerCount).fill(map(n => n));
  }

  public roomLink(room: IRoom): string {
    return `${environment.clientUrl}/room/${room.slug}`;
  }

  public connectionIndicatorClass(connectionState: string) {
    return ['header__connection-indicator', 'header__connection-indicator_' + connectionState.toLowerCase()];
  }

  public joinAsListener() {
    combineLatest([this.allOptions$, this.auth$, this.room$])
      .pipe(
        take(1),
        tap(([allOptions, auth, room]) => {
          const roomId = room.slug;
          const options =
            allOptions[roomId] || this.connectionOptions.defaultConnectionOptions(ConnectionMode.LISTENER, roomId);
          options.mode = ConnectionMode.LISTENER;
          this.store.dispatch(new JoinRoom(auth.socket, this.peerIdService.peerId, options));
        }),
        filter(success => !!success)
      )
      .subscribe(() => this.dialog.close());
  }

  public onMuteRoom() {
    this.isRoomMuted = !this.isRoomMuted;
    this.store.dispatch(new MuteRoom(this.isRoomMuted));
  }

  private canPeerBecomeSpeaker(): Observable<boolean> {
    return combineLatest([this.notConnected$, this.canUpgradeToSpeaker$, this.myPresence$]).pipe(
      map(([notConnected, canBecomeSpeaker, myPresence]) => {
        if (notConnected) {
          return false;
        }
        if (!canBecomeSpeaker) {
          return false;
        }
        if (!myPresence) {
          return false;
        }

        return true;
      })
    );
  }

  public onChangeBanDialog() {
    this.snack.openKeys({ key: 'PAGES.ROOM.SPEAKER_BANNED', values: {} }, BanDialogComponent, 0);
  }
}
