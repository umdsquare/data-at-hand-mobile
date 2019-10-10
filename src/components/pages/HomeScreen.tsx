import React from 'react';
import { View, Text, Button } from 'react-native';

export class HomeScreen extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Home Screen</Text>
        <Button title="Go to Source List" onPress={() => (this.props as any).navigation.navigate("MeasureSettings")}/>
      </View>
    );
  }
}
