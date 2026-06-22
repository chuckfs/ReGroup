/**
 * Dev-only overrides for awareness testing — battery drops, stale
 * location pauses, and scripted drift/regroup behaviors.
 *
 * TODO(realtime): remove when Supabase friend positions replace simulation.
 */
type BatteryOverrides = Record<string, number>;

class AwarenessDevSimulatorImpl {
  private batteryOverrides: BatteryOverrides = {};
  private pausedFriends = new Set<string>();
  private pausedSnapshots = new Map<string, number>();

  setBatteryPercent(friendId: string, percent: number): void {
    if (!__DEV__) return;
    this.batteryOverrides[friendId] = percent;
  }

  clearBatteryOverride(friendId: string): void {
    delete this.batteryOverrides[friendId];
  }

  getBatteryPercent(friendId: string, fallback: number): number {
    return this.batteryOverrides[friendId] ?? fallback;
  }

  /** Stop emitting fresh fixes so stale awareness can fire. */
  pauseLocationUpdates(friendId: string): void {
    if (!__DEV__) return;
    this.pausedFriends.add(friendId);
    this.pausedSnapshots.set(friendId, Date.now());
  }

  resumeLocationUpdates(friendId: string): void {
    this.pausedFriends.delete(friendId);
    this.pausedSnapshots.delete(friendId);
  }

  isLocationPaused(friendId: string): boolean {
    return this.pausedFriends.has(friendId);
  }

  /** Timestamp frozen when updates were paused — ages for stale detection. */
  getPausedTimestamp(friendId: string): number | null {
    return this.pausedSnapshots.get(friendId) ?? null;
  }

  reset(): void {
    this.batteryOverrides = {};
    this.pausedFriends.clear();
    this.pausedSnapshots.clear();
  }
}

export const awarenessDevSimulator = new AwarenessDevSimulatorImpl();
