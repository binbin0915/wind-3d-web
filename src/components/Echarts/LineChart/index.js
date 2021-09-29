import React from "react";
import * as echarts from 'echarts'
import './index.css'

const options = {
    title: {
        text: '风机功率和风速折线图',
        textStyle:{
            color:'#fffff0',
            fontSize : 16,

        },
        left : 5
    },
    tooltip: {
        trigger: "axis",
    },
    legend: {
        textStyle:{
            color:'#ffffff'
        },
        data: ['功率', '风速']
    },
    grid: {
        left: 10,
        right: 10,
        bottom: 20,
        top: 30,
        containLabel: true,
    },
    xAxis: {
        name: "时间/小时",
        type: "category",
        // boundaryGap: false,
        data: ["1", "3", "5", "7", "9", "11", "13","15", "17", "19", "21", "23"],
        axisLine: {
            // show: false,
            lineStyle: {
                color: "#028ab5ad",
            },
        },
    },
    yAxis: {
        // name: "风速/功率",
        type: "value",
        axisLine: {
            show: false,
            lineStyle: {
                color: "#028ab5ad",
            },
        },

        splitLine: {
            lineStyle: {
                color: ["#028ab545"],
            },
        },
    },
    series: [
        {
            name: "功率",
            type: "line",
            data: [12, 6, 13, 5, 18, 15, 8,2, 4, 12, 15, 10],
            lineStyle: {
                color: "#15c5e8",
            },
            itemStyle: {
                normal: {
                    color: "#15c5e8",
                },
            },
        },
        {
            name: "风速",
            type: "line",
            // stack: "总量",
            data: [2, 4, 12, 15, 10, 11, 5,12, 6, 13, 5, 18],
            lineStyle: {
                color: "#c8a818",
            },
            itemStyle: {
                normal: {
                    color: "#c8a818",
                },
            },
        },
    ],
}


export default class LineChart extends React.Component{
    lineChart = React.createRef()
    constructor(props) {
        super(props);
        this.myChart = null;

    }

    componentDidMount() {
        this.setEcharts();
    }

    setEcharts = () => {
        const { current } = this.lineChart;
        if (current) {
            this.myChart = echarts.init(current);
            this.myChart.setOption(options);
        } else {
            setTimeout(this.setEcharts, 200)
        }
    }



    render() {

        return (
            <div ref={this.lineChart} className="echarts_container">

            </div>
        )
    }
}