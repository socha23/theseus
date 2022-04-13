import { Subsystem } from "."
import { randomElem } from "../../utils"
import { action } from "../action"
import { Battery } from "./battery"
import { Reactor } from "./reactor"

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
                id: "dam",
                name: "Battery damage",
                onCompleted: (model) => {
                    model.sub.subsystems.find(s => s instanceof Battery).addRandomDamage()
                },
            }),
            action({
                id: "cheat_add_medium_damage",
                name: "Add random damage",
                onCompleted: (model) => {
                    const s = randomElem(model.sub.subsystems.filter(s => s.takesDamage))
                    s.addRandomDamage()
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
