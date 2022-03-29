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

const WEAPON_TEMPLATES = {
    COILGUN: {
        aimTime: 2000,
        reloadTime: 5000,
        ammoMax: 5,
        powerConsumption: 10,
        range: 32,
        damage: 10,
    },
    RAILGUN: {
        aimTime: 4000,
        reloadTime: 10000,
        ammoMax: 2,
        powerConsumption: 20,
        range: 45,
        damage: 20,
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

const FISH_TEMPLATES = {
    SMALL_FISH: {
        id: "small_fish",
        volume: new Volume(0.5, 0.5, 2, 0.2),
        tailForce: 2 * 1000,
        rotationalForce: 1 * 1000,
        rotationSpeed: 1,
        color: "#AEF3E7"
    },
    GOAT_FISH: {
        id: "goat_fish",
        volume: new Volume(1, 1, 3, 0.2),
        tailForce: 5 * 1000,
        rotationalForce: 2 * 1000,
        rotationSpeed: 1,
        color: "blue",
        territoryRange: 30,
    },
    FAT_FISH: {
        id: "fat_fish",
        volume: new Volume(2, 2, 3, 0.2),
        tailForce: 15 * 1000,
        rotationalForce: 2 * 1000,
        rotationSpeed: 1,
        color: "#E08E45",
        aggresive: true,
        attacks: [{
            range: 2,
            cooldown: 1000,
            damage: {
                type: "default",
                strength: 5,
            }
        }],
    },
    BIG_FISH: {
        id: "big_fish",
        volume: new Volume(2, 2, 5, 0.1),
        tailForce: 35 * 1000,
        rotationalForce: 2 * 1000,
        rotationSpeed: 1,
        color: "red",
        aggresive: true,
        attacks: [{
            range: 2,
            cooldown: 3000,
            damage: {
                type: "default",
                strength: 10,
            }
        }],
    },

}

export function getStartingSub(position) {
    return new Sub(
        position,
        new Volume(2, 2, 10),
        [
            new Minimap(new Point(0, 0)),
            new CheatBox(new Point(0, 2)),

            new Sonar(new Point(1, 0), "sonar", "Sonar", SONAR_TEMPLATES.BASIC_SONAR),
            new Tracking(new Point(2, 3), "tracking_1", "Tracking", TRACKING_TEMPLATES.BASIC_TRACKING),

            new Weapon(new Point(3, 0), "coil", "Coilgun", WEAPON_TEMPLATES.COILGUN),
            new Weapon(new Point(3, 1), "railgun", "Railgun", WEAPON_TEMPLATES.RAILGUN),
            new Pumps(new Point(3, 2), "pumps0", "Pumps", PUMP_TEMPLATES.BASIC_PUMP),
            new Storage(new Point(3, 3), "storage0", "Storage", {
                [MATERIALS.SPARE_PARTS]: 20,
                [MATERIALS.LEAK_SEALS]: 5,
                [MATERIALS.KINETIC_AMMO]: 5,
                [MATERIALS.FUEL_RODS]: 3,
            }),

            new Reactor(new Point(4, 0), "reactor", "Reactor", REACTOR_TEMPLATES.BASIC_REACTOR),
            new Engine(new Point(4, 2), "engine_2", "Engine", ENGINE_TEMPLATES.BASIC_ENGINE),
            new SubStatusScreen(new Point(4, 3), "status_1", "Status"),


    ])
}
