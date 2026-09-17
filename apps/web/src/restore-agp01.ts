import { GrandPrixScene } from './GrandPrixScene';

type RuntimeScene = {
  carTemplate: object | null;
  loadCarAsset: () => Promise<void>;
  makeImportedCar: (entrant: unknown) => unknown;
  __agp01LoadStarted?: boolean;
};

type RuntimePrototype = {
  start: (this: RuntimeScene, ...args: unknown[]) => void;
  makeCar: (this: RuntimeScene, entrant: unknown) => unknown;
};

/**
 * Restores the approved AGP-01 GLB as the primary race car without disturbing the
 * Connectome championship adapter. The newer procedural AGP-27 remains only as a
 * short-lived/error fallback while the GLB is loading.
 *
 * GrandPrixScene already owns the proven AGP-01 loader, livery material remapping,
 * decals and live-car replacement path from the polished pre-Connectome build. A
 * later visual pass accidentally left that loader dormant and made the procedural
 * car unconditional. This runtime restoration deliberately re-enables the existing
 * production path rather than duplicating the loader or changing race simulation.
 */
const prototype = GrandPrixScene.prototype as unknown as RuntimePrototype;
const originalStart = prototype.start;
const proceduralFallback = prototype.makeCar;

prototype.makeCar = function restoredPremiumCar(entrant: unknown) {
  return this.carTemplate ? this.makeImportedCar(entrant) : proceduralFallback.call(this, entrant);
};

prototype.start = function startWithApprovedCar(...args: unknown[]) {
  if (!this.carTemplate && !this.__agp01LoadStarted) {
    this.__agp01LoadStarted = true;
    document.documentElement.dataset.agpCar = 'loading-agp01';
    void this.loadCarAsset().finally(() => {
      this.__agp01LoadStarted = false;
      document.documentElement.dataset.agpCar = this.carTemplate ? 'agp01' : 'fallback';
    });
  }
  originalStart.apply(this, args);
};

// Start the network request immediately so the opening replay spends as little time
// as possible on the lightweight fallback on slower mobile connections.
const agp01Url = new URL('models/agp01.glb', document.baseURI).href;
void fetch(agp01Url, { cache: 'force-cache' }).catch(() => undefined);
