export interface Point {
  x: number;
  y: number;
}
export type RandomSource = () => number;
export type Gender = "nam" | "nu";
export type GenderByName = Record<string, Gender>;
export interface House {
  id: number;
  name: string;
  row: number;
  column: number;
  gridX: number;
  gridY: number;
  styleIndex: number;
  characterIndex: number;
}
export interface Village {
  rows: number;
  columns: number;
  houseGap: number;
  yardDepth: number;
  houses: House[];
  width: number;
  depth: number;
  westRoadX: number;
  eastRoadX: number;
  streetYs: number[];
  trees: Point[];
}
export type Direction = "right" | "left" | "down" | "up";
export type Action =
  | "ride"
  | "brake"
  | "turn"
  | "look"
  | "horn"
  | "stall"
  | "fall"
  | "walk"
  | "knock"
  | "waitForDoor"
  | "readNotice"
  | "summon";
export type DecoyType =
  "wrongDoor" | "brakeAndTurn" | "duckHorn" | "lookAround";
export type IncidentType = "trashCan" | "stall" | "dog";
export type CueName =
  | "whistle"
  | "brake"
  | "knock"
  | "horn"
  | "crash"
  | "stall"
  | "bark"
  | "summon"
  | "result";
export type MusicMood = "calm" | "chase" | "arrival" | "suspense" | "silent";
export interface MotionSegment {
  startTime: number;
  endTime: number;
  action: Action;
  from: Point;
  to: Point;
  direction: Direction;
}
export interface Dialogue {
  startTime: number;
  endTime: number;
  speaker: number | "rooster";
  text: string;
  isShout: boolean;
}
export interface Obstacle {
  type: IncidentType;
  position: Point;
  impactTime: number;
  endTime: number;
}
export interface TimelineCue {
  time: number;
  name: CueName;
}
export interface DoorEvent {
  houseId: number;
  startTime: number;
  endTime: number;
  exitsHouse: boolean;
}
export interface Round {
  selectedNames: string[];
  selectedHouseIds: number[];
  decoyHouseIds: number[];
  segments: MotionSegment[];
  dialogues: Dialogue[];
  obstacles: Obstacle[];
  cues: TimelineCue[];
  knockTimes: number[];
  finalKnockTime: number;
  resultTime: number;
  decoyType: DecoyType | null;
  incidentType: IncidentType | null;
  reactions: Record<number, number>;
  doorEvents: DoorEvent[];
  startsNewCycle: boolean;
  returnsToFirstHouse: boolean;
  hesitationHouseId: number | null;
}
export interface RoundOptions {
  selectedNames?: string[];
  decoyType?: DecoyType | null;
  incidentType?: IncidentType | null;
  decoyCount?: number;
  returnsToFirstHouse?: boolean;
  hesitates?: boolean;
}
export interface NarrativePlan {
  decoyCount: number;
  returnsToFirstHouse: boolean;
  hesitationHouse: House | null;
  skipSelectedStreets: boolean;
  walkingSpeed: number;
}
export interface RoosterPose {
  segment: MotionSegment;
  position: Point;
  progress: number;
}
export interface SoundState {
  engineRunning: boolean;
  musicMood: MusicMood;
}
export interface SpeechBubble extends Point {
  id: string;
  text: string;
}
export interface Shout extends SpeechBubble {
  progress: number;
  isLarge: boolean;
}
export interface SpeechFrame {
  shouts: Shout[];
  bubbles: SpeechBubble[];
}
export type Bounds = [left: number, top: number, right: number, bottom: number];
export interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
  bounds: Bounds;
  doorBounds?: Bounds;
}
export interface SpriteDefinition {
  url: string;
  frames: SpriteFrame[];
}
export interface SpriteSheet {
  image: HTMLImageElement;
  frames: SpriteFrame[];
}
