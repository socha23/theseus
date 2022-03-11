import React, { useContext } from "react";

class TooltipController {
    constructor() {
        this.tooltip = null
        this.mouseX = 0
        this.mouseY = 0
    }
}

const controller = new TooltipController()
export const TooltipContext = React.createContext(controller)


export function TooltipArea({children}) {
    return <TooltipContext.Provider value={controller}>
        <MouseCatcher>
            <div className="tooltipArea" >
                <Tooltip/>
                {children}
            </div>
        </MouseCatcher>
  </TooltipContext.Provider>
}

function MouseCatcher({children}) {
    const c = useContext(TooltipContext)
    return <div onMouseMove={e => {c.mouseX = e.clientX; c.mouseY = e.clientY}}>
        {children}
    </div>
}

export function Tooltip() {
    const c = useContext(TooltipContext)
    return c.tooltip &&
        <div
            className="tooltip"
            style={{left: c.mouseX, top: c.mouseY + 10}}
        >
            {c.tooltip}
        </div>
}

