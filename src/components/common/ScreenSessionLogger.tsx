import React from 'react';
import {NavigationEvents} from 'react-navigation';
import {UsageLogger} from '../../system/UsageLogger';

interface State{
  startedAt: number
}

export class ScreenSessionLogger extends React.Component<any, State> {
  
  constructor(props) {
    super(props);
    this.state = {
      startedAt: null
    };
  }

  render() {
    return (<NavigationEvents
        onWillFocus={payload => {
          this.setState({
            startedAt: Date.now()
          })
        }}
        onWillBlur={payload => {
          const endedAt = Date.now();
          const duration = endedAt - this.state.startedAt;
          UsageLogger.writeLog("session", payload.lastState["routeName"], 
            {startedAt: this.state.startedAt, endedAt: endedAt, duration: duration}).then()
          this.setState({startedAt: null})
        }}
      />)
  }
}
