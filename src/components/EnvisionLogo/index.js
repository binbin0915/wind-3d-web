import React from "react";
import './index.css'



export default class EnvisionLogo extends React.Component{
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="header">
                <div id='logoImage'>
                </div>
                <div>
                    Wind Turbine
                </div>
            </div>
        );
    }
}