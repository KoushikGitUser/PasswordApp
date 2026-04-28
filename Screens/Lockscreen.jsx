import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  InteractionManager,
  Alert,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { BlurView } from "@react-native-community/blur";
import * as SecureStore from "expo-secure-store";
import { triggerToast } from "../Services/toast";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  getLockState,
  recordFailure,
  recordSuccess,
  clearExpiredLock,
  MAX_FAILS,
} from "../Services/pinLockout";
import Toaster from "../Components/UniversalToaster/Toaster";
import { buttonStyles } from "../styles/buttonStyles";

const formatCountdown = (ms) => {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const Lockscreen = ({ navigation, onAuthenticated }) => {
  const [authNotAvailableModal, setAuthNotAvailableModal] = useState(false);
  const [securityPinModalVisible, setSecurityPinModalVisible] = useState(false);
  const [pinDigits, setPinDigits] = useState(["", "", "", "", "", ""]);
  const [cooldownModalVisible, setCooldownModalVisible] = useState(false);
  const [cooldownRemainingMs, setCooldownRemainingMs] = useState(0);
  const [failsSoFar, setFailsSoFar] = useState(0);
  const pinInputRefs = useRef([]);
  const cooldownTimerRef = useRef(null);

  useEffect(() => {
    (async () => {
      await clearExpiredLock();
      const state = await getLockState();
      setFailsSoFar(state.fails);
      if (state.remainingMs > 0) {
        openCooldownModal(state.remainingMs);
      }
    })();
    return () => stopCooldownTimer();
  }, []);

  const stopCooldownTimer = () => {
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
  };

  const openCooldownModal = (ms) => {
    setSecurityPinModalVisible(false);
    setPinDigits(["", "", "", "", "", ""]);
    setCooldownRemainingMs(ms);
    setCooldownModalVisible(true);
    stopCooldownTimer();
    cooldownTimerRef.current = setInterval(async () => {
      const state = await getLockState();
      if (state.remainingMs <= 0) {
        stopCooldownTimer();
        await clearExpiredLock();
        setFailsSoFar(0);
        setCooldownRemainingMs(0);
        setCooldownModalVisible(false);
      } else {
        setCooldownRemainingMs(state.remainingMs);
      }
    }, 1000);
  };

  const handlePinDigitChange = (text, index) => {
    if (text.length > 1) {
      text = text.slice(-1);
    }
    const newPinDigits = [...pinDigits];
    newPinDigits[index] = text;
    setPinDigits(newPinDigits);

    if (text && index < 5) {
      pinInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !pinDigits[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyPin = async () => {
    const enteredPin = pinDigits.join("");
    if (enteredPin.length !== 6) {
      triggerToast(
        "Incomplete PIN",
        "Enter the full PIN",
        "error",
        2500
      );
      return;
    }

    const lockNow = await getLockState();
    if (lockNow.remainingMs > 0) {
      openCooldownModal(lockNow.remainingMs);
      return;
    }

    const storedPin = await SecureStore.getItemAsync("userSecurityPIN");
    if (enteredPin === storedPin) {
      await recordSuccess();
      setFailsSoFar(0);
      setSecurityPinModalVisible(false);
      setPinDigits(["", "", "", "", "", ""]);
      onAuthenticated();
    } else {
      const outcome = await recordFailure();
      setFailsSoFar(outcome.fails);
      setPinDigits(["", "", "", "", "", ""]);
      if (outcome.locked) {
        openCooldownModal(outcome.remainingMs);
      } else {
        const remaining = MAX_FAILS - outcome.fails;
        triggerToast(
          "Incorrect PIN",
          `${remaining} ${remaining === 1 ? "attempt" : "attempts"} left before 30-minute lockout.`,
          "error",
          3500
        );
        InteractionManager.runAfterInteractions(() => {
          setTimeout(() => {
            pinInputRefs.current[0]?.focus();
          }, 100);
        });
      }
    }
  };

  const checkFingerprint = async () => {
    const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();

    if (securityLevel === LocalAuthentication.SecurityLevel.NONE) {
      setAuthNotAvailableModal(true);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Verify it's you",
      fallbackLabel: "Use PIN or Password",
      disableDeviceFallback: false,
    });

    if (result.success) {
      const storedPin = await SecureStore.getItemAsync("userSecurityPIN");
      if (storedPin) {
        await clearExpiredLock();
        const state = await getLockState();
        if (state.remainingMs > 0) {
          openCooldownModal(state.remainingMs);
          return;
        }
        setSecurityPinModalVisible(true);
        InteractionManager.runAfterInteractions(() => {
          setTimeout(() => {
            pinInputRefs.current[0]?.focus();
          }, 100);
        });
      } else {
        onAuthenticated();
      }
    } else if (result.error === "user_cancel") {
      // user cancelled, no action
    } else if (result.error) {
      Alert.alert("Authentication failed", "Please try again.");
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "black",
        padding: 20,
      }}
    >
      <Modal
        animationType="slide"
        transparent
        visible={authNotAvailableModal}
        onRequestClose={() => setAuthNotAvailableModal(false)}
      >
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <Text style={{ color: "white", fontSize: 18, fontWeight: 800 }}>
              Authentication Not Available
            </Text>
            <Text style={{ color: "white", fontSize: 16, marginTop: 10 }}>
              Your device does not have any authentication method set up. Please set up a PIN, password, or biometric authentication in your device settings.
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "100%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, buttonStyles.whiteButton]}
                  onPress={() => setAuthNotAvailableModal(false)}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: "black" }}
                  >
                    Got it
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={cooldownModalVisible}
        onRequestClose={() => {}}
      >
        <BlurView blurType="dark" blurAmount={15} style={styles.blurContainer}>
          <View style={[styles.modalContent, { alignItems: "center" }]}>
            <Ionicons name="lock-closed" size={44} color="#ff5a5a" />
            <Text
              style={{
                color: "#ff5a5a",
                fontSize: 20,
                fontWeight: 800,
                marginTop: 14,
              }}
            >
              Too Many Failed Attempts
            </Text>
            <Text
              style={{
                color: "white",
                fontSize: 15,
                textAlign: "center",
                marginTop: 10,
                lineHeight: 22,
              }}
            >
              You entered the wrong PIN {MAX_FAILS} times. PIN entry is disabled
              for 30 minutes.
            </Text>
            <View
              style={{
                marginTop: 24,
                backgroundColor: "#1a0000",
                borderWidth: 1,
                borderColor: "#5a0000",
                paddingHorizontal: 28,
                paddingVertical: 16,
                borderRadius: 16,
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 36,
                  fontWeight: 800,
                  letterSpacing: 2,
                  textAlign: "center",
                  fontVariant: ["tabular-nums"],
                }}
              >
                {formatCountdown(cooldownRemainingMs)}
              </Text>
              <Text
                style={{
                  color: "#ff9b9b",
                  fontSize: 12,
                  textAlign: "center",
                  marginTop: 6,
                  letterSpacing: 1,
                }}
              >
                TIME REMAINING
              </Text>
            </View>
            <Text
              style={{
                color: "lightgrey",
                fontSize: 13,
                textAlign: "center",
                marginTop: 18,
              }}
            >
              Closing or restarting the app will not clear this timer.
            </Text>
          </View>
        </BlurView>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={securityPinModalVisible}
        onRequestClose={() => {
          setSecurityPinModalVisible(false);
          setPinDigits(["", "", "", "", "", ""]);
        }}
      >
        <Toaster/>
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <Text style={{ color: "white", fontSize: 16, fontWeight: 800, textAlign: "center", marginBottom: 20 }}>
              Provide your 6 digit security PIN for extended protection.
            </Text>

            <View style={styles.pinInputContainer}>
              {pinDigits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (pinInputRefs.current[index] = ref)}
                  style={styles.pinInput}
                  value={digit}
                  onChangeText={(text) => handlePinDigitChange(text, index)}
                  onKeyPress={(e) => handlePinKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  secureTextEntry
                />
              ))}
            </View>

            {failsSoFar > 0 && (
              <Text
                style={{
                  color: "#ff9b9b",
                  fontSize: 12,
                  textAlign: "center",
                  marginTop: 6,
                }}
              >
                {MAX_FAILS - failsSoFar}{" "}
                {MAX_FAILS - failsSoFar === 1 ? "attempt" : "attempts"} left
                before 30-minute lockout.
              </Text>
            )}

            <View style={styles.buttonRow}>
              <View style={{ width: "100%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, buttonStyles.whiteButton]}
                  onPress={handleVerifyPin}
                >
                  <Text style={{ fontSize: 15, fontWeight: 800, color: "black" }}>
                    Verify
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Image
        source={require("../assets/splash4.png")}
        style={{ width: 310, height: 310, marginBottom: 10 }}
        resizeMode="contain"
      />
      <Text
        style={{
          textAlign: "center",
          fontSize: 13,
          fontWeight: 800,
          color: "white",
        }}
      >
        App is locked,
      </Text>
      <Text
        style={{
          textAlign: "center",
          fontSize: 13,
          fontWeight: 800,
          color: "white",
        }}
      >
        Authenticate to open the app
      </Text>

      <View style={{ width: "100%", marginTop: 30 }}>
        <TouchableOpacity
          onPress={checkFingerprint}
          style={{
            margin: "auto",
            backgroundColor: "#272727ff",
            paddingHorizontal: 25,
            paddingVertical: 18,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            borderRadius: 55,
            borderWidth: 1.5,
            borderColor: "#323232ff",
            shadowOpacity: 1,
            shadowOffset: {
              width: 10,
              height: 20,
            },
          }}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: 800 }}>
            AUTHENTICATE
          </Text>
          <Ionicons name="finger-print" size={27} color="#00c76b" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#202020ff",
    borderRadius: 40,
    paddingHorizontal: 20,
    paddingVertical: 20,
    elevation: 5,
    borderWidth: 0.5,
    borderColor: "#3d3d3d",
  },
  modalbtn: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 54,
    backgroundColor: "#383838",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 30,
  },
  pinInputContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 10,
  },
  pinInput: {
    width: 45,
    height: 55,
    borderRadius: 12,
    backgroundColor: "#383838",
    borderWidth: 1,
    borderColor: "#505050",
    color: "white",
    fontSize: 24,
    textAlign: "center",
    fontWeight: "800",
  },
});

export default Lockscreen;
