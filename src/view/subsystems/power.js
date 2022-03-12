import { useContext } from "react"
import { TooltipContext } from "../tooltip"

import "../../css/subsystems/power.css"

export function SubsystemPowerInfo({subsystem}) {

    const tooltipCtx = useContext(TooltipContext)

    var tooltip = null;

    if (!subsystem.on) {
        tooltip = <div>
            Req power: {subsystem.nominalPowerConsumption} kW
        </div>
    } else if (subsystem.powerConsumption !== subsystem.nominalPowerConsumption) {
        tooltip = <div>
            Power use: {subsystem.powerConsumption} / {subsystem.nominalPowerConsumption} kW
        </div>

    } else {
        tooltip = <div>
            Power use: {subsystem.powerConsumption} kW
        </div>
    }
    return <div className="powerInfo"
        onMouseOver ={e => {tooltipCtx.tooltip = tooltip}}
        onMouseOut ={e => {tooltipCtx.tooltip = null}}
    >
        <i className="icon fa-solid fa-bolt"/>
    </div>
}

