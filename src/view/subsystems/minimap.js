import React, { memo } from "react";
import "../../css/subsystems/minimap.css"
import { Point } from "../../model/physics";
import { transpose } from "../../utils";
import { DArea, DPolygon, DRect, DReferenceFrame } from "../divGraphics";


const SIZE_PX = 224//376

///////////
// FEATURES
///////////

function _MinimapContents({sizePx, minX, maxX, minY, maxY, scale, features}) {
    const dx = -minX
    const dy = -minY
    return <DArea width={sizePx} height={sizePx}>
              {  <DRect className="background" position={new Point(sizePx / 2, sizePx / 2)} width={sizePx} height={sizePx}/>}
                {
                    <DReferenceFrame scale={scale} position={new Point(dx, dy)}>
                    {
                        features.map(f => <DPolygon
                            key={f.id}
                            className={"feature"}
                            polygon={f}
                        />)
                    }
                    </DReferenceFrame>
                }
            </DArea>
}

const MinimapContents = _MinimapContents

function _Minimap({position, minX, maxX, minY, maxY, on, target, features}) {
    const scale = SIZE_PX / (maxX - minX)
    return <div className="minimap">
        <div className="display" style={{width: SIZE_PX + 2, height: SIZE_PX + 2}}>
            {on &&
                    <MinimapContents sizePx={SIZE_PX} minX={minX} maxX={maxX} minY={minY} maxY={maxY} scale={scale} features={features}/>
            }
            {
                on && <div className="sub" style={{
                    left: transpose(position.x, minX, maxX, 0, SIZE_PX) - 2,
                    top: transpose(position.y, minY, maxY, 0, SIZE_PX) - 2,
                }}/>
            }
            {
                on && <div className="target" style={{
                    left: transpose(target.x, minX, maxX, 0, SIZE_PX) - 2,
                    top: transpose(target.y, minY, maxY, 0, SIZE_PX) - 2,
                }}/>
            }
        </div>

    </div>
}

export const Minimap = memo(_Minimap)
