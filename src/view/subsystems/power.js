import { ActionButton } from "../widgets"

import "../../css/subsystems/power.css"
import { WithTooltip } from "../tooltip"


export function PowerConsumption({subsystem}) {
    const availablePower = subsystem.subPowerBalance
    const nominalConsumption = subsystem.nominalPowerConsumption

    var text = ""
    var className = ""
    if (!subsystem.on) {
        text = `Needs ${subsystem.nominalPowerConsumption.toFixed(2)} kW`
        className = (nominalConsumption > availablePower) ? "insufficientPower " : "sufficientPower "
    } else {
        text = `Uses ${subsystem.powerConsumption.toFixed(2)} / ${nominalConsumption.toFixed(2)} kW`
    }

    return <div className="powerConsumption">
        <div className={"text " + className}>
            {text}
        </div>
        { (subsystem.powerConsumptionMultiplier > 1) &&
            <div className="extraPowerConsumption">
                <hr/>
                Extra power consumption
            </div>
        }
    </div>
}


export function PowerTooltip({subsystem}) {
    return <div className="powerButtonTooltip">
        <div className={"name " + (subsystem.disabled ? "disabled " : "enabled ")}>
            {subsystem.name + (subsystem.disabled ? " (disabled)" : "")}
        </div>
        {(subsystem.nominalPowerConsumption > 0) && <PowerConsumption subsystem={subsystem}/>}

        { subsystem.powerOnErrors &&
            <div className="errorConditions">
            <hr/>
            {
                subsystem.powerOnErrors.map(c =>
                <div className="condition" key={c}>{c}</div>)
            }
            </div>
        }
    </div>
}



export function SubsystemPowerButton({subsystem}) {
    return <div className='powerButton'>
        <WithTooltip tooltip={<PowerTooltip subsystem={subsystem}/>}>
            <ActionButton
                action={subsystem.actionOn}
            />
        </WithTooltip>
    </div>
}
