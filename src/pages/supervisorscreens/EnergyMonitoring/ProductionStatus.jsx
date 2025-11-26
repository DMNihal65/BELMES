import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, DatePicker, Typography, Space, Spin } from 'antd';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import moment from 'moment';
import useEnergyStore from '../../../store/energyMonitoring';

// Import and initialize Highcharts modules
import HC_xrange from 'highcharts/modules/xrange';
if (typeof Highcharts === 'object') {
    HC_xrange(Highcharts);
}

const { Title } = Typography;

function ProductionStatus({ machineId }) {
    const [selectedDate, setSelectedDate] = useState(() => moment());
    const { fetchMachineProductionData, loading } = useEnergyStore();
    const [chartData, setChartData] = useState([]);

    const handleDateChange = useCallback(async (date) => {
        if (!date) return;
        
        setSelectedDate(date);
        
        if (machineId) {
            try {
                const data = await fetchMachineProductionData(machineId, date);
                
                const transformedData = [];
                
                const dayStart = moment(date)
                    .utc()
                    .hours(8)
                    .minutes(0)
                    .seconds(0)
                    .milliseconds(0);

                if (data.dataPoints && data.dataPoints.length > 0) {
                    const firstDataPoint = moment(Number(data.dataPoints[0].value[0]));
                    
                    // Add OFF state from 8:00 to first data point
                    transformedData.push({
                        x: dayStart.valueOf(),
                        x2: firstDataPoint.valueOf(),
                        y: 0,
                        status: 'OFF',
                        color: '#4A4A4A',
                        name: 'OFF'  // Add name for tooltip
                    });

                    // Add the rest of the data points
                    data.dataPoints.forEach(point => {
                        transformedData.push({
                            x: Number(point.value[0]),
                            x2: Number(point.value[1]),
                            y: 0,
                            status: point.name,
                            name: point.name,  // Add name for tooltip
                            color: point.name === 'PRODUCTION' ? '#228B22' :
                                   point.name === 'ON' ? '#DAA520' : '#4A4A4A'
                        });
                    });
                }

                console.log('Transformed data:', transformedData);
                setChartData(transformedData);
            } catch (error) {
                console.error('Error loading data:', error);
                setChartData([]);
            }
        }
    }, [machineId]);

    const startTime = moment(selectedDate)
        .utc()
        .hours(8)
        .minutes(0)
        .seconds(0)
        .milliseconds(0);
    
    const endTime = moment(selectedDate)
        .utc()
        .add(1, 'day')
        .hours(8)
        .minutes(0)
        .seconds(0)
        .milliseconds(0);

    const chartOptions = useMemo(() => ({
        chart: {
            type: 'xrange',
            height: 400,
            backgroundColor: '#ffffff',
            spacingBottom: 40,
            spacingTop: 30,
            spacingLeft: 40,
            spacingRight: 40,
            zoomType: 'x',
            panning: true,
            panKey: 'shift',
            style: {
                fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue'
            },
            scrollablePlotArea: {
                minWidth: 2000,
                scrollPositionX: 0
            }
        },
        title: {
            text: 'Production Timeline',
            align: 'left',
            style: {
                fontSize: '18px',
                fontWeight: '600',
                color: '#2c6e49'
            }
        },
        scrollbar: {
            enabled: true,
            liveRedraw: true,
            barBackgroundColor: '#808080',
            barBorderRadius: 7,
            barBorderWidth: 0,
            buttonBackgroundColor: '#606060',
            buttonBorderWidth: 0,
            buttonBorderRadius: 7,
            trackBackgroundColor: '#f2f2f2',
            trackBorderWidth: 1,
            trackBorderRadius: 8,
            trackBorderColor: '#CCC',
            size: 15,
            margin: 25,
            showFull: true
        },
        xAxis: {
            type: 'datetime',
            min: startTime.valueOf(),
            max: endTime.valueOf(),
            tickInterval: 1800 * 1000,  // 30-minute intervals
            labels: {
                formatter: function() {
                    return moment(this.value).utc().format('HH:mm');
                },
                rotation: 45,
                style: {
                    fontSize: '13px',
                    color: '#666',
                    fontWeight: '500'
                }
            },
            crosshair: {
                color: '#2c6e49',
                width: 1,
                dashStyle: 'shortdot',
                label: {
                    enabled: true,
                    backgroundColor: '#2c6e49',
                    style: {
                        color: '#fff'
                    },
                    formatter: function(value) {
                        return moment(value).utc().format('HH:mm');
                    }
                }
            },
            lineColor: '#e0e0e0',
            gridLineWidth: 1,
            gridLineColor: 'rgba(224, 224, 224, 0.5)'
        },
        yAxis: {
            title: { text: '' },
            categories: [machineId],
            reversed: true,
            labels: {
                style: {
                    fontSize: '14px',
                    color: '#2c6e49',
                    fontWeight: '500'
                }
            },
            crosshair: {
                color: '#2c6e49',
                width: 1,
                dashStyle: 'shortdot'
            }
        },
        tooltip: {
            enabled: true,
            shared: false,
            useHTML: true,
            headerFormat: '',
            pointFormat: `
                <div style="padding: 10px; min-width: 200px;">
                    <div style="
                        font-size: 14px;
                        font-weight: 600;
                        color: {point.color};
                        margin-bottom: 8px;
                        border-bottom: 1px solid #eee;
                        padding-bottom: 5px;
                    ">
                        {point.status}
                    </div>
                    <div style="color: #666; line-height: 1.5;">
                        <div>
                            <span style="font-weight: 500;">Start:</span> 
                            {point.start:%H:%M} GMT
                        </div>
                        <div>
                            <span style="font-weight: 500;">End:</span> 
                            {point.end:%H:%M} GMT
                        </div>
                    </div>
                </div>
            `,
            formatter: function() {
                const start = moment(this.x).utc();
                const end = moment(this.x2).utc();
                const duration = moment.duration(end.diff(start));
                const hours = Math.floor(duration.asHours());
                const minutes = duration.minutes();
                
                let statusColor;
                switch(this.point.status) {
                    case 'PRODUCTION':
                        statusColor = '#228B22';
                        break;
                    case 'ON':
                        statusColor = '#DAA520';
                        break;
                    default:
                        statusColor = '#4A4A4A';
                }
                
                return `
                    <div style="padding: 10px; min-width: 200px;">
                        <div style="
                            font-size: 14px;
                            font-weight: 600;
                            color: ${statusColor};
                            margin-bottom: 8px;
                            border-bottom: 1px solid #eee;
                            padding-bottom: 5px;
                        ">
                            ${this.point.status}
                        </div>
                        <div style="color: #666; line-height: 1.5;">
                            <div>
                                <span style="font-weight: 500;">Start:</span> 
                                ${start.format('HH:mm')} GMT
                            </div>
                            <div>
                                <span style="font-weight: 500;">End:</span> 
                                ${end.format('HH:mm')} GMT
                            </div>
                            <div style="
                                margin-top: 5px;
                                padding-top: 5px;
                                border-top: 1px solid #eee;
                                font-weight: 500;
                                color: ${statusColor};
                            ">
                                Duration: ${hours}h ${minutes}m
                            </div>
                        </div>
                    </div>
                `;
            },
            followPointer: true,
            hideDelay: 0,
            outside: true,
            shadow: true,
            animation: true,
            style: {
                fontSize: '13px'
            }
        },
        plotOptions: {
            xrange: {
                borderRadius: 4,
                borderWidth: 1,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                pointPadding: 0.2,
                groupPadding: 0.1,
                dataLabels: {
                    enabled: true,
                    formatter: function() {
                        return this.point.status;
                    },
                    style: {
                        fontSize: '12px',
                        fontWeight: '500',
                        textOutline: 'none',
                        color: '#fff'
                    }
                },
                pointWidth: 80,
                states: {
                    hover: {
                        brightness: 0.15,
                        shadow: {
                            color: 'rgba(0, 0, 0, 0.3)',
                            width: 8,
                            offsetX: 0,
                            offsetY: 0
                        },
                        borderColor: '#2c6e49',
                        borderWidth: 2,
                        animation: {
                            duration: 100
                        }
                    },
                    inactive: {
                        opacity: 0.5
                    }
                },
                stickyTracking: true,
                animation: {
                    duration: 100
                }
            }
        },
        series: [{
            name: 'Machine Status',
            data: chartData.map(point => ({
                ...point,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1,
                shadow: true,
                states: {
                    hover: {
                        enabled: true
                    }
                }
            }))
        }],
        legend: {
            enabled: false
        },
        credits: {
            enabled: false
        }
    }), [chartData, machineId, startTime, endTime]);

    useEffect(() => {
        handleDateChange(selectedDate);
    }, [handleDateChange, selectedDate]);

    return (
        <Card style={{ 
            width: '100%', 
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ 
                    position: 'relative',
                    width: '100%',
                    height: '500px',
                    margin: '20px 0',
                    overflow: 'hidden',
                    borderRadius: '8px',
                    backgroundColor: '#fff'
                }}>
                    {loading ? (
                        <div style={{ 
                            position: 'absolute', 
                            top: '50%', 
                            left: '50%', 
                            transform: 'translate(-50%, -50%)' 
                        }}>
                            <Spin size="large" />
                        </div>
                    ) : (
                        <HighchartsReact
                            highcharts={Highcharts}
                            options={chartOptions}
                            containerProps={{ 
                                style: { 
                                    height: '100%',
                                    width: '100%'
                                } 
                            }}
                        />
                    )}
                </div>

                {/* Enhanced legend */}
                <div style={{ 
                    display: 'flex', 
                    gap: '20px', 
                    justifyContent: 'center',
                    padding: '10px',
                    backgroundColor: '#f8f8f8',
                    borderRadius: '6px'
                }}>
                    {[
                        { status: 'PRODUCTION', color: '#228B22' },
                        { status: 'ON', color: '#DAA520' },
                        { status: 'OFF', color: '#4A4A4A' }
                    ].map(item => (
                        <div key={item.status} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            padding: '8px 12px',
                            backgroundColor: '#fff',
                            borderRadius: '4px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ 
                                width: '16px', 
                                height: '16px', 
                                backgroundColor: item.color,
                                borderRadius: '3px'
                            }}></div>
                            <span style={{ 
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#333'
                            }}>{item.status}</span>
                        </div>
                    ))}
                </div>
            </Space>
        </Card>
    );
}

export default ProductionStatus; 