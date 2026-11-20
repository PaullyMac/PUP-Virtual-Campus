import { TimeOfDayPreset, WeatherPreset } from '../campus/campusData';
import {
  FRUTIGER_AERO_PROGRESSION,
  getAeroAtmosphereProfile,
  midiToFreq,
  selectAeroSparkleMidi,
} from './frutigerAeroMusic';

/**
 * 100% procedural Web Audio API spatial campus soundscape + Frutiger Aero soundtrack:
 * - Lush late-2000s Frutiger Aero generative music (Rhodes electric piano, airy aqua glass pad,
 *   crystalline water-droplet bell arpeggios, warm sub-bass, and dual-tap echo shimmer)
 * - Glossy aquatic glass UI & interaction chimes
 * - Surface-aware footsteps (concrete, grass, interior tile)
 * - Outdoor tropical birds & soft Manila urban breeze
 * - Spatial distance-attenuated Lagoon student chatter & Pasig River water lapping
 * - Quiet indoor reverberant room tone when inside Main Building, NALLRC, or Chapel
 * - Procedural tropical rain noise when weather === 'rain'
 */
export class CampusAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;
  private delayFeedbackGain: GainNode | null = null;
  private delaySendGain: GainNode | null = null;

  private outdoorWindGain: GainNode | null = null;
  private riverGain: GainNode | null = null;
  private lagoonChatterGain: GainNode | null = null;
  private indoorRoomGain: GainNode | null = null;
  private rainGain: GainNode | null = null;

  private noiseBuffer: AudioBuffer | null = null;
  private initialized = false;
  private muted = false;
  private aeroMusicEnabled = true;
  private masterVol = 0.7;
  private ambientVol = 0.65;
  private sfxVol = 0.75;
  private musicVol = 0.52;
  private birdTimer = 0;

  // Frutiger Aero step sequencer state (96 BPM, 16th-note grid => 0.15625s per step)
  private readonly stepDuration = 60 / 96 / 4;
  private musicStepAccum = 0;
  private musicStepIndex = 0;
  private musicChordIndex = 0;
  private lastSparkleGain = 1.0;
  private lastPadGain = 1.0;

  public unlock() {
    if (this.initialized) {
      if (this.ctx?.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    try {
      const ctx = new AudioCtx();
      this.ctx = ctx;

      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.masterVol;
      this.masterGain.connect(ctx.destination);

      this.ambientGain = ctx.createGain();
      this.ambientGain.gain.value = this.ambientVol;
      this.ambientGain.connect(this.masterGain);

      this.sfxGain = ctx.createGain();
      this.sfxGain.gain.value = this.sfxVol;
      this.sfxGain.connect(this.masterGain);

      // Frutiger Aero Music Bus: Warm Lowpass -> Dry + Dotted-Eighth Aqua Echo Delay -> Master
      this.musicGain = ctx.createGain();
      this.musicGain.gain.value = this.aeroMusicEnabled ? this.musicVol : 0;
      this.musicGain.connect(this.masterGain);

      this.musicFilter = ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.value = 3600;
      this.musicFilter.Q.value = 0.6;
      this.musicFilter.connect(this.musicGain);

      // Glossy aqua stereo-feeling dual-tap feedback delay shimmer
      const delayL = ctx.createDelay(1.0);
      delayL.delayTime.value = this.stepDuration * 3; // dotted eighth shimmer
      const delayR = ctx.createDelay(1.0);
      delayR.delayTime.value = this.stepDuration * 5; // cascading cross-tap
      const delayFilter = ctx.createBiquadFilter();
      delayFilter.type = 'bandpass';
      delayFilter.frequency.value = 1850;
      delayFilter.Q.value = 0.7;
      this.delayFeedbackGain = ctx.createGain();
      this.delayFeedbackGain.gain.value = 0.34;
      this.delaySendGain = ctx.createGain();
      this.delaySendGain.gain.value = 0.28;

      this.musicFilter.connect(this.delaySendGain);
      this.delaySendGain.connect(delayL);
      delayL.connect(delayFilter);
      delayFilter.connect(this.musicGain);
      delayFilter.connect(this.delayFeedbackGain);
      this.delayFeedbackGain.connect(delayR);
      delayR.connect(this.musicGain);
      delayR.connect(delayL);

      // Shared 3-second white/pink noise buffer for wind, water, rain, footsteps
      const sampleRate = ctx.sampleRate;
      const length = sampleRate * 3;
      const buffer = ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.029;
        b1 = 0.985 * b1 + white * 0.032;
        b2 = 0.95 * b2 + white * 0.048;
        data[i] = Math.max(-1, Math.min(1, (b0 + b1 + b2 + white * 0.06) * 2.2));
      }
      this.noiseBuffer = buffer;

      // 1. Manila outdoor breeze + distant city hum (lowpass filtered pink noise)
      this.outdoorWindGain = this.createLoopingBand(buffer, 'lowpass', 320, 0.7, 0.06);
      // 2. Pasig River lapping near Linear Park (bandpass)
      this.riverGain = this.createLoopingBand(buffer, 'bandpass', 520, 1.4, 0.0);
      // 3. Lagoon & Freedom Park student chatter murmur (warm vocal-range bandpass)
      this.lagoonChatterGain = this.createLoopingBand(buffer, 'bandpass', 880, 2.2, 0.0);
      // 4. Indoor building quiet HVAC/hallway tone
      this.indoorRoomGain = this.createLoopingBand(buffer, 'lowpass', 170, 0.8, 0.0);
      // 5. Tropical rain shower loop
      this.rainGain = this.createLoopingBand(buffer, 'highpass', 1400, 0.6, 0.0);

      this.initialized = true;
      // Start immediately on beat 0 with a warm opening chord once unlocked
      this.musicStepAccum = this.stepDuration;
    } catch {
      // Audio unavailable in headless or restricted context
    }
  }

  private createLoopingBand(
    buffer: AudioBuffer,
    filterType: BiquadFilterType,
    freq: number,
    q: number,
    initialGain: number,
  ): GainNode {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = freq;
    filter.Q.value = q;

    const gain = ctx.createGain();
    gain.gain.value = initialGain;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain!);
    src.start();
    return gain;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.masterVol, this.ctx.currentTime, 0.06);
    }
  }

  public setAeroMusicEnabled(enabled: boolean) {
    this.aeroMusicEnabled = enabled;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(enabled ? this.musicVol : 0, this.ctx.currentTime, 0.14);
    }
  }

  public setVolumes(master: number, ambient: number, sfx: number, music?: number) {
    this.masterVol = master;
    this.ambientVol = ambient;
    this.sfxVol = sfx;
    if (music !== undefined) this.musicVol = music;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (this.masterGain) this.masterGain.gain.setTargetAtTime(this.muted ? 0 : master, t, 0.05);
    if (this.ambientGain) this.ambientGain.gain.setTargetAtTime(ambient, t, 0.05);
    if (this.sfxGain) this.sfxGain.gain.setTargetAtTime(sfx, t, 0.05);
    if (this.musicGain) {
      this.musicGain.gain.setTargetAtTime(this.aeroMusicEnabled ? this.musicVol : 0, t, 0.08);
    }
  }

  public updateSpatialAmbience(
    dt: number,
    playerX: number,
    playerZ: number,
    isIndoors: boolean,
    weather: WeatherPreset,
    timeOfDay: TimeOfDayPreset = 'morning',
  ) {
    if (!this.initialized || !this.ctx || this.muted || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const isNight = timeOfDay === 'night';

    // Spatial distance to Pasig River (x = -76)
    const distRiver = Math.max(0, playerX - -76);
    const riverProx = Math.max(0, 1 - distRiver / 40);

    // Spatial distance to Lagoon (-16, -16) and Freedom Park / Obelisk (12, 4)
    const distLagoon = Math.hypot(playerX - -16, playerZ - -16);
    const distPlaza = Math.hypot(playerX - 12, playerZ - 4);
    const crowdProx = Math.max(
      Math.max(0, 1 - distLagoon / 32),
      Math.max(0, 1 - distPlaza / 30) * 0.75,
    );

    this.outdoorWindGain?.gain.setTargetAtTime(isIndoors ? 0.01 : isNight ? 0.055 : 0.075, t, 0.25);
    this.indoorRoomGain?.gain.setTargetAtTime(isIndoors ? 0.065 : 0.0, t, 0.25);
    this.riverGain?.gain.setTargetAtTime(isIndoors ? 0.0 : riverProx * 0.11, t, 0.25);
    this.lagoonChatterGain?.gain.setTargetAtTime(
      isIndoors ? 0.015 : crowdProx * (isNight ? 0.025 : 0.07),
      t,
      0.25,
    );
    this.rainGain?.gain.setTargetAtTime(
      weather === 'rain' ? (isIndoors ? 0.025 : 0.11) : 0.0,
      t,
      0.3,
    );

    // Frutiger Aero generative music modulation & step scheduling
    const aeroProfile = getAeroAtmosphereProfile(timeOfDay, isIndoors);
    this.musicFilter?.frequency.setTargetAtTime(aeroProfile.filterCutoffHz, t, 0.35);
    this.delayFeedbackGain?.gain.setTargetAtTime(aeroProfile.delayFeedback, t, 0.35);
    this.lastSparkleGain = aeroProfile.sparkleGain;
    this.lastPadGain = aeroProfile.padGain;

    if (this.aeroMusicEnabled && this.musicVol > 0.01) {
      this.musicStepAccum += Math.min(dt, 0.12);
      let safety = 0;
      while (this.musicStepAccum >= this.stepDuration && safety < 2) {
        this.musicStepAccum -= this.stepDuration;
        this.triggerAeroStep(this.musicChordIndex, this.musicStepIndex);
        this.musicStepIndex = (this.musicStepIndex + 1) % 16;
        if (this.musicStepIndex === 0) {
          this.musicChordIndex = (this.musicChordIndex + 1) % FRUTIGER_AERO_PROGRESSION.length;
        }
        safety++;
      }
    }

    // Daytime Manila Maya/tropical bird chirps outdoors (silent at night & during rain)
    if (!isIndoors && weather !== 'rain' && !isNight) {
      this.birdTimer -= dt;
      if (this.birdTimer <= 0) {
        this.birdTimer = 3.2 + Math.random() * 4.5;
        this.playBirdChirp();
      }
    }
  }

  private triggerAeroStep(chordIndex: number, stepInBar: number) {
    if (!this.ctx || !this.musicFilter) return;
    const now = this.ctx.currentTime + 0.015;
    const chord = FRUTIGER_AERO_PROGRESSION[chordIndex];

    // Step 0: Warm glossy Rhodes chord swell + airy aqua glass pad + sub-bass root
    if (stepInBar === 0) {
      const barDur = this.stepDuration * 16;
      this.playAeroBass(midiToFreq(chord.bassMidi), now, barDur * 0.94);

      // Airy detuned glass pad (2 voices per note ±5 cents)
      for (let i = 0; i < chord.padMidis.length; i++) {
        this.playAeroPadVoice(
          midiToFreq(chord.padMidis[i]),
          now + i * 0.025,
          barDur * 1.06,
          0.024 * this.lastPadGain,
        );
      }

      // Gently strummed glossy electric piano / tine Rhodes voicing
      for (let i = 0; i < chord.rhodesMidis.length; i++) {
        this.playAeroRhodesVoice(
          midiToFreq(chord.rhodesMidis[i]),
          now + i * 0.032,
          barDur * 0.62,
          0.044,
        );
      }
    }

    // Step 8 (mid-bar syncopated gentle Rhodes re-voicing for bouncy Wii/Vista groove)
    if (stepInBar === 8) {
      for (let i = 1; i < chord.rhodesMidis.length; i++) {
        this.playAeroRhodesVoice(
          midiToFreq(chord.rhodesMidis[i]),
          now + i * 0.024,
          this.stepDuration * 6.5,
          0.026,
        );
      }
    }

    // Crystalline aquatic bell-droplet arpeggio
    const sparkleMidi = selectAeroSparkleMidi(chordIndex, stepInBar);
    if (sparkleMidi !== null) {
      this.playAeroWaterDroplet(
        midiToFreq(sparkleMidi),
        now,
        0.028 * this.lastSparkleGain,
      );
    }
  }

  private playAeroBass(freq: number, startTime: number, duration: number) {
    if (!this.ctx || !this.musicFilter) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(0.085, startTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.035, startTime + duration * 0.65);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.musicFilter);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.04);
  }

  private playAeroPadVoice(freq: number, startTime: number, duration: number, peak: number) {
    if (!this.ctx || !this.musicFilter) return;
    const oscA = this.ctx.createOscillator();
    const oscB = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    oscA.type = 'sine';
    oscB.type = 'triangle';
    oscA.frequency.setValueAtTime(freq * 0.997, startTime);
    oscB.frequency.setValueAtTime(freq * 1.003, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peak, startTime + 0.45);
    gain.gain.setValueAtTime(peak * 0.85, startTime + duration * 0.65);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    const mixB = this.ctx.createGain();
    mixB.gain.value = 0.22;
    oscA.connect(gain);
    oscB.connect(mixB);
    mixB.connect(gain);
    gain.connect(this.musicFilter);

    oscA.start(startTime);
    oscB.start(startTime);
    oscA.stop(startTime + duration + 0.05);
    oscB.stop(startTime + duration + 0.05);
  }

  private playAeroRhodesVoice(freq: number, startTime: number, duration: number, peak: number) {
    if (!this.ctx || !this.musicFilter) return;
    // Fundamental body + glossy bell-tine 3rd harmonic attack (authentic late-2000s EP sound)
    const body = this.ctx.createOscillator();
    const tine = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    const tineGain = this.ctx.createGain();

    body.type = 'sine';
    body.frequency.setValueAtTime(freq, startTime);
    tine.type = 'sine';
    tine.frequency.setValueAtTime(freq * 3.0, startTime);

    bodyGain.gain.setValueAtTime(0.0001, startTime);
    bodyGain.gain.linearRampToValueAtTime(peak, startTime + 0.018);
    bodyGain.gain.exponentialRampToValueAtTime(peak * 0.35, startTime + duration * 0.4);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    tineGain.gain.setValueAtTime(0.0001, startTime);
    tineGain.gain.linearRampToValueAtTime(peak * 0.24, startTime + 0.008);
    tineGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.22);

    body.connect(bodyGain);
    tine.connect(tineGain);
    bodyGain.connect(this.musicFilter);
    tineGain.connect(this.musicFilter);

    body.start(startTime);
    tine.start(startTime);
    body.stop(startTime + duration + 0.04);
    tine.stop(startTime + 0.25);
  }

  private playAeroWaterDroplet(freq: number, startTime: number, peak: number) {
    if (!this.ctx || !this.musicFilter) return;
    // Crystalline water-drop plink with subtle upward liquid pitch micro-glide
    const osc = this.ctx.createOscillator();
    const shimmer = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const shimmerGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 0.96, startTime);
    osc.frequency.exponentialRampToValueAtTime(freq, startTime + 0.028);

    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(freq * 2.0, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peak, startTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.42);

    shimmerGain.gain.setValueAtTime(0.0001, startTime);
    shimmerGain.gain.linearRampToValueAtTime(peak * 0.28, startTime + 0.01);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.16);

    osc.connect(gain);
    shimmer.connect(shimmerGain);
    gain.connect(this.musicFilter);
    shimmerGain.connect(this.musicFilter);

    osc.start(startTime);
    shimmer.start(startTime);
    osc.stop(startTime + 0.46);
    shimmer.stop(startTime + 0.19);
  }

  private playBirdChirp() {
    if (!this.ctx || !this.ambientGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const baseFreq = 2600 + Math.random() * 1100;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.32, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.92, now + 0.14);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.024, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.ambientGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playFootstep(surface: 'concrete' | 'grass' | 'interior' | 'water', sprinting: boolean) {
    if (!this.initialized || !this.ctx || !this.noiseBuffer || !this.sfxGain || this.muted) return;
    if (this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    const pitchJitter = 0.92 + Math.random() * 0.16;

    if (surface === 'grass') {
      filter.type = 'bandpass';
      filter.frequency.value = 520 * pitchJitter;
      filter.Q.value = 1.2;
    } else if (surface === 'interior') {
      filter.type = 'bandpass';
      filter.frequency.value = 1250 * pitchJitter;
      filter.Q.value = 2.4;
    } else {
      filter.type = 'bandpass';
      filter.frequency.value = 840 * pitchJitter;
      filter.Q.value = 1.6;
    }

    const gain = this.ctx.createGain();
    const peak = (sprinting ? 0.14 : 0.085) * (surface === 'grass' ? 0.75 : 1);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.095);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    const offset = Math.random() * 1.8;
    src.start(now, offset, 0.12);
  }

  public playDoorSound(opening: boolean) {
    if (!this.initialized || !this.ctx || !this.sfxGain || this.muted) return;
    if (this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(opening ? 190 : 240, now);
    osc.frequency.exponentialRampToValueAtTime(opening ? 310 : 140, now + 0.18);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  /**
   * Glossy 3-note Frutiger Aero ascending crystal-glass interaction chime (C5 -> E5 -> B5).
   */
  public playInteractChime() {
    if (!this.initialized || !this.ctx || !this.sfxGain || this.muted) return;
    if (this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 987.77]; // C5, E5, B5 glassy triad
    notes.forEach((freq, idx) => {
      const t0 = now + idx * 0.048;
      const osc = this.ctx!.createOscillator();
      const overtone = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const oGain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 0.97, t0);
      osc.frequency.exponentialRampToValueAtTime(freq, t0 + 0.022);

      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(freq * 2.0, t0);

      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(0.052, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);

      oGain.gain.setValueAtTime(0.0001, t0);
      oGain.gain.linearRampToValueAtTime(0.014, t0 + 0.008);
      oGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);

      osc.connect(gain);
      overtone.connect(oGain);
      gain.connect(this.sfxGain!);
      oGain.connect(this.sfxGain!);
      osc.start(t0);
      overtone.start(t0);
      osc.stop(t0 + 0.35);
      overtone.stop(t0 + 0.14);
    });
  }

  /**
   * Crisp Frutiger Aero water-bubble UI button click sound.
   */
  public playAeroUiClick() {
    if (!this.initialized || !this.ctx || !this.sfxGain || this.muted) return;
    if (this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.exponentialRampToValueAtTime(1180, now + 0.055);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.045, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public dispose() {
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.initialized = false;
  }
}
