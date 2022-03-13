import React, { useContext, useEffect, useState } from "react";
import { MATERIALS, MATERIALS_IN_ORDER, MATERIAL_DEFINITIONS } from "../model/materials";
import { Tooltip, TooltipContext } from "./tooltip";

import "../css/materials.css"

class InventoryContext {
    constructor() {
        this.values = {}
    }
}

export const AvailableInventory = React.createContext(new InventoryContext())
export const RequiredInventory = React.createContext(new InventoryContext())


export function Materials({materials, filterOnes = true}) {
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


