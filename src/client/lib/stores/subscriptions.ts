import { writable } from 'svelte/store';
import type { Subscription } from './subscription';

export const subscriptions = writable<Subscription[]>([]);
