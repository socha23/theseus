import { ActionButton } from "../widgets"
import "../../css/subsystems/weapons.css"
import { useContext } from "react"
import { ActionControllerCtx } from "../../actionController"

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


function AimBarSegment({segment, className, color, onClick=()=>{}}) {
    const style = {
        left: segment.distancePercent + "%",
        width: segment.sizePercent + "%",
    }
    const innerStyle={}
    if (color) {
        style.borderColor = color
        innerStyle.backgroundColor = color
    }

    return <div
            className={className}
            onClick={onClick}
            style={style}
        >
        <div
            className="inner "
            onClick={onClick}
            style={innerStyle}
        />
    </div>
}

function AimBar({aim}) {
    const actionController = useContext(ActionControllerCtx)

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
                aim.targets.map(t => <AimBarSegment key={t.id}
                    onClick={() => {actionController.targetEntityId = t.id}}
                    segment={t}
                    color={t.color}
                    className={"target "
                        + (t.alive ? "alive " : "dead ")
                        + (t.obscured ? "obscured " : "unobscured ")
                        + (t.selected ? "selected " : "unselected ")
                        }

                />)
            }
            {
                aim.crosshairs && <AimBarSegment segment={aim.crosshairs} className="crosshairs"/>
            }
            {
                aim.shootMarks.map(t => <AimBarSegment
                    segment={t}
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
