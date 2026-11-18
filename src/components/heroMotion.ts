export type EntryStage = 'descending' | 'hanging' | 'falling' | 'landing' | 'walking';
const clamp = (v:number, lo:number, hi:number) => Math.max(lo,Math.min(hi,v));
const smooth = (p:number) => p*p*(3-2*p);
export const HERO_RELEASE_MS = 2100;
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
  const footX=stance?6-12*u:-6+12*smooth(u);
  const lift=stance?0:Math.sin(Math.PI*u)*5;
  const vertical=clamp(20-bob-lift-crouch*7,7,21);
  const distance=clamp(Math.hypot(footX,vertical),1,21.9);
  const knee=Math.acos(clamp((distance*distance-100-144)/240,-1,1));
  const upper=Math.atan2(-footX,vertical)-Math.atan2(12*Math.sin(knee),10+12*Math.cos(knee));
  return [upper*180/Math.PI,knee*180/Math.PI,-(upper+knee)*180/Math.PI];
}
const previousValues = new WeakMap<HTMLElement, Record<string,string>>();
export function paintHeroPose(pet:HTMLElement, phase:number, moving:boolean, crouch=0, airborne=false, reduced=false) {
  const bob=moving&&!reduced?Math.cos(phase*2)*.65:0;
  const values:Record<string,number>={'body-y':bob+crouch*7,'head-tilt':moving?Math.sin(phase-.35)*1.8:0};
  for(const [side,offset] of [['l',0],['r',Math.PI]] as const){
    const [upper,knee,foot]=legPose(moving&&!reduced?phase+offset:Math.PI*.31,bob,crouch);
    values[`leg-${side}-upper`]=airborne?(side==='l'?-22:18):upper;
    values[`leg-${side}-lower`]=airborne?35:knee;
    values[`leg-${side}-foot`]=airborne?-15:foot;
    values[`arm-${side}`]=airborne?(side==='l'?-95:105):moving?Math.sin(phase+offset)*22:side==='l'?12:-12;
    values[`elbow-${side}`]=airborne?-24:-8-(moving?Math.max(0,Math.sin(phase+offset))*12:0);
  }
  const previous = previousValues.get(pet) ?? {};
  for(const [key,value] of Object.entries(values)) {
    const rendered = `${value.toFixed(2)}${key==='body-y'?'px':'deg'}`;
    if (previous[key] !== rendered) pet.style.setProperty(`--hero-${key}`, rendered);
    previous[key] = rendered;
  }
  previousValues.set(pet, previous);
}
