import { Subsystem, SUBSYSTEM_CATEGORIES } from "."
import { randomElem } from "../../utils"
import { action } from "../action"
import { Reactor } from "./others"
import { Pumps } from "./pumps"

export class CheatBox extends Subsystem {
    constructor(gridPosition) {
        super(gridPosition, "cheatbox", "Cheatbox", SUBSYSTEM_CATEGORIES.WEAPON, {takesDamage: false})

        this.cheats = [
            action({
                id: "cheat_startSub",
                name: "Start Sub",
                onCompleted: (model) => {
                    model.sub.subsystems.forEach(s => {
                        s.on = true
                        if (s instanceof Reactor) {
                            s.externalSetControl(1)
                        }
                    })
                },
            }),
            action({
                id: "cheat_add_pump_light_damage",
                name: "Pump damage",
                onCompleted: (model) => {
                    const s = model.sub.subsystems.find(s => s instanceof Pumps)
                    const r = Math.random()
                    if (r < 0.33) {
                        s.addLightDamage()
                    } else if (r < 0.66) {
                        s.addMediumDamage()
                    } else {
                        s.addHeavyDamage()
                    }
                },
            }),
            action({
                id: "cheat_add_light_damage",
                name: "Add light damage",
                onCompleted: (model) => {
                    const s = randomElem(model.sub.subsystems.filter(s => s.takesDamage))
                    s.addLightDamage()
                },
            }),
            action({
                id: "cheat_add_medium_damage",
                name: "Add medium damage",
                onCompleted: (model) => {
                    const s = randomElem(model.sub.subsystems.filter(s => s.takesDamage))
                    s.addMediumDamage()
                },
            }),
            action({
                id: "cheat_add_heavy_damage",
                name: "Add heavy damage",
                onCompleted: (model) => {
                    const s = randomElem(model.sub.subsystems.filter(s => s.takesDamage))
                    s.addHeavyDamage()
                },
            }),
        ]

        this.actions.push(...this.cheats)
        this.on = true
    }

    toViewState() {
        return {
            ...super.toViewState(),
            cheats: this.cheats.map(c => c.toViewState()),
            isCheatbox: true,

        }
    }
}
