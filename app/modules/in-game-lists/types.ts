import type { abilities } from "./abilities";
import type { brandIds } from "./brand-ids";
import type { modesShort, modesShortWithSpecial } from "./modes";
import type { stageIds } from "./stage-ids";
import type {
	mainWeaponIds,
	specialWeaponIds,
	subWeaponIds,
} from "./weapon-ids";

export type ModeShort = (typeof modesShort)[number];
export type ModeShortWithSpecial = (typeof modesShortWithSpecial)[number];
export type RankedModeShort = Exclude<ModeShort, "TW">;

export type StageId = (typeof stageIds)[number];

export type ModeWithStage = { mode: ModeShort; stageId: StageId };

export type Ability = (typeof abilities)[number]["name"];
export type AbilityWithUnknown = (typeof abilities)[number]["name"] | "UNKNOWN";
export type AbilityType = (typeof abilities)[number]["type"];

export type MainWeaponId = (typeof mainWeaponIds)[number];
export type SubWeaponId = (typeof subWeaponIds)[number];
export type SpecialWeaponId = (typeof specialWeaponIds)[number];

export type BuildAbilitiesTuple = [
	head: [main: Ability, s1: Ability, s2: Ability, s3: Ability],
	clothes: [main: Ability, s1: Ability, s2: Ability, s3: Ability],
	shoes: [main: Ability, s1: Ability, s2: Ability, s3: Ability],
];
export type BuildAbilitiesTupleWithUnknown = [
	head: [
		main: AbilityWithUnknown,
		s1: AbilityWithUnknown,
		s2: AbilityWithUnknown,
		s3: AbilityWithUnknown,
	],
	clothes: [
		main: AbilityWithUnknown,
		s1: AbilityWithUnknown,
		s2: AbilityWithUnknown,
		s3: AbilityWithUnknown,
	],
	shoes: [
		main: AbilityWithUnknown,
		s1: AbilityWithUnknown,
		s2: AbilityWithUnknown,
		s3: AbilityWithUnknown,
	],
];

export type BrandId = (typeof brandIds)[number];
