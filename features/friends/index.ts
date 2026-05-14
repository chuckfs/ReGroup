/**
 * Friends feature module.
 *
 * Owns the friend-detail screen + its hero card, metric rows, and action
 * stack. The cross-feature `FriendRow` lives in `/components/friend`
 * because it's used inside the group sheet too.
 *
 * Selection state lives in `/store/useFriendStore` so both the map and
 * the modal can react to "this friend is being viewed".
 */
export { default as FriendDetailScreen } from './screens/FriendDetailScreen';
export { FriendHeroCard } from './components/FriendHeroCard';
export { FriendMetric } from './components/FriendMetric';
export { FriendActions } from './components/FriendActions';
