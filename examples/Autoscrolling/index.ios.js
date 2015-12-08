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
  ScrollView,
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

const ScrollingDropZone = createDropZone(createAutoscrollable(React.createClass({

  scrollTo(y, x) {
    this.scrollView.scrollTo(y, x);
  },

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
      <ScrollView
        style={[styles.scrollingDropZone]}
        ref={component => this.scrollView = component}>
        {dragItems.map(dragItem => (
          <DraggableThing
            onLayout={(e) => onDragItemLayout(dragItem, e)}
            onLongPress={() => startDragHandler(dragItem)} />
        ))}
      </ScrollView>
    );
  }
})), 'blue');

const DragArena = createDragArena(React.createClass({
  render() {
    const {
      currentDropZone,
      currentDropZoneEdge,
      startDragHandler,
    } = this.props; // Injected by createDragArena()

    return (
      <View style={styles.container}>
        <ScrollingDropZone
          currentDropZone={currentDropZone}
          currentDropZoneEdge={currentDropZoneEdge}
          startDragHandler={startDragHandler} />
      </View>
    );
  }
}), DragShadow, dragContext, 'any');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'flex-start',
    backgroundColor: '#F5FCFF',
  },
  draggableThing: {
    margin: 10,
  },
  dragShadow: {
    position: 'absolute', // Don't forget to add position: absolute because position styles are calculated.
    backgroundColor: 'green',
  },
  scrollingDropZone: {
    backgroundColor: 'lightblue',
    height: 1000,
  },
});

AppRegistry.registerComponent('Autoscrolling', () => DragArena);
