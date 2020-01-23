import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Colors from '../../style/Colors';
import { Sizes } from '../../style/Sizes';
import { DataSourceIcon } from '../common/DataSourceIcon';
import { DataSourceType } from '../../measure/DataSourceSpec';
import { dataSourceManager } from '../../system/DataSourceManager';

const lightTextColor = "#8b8b8b"

const styles = StyleSheet.create({
    containerStyle: {
        backgroundColor: 'white',
        marginBottom: 12,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        shadowColor: 'black',
        shadowOpacity: 0.07
    },

    headerStyle: {
        height: 60,
        flexDirection: "row",
        alignItems: 'center',
        paddingRight: Sizes.horizontalPadding,
    },

    headerTitleStyle: {
        fontWeight: 'bold',
        color: Colors.textColorLight,
        fontSize: Sizes.normalFontSize,
        flex: 1
    },

    headerDescriptionTextStyle: {
        fontWeight: '500',
        color: lightTextColor,
        fontSize: 14
    },

    todayUnitStyle: {
        fontWeight: '300',
        color: '#9B9B9B'
    },

    todayValueStyle: {
        color: Colors.today,
        fontWeight: 'bold'
    },

    iconContainerStyle: {
        paddingLeft: Sizes.horizontalPadding,
        paddingRight: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    chartAreaStyle: {
        padding: Sizes.horizontalPadding,
    },
    footerStyle: {
        padding: Sizes.horizontalPadding,
        flexDirection: 'row',
        justifyContent: 'space-around'
    },

    statValueStyle: {
        fontSize: 14,
        fontWeight: '500',
        color: lightTextColor
    },

    statLabelStyle: {
        fontSize: Sizes.tinyFontSize,
        color: '#Bababa',
        fontWeight: 'normal'
    }
})

export const DataSourceChartFrame = (props: {
    sourceType: DataSourceType,
    todayMeasureTitle?: string,
    todayMeasureValue?: Array<{ text: string, type: "unit" | "value" }>,
    statistics?: Array<{ label: string, valueText: string }>
}) => {
    const spec = dataSourceManager.getSpec(props.sourceType)
    return <View style={styles.containerStyle}>
        <View style={styles.headerStyle}>
            <View style={styles.iconContainerStyle}>
                <DataSourceIcon size={18} type={props.sourceType} color={Colors.accent} />
            </View>
            <Text style={styles.headerTitleStyle}>{spec.name}</Text>
            {
                props.todayMeasureValue && <Text style={styles.headerDescriptionTextStyle}>
                    <Text>{(props.todayMeasureTitle || "Today") + ": "}</Text>
                    {
                        props.todayMeasureValue && props.todayMeasureValue.map((chunk, index) =>
                            <Text key={index} style={chunk.type === 'unit' ? styles.todayUnitStyle : styles.todayValueStyle}>{chunk.text}</Text>)
                    }
                </Text>
            }
        </View>
        <View style={styles.chartAreaStyle}>
            <Text>Chart Area</Text>
        </View>

        <View style={styles.footerStyle}>{
            props.statistics && props.statistics.map(stat => {
                return <Text key={stat.label} style={styles.statValueStyle}>
                    <Text style={styles.statLabelStyle}>{stat.label + " "}</Text>
                    <Text>{stat.valueText}</Text>
                </Text>
            })
        }
        </View>

    </View >
}