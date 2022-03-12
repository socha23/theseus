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
                name: "Pump light damage",
                onCompleted: (model) => {
                    const s = model.sub.subsystems.find(s => s instanceof Pumps)
                    s.addLightDamage()
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
