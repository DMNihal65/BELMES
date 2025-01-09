import React from 'react';
import ReactDOM from 'react-dom';
import ReactApexChart from 'react-apexcharts';

const ApexChart = () => {
    const [state, setState] = React.useState({
        series: [
            {
                name: 'Bob',
                data: [
                    // Planned operations (in blue)
                    {
                        x: 'Design',
                        y: [
                            new Date('2023-03-01').getTime(),
                            new Date('2023-03-05').getTime()
                        ],
                        color: '#007bff' // Planned color
                    },
                    // Actual operations (in green)
                    {
                        x: 'Code',
                        y: [
                            new Date('2023-03-02').getTime(),
                            new Date('2023-03-06').getTime()
                        ],
                        color: '#28a745' // Actual color
                    },
                    // Delayed operation (in red)
                    {
                        x: 'Test',
                        y: [
                            new Date('2023-03-03').getTime(),
                            new Date('2023-03-10').getTime()
                        ],
                        color: '#dc3545' // Delayed color
                    },
                    // More planned operations
                    {
                        x: 'Validation',
                        y: [
                            new Date('2023-03-05').getTime(),
                            new Date('2023-03-12').getTime()
                        ],
                        color: '#007bff' // Planned color
                    },
                    // More actual operations
                    {
                        x: 'Deployment',
                        y: [
                            new Date('2023-03-08').getTime(),
                            new Date('2023-03-15').getTime()
                        ],
                        color: '#28a745' // Actual color
                    },
                    // Another delayed operation
                    {
                        x: 'Review',
                        y: [
                            new Date('2023-03-10').getTime(),
                            new Date('2023-03-20').getTime()
                        ],
                        color: '#dc3545' // Delayed color
                    }
                ]
            },
            {
                name: 'Joe',
                data: [
                    // Planned operations (in blue)
                    {
                        x: 'Design',
                        y: [
                            new Date('2023-03-01').getTime(),
                            new Date('2023-03-04').getTime()
                        ],
                        color: '#007bff' // Planned color
                    },
                    // Actual operations (in green)
                    {
                        x: 'Test',
                        y: [
                            new Date('2023-03-05').getTime(),
                            new Date('2023-03-09').getTime()
                        ],
                        color: '#28a745' // Actual color
                    },
                    // Delayed operation (in red)
                    {
                        x: 'Code',
                        y: [
                            new Date('2023-03-06').getTime(),
                            new Date('2023-03-12').getTime()
                        ],
                        color: '#dc3545' // Delayed color
                    }
                ]
            }
        ],
        options: {
            chart: {
                height: 450,
                type: 'rangeBar',
                events: {
                    dataPointMouseEnter: function(event, chartContext, config) {
                        const dataPointIndex = config.dataPointIndex;
                        const seriesIndex = config.seriesIndex;
                        const dataPoint = state.series[seriesIndex].data[dataPointIndex];
                        // Show tooltip with additional information
                        const tooltipInfo = `Component: ${dataPoint.x}, Start Time: ${new Date(dataPoint.y[0]).toLocaleString()}, End Time: ${new Date(dataPoint.y[1]).toLocaleString()}`;
                        console.log(tooltipInfo); // Replace with your tooltip display logic
                    }
                }
            },
            plotOptions: {
                bar: {
                    horizontal: true,
                    barHeight: '80%'
                }
            },
            xaxis: {
                type: 'datetime'
            },
            stroke: {
                width: 1
            },
            fill: {
                type: 'solid',
                opacity: 0.6
            },
            legend: {
                position: 'top',
                horizontalAlign: 'left'
            }
        },
    });

    return (
        <div>
            <div id="chart">
                <ReactApexChart options={state.options} series={state.series} type="rangeBar" height={450} />
            </div>
            <div id="html-dist"></div>
        </div>
    );
}

const domContainer = document.querySelector('#app');
ReactDOM.render(<ApexChart />, domContainer);