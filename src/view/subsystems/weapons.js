import { ActionButton } from "../widgets"
import "../../css/subsystems/weapons.css"
import { useContext, useCallback, memo } from "react"
import { ActionControllerCtx } from "../../actionController"
import { transpose } from "../../utils"
import { DArea, DRect, DEllipse, DCircle } from "../divGraphics"
import { Point } from "../../model/physics"

function AmmoBullet({spent}) {
    return <span className='bullet'>
        <i className={"fa-circle " + (spent ? "fa-regular": "fa-solid")}></i>
    </span>
}

function _AmmoBar({ammo, ammoMax}) {
    return <div className='ammo'>
        <span>Ammo: </span>
        {
            new Array(ammoMax).fill(0).map((key, idx) =>
                 <AmmoBullet key={"a" + idx} spent={idx >= ammo}/>
            )
        }
    </div>
}
const AmmoBar = memo(_AmmoBar)

function AimTarget({target, aimBarWidth, aimBarHeight}) {
    const targetSize = Math.max(2, target.sizePercent / 100 * aimBarWidth)
    const targetWidth = Math.max(1, target.widthPercent / 100 * aimBarWidth) * 1.5
    const myX = target.distancePercent / 100 * aimBarWidth
    const myY = transpose(target.ordering, 0, 1, 2 + targetWidth / 2, aimBarHeight - 2 - targetWidth / 2)

    var className = "target "
    if (target.selected) {
        className += "selected "
    }

    const center = new Point(myX + targetSize / 2, myY)

    const actionController = useContext(ActionControllerCtx)
    const onClick = useCallback(() => {actionController.targetEntityId = target.id})

    return <div className={className}>
    {
            /* tracked overlay */
            target.selected && <DCircle
                radius={(targetSize / 2) + 4}
                position={center}
                className="selectedMark"
            />
        }
        <DEllipse
            position={center}
            opacity={target.alive ? 1 : 0.5}
            width={targetSize}
            height={targetWidth}
            color={target.color}
        />
        {
            /* click overlay */
            <DCircle
                position={center}
                radius={(targetSize / 2) + 2}
                onClick={onClick}
            />
        }
        </div>
}

function AimBar({aim, on}) {
    const width = 228
    const height = 30

    const rangeWidth = aim.rangePercent / 100 * width

    return <div className={"aimBar "}>
        {
            on && <DArea width={width} height={height}>
                <DRect position={new Point(width / 2, height / 2)} width={width} height={height} color="black"/>
                {
                    aim.targets.map(t => <AimTarget
                        key={t.id}
                        target={t}
                        aimBarWidth={width}
                        aimBarHeight={height}/>)
                }
                {
                    aim.crosshairs &&
                        <DRect
                            position={new Point(
                                (aim.crosshairs.distancePercent + aim.crosshairs.sizePercent / 2 ) / 100 * width,
                                height / 2
                            )}
                            width={aim.crosshairs.sizePercent / 100 * width}
                            height={height}
                            color="white"
                            opacity={0.7}
                        />
                }
                <DRect position={new Point(rangeWidth, height / 2)} width={2} height={height} color="white" opacity={0.5}/>
        </DArea>
        }
    </div>
}
function _Weapon({subsystem}) {
    return <div className="weapon">
        <AmmoBar ammo={subsystem.ammo} ammoMax={subsystem.ammoMax}/>
        <AimBar on={subsystem.on} aim={subsystem.aim}/>
        <div className="actions">
            {subsystem.weaponActions.map(a =>
            <ActionButton key={a.id}
                action={a} />)}
        </div>
    </div>
}

export const Weapon = memo(_Weapon)
