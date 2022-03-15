import React, { useContext } from "react";
import { MATERIALS, MATERIALS_IN_ORDER, MATERIAL_DEFINITIONS } from "../model/materials";

import "../css/materials.css"
import { jsonCompare } from "../utils";

class InventoryContext {
    constructor() {
        this.values = {}
    }
}

export const AvailableInventory = React.createContext(new InventoryContext())
export const RequiredInventory = React.createContext(new InventoryContext())

function _Materials({materials, filterOnes = true}) {
    const inventory = useContext(AvailableInventory).values
    return <div className="materials">
        {
            MATERIALS_IN_ORDER.filter(m => (m in materials)).map(mId => {
                const count = materials[mId]
                const available = (count <= inventory[mId])

                return <div key={mId} className={"material " + (available ? "available " : "unavailable ")}>
                    {
                        (count > (filterOnes ? 1 : 0)) && <span className="count">{count}</span>
                    }
                    <i className={"materialIcon " + MATERIAL_DEFINITIONS[mId].icon }/>
                </div>
            })
        }
    </div>
}
//export const Materials = _Materials
export const Materials = React.memo(_Materials, jsonCompare)

export function MarkRequiredMaterialsOnHover({materials, children}) {
    const requiredInventory = useContext(RequiredInventory)

    return <div
        onMouseOver = {e => {
            requiredInventory.values = materials
        }}
        onMouseOut = {e => {
            requiredInventory.values = {}
        }}
    >
        {children}
    </div>
}
