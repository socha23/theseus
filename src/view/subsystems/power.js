import { ActionButton } from "../widgets"

import "../../css/subsystems/power.css"
import { WithTooltip } from "../tooltip"
import { memo } from "react"
import { jsonCompare } from "../../utils"


export function PowerConsumption({on, nominalConsumption, insufficientPower, powerConsumption, powerConsumptionMultiplier}) {

    var text = ""
    var className = ""
    if (!on) {
        text = `Needs ${nominalConsumption.toFixed(2)} kW`
        className = (insufficientPower) ? "insufficientPower " : "sufficientPower "
    } else {
        text = `Uses ${powerConsumption.toFixed(2)} / ${nominalConsumption.toFixed(2)} kW`
    }
    return <div className="powerConsumption">
        <div className={"text " + className}>
            {text}
        </div>
        { (powerConsumptionMultiplier > 1) &&
            <div className="extraPowerConsumption">
                <hr/>
                Extra power consumption
            </div>
        }
    </div>
}


export function PowerTooltip({on, disabled, name, nominalConsumption, powerOnErrors, insufficientPower, powerConsumption, powerConsumptionMultiplier}) {
    return <div className="powerButtonTooltip">
        <div className={"name " + (disabled ? "disabled " : "enabled ")}>
            {name + (disabled ? " (disabled)" : "")}
        </div>
        {(nominalConsumption > 0) && <PowerConsumption
            on={on}
            nominalConsumption={nominalConsumption}
            insufficientPower={insufficientPower}
            powerConsumption={powerConsumption}
            powerConsumptionMultiplier={powerConsumptionMultiplier}
            />}

        { powerOnErrors &&
            <div className="errorConditions">
            <hr/>
            {
                powerOnErrors.map(c =>
                <div className="condition" key={c}>{c}</div>)
            }
            </div>
        }
    </div>
}




function _InnerSubsystemPowerButton(params) {
    return <div className='powerButton'>
        <WithTooltip tooltip={<PowerTooltip {...params}
        />}>
            <ActionButton
                action={params.actionOn}
            />
        </WithTooltip>
    </div>
}

const InnerSubsystemPowerButton = memo(_InnerSubsystemPowerButton, jsonCompare)


export function SubsystemPowerButton({subsystem}) {
    const insufficientPower = subsystem.nominalPowerConsumption > subsystem.availablePower
    return <InnerSubsystemPowerButton
        on={subsystem.on}
        disabled={subsystem.disabled}
        name={subsystem.name}
        nominalConsumption={subsystem.nominalPowerConsumption}
        powerOnErrors={subsystem.powerOnErrors}
        insufficientPower={insufficientPower}
        actionOn={subsystem.actionOn}
        powerConsumption={subsystem.powerConsumption}
        powerConsumptionMultiplier={subsystem.powerConsumptionMultiplier}

    />

}
