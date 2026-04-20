import {
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  CircleCheck,
  CircleX,
  Info,
  TriangleAlert,
} from "lucide-react-native";
import { toastEmitter } from "../../Services/toast";

const Toaster = () => {

  const [toast, setToast] = useState({
    visible: false,
    title: "",
    description: "",
    type: "success",
    duration: 3000,
  });

  const slideAnim = useRef(new Animated.Value(-170)).current;
  const hideTimer = useRef(null);

  // 👉 SWIPE HANDLER
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dy) > 5;
      },

      onPanResponderMove: (_, gesture) => {
        if (gesture.dy < 0) {
          slideAnim.setValue(55 + gesture.dy);
        }
      },

      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < -40) {
          // dismiss
          Animated.timing(slideAnim, {
            toValue: -170,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setToast((t) => ({ ...t, visible: false }));
          });
        } else {
          // snap back
          Animated.spring(slideAnim, {
            toValue: 55,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    const listener = (data) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);

      const duration = data.duration || 3000;

      setToast({
        visible: true,
        title: data.title || "",
        description: data.description || "",
        type: data.type || "success",
        duration,
      });

      slideAnim.setValue(-170);

      Animated.timing(slideAnim, {
        toValue: 55,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        hideTimer.current = setTimeout(() => {
          Animated.timing(slideAnim, {
            toValue: -170,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setToast((t) => ({ ...t, visible: false }));
          });
        }, duration);
      });
    };

    const off = toastEmitter.on("SHOW_TOAST", listener);
    return () => off();
  }, []);

  if (!toast.visible) return null;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[styles.toast, { transform: [{ translateY: slideAnim }] }]}
    >
      {toast.type == "success" ? (
        <BadgeCheck
          style={{ marginTop: 5 }}
          color="#03B32F"
          strokeWidth={2}
        />
      ) : toast.type == "alert" ? (
        <TriangleAlert
          style={{ marginTop: 5 }}
          color="#FFA412"
          strokeWidth={1.25}
        />
      ) : toast.type == "info" ? (
        <Info style={{ marginTop: 5 }} color="#D00B0B" strokeWidth={1.25} />
      ) : toast.type == "normal" ? (
        <CircleCheck style={{ marginTop: 5 }} color="#888888" strokeWidth={1.25} />
      ) : (
        <CircleX style={{ marginTop: 5 }} color="#D00B0B" strokeWidth={1.25} />
      )}

      <Animated.View>
        <Text style={[styles.textTitle,{fontFamily:'Mukta-Bold'}]}>{toast.title}</Text>
        {toast.description !== "" && (
          <Text style={[styles.textDesc,{fontFamily:'Mukta-Regular'}]}>{toast.description}</Text>
        )}
      </Animated.View>
    </Animated.View>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  toast: {
    width: width - 40,
    position: "absolute",
    left: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "#181818ff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2e2e2eff",
    elevation: 10,
    shadowColor: "#000000ff",
    zIndex: 99999999999,
    flexDirection: "row", 
    alignItems: "flex-start",
    gap: 10,
  },
  textTitle: {
    fontWeight: 800,
    fontSize: 16,
    color:"white"
  },
  textDesc: {
    color: "#a3a3a3ff",
    fontSize: 14,
    fontWeight:"800"
  },
});

export default Toaster;
