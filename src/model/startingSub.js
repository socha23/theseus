import { Point, Volume } from "./physics"
import { Sub } from "./sub"

import { SubStatusScreen } from "./subsystems/others"
import { Reactor } from "./subsystems/reactor"
import { Engine } from "./subsystems/engine"
import { Weapon } from "./subsystems/weapons"
import { Tracking } from "./subsystems/tracking"
import { Sonar } from "./subsystems/sonar"
import { Pumps } from "./subsystems/pumps"
import { CheatBox } from "./subsystems/cheatbox"
import { Storage } from "./subsystems/storage"
import { MATERIALS } from "./materials"
import { Minimap } from "./subsystems/minimap"
import { DAMAGE_TYPES } from "./subsystems/weapons"
import { Battery } from "./subsystems/battery"
import { BATTERY_DEFAULTS } from "./subsystems/battery"

const WEAPON_TEMPLATES = {
    COILGUN: {
        aimTime: 2000,
        reloadTime: 5000,
        ammoMax: 5,
        powerConsumption: 10,
        range: 32,
        damage: {
            type: DAMAGE_TYPES.PIERCING,
            strength: {from: 8, to: 12},
        },
    },
    RAILGUN: {
        aimTime: 4000,
        reloadTime: 10000,
        ammoMax: 2,
        powerConsumption: 20,
        range: 45,
        damage: {
            type: DAMAGE_TYPES.PIERCING,
            strength: {from: 20, to: 30},
        },
    }
}

const ENGINE_TEMPLATES = {
    BASIC_ENGINE: {
        force:  100 * 1000,
        rotationalForce: 4 * 1000,
        powerConsumption: 10,
    }
}

const SONAR_TEMPLATES = {
    BASIC_SONAR: {
        range: 50,
        powerConsumption: 10,
        gridSize: new Point(2, 3),
    }
}

const PUMP_TEMPLATES = {
    BASIC_PUMP: {
        pumpPower: 0.05,
        powerConsumption: 10,
        waterResistant: true,
    }
}


const TRACKING_TEMPLATES = {
    BASIC_TRACKING: {
        range: 80,
        powerConsumption: 5,
    }
}

const REACTOR_TEMPLATES = {
    BASIC_REACTOR: {
        maxOutput: 100,
        gridSize: new Point(1, 2),
        waterResistant: true,
    }
}

export function getStartingSub(position) {
    return new Sub(
        position,
        new Volume(2, 2, 10),
        [
            new Minimap(new Point(0, 0)),
            new CheatBox(new Point(0, 2)),
            new SubStatusScreen(new Point(0, 3), "status_1", "Status"),

            new Sonar(new Point(1, 0), "sonar", "Sonar", SONAR_TEMPLATES.BASIC_SONAR),
            new Tracking(new Point(2, 3), "tracking_1", "Tracking", TRACKING_TEMPLATES.BASIC_TRACKING),

            new Weapon(new Point(3, 0), "coil", "Coilgun", WEAPON_TEMPLATES.COILGUN),
            new Weapon(new Point(3, 1), "railgun", "Railgun", WEAPON_TEMPLATES.RAILGUN),
            new Pumps(new Point(3, 2), "pumps0", "Pumps", PUMP_TEMPLATES.BASIC_PUMP),
            new Storage(new Point(3, 3), "storage0", "Storage", {
                [MATERIALS.SPARE_PARTS]: 10,
                [MATERIALS.LEAK_SEALS]: 3,
                [MATERIALS.KINETIC_AMMO]: 5,
                [MATERIALS.FUEL_RODS]: 3,
            }),

            new Reactor(new Point(4, 0), "reactor", "Reactor", REACTOR_TEMPLATES.BASIC_REACTOR),
            new Battery(new Point(4, 2), "battery_1", "Battery", BATTERY_DEFAULTS),
            new Engine(new Point(4, 3), "engine_2", "Engine", ENGINE_TEMPLATES.BASIC_ENGINE),


    ])
}
