/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */
'use strict';

import React from 'react-native';
import {
  createAutoscrollable,
  createDragArena,
  createDragContext,
  createDragShadow,
  createDropZone,
} from 'react-native-drag-drop';

const {
  AlertIOS,
  Animated,
  AppRegistry,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} = React;

const dragContext = createDragContext((props, state) => {
  const dragItem = state.dragItem; // This should probably be passed as the 1st arg to onDrop.

  AlertIOS.alert(
    'This is the onDrop callback. You just dropped a thing!', JSON.stringify(dragItem)
  );

  // Must return a promise.
  return Promise.resolve();
});

const DraggableThing = React.createClass({
  render() {
    const { onLayout, onLongPress } = this.props;

    return (
      <TouchableHighlight
        style={styles.draggableThing}
        onLayout={onLayout}
        onLongPress={onLongPress}>
        <Text>I am a draggable thing!</Text>
      </TouchableHighlight>
    );
  }
});

const DragShadow = createDragShadow(React.createClass({
  render() {
    return (
      <Animated.View style={[styles.dragShadow, this.props.style]}>
        <Text>I am a drag shadow!</Text>
      </Animated.View>
    );
  }
}));

const RedDropZone = createDropZone(React.createClass({
  render() {
    const {
      onDragItemLayout, // Injected by createDropZone()
      startDragHandler,
    } = this.props;

    // Note that a 'dragItem' must be an object with at minimum a unique 'id' property.
    const dragItems = [
      {id: 'redfoo', type: 'red'},
      {id: 'redbar', type: 'red'},
      {id: 'redbaz', type: 'red'},
    ];

    return (
      <View style={[styles.redDropZone]}>
        {dragItems.map(dragItem => (
          <DraggableThing
            onLayout={(e) => onDragItemLayout(dragItem, e)}
            onLongPress={() => startDragHandler(dragItem)} />
        ))}
      </View>
    );
  }
}), 'red');

const BlueDropZone = createDropZone(React.createClass({
  render() {
    const {
      onDragItemLayout, // Injected by createDropZone()
      startDragHandler,
    } = this.props;

    const dragItems = [
      {id: 'bluefoo', type: 'blue'},
      {id: 'bluebar', type: 'blue'},
      {id: 'bluebaz', type: 'blue'},
    ];

    return (
      <View style={[styles.blueDropZone]}>
        {dragItems.map(dragItem => (
          <DraggableThing
            onLayout={(e) => onDragItemLayout(dragItem, e)}
            onLongPress={() => startDragHandler(dragItem)} />
        ))}
      </View>
    );
  }
}), 'blue');

const DragArena = createDragArena(React.createClass({
  render() {
    const { startDragHandler } = this.props; // Injected by createDragArena()

    return (
      <View style={styles.container}>
        <RedDropZone startDragHandler={startDragHandler} />
        <BlueDropZone startDragHandler={startDragHandler} />
      </View>
    );
  }
}), DragShadow, dragContext, 'x');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  draggableThing: {
    margin: 10,
  },
  dragShadow: {
    position: 'absolute', // Don't forget to add position: absolute because position styles are calculated.
    backgroundColor: 'green',
  },
  redDropZone: {
    backgroundColor: 'red',
  },
  blueDropZone: {
    backgroundColor: 'lightblue',
  },
});

AppRegistry.registerComponent('BasicExample', () => DragArena);
