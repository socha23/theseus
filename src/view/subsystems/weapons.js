import { ActionButton } from "../widgets"
import "../../css/subsystems/weapons.css"

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


function AimBarSegment({segment, className}) {
    return <div
    className={className}
    style={{
        left: segment.distancePercent + "%",
        width: segment.sizePercent + "%",
    }}
/>
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
                aim.target && <AimBarSegment segment={aim.target}
                    className={"target " + (aim.target.alive ? "alive " : "dead ") }/>
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
        {
            (aim.on && aim.targetObscured) && <div className="obscuredMessage">
                Target obscured
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
