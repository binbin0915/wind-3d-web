import React from "react";
import * as echarts from 'echarts'
import './index.css'


export default class Histogram extends React.Component {
    histogram = React.createRef()
    constructor(props) {
        super(props);
        this.chartData = null
    }


    componentDidMount() {
        this.updateEcharts();
    }


    createOption = (data)=>{
        const op = {
            grid: {
                left: 80,
                    right: 30,
                    bottom: 0,
                    top: 0,
            },
            xAxis: {
                type: "value",
                    show: false,
                    axisTick: {
                    show: false,
                },
                splitLine: {
                    show: true,
                },
                max: 100,
                    splitNumber: 4,
            },
            yAxis: {
                type: "category",
                    data: ["齿轮箱温度", "机舱温度", "环境温度"],
                    axisTick: {
                    show: false,
                },
                splitLine: {
                    show: false,
                },
                axisLine: {
                    show: false,
                        lineStyle: {
                        color: "#fff",
                    },
                },
            },
            series: [
                {
                    data,
                    type: "bar",
                    showBackground: true,
                    backgroundStyle: {
                        color: "#123e59",
                    },
                    barCategoryGap: 11,
                    itemStyle: {
                        normal: {
                            label: {
                                show: true,
                                formatter: "{c} ℃",
                                textStyle: {
                                    color: "#123e59",
                                    fontSize: 11,
                                    fontWeight: "bolder",
                                },
                            },
                            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                                {
                                    offset: 0,
                                    color: "#ffffff",
                                },
                                {
                                    offset: 1,
                                    color: "#11c5e8",
                                },
                            ]),
                        },
                    },
                },
            ],
        }
        return op
    }


    setEcharts = () => {
        const { current } = this.histogram;
        const options = this.createOption([69, 58, 27])
        if (current) {
            this.myChart = echarts.init(current);

            this.myChart.setOption(options);
        } else {
            setTimeout(this.setEcharts, 200)
        }
    }

    updateEcharts = () =>{
        const { current } = this.histogram;
        const newArr = this.mockData()
        const options = this.createOption(newArr)
        if (current) {
            this.myChart = echarts.init(current);

            this.myChart.setOption(options);
        } else {
            setTimeout(this.setEcharts, 200)
        }
        setTimeout(()=>{
            this.updateEcharts()
        },2000)
    }



    mockData = () => {
        const environment = parseInt(65 + Math.random() * 8)
        const cabine = parseInt(58 + Math.random() * 8)
        const gearBox = parseInt(27 + Math.random() * 2)
        return [environment,cabine,gearBox]
    }


    render() {
        return (
            <div className="environmental_monitoring">
                <div ref={this.histogram} className="echart_container"/>
            </div>
        )
    }

}