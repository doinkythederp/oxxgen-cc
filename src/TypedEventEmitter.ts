import { EventEmitter } from 'events';

export type EventMap = { [eventName: string]: any };
type DefaultEvent = (...args: any[]) => void;

/**
 * Provides typings for the `on`, `once`, `off`, and `emit` methods
 */
export class TypedEventEmitter<Events extends EventMap = {}> extends EventEmitter {
  override on<Event extends keyof Events>(eventName: Event, listener: Events[Event]): this
  override on<Event extends string>(eventName: Event, listener: DefaultEvent): this
  override on<Event extends string>(eventName: Event, listener: DefaultEvent): this {
    return super.on(eventName, listener);
  }

  override once<Event extends keyof Events>(eventName: Event, listener: Events[Event]): this
  override once<Event extends string>(eventName: Event, listener: DefaultEvent): this
  override once<Event extends string>(eventName: Event, listener: DefaultEvent): this {
    return super.once(eventName, listener);
  }

  override off<Event extends keyof Events>(eventName: Event, listener: Events[Event]): this
  override off<Event extends string>(eventName: Event, listener: DefaultEvent): this
  override off<Event extends string>(eventName: Event, listener: DefaultEvent): this {
    return super.off(eventName, listener);
  }

  override emit<Event extends keyof Events>(eventName: Event, ...args: Parameters<Events[Event]>): boolean
  override emit<Event extends string>(eventName: Event, ...args: Parameters<DefaultEvent>): boolean
  override emit<Event extends string>(eventName: Event, ...args: Parameters<DefaultEvent>): boolean {
    return super.emit(eventName, ...args);
  }
}

declare interface Typed<Events extends EventMap = {}> {

  on<U extends keyof Events>(
    event: U, listener: Events[U]
  ): this;
  on<U extends string>(
    event: U, listener: DefaultEvent
  ): this;

  emit<U extends keyof Events>(
    event: U, ...args: Parameters<Events[U]>
  ): boolean;
}
