import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { Sizes } from "../../style/Sizes";
import { StyleTemplates } from "../../style/Styles";
import Colors from "../../style/Colors";
import { Button, Icon } from "react-native-elements";
import { LikeHeart, Valence } from "../common/LikeHeart";
import { PaginationBar } from "../common/PaginationBar";
import { BookmarkToggle } from "../common/BookmarkToggle";

const cardHeaderHeight = 60
const cardFooterHeight = 48
const cardHorizontalMargin = 12
const cardVerticalMargin = 12


const Styles = StyleSheet.create({
    cardStyle: {
        position: 'absolute',
        left: cardHorizontalMargin,
        right: cardHorizontalMargin,
        top: cardVerticalMargin,
        bottom: cardVerticalMargin,
        ...StyleTemplates.backgroundCardStyle,
        backgroundColor: Colors.lightBackground,
        shadowRadius: 2,
        borderRadius: 8,
        flexDirection: 'column',
    },

    cardHeaderStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: Sizes.horizontalPadding,
        paddingRight: 4
    },

    cardTitleIconStyle: {
        marginRight: 6,
    },

    cardTitleStyle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: "#909090",
    },
    headerButtonStyle: {
        width: cardHeaderHeight * 0.8,
        height: cardHeaderHeight
    },

    cardBodyStyle: {
        flex: 1
    },

    cardFooterStyle: {
        height: cardFooterHeight,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'stretch',
        paddingLeft: 4,
        paddingRight: 4,
    },

    footerButtonStyle: {
        width: cardFooterHeight,
        height: cardFooterHeight
    },

    hrStyle: {
        alignSelf: 'stretch',
        marginLeft: 12,
        marginRight: 12,
        marginBottom: 3,
        height: 1,
        backgroundColor: "#d0d0d0",
    },

    cardMessageStyle: {
        alignSelf: 'center',
        padding: 24,
        fontSize: 18,
        color: Colors.link,
        fontWeight: 'bold',
    }
})


export class ReportCard extends React.Component {
    render() {
        return (<View style={Styles.cardStyle} removeClippedSubviews={true}>
            <View style={Styles.cardHeaderStyle}>
                <Icon iconStyle={Styles.cardTitleIconStyle} name="ios-pricetag" type="ionicon" color={Colors.textColorLight} size={20} />
                <Text style={Styles.cardTitleStyle}>Card Title</Text>

                <BookmarkToggle buttonStyle={Styles.headerButtonStyle}
                    isBookmarked={true} />
                <Button buttonStyle={Styles.headerButtonStyle}
                    type="clear"
                    icon={{ name: "md-trash", type: 'ionicon', color: 'gray' }} />
            </View>

            <View style={Styles.cardBodyStyle}>

            </View>

            <Text style={Styles.cardMessageStyle}>Your average step count is 10,000.</Text>

            <View style={Styles.hrStyle} />

            <View style={Styles.cardFooterStyle}>
                <LikeHeart containerStyle={{ flex: 1 }}
                    buttonStyle={Styles.footerButtonStyle}
                    valence={Valence.Neutral} />

                <PaginationBar buttonStyle={Styles.footerButtonStyle} orientedAtEnd ={true} numItems={20} windowSize={5} />
            </View>

        </View>)
    }
}