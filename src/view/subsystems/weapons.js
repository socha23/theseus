import { ActionButton } from "../widgets"
import "../../css/subsystems/weapons.css"
import { useContext, useCallback, memo } from "react"
import { ActionControllerCtx } from "../../actionController"
import {jsonCompare, transpose} from "../../utils"
import { Circle, Layer, Rect, Stage, Ellipse, Line, Group } from "react-konva"

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

function _AimTarget2({target, aimBarWidth, aimBarHeight, actionController}) {
    const targetSize = Math.max(2, target.sizePercent / 100 * aimBarWidth)
    const targetWidth = Math.max(1, target.widthPercent / 100 * aimBarWidth) * 1.5
    const myX = target.distancePercent / 100 * aimBarWidth
    const myY = transpose(target.ordering, 0, 1, 2 + targetWidth / 2, aimBarHeight - 2 - targetWidth / 2)

    return <Group>

        {target.selected && <Circle /* tracked overlay */
            listening={false}
            radius={(targetSize / 2) + 4}
            x={myX + targetSize / 2}
            y={myY}
            stroke="#ddd"
            strokeWidth={1}
            dash={[6, 3]}
        />}

            <Ellipse
                listening={false}
                x={myX + targetSize / 2}
                y={myY}
                opacity={target.alive ? 1 : 0.5}
                radius={{x: targetSize / 2, y: targetWidth / 2}}
                fill={target.color}
            />
        <Circle /* click overlay */
            x={myX + targetSize / 2}
            y={myY}
            radius={(targetSize / 2) + 2}
            onClick={() => {actionController.targetEntityId = target.id}}
        />
        </Group>
}

//const AimTarget2 = memo(_AimTarget2, (a, b) => jsonCompare(a.target, b.target))
const AimTarget2 = _AimTarget2

function AimBar2({aim, on}) {
    const width = 228
    const height = 30

    const rangeWidth = aim.rangePercent / 100 * width
    const actionController = useContext(ActionControllerCtx)

    return <div className={"aimBar "}>
        {
            on && <Stage width={width} height={height}>
            <Layer>
                <Rect x={0} y={0} width={width} height={height} fill="black"/>
                {
                    aim.targets.map(t => <AimTarget2
                        key={t.id}
                        actionController={actionController}
                        target={t}
                        aimBarWidth={width}
                        aimBarHeight={height}/>)
                }
                {
                    aim.crosshairs &&
                        <Rect
                            x={aim.crosshairs.distancePercent / 100 * width}
                            y={0}
                            width={aim.crosshairs.sizePercent / 100 * width}
                            height={height}
                            fill="white"
                            opacity={0.7}
                        />
                }
                <Rect x={rangeWidth} y={0} width={2} height={height} fill="white" opacity={0.5}/>

            </Layer>
        </Stage>
        }
    </div>


}


export function Weapon({subsystem}) {
    return <div className="weapon">
        <AmmoBar ammo={subsystem.ammo} ammoMax={subsystem.ammoMax}/>
        <AimBar2 on={subsystem.on} aim={subsystem.aim}/>
        <div className="actions">
            {subsystem.weaponActions.map(a =>
            <ActionButton key={a.id}
                action={a} />)}
        </div>
    </div>
}
