import { writable } from 'svelte/store';
import { Subscription } from './subscription';

export const subscriptions = writable<Subscription[]>([]);
