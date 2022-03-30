import React, {memo} from "react";
import "../../css/subsystems/engine.css"
import { WithTooltip } from "../tooltip";
import { SegmentProgress } from "../widgets";


function EnginePowerBoxTooltip({nominalThrust, thrustMultiplier, rotationMultiplier}) {
    return <div className="enginePowerTooltip">
        <div>
            Engine thrust: {Math.floor(nominalThrust / 1000)} kN
        </div>
        {
        (thrustMultiplier < 1 || rotationMultiplier < 1) && <div className="reducedForce">
            Reduced thrust
            </div>
        }
    </div>
}

function _EngineInner({speed, thrustMultiplier, rotationMultiplier, nominalThrust, thrustThrottlePercent, rotationThrottlePercent}) {
    return <div className={"engine "}>
        <div className="mainPane">
            <div className="topRow">
                <i className={"engineIcon fa-solid fa-gear "}/>
                <div className={"powerBox "
                    + ((thrustMultiplier < 1 || rotationMultiplier < 1) ? "reducedForce " : "")
                  }>
                    <WithTooltip tooltip={<EnginePowerBoxTooltip nominalThrust={nominalThrust} thrustMultiplier={thrustMultiplier} rotationMultiplier={rotationMultiplier}/>}>
                        <div>
                            {Math.floor(nominalThrust / 1000)} kN
                        </div>
                        <div>{speed} m/s</div>
                    </WithTooltip>
                </div>
            </div>
        </div>
        <div className="infoBox">
            <div>
                <SegmentProgress segments={20} value={thrustThrottlePercent}/>
            </div>
            <div className="directions">
                <SegmentProgress value={Math.abs(Math.min(0, rotationThrottlePercent))} reverse={true}/>
                <SegmentProgress value={Math.max(0, rotationThrottlePercent)}/>
            </div>
        </div>
    </div>

}

const EngineInner = memo(_EngineInner)

export function Engine({subsystem}) {
    return <EngineInner
        speed={subsystem.speed.toFixed(1)}
        thrustMultiplier={subsystem.thrustMultiplier}
        rotationMultiplier={subsystem.rotationMultiplier}
        nominalThrust={subsystem.nominalThrust}
        thrustThrottlePercent={subsystem.thrustThrottlePercent}
        rotationThrottlePercent={subsystem.rotationThrottlePercent}
    />
}

