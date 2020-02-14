import { SnackbarService } from '@app/shared/snackbar.service';
import { Action, Selector, State, StateContext, Store } from '@ngxs/store';
import * as mediasoupClient from 'mediasoup-client';
import { Presence } from 'phoenix';
import { of, Observable, throwError } from 'rxjs';
import { delay, tap, catchError, map } from 'rxjs/operators';
import { RoomChannelService } from '../channel.service';
import { ConnectionMode } from '../connection-options.interface';
import { ConnectionOptionsService } from '../connection-options.service';
import { RoomService } from '../room.service';
import { AddConsumer, RemoveAllConsumers } from '../consumers/consumers.actions';
import { ConsumersState } from '../consumers/consumers.state';
import { SetMe, CleanMe } from '../me/me.actions';
import { MeState } from '../me/me.state';
import { AddPeer, RemovePeer, RemoveAllPeers } from '../peers/peers.actions';
import { PeersState } from '../peers/peers.state';
import { AddProducer, PauseProducer, RemoveProducer, ResumeProducer } from '../producers/producers.actions';
import { ProducersState } from '../producers/producers.state';
import {
  GetMicProducer,
  JoinRoom,
  LeaveRoom,
  OnJoinError,
  RejoinRoom,
  RoomLeft,
  SetListenerCount,
  SetMicProducer,
  SetPresence,
  SetRoom,
  SetWidgetRoom,
  ToggleVoteForPeer,
  MuteRoom
} from './room.actions';
import { RoomStateModel } from './room.model';
import { IPresenceInfo, IPresence } from './presence.interface';

@State<RoomStateModel>({
  name: 'room',
  defaults: {
    connectionState: 'EMPTY',
    room: null,
    presences: [],
    connectionOptions: null,
    savedConnectionOptions: {},
    isMuted: false,

    // WEBRTC only
    mediaRoom: null,
    micProducer: null,
    roomChannels: {},
    peerChannels: {}
  },
  children: [MeState, ProducersState, ConsumersState, PeersState]
})
export class RoomState {
  private readonly AUDIO_CONTRAINTS: MediaTrackConstraints = {
    sampleRate: 48000,
    channelCount: 2,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    volume: { min: 1, max: 2, ideal: 1 }
  } as MediaTrackConstraints;

  constructor(
    private roomService: RoomService,
    private channelService: RoomChannelService,
    private connectionOptionsService: ConnectionOptionsService,
    private snack: SnackbarService
  ) {}

  /**
   * Selectors
   */
  @Selector()
  public static room({ room }: RoomStateModel) {
    return room;
  }

  @Selector()
  public static connectionState({ connectionState }: RoomStateModel) {
    return connectionState;
  }

  @Selector()
  public static notConnected({ connectionState }: RoomStateModel) {
    return connectionState !== 'CONNECTED';
  }

  @Selector()
  public static failedToConnect({ connectionState }: RoomStateModel) {
    return connectionState === 'FAILED';
  }

  @Selector()
  public static presences({ presences }: RoomStateModel) {
    return presences;
  }

  @Selector()
  public static isSpeaker({ connectionOptions }: RoomStateModel) {
    return connectionOptions && connectionOptions.mode === ConnectionMode.SPEAKER;
  }

  @Selector()
  public static micProducer({ micProducer }: RoomStateModel) {
    return !!micProducer;
  }

  @Selector()
  public static isMuted({ isMuted }: RoomStateModel) {
    return isMuted;
  }

  @Selector()
  public static voteCounts({ presences }: RoomStateModel) {
    const speakerInfo = presences
      .map((p: IPresence) => p.metas[0])
      // .filter((p: IPresenceInfo) => !p.is_listener) # TODO(nhpd): turn this on after debugging everything els
      .reduce((result: string[], p: IPresenceInfo) => result.concat(p.votes || []), [])
      .reduce((occurences: any, vote: string) => {
        if (occurences[vote]) {
          occurences[vote] = occurences[vote] + 1;
        } else {
          occurences[vote] = 1;
        }
        return occurences;
      }, {});
    return speakerInfo;
  }

  @Selector()
  public static votes({ presences }: RoomStateModel) {
    return presences
      .map((p: IPresence) => p.metas[0])
      .map((meta: IPresenceInfo) => [meta.peer_id, meta.votes])
      .reduce((result: any, [id, votes]) => {
        result[id] = votes;
        return result;
      }, {});
  }

  /**
   * Actions
   */
  @Action(SetRoom)
  public setRoom(ctx: StateContext<RoomStateModel>, { roomId }: SetRoom) {
    return this.roomService.get(roomId).pipe(tap(room => ctx.patchState({ room })));
  }

  @Action(SetWidgetRoom)
  public setWidgetRoom(ctx: StateContext<RoomStateModel>, { roomMeta }: SetWidgetRoom) {
    return this.roomService.getForWidget(roomMeta).pipe(tap(room => ctx.patchState({ room })));
  }

  @Action(SetListenerCount)
  public setListenerCount(ctx: StateContext<RoomStateModel>, { listenerCount }: SetListenerCount) {
    const room = ctx.getState().room;
    room.listenerCount = listenerCount;
    ctx.patchState({ room });
  }

  @Action(SetPresence)
  public setPresence(ctx: StateContext<RoomStateModel>, { presence }: SetPresence) {
    const presences = presence.list();
    // console.log('[BYVOICE] Setting presence: ' + JSON.stringify(presences));
    const presenceMetaValues = (Object.values(presences) as any)
      .map((p: IPresence) => p.metas[0])
      .filter((meta: IPresenceInfo) => !!meta);
    const listenerCount = presenceMetaValues.filter((meta: any) => meta.is_listener).length;
    ctx.dispatch(new SetListenerCount(listenerCount));
    ctx.patchState({ presences });
  }

  @Action(RejoinRoom)
  public rejoinRoom(ctx: StateContext<RoomStateModel>, { socket, peerId }: RejoinRoom) {
    const { connectionOptions } = ctx.getState();
    if (connectionOptions) {
      ctx.dispatch(new JoinRoom(socket, peerId, connectionOptions));
    } else {
      console.error('[BYVOICE] Cannot rejoin room without connection options set up');
      this.snack.open('PAGES.ROOM.FAILED_TO_REJOIN');
    }
  }

  // TODO: make atomic. if not joined, lock it with property
  @Action(JoinRoom)
  public joinRoom(ctx: StateContext<RoomStateModel>, { socket, peerId, options }: JoinRoom) {
    const { mediaRoom: oldMediaRoom, roomChannels, peerChannels } = ctx.getState();
    ctx.patchState({ connectionState: 'CONNECTING', connectionOptions: options });

    // LEAVE OLD ROOM
    if (oldMediaRoom) {
      oldMediaRoom.leave();
      ctx.patchState({ mediaRoom: null });
    }

    // JOIN
    const newMediaRoom = new mediasoupClient.Room(options.mediasoupRoom);
    const roomChannelExisted = !!roomChannels[options.roomId];
    const peerChannelExisted = !!peerChannels[options.roomId];
    const roomChannel$: Observable<any> = roomChannels[options.roomId]
      ? of(roomChannels[options.roomId])
      : this.channelService.roomChannel(socket, options.roomId, {
          peerId,
          isListener: options.mode === ConnectionMode.LISTENER
        });

    return roomChannel$.pipe(
      catchError(error => {
        // TODO(nhpd): remove copypaste - maybe extract into action JoinRoomAsListener()
        const newOptions = this.connectionOptionsService.defaultConnectionOptions(
          ConnectionMode.LISTENER,
          options.roomId
        );
        // console.log('[BYVOICE] Tried to join room as speaker but was banned');
        ctx.dispatch(new JoinRoom(socket, peerId, newOptions));
        // TODO(nhpd): maybe do something if connection to channel failed
        return throwError(error);
      }),
      tap(roomChannel => {
        const peerChannel =
          peerChannels[options.roomId] || this.channelService.channel(socket, options.roomId, peerId, options.peer);

        if (roomChannelExisted) {
          // console.log('[BYVOICE] update presence meta info');
          const newMeta = { peer: options.peer, isListener: options.mode === ConnectionMode.LISTENER };
          roomChannels[options.roomId].push('update_presence_is_listener', newMeta);
        } else {
          // console.log('[BYVOICE] create new presence');
          const presence = new Presence(roomChannel);
          presence.onSync(() => ctx.dispatch(new SetPresence(presence)));
        }

        if (peerChannelExisted) {
          peerChannel.off('request');
          peerChannel.off('expell_from_room');
        }
        peerChannel.on('request', (request: any) => {
          // console.log('[BYVOICE] on request: ' + request.method);
          switch (request.method) {
            case 'mediasoup-notification': {
              const notification = request.data;
              newMediaRoom.receiveNotification(notification).catch(error => {
                console.error('[BYVOICE] Error in mediasoup-notification request: ' + error);
                throw error;
              });
              // console.log('[BYVOICE] Mediasoup notification received');
              break;
            }
            default: {
              console.error(`[BYVOICE] Wrong type of request method: ${request.method}`);
            }
          }
        });
        peerChannel.on('expell_from_room', (_request: any) => {
          // TODO(nhpd): remove copypaste - maybe extract into action JoinRoomAsListener()
          const newOptions = this.connectionOptionsService.defaultConnectionOptions(
            ConnectionMode.LISTENER,
            options.roomId
          );
          // console.log('[BYVOICE] Expell from room');
          ctx.dispatch(new LeaveRoom()).subscribe(() => ctx.dispatch(new JoinRoom(socket, peerId, newOptions)));
        });

        newMediaRoom.on('request', (request: any, callback: any, errback: any) => {
          // console.log('[BYVOICE] mediasoup outrequest: ' + JSON.stringify(request));
          peerChannel
            .push('mediasoup-request', request)
            .receive('ok', callback)
            .receive('error', (error: any) => errback(error && error.reason))
            .catch(errback);
        });
        newMediaRoom.on('notify', (notification: any) => peerChannel.push('mediasoup-notification', notification));

        // console.log(`[BYVOICE] About to join room. Peer: ${peerId}`);
        newMediaRoom
          .join(peerId, options.peer)
          .then((peers: any) => {
            // console.log('%c [BYVOICE] Room joined. Peers count: ' + peers.length, 'color: #00a99d');

            const receiveTransport =
              options.mode === ConnectionMode.VISITOR ? null : newMediaRoom.createTransport('recv', { media: 'RECV' });
            if (options.mode === ConnectionMode.SPEAKER) {
              const sendTransport = newMediaRoom.createTransport('send', { media: 'SEND_MIC_WEBCAM' });

              ctx.dispatch(new GetMicProducer(newMediaRoom, sendTransport));
            }

            newMediaRoom.on('newpeer', (peer: any) => this.handlePeer(ctx, peer, receiveTransport));
            newMediaRoom.peers.forEach((peer: any) => this.handlePeer(ctx, peer, receiveTransport));

            roomChannels[options.roomId] = roomChannel;
            peerChannels[options.roomId] = peerChannel;
            ctx.dispatch(new SetMe(options));
            ctx.patchState({
              connectionState: 'CONNECTED',
              mediaRoom: newMediaRoom,
              roomChannels,
              peerChannels
            });
          })
          .catch((reason: any) => reason)
          .then((error: any) => {
            if (error) {
              ctx.dispatch(new OnJoinError(error, socket, peerId, options));
            }
          });
      })
    );
  }

  @Action(LeaveRoom)
  public leaveRoom(ctx: StateContext<RoomStateModel>, { needToClearRoom }: LeaveRoom) {
    // console.log('%c [BYVOICE] (LeaveRoom)', 'color: rgb(200, 10, 10');
    const {
      mediaRoom,
      roomChannels,
      connectionOptions: { roomId }
    } = ctx.getState();

    ctx.dispatch([new RemoveAllConsumers(), new RemoveAllPeers(), new RemoveProducer()]);

    const $result = of(mediaRoom).pipe(
      tap(room => {
        // console.log('[BYVOICE] Leaving room');
        if (room) {
          room.leave();
        }
      }),
      delay(150),
      tap(() => {
        if (roomChannels[roomId]) {
          // console.log('[BYVOICE] Closing room channel');
          roomChannels[roomId].leave();
          roomChannels[roomId] = null;
        }
        ctx.patchState({
          connectionState: 'EMPTY',
          mediaRoom: null,
          roomChannels
        });
        if (needToClearRoom) {
          ctx.patchState({
            room: null
          });
          ctx.dispatch(new CleanMe());
        }
      })
    );
    return $result.pipe(tap(() => ctx.dispatch(new RoomLeft())));
  }

  @Action(PauseProducer)
  public pauseMic(ctx: StateContext<RoomStateModel>) {
    const { micProducer } = ctx.getState();
    micProducer.pause();
  }

  @Action(ResumeProducer)
  public resumeMic(ctx: StateContext<RoomStateModel>) {
    const { micProducer } = ctx.getState();
    micProducer.resume();
  }

  @Action(OnJoinError)
  public onJoinError(ctx: StateContext<RoomStateModel>, { socket, peerId, options, error }: OnJoinError) {
    if (error.message === 'seat_taken') {
      // console.log('[BYVOICE] Seat taken');
      this.snack.open('PAGES.ROOM.SEAT_TAKEN');
      ctx.dispatch(new JoinRoom(socket, peerId, this.connectionOptionsService.changeToListener(options)));
    } else {
      ctx.patchState({ connectionState: 'FAILED' });
      console.log('[BYVOICE] Error joining room. Reason: ' + error);
      console.log('[BYVOICE] Reconnecting to the room...');
    }
  }

  @Action(ToggleVoteForPeer)
  public toggleVoteForPeer(ctx: StateContext<RoomStateModel>, { peerId }: ToggleVoteForPeer) {
    const { roomChannels, connectionOptions } = ctx.getState();
    roomChannels[connectionOptions.roomId].push('toggle_vote_for_peer', { peer_id: peerId });
  }

  @Action(MuteRoom)
  public muteRoom(ctx: StateContext<RoomStateModel>, { isMuted }: MuteRoom) {
    ctx.patchState({ isMuted });
  }

  // internal actions
  private handlePeer(ctx: StateContext<RoomStateModel>, peer, receiveTransport) {
    // console.log('[BYVOICE] handlePeer: ' + peer.name);
    const { seatIndex } = peer.appData;

    ctx.dispatch(
      new AddPeer({
        name: peer.name,
        displayName: peer.appData.displayName,
        device: peer.appData.device,
        consumer: null,
        speaking: false,
        owner: false,
        seatIndex,
        sex: peer.appData.sex
      })
    );

    peer.consumers.forEach((consumer: any) => this.handleConsumer(ctx, peer, consumer, receiveTransport));
    peer.on('close', () => ctx.dispatch(new RemovePeer(peer.name)));
    peer.on('newconsumer', (consumer: any) => this.handleConsumer(ctx, peer, consumer, receiveTransport));
  }

  private handleConsumer(ctx: StateContext<RoomStateModel>, peer, mediaConsumer, receiveTransport) {
    // console.log(`[BYVOICE] New consumer: ${mediaConsumer.peer.name}`);
    const codec = mediaConsumer.rtpParameters.codecs[0];

    ctx.dispatch([
      new AddConsumer(
        {
          id: mediaConsumer.id,
          peerName: mediaConsumer.peer.name,
          source: mediaConsumer.appData.source,
          supported: mediaConsumer.supported,
          locallyPaused: mediaConsumer.locallyPaused,
          remotelyPaused: mediaConsumer.remotelyPaused,
          track: null,
          codec: codec ? codec.name : null,
          mediaConsumer,
          peer
        },
        receiveTransport
      )
    ]);
  }

  @Action(GetMicProducer)
  public getMicProducer(ctx: StateContext<RoomStateModel>, { mediaRoom, sendTransport }: GetMicProducer) {
    if (!mediaRoom.canSend('audio')) {
      return Promise.reject(new Error('cannot send audio'));
    }

    const { micProducer } = ctx.getState();

    if (micProducer) {
      return Promise.reject(new Error('micProducer already exists'));
    }
    return Promise.resolve()
      .then(() => navigator.mediaDevices.getUserMedia({ audio: this.AUDIO_CONTRAINTS }))
      .then(stream => {
        // console.log('[BYVOICE] Got media devise stream');
        const track = stream.getAudioTracks()[0];
        const newMicProducer = mediaRoom.createProducer(track, null, { source: 'mic' });
        const micSendPromise = newMicProducer.send(sendTransport).catch((error: any) => {
          if (error) {
            newMicProducer.close();
            // console.log(`[BYVOICE] Error capturing sound: ${error}`);
          }
        });

        const result = Promise.all([micSendPromise, Promise.resolve(newMicProducer), Promise.resolve(stream)]);
        return result;
      })
      .then(([_error, newMicProducer, stream]) => {
        return ctx.dispatch(new SetMicProducer(newMicProducer, stream));
      })
      .catch(error => {
        // console.log(`[BYVOICE] Error settings mic provider: ${error}`);
        throw error;
      });
  }

  @Action(SetMicProducer)
  public onSetMicProducer(ctx: StateContext<RoomStateModel>, { micProducer, stream }: SetMicProducer) {
    ctx.patchState({ micProducer });
    // console.log('[BYVOICE] Set mic producer: ');
    ctx.dispatch(
      new AddProducer({
        id: micProducer.id,
        source: 'mic',
        locallyPaused: micProducer.locallyPaused,
        remotelyPaused: micProducer.remotelyPaused,
        track: micProducer.track,
        stream: stream,
        codec: micProducer.rtpParameters.codecs[0]
      })
    );

    micProducer.on('close', () => {
      ctx.patchState({ micProducer: null });
      ctx.dispatch(new RemoveProducer());
    });
  }
}
