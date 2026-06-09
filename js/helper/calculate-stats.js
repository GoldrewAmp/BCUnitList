//@ts-check
import ORB_MAP from "../../assets/orb-map.js";
import SETTINGS from "../../assets/settings.js";
import { getTraitSpecificMult, getAbilityOrb, getDesiredLevel, getEffectOrb, getLevelStatMult, getTalentStatMod, getTreasurePercent, getUnitTraitTargets, hasAbility } from "./calculate-stat-mult.js";

/**
 * @enum {number}
 * @readonly
 */
export const CALCULATOR_LEVEL_OPTIONS = {
    LEVEL_CURRENT: 0,
    LEVEL_1: 1,
    LEVEL_30: 2,
    LEVEL_50: 3,
    LEVEL_MAX: 4
}

/** 
 * @typedef CALCULATOR_OPTIONS
 * @property {string[]} targetTraits
 * @property {string[]} targetSubTraits
 * @property {CALCULATOR_LEVEL_OPTIONS} testLevelValue
 * @property {boolean} includeTalents
 * @property {boolean} includeOrbs
 * @property {number} eocChapterPrice
 * @property {boolean} talentIgnoreForm
 */

/**
 * @type {CALCULATOR_OPTIONS}
 */
export const DEFAULT_CALCULATOR_OPTIONS = {
    targetTraits: [],
    targetSubTraits: [],
    testLevelValue: CALCULATOR_LEVEL_OPTIONS.LEVEL_CURRENT,
    includeTalents: true,
    includeOrbs: true,
    eocChapterPrice: 2, // Currently unused
    talentIgnoreForm: true
}

/**
 * Calculates the effective cost of a unit.
 * @param {number} initialValue The cost before any modifiers.
 * @param {import("../data/unit-data").UNIT_RECORD} updatedData Values for the unit that can be modified, e.g. level, talents, etc.
 * @param {import("../data/unit-data").UNIT_DATA} fixedData Values for the unit that cannot be modified. Also contains modifiable values, but these may be outdated and should not be used.
 * @param {CALCULATOR_OPTIONS} calculatorOptions Options for modifying the calculations for convenience.
 * @returns {number} The calculated cost.
 */
export function calculateCost(initialValue, updatedData, fixedData, calculatorOptions = DEFAULT_CALCULATOR_OPTIONS) {
    let cost = initialValue;

    cost -= getTalentStatMod("Cost_Down", fixedData, updatedData, calculatorOptions.talentIgnoreForm);

    if(calculatorOptions.eocChapterPrice === 1) {
        cost = Math.ceil(cost * 2 / 3);
    } else if(calculatorOptions.eocChapterPrice === 3) {
        cost = Math.ceil(cost * 4 / 3);
    }

    return cost;
}

/**
 * Calculates the effective health of a unit.
 * @param {number} initialValue The health value before any modifiers.
 * @param {import("../data/unit-data").UNIT_RECORD} updatedData Values for the unit that can be modified, e.g. level, talents, etc.
 * @param {import("../data/unit-data").UNIT_DATA} fixedData Values for the unit that cannot be modified. Also contains modifiable values, but these may be outdated and should not be used.
 * @param {CALCULATOR_OPTIONS} calculatorOptions Options for modifying the calculations for convenience.
 * @returns {number} The calculated health.
 */
export function calculateHealth(initialValue, updatedData, fixedData, calculatorOptions = DEFAULT_CALCULATOR_OPTIONS) {
    const shieldMult = 1 + 0.5 * getTreasurePercent("Legendary Cat Shield", "eoc");
    const usedLevel = getDesiredLevel(calculatorOptions.testLevelValue, updatedData.level + updatedData.plus_level, fixedData);

    let health = getLevelStatMult(initialValue, usedLevel, fixedData.id, fixedData.rarity, shieldMult);
    health *= getTraitSpecificMult(fixedData, updatedData, calculatorOptions, "def");
    
    for(const subtrait of calculatorOptions.targetSubTraits) {
        const subtraitIndex = SETTINGS.subTraits.indexOf(subtrait);
        const subtraitKillerAbility = SETTINGS.subTraitKillers[subtraitIndex];

        if(hasAbility(subtraitKillerAbility, fixedData, updatedData, calculatorOptions.includeTalents, calculatorOptions.talentIgnoreForm)) {
            health *= SETTINGS.subTraitEffectMult.def[subtraitKillerAbility] ?? 1;
        }
    }

    if(calculatorOptions.includeOrbs) {
        if(calculatorOptions.targetSubTraits.includes("Colossus")) {
            // @ts-ignore Type hints do not detect that filter prevents null orbs from being reduced
            health *= getAbilityOrb("Colossus Slayer", updatedData).reduce((prev, curr) => Math.max(prev, ORB_MAP.type_mults.def.Colossus_Slayer[curr.rank]), 1);
        }
    }

    if(calculatorOptions.includeTalents) {
        health *= 1 + getTalentStatMod("Defense", fixedData, updatedData, calculatorOptions.talentIgnoreForm);
    }

    if(calculatorOptions.includeOrbs) {
        // @ts-ignore Type hints do not detect that filter prevents null orbs from being reduced
        const orbDef = getEffectOrb("Defense", calculatorOptions.targetTraits, updatedData).reduce((prev, next) => prev + ORB_MAP.type_mults.def.Defense[next.rank], 1);
        health *= orbDef;
    }

    return Math.max(1, Math.floor(health));
}

/**
 * Calculates the effective damage of a unit.
 * @param {number} initialValue The damage value before any modifiers.
 * @param {import("../data/unit-data").UNIT_RECORD} updatedData Values for the unit that can be modified, e.g. level, talents, etc.
 * @param {import("../data/unit-data").UNIT_DATA} fixedData Values for the unit that cannot be modified. Also contains modifiable values, but these may be outdated and should not be used.
 * @param {CALCULATOR_OPTIONS} calculatorOptions Options for modifying the calculations for convenience.
 * @returns {number} The calculated damage.
 */
export function calculateDamage(initialValue, updatedData, fixedData, calculatorOptions = DEFAULT_CALCULATOR_OPTIONS) {
    if(calculatorOptions.targetTraits.length > 0 &&
       hasAbility("Restricted_Target", fixedData, updatedData, calculatorOptions.includeTalents, calculatorOptions.talentIgnoreForm) &&
       getUnitTraitTargets(fixedData, updatedData, calculatorOptions.includeTalents, calculatorOptions.talentIgnoreForm).every(t => !calculatorOptions.targetTraits.includes(t))) {
        // If can only attack certain traits and none of the selected traits are those traits, cannot attack, and thus does 0 damage
        return 0;
    }

    const swordMult = 1 + 0.5 * getTreasurePercent("Legendary Cat Sword", "eoc");
    const usedLevel = getDesiredLevel(calculatorOptions.testLevelValue, updatedData.level + updatedData.plus_level, fixedData);

    let damage = getLevelStatMult(initialValue, usedLevel, fixedData.id, fixedData.rarity, swordMult);
    damage *= getTraitSpecificMult(fixedData, updatedData, calculatorOptions, "atk");
    
    for(const subtrait of calculatorOptions.targetSubTraits) {
        const subtraitIndex = SETTINGS.subTraits.indexOf(subtrait);
        const subtraitKillerAbility = SETTINGS.subTraitKillers[subtraitIndex];

        if(hasAbility(subtraitKillerAbility, fixedData, updatedData, calculatorOptions.includeTalents, calculatorOptions.talentIgnoreForm)) {
            damage *= SETTINGS.subTraitEffectMult.atk[subtraitKillerAbility] ?? 1;
        }
    }

    if(calculatorOptions.includeOrbs) {
        if(calculatorOptions.targetSubTraits.includes("Colossus")) {
            // @ts-ignore Type hints do not detect that filter prevents null orbs from being reduced
            damage *= getAbilityOrb("Colossus Slayer", updatedData).reduce((prev, curr) => Math.max(prev, ORB_MAP.type_mults.atk.Colossus_Slayer[curr.rank]), 1);
        }
    }

    if(calculatorOptions.includeTalents) {
        damage *= 1 + getTalentStatMod("Attack", fixedData, updatedData, calculatorOptions.talentIgnoreForm);
    }
    
    if(calculatorOptions.includeOrbs) {
        // @ts-ignore Type hints do not detect that filter prevents null orbs from being reduced
        const flatOrbAtk = getEffectOrb("Attack", calculatorOptions.targetTraits, updatedData).reduce((prev, next) => prev + ORB_MAP.type_mults.atk.Attack[next.rank], 0);
        damage += flatOrbAtk * initialValue;
    }

    return Math.max(1, Math.floor(damage));
}

/**
 * Calculates the effective number of knockbacks of a unit.
 * @param {number} initialValue The knockback count before any modifiers.
 * @param {import("../data/unit-data").UNIT_RECORD} _updatedData Values for the unit that can be modified, e.g. level, talents, etc.
 * @param {import("../data/unit-data").UNIT_DATA} _fixedData Values for the unit that cannot be modified. Also contains modifiable values, but these may be outdated and should not be used.
 * @param {CALCULATOR_OPTIONS} _calculatorOptions Options for modifying the calculations for convenience, not currently used.
 * @returns {number} The calculated knockback count.
 */
export function calculateKnockbacks(initialValue, _updatedData, _fixedData, _calculatorOptions = DEFAULT_CALCULATOR_OPTIONS) {
    return initialValue;
}

/**
 * Calculates the effective recharge time of a unit.
 * @param {number} initialValue The recharge time before any modifiers.
 * @param {import("../data/unit-data").UNIT_RECORD} updatedData Values for the unit that can be modified, e.g. level, talents, etc.
 * @param {import("../data/unit-data").UNIT_DATA} fixedData Values for the unit that cannot be modified. Also contains modifiable values, but these may be outdated and should not be used.
 * @param {CALCULATOR_OPTIONS} calculatorOptions Options for modifying the calculations for convenience.
 * @returns {number} The calculated recharge time.
 */
export function calculateRechargeTime(initialValue, updatedData, fixedData, calculatorOptions = DEFAULT_CALCULATOR_OPTIONS) {
    let output = initialValue;

    // 30 is for 30 frames per second, since recharge is by number of frames and it doesn't make sense to say a unit recharges in, e.g., 42.53 frames.
    output -= Math.round(30 * getTreasurePercent("Relativity Clock", "eoc")) / 30;

    const abilityIndex = SETTINGS.abilities.abilityNames.indexOf("Research");
    const abilityLevels = window.localStorage.getItem("abo")?.split("-") ?? [];
    const researchLevels = abilityLevels[abilityIndex].split("+");
    const totalResearchLevel = parseInt(researchLevels[0]) + parseInt(researchLevels[1]);

    output -= 0.2 * (totalResearchLevel - 1); // - 0.2 sec per level starting at level 2 (since you start with level 1)

    output -= Math.round(30 * getTalentStatMod("Recover_Speed", fixedData, updatedData, calculatorOptions.talentIgnoreForm)) / 900; // 30 for 30 frames per second, / (30 * 30) because getTalentStatMod output is in frames

    return Math.max(2, output); // Recharge time cannot go below 2 seconds
}

/**
 * Calculates the effective range of a unit.
 * @param {number} initialValue The range before any modifiers.
 * @param {import("../data/unit-data").UNIT_RECORD} _updatedData Values for the unit that can be modified, e.g. level, talents, etc.
 * @param {import("../data/unit-data").UNIT_DATA} _fixedData Values for the unit that cannot be modified. Also contains modifiable values, but these may be outdated and should not be used.
 * @param {CALCULATOR_OPTIONS} _calculatorOptions Options for modifying the calculations for convenience, not currently used.
 * @returns {number} The calculated range.
 */
export function calculateRange(initialValue, _updatedData, _fixedData, _calculatorOptions = DEFAULT_CALCULATOR_OPTIONS) {
    return initialValue;
}

/**
 * Calculates the effective speed of a unit.
 * @param {number} initialValue The speed before any modifiers.
 * @param {import("../data/unit-data").UNIT_RECORD} updatedData Values for the unit that can be modified, e.g. level, talents, etc.
 * @param {import("../data/unit-data").UNIT_DATA} fixedData Values for the unit that cannot be modified. Also contains modifiable values, but these may be outdated and should not be used.
 * @param {import("./calculate-stats.js").CALCULATOR_OPTIONS} calculatorOptions Options for modifying the calculations for convenience.
 * @returns {number} The calculated speed.
 */
export function calculateSpeed(initialValue, updatedData, fixedData, calculatorOptions = DEFAULT_CALCULATOR_OPTIONS) {
    let speed = initialValue;

    speed += getTalentStatMod("Move_Speed", fixedData, updatedData, calculatorOptions.talentIgnoreForm);

    return speed;
}