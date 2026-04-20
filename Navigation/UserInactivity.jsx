// components/InactivityWrapper.js
import React, { useRef, useEffect } from 'react';
import { View, PanResponder } from 'react-native';

const InactivityWrapper = ({ timeout = 30000, onInactivity, children }) => {
  const timer = useRef(null);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        resetTimer();
        return false;
      },
    })
  ).current;

  const resetTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(onInactivity, timeout);
  };

  useEffect(() => {
    resetTimer();
    return () => clearTimeout(timer.current);
  }, []);

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
};

export default InactivityWrapper;
