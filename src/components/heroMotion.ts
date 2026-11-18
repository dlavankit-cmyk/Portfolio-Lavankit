import { paintHeroVolume } from "./heroVolume";
export type EntryStage = 'descending' | 'hanging' | 'falling' | 'landing' | 'walking';
const clamp = (v:number, lo:number, hi:number) => Math.max(lo,Math.min(hi,v));
const smooth = (p:number) => p*p*(3-2*p);
export const HERO_RELEASE_MS = 2100;
// Match world travel to the planted foot's backwards travel: no moonwalking.
export const HERO_STRIDE_PX = 15 * .9 / .62;
/** Feet coordinates keep the timeline independent of character size and viewport height. */
export function sampleHeroEntrance(elapsed:number, ground:number) {
  const rest = Math.max(20,ground*.36);
  const fallMs = Math.sqrt(2*Math.max(0,ground-rest)/1800)*1000;
  const impactAt = HERO_RELEASE_MS+fallMs;
  let stage:EntryStage, feet:number, compression=0;
  if(elapsed<1550){stage='descending';feet=-110+(rest+110)*smooth(clamp(elapsed/1550,0,1));}
  else if(elapsed<HERO_RELEASE_MS){stage='hanging';feet=rest;}
  else if(elapsed<impactAt){stage='falling';feet=rest+900*((elapsed-HERO_RELEASE_MS)/1000)**2;}
  else if(elapsed<impactAt+600){
    stage='landing';feet=ground;
    const t=elapsed-impactAt;
    compression=t<90?smooth(t/90):1-smooth(clamp((t-90)/510,0,1));
  } else {stage='walking';feet=ground;}
  const tethered=stage==='descending'||stage==='hanging';
  return {stage,feet,compression,tethered,impactAt,
    sway:tethered?Math.sin(elapsed/420)*5:0,
    web:elapsed<HERO_RELEASE_MS?1:1-smooth(clamp((elapsed-HERO_RELEASE_MS)/340,0,1))};
}
/** Two-bone inverse kinematics; swing feet lift while planted feet travel backwards. */
function legPose(phase:number,bob:number,crouch:number) {
  const p=((phase%(Math.PI*2))+Math.PI*2)%(Math.PI*2)/(Math.PI*2);
  const stance=p<.62;
  const u=stance?p/.62:(p-.62)/.38;
  // Hermite swing tangents match stance velocity at toe-off and heel strike.
  const tangent = -15 * .38 / .62;
  const footX=stance ? 7.5-15*u : -7.5+15*smooth(u)+tangent*(2*u*u*u-3*u*u+u);
  const lift=stance ? 0 : Math.sin(Math.PI*u)**2*2.6;
  const footRoll=stance
    ? -8*(1-smooth(clamp(u/.16,0,1)))+16*smooth(clamp((u-.8)/.2,0,1))
    : 16-24*smooth(u);
  const vertical=clamp(20.2-bob-lift-crouch*7,7,21);
  const distance=clamp(Math.hypot(footX,vertical),1,21.5);
  const knee=Math.acos(clamp((distance*distance-100-144)/240,-1,1));
  const upper=Math.atan2(-footX,vertical)-Math.atan2(12*Math.sin(knee),10+12*Math.cos(knee));
  return [upper*180/Math.PI,knee*180/Math.PI,footRoll-(upper+knee)*180/Math.PI];
}
const activity = new WeakMap<HTMLElement, {time:number, blend:number}>();
const previousValues = new WeakMap<HTMLElement, Record<string,string>>();
export function paintHeroPose(pet:HTMLElement, phase:number, moving:boolean, crouch=0, airborne=false, reduced=false) {
  const now=performance.now();
  const state=activity.get(pet) ?? {time:now,blend:0};
  const dt=clamp((now-state.time)/1000,0,.05);
  const target=moving&&!reduced?1:0;
  state.blend=reduced?0:target+(state.blend-target)*Math.exp(-dt/.085);
  state.time=now;
  activity.set(pet,state);
  const blend=state.blend;
  const bob=Math.cos(phase*2-.35)*.5*blend-.6*(1-blend);
  const values:Record<string,number>={
    'body-y':bob+crouch*7+.6,
    'head-tilt':Math.sin(phase-.55)*1.25*blend,
  };
  for(const [side,offset] of [['l',0],['r',Math.PI]] as const){
    const walk=legPose(phase+offset,bob,crouch);
    const rest=legPose(Math.PI*.62,bob,crouch);
    // Relax into the rest pose instead of snapping limbs when he pauses.
    const [upper,knee,foot]=rest.map((v,index)=>v+(walk[index]-v)*blend);
    values[`leg-${side}-upper`]=airborne?(side==='l'?-22:18):upper;
    values[`leg-${side}-lower`]=airborne?35:knee;
    values[`leg-${side}-foot`]=airborne?-15:foot;
    const armRest=side==='l'?7:-7;
    values[`arm-${side}`]=airborne?(side==='l'?-85:90):armRest*(1-blend)+Math.sin(phase+offset-.2)*17*blend;
    values[`elbow-${side}`]=airborne?-24:-10-(.5+.5*Math.sin(phase+offset-.55))*9*blend;
    values[`wrist-${side}`]=airborne?5:Math.sin(phase+offset-.85)*3.5*blend;
  }
  const previous = previousValues.get(pet) ?? {};
  for(const [key,value] of Object.entries(values)) {
    const rendered = `${value.toFixed(2)}${key==='body-y'?'px':'deg'}`;
    if (previous[key] !== rendered) pet.style.setProperty(`--hero-${key}`, rendered);
    previous[key] = rendered;
  }
  previousValues.set(pet, previous);
  paintHeroVolume(pet, values, reduced);
}
