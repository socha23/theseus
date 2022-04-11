import { Subsystem } from "."
import { randomElem } from "../../utils"
import { Engine } from "./engine"
import { action } from "../action"
import { Reactor } from "./reactor"
import { Pumps } from "./pumps"

export class CheatBox extends Subsystem {
    constructor(gridPosition) {
        super(gridPosition, "cheatbox", "Cheatbox", {takesDamage: false, waterResistant: true})

        this.cheats = [
            action({
                id: "cheat_startSub",
                name: "Start Sub",
                onCompleted: (model) =>  {
                    model.sub.subsystems
                        .filter(s => s instanceof Reactor)
                        .forEach(s => {
                            s.on = true
                            s._fuel = 1
                            s.externalSetControl(1)
                    })
                },
            }),
            action({
                id: "cheat_add_pump_damage",
                name: "Pump damage",
                onCompleted: (model) => {
                    model.sub.subsystems.find(s => s instanceof Pumps).addLightDamage()
                },
            }),
            action({
                id: "cheat_add_engine_damage",
                name: "Engine damage",
                onCompleted: (model) => {
                    model.sub.subsystems.find(s => s instanceof Engine).addLightDamage()
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

    createViewState(model) {
        return {
            cheats: this.cheats.map(c => c.toViewState()),
            isCheatbox: true,
        }
    }
}
