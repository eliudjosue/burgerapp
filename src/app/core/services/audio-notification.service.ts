import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioNotificationService {
  readonly soundEnabled = signal(
    typeof sessionStorage !== 'undefined' && sessionStorage.getItem('sf-sound') === '1',
  );

  private audioCtx: AudioContext | null = null;
  private audioUnlocked = false;

  private readonly unlockOnInteraction = (): void => {
    if (this.audioUnlocked || !this.audioCtx) return;
    this.audioUnlocked = true;
    document.removeEventListener('click', this.unlockOnInteraction);
    document.removeEventListener('keydown', this.unlockOnInteraction);
    void this.audioCtx.resume().then(() => {
      console.log('[Audio] AudioContext unlocked, state:', this.audioCtx?.state);
    });
  };

  initAudio(): void {
    if (this.audioCtx) return; // already initialized — idempotent
    try {
      this.audioCtx = new AudioContext();
      console.log('[Audio] AudioContext state on init:', this.audioCtx.state);
      document.addEventListener('click', this.unlockOnInteraction);
      document.addEventListener('keydown', this.unlockOnInteraction);
    } catch (err) {
      console.warn('[Audio] AudioContext not supported:', err);
    }
  }

  toggleSound(): void {
    const next = !this.soundEnabled();
    this.soundEnabled.set(next);
    if (next && this.audioCtx?.state === 'suspended') {
      void this.audioCtx.resume().then(() => {
        console.log('[Audio] AudioContext resumed via toggle, state:', this.audioCtx?.state);
      });
    }
    try { sessionStorage.setItem('sf-sound', next ? '1' : '0'); } catch { /* ignore */ }
  }

  async playBeep(): Promise<void> {
    if (!this.soundEnabled() || !this.audioCtx) return;
    try {
      console.log('[Audio] playBeep — AudioContext state:', this.audioCtx.state);
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1108, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (err) {
      console.warn('[Audio] playBeep failed:', err);
    }
  }
}
