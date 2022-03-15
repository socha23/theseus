import "../../css/subsystems/engine.css"
import { WithTooltip } from "../tooltip";
import { SegmentProgress } from "../widgets";


function EnginePowerBoxTooltip({subsystem}) {
    return <div className="enginePowerTooltip">
        <div>
            Engine thrust: {Math.floor(subsystem.nominalThrust / 1000)} kN
        </div>
        {
        (subsystem.thrustMultiplier < 1 || subsystem.rotationMultiplier < 1) && <div className="reducedForce">
            Reduced thrust
            </div>
        }
    </div>
}


export function Engine({subsystem}) {
    return <div className={"engine "}>
        <div className="mainPane">
            <div className="topRow">
                <i className={"engineIcon fa-solid fa-gear "}/>
                <div className={"powerBox "
                    + ((subsystem.thrustMultiplier < 1 || subsystem.rotationMultiplier < 1) ? "reducedForce " : "")
                  }>
                    <WithTooltip tooltip={<EnginePowerBoxTooltip subsystem={subsystem}/>}>
                        <div>
                            {Math.floor(subsystem.nominalThrust / 1000)} kN
                        </div>
                        <div>{subsystem.speed.toFixed(1)} m/s</div>
                    </WithTooltip>
                </div>
            </div>
        </div>
        <div className="infoBox">
            <div>
                <SegmentProgress segments={20} value={subsystem.thrustThrottlePercent}/>
            </div>
            <div className="directions">
                <SegmentProgress value={Math.abs(Math.min(0, subsystem.rotationThrottlePercent))} reverse={true}/>
                <SegmentProgress value={Math.max(0, subsystem.rotationThrottlePercent)}/>
            </div>
        </div>
    </div>
}

