import { ActionButton } from "../widgets"
import "../../css/subsystems/weapons.css"
import { useContext, useCallback, memo } from "react"
import { ActionControllerCtx } from "../../actionController"
import {jsonCompare} from "../../utils"

function AmmoBullet({spent}) {
    return <span className='bullet'>
        <i className={"fa-circle " + (spent ? "fa-regular": "fa-solid")}></i>
    </span>
}

function AmmoBar({subsystem}) {
    return <div className='ammo'>
        <span>Ammo: </span>
        {
            new Array(subsystem.ammoMax).fill(0).map((key, idx) =>
                 <AmmoBullet key={subsystem.i + "_ammo_" + idx} spent={idx >= subsystem.ammo}/>
            )
        }
    </div>
}


var render = 0


function _InnerAimBarSegment({sizePercent, className, color}) {
    console.log("RENDER", render++)
    return <div
            className={className}
            //onClick={onClick}
            style={{width: sizePercent + "%", borderColor: color}}
        >
        <div
            className="inner "
            //onClick={onClick}
            style={{backgroundColor: color}}
        />
    </div>
}

const InnerAimBarSegment = memo(_InnerAimBarSegment)

//const InnerAimBarSegment = _InnerAimBarSegment

function AimBarSegment({distancePercent, sizePercent, className, color}) {
    return <div style={{
        height: "100%",
        position: "absolute",
        left: distancePercent + "%",
        width: "100%",
    }}>
        <InnerAimBarSegment sizePercent={sizePercent} className={className} color={color}/>
    </div>
}

function AimTarget({t}) {
    const actionController = useContext(ActionControllerCtx)
    const onClick = useCallback(() => {actionController.targetEntityId = t.id}, [t.id])
    return <div style={{
        height: "100%",
        position: "absolute",
        width: "100%",
        left: t.distancePercent + "%",
    }}>
        <InnerAimBarSegment
            //onClick={onClick}
            sizePercent={t.sizePercent}
            color={t.color}
            className={"target "
                + (t.alive ? "alive " : "dead ")
                + (t.obscured ? "obscured " : "unobscured ")
                + (t.selected ? "selected " : "unselected ")
                }
        />
    </div>

}

function AimBar({aim}) {

    return <div className={"aimBar " + (aim.targetObscured ? "obscured " : "visible ")}>
        {   aim.on && <div className="aimBarInner">
            {
                aim.rangePercent && <div
                    className="range"
                    style={{
                        width: aim.rangePercent + "%",
                    }}
                />
            }
            {
                aim.targets.map(t => <AimTarget key={t.id} t={t}/>)
            }
            {
                aim.crosshairs && <AimBarSegment
                    distancePercent={aim.crosshairs.distancePercent}
                    sizePercent={aim.crosshairs.sizePercent}
                    className="crosshairs"
                />
            }
            {
                aim.shootMarks.map(t => <AimBarSegment
                    distancePercent={t.distancePercent}
                    sizePercent={t.sizePercent}
                    className={"shootMark " + (t.hit ? "hit " : "miss ")}
                    key={t.distancePercent}
                />)
            }
        </div>
        }
    </div>
}


export function Weapon({subsystem}) {
    return <div className="weapon">
        <AmmoBar subsystem={subsystem}/>
        <div className="filler"/>
        <AimBar aim={subsystem.aim}/>
        <div className="actions">
            {subsystem.weaponActions.map(a =>
            <ActionButton key={a.id}
                action={a} />)}
        </div>
    </div>
}
