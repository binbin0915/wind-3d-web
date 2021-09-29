import React from "react";
import './index.css'
import statisticalData from '../../assets/statisticalData/statisticalData.json'
import LineChart from '../Echarts/LineChart/index'


export default class StatisticsPanel extends React.Component{
    constructor(props) {
        super(props);
    }

    render() {
        const arr = statisticalData.statisticalData
        return (

            <div className="statistical_parameter">

                <div className="container">
                    <li className="left">
                        <header>
                            <span>风机参数</span>
                            <span>Turbine Parameter</span>
                        </header>
                        <article>
                            {
                                arr.map((ele)=>{
                                    return (
                                        <li>
                                            <span>{ele.name+' '}</span>
                                            <span>{ele.value}</span>
                                            <span>{ele.unit}</span>
                                        </li>
                                    )
                                })
                            }
                        </article>
                    </li>

                </div>
                <LineChart class="stackLine"/>
            </div>
        );
    }
}