import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Modal,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from "react-native";
import { deletePassword, getPasswords, updatePassword } from "../utils";
import { SafeAreaView } from "react-native-safe-area-context";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Fontisto from "@expo/vector-icons/Fontisto";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Picker } from "@react-native-picker/picker";
import * as LocalAuthentication from "expo-local-authentication";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import { triggerToast } from "../Services/toast";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Entypo from "@expo/vector-icons/Entypo";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import Octicons from "@expo/vector-icons/Octicons";
import RBSheet from "react-native-raw-bottom-sheet";
import QRCodeStyled from "react-native-qrcode-styled";
import QRCode from "react-native-qrcode-svg";
import { QrCodeSvg } from "react-native-qr-svg";
import logo from "../assets/icon.png";
import {
  ChevronDown,
  ClipboardList,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  UserRound,
  Wifi,
} from "lucide-react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { BlurView } from "@react-native-community/blur";
import AppPickerSheet from "../Components/AppPickerSheet";
import { ScrollView } from "react-native-gesture-handler";
import Toaster from "../Components/UniversalToaster/Toaster";
import { useTheme } from "../theme/ThemeContext";
import { getButtonStyles } from "../styles/buttonStyles";
import { getCategoryColors } from "../theme/colors";

const PasswordDetails = ({ route, navigation }) => {
  const { colors, isDark } = useTheme();
  const dynamicButtons = getButtonStyles(colors);

  const { index, passCategory } = route.params;

  const [entry, setEntry] = useState(null);
  const [passName, setPassName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [category, setCategory] = useState("");
  const [initialPassName, setInitialPassName] = useState("");
  const [initialUsername, setInitialUsername] = useState("");
  const [initialPassword, setInitialPassword] = useState("");
  const [initialCategory, setInitialCategory] = useState("");
  const [initialPin, setInitialPin] = useState("");
  const [linkedPackages, setLinkedPackages] = useState([]);
  const [linkedDomains, setLinkedDomains] = useState([]);
  const [initialLinkedPackages, setInitialLinkedPackages] = useState([]);
  const [initialLinkedDomains, setInitialLinkedDomains] = useState([]);
  const [newPackage, setNewPackage] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [appPickerVisible, setAppPickerVisible] = useState(false);
  const [backToInitial, setBackToInitial] = useState(1);
  const [secureEntry, setSecureEntry] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showPIN, setShowPIN] = useState(false);
  const [isUsernameExpanded, setIsUsernameExpanded] = useState(false);
  const [isPassNameExpanded, setIsPassNameExpanded] = useState(false);
  const [deletePassModalVisible, setDeletePassModalVisible] = useState(false);
  const [notUpdatedModalVisible, setNotUpdatedModalVisible] = useState(false);
  const [authNotAvailableModal, setAuthNotAvailableModal] = useState(false);
  const [qrBottomSheetVisible, setQrBottomSheetVisible] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const { height, width } = Dimensions.get("window");
  const countdownInterval = useRef(null);

  const refRBSheet = useRef();

  useEffect(() => {
    const fetch = async () => {
      const all = await getPasswords();
      const item = all[index];
      setEntry(item);
      setPassName(item?.passName);
      setUsername(item.username);
      setPassword(item.password);
      setCategory(item.category);
      setPin(item?.pin);
      setInitialCategory(item.category);
      setInitialPassName(item?.passName);
      setInitialPassword(item.password);
      setInitialUsername(item.username);
      setInitialPin(item?.pin);
      const pkgs = Array.isArray(item.packageNames) ? item.packageNames : [];
      const doms = Array.isArray(item.domains) ? item.domains : [];
      setLinkedPackages(pkgs);
      setLinkedDomains(doms);
      setInitialLinkedPackages(pkgs);
      setInitialLinkedDomains(doms);
      setNewPackage("");
      setNewDomain("");
    };
    fetch();
  }, [backToInitial]);

  const copyToClipboard = async (text, item) => {
    if (item == "password" || item == "pin") {
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
        await Clipboard.setStringAsync(text);
        if (item == "pin") {
          triggerToast("Copied", "PIN copied to clipboard", "success", 4000);
        } else {
          triggerToast(
            "Copied",
            "Password copied to clipboard",
            "success",
            4000,
          );
        }
      }
    } else {
      await Clipboard.setStringAsync(text);
      triggerToast("Copied", "Username copied to Clipboard", "success", 4000);
    }
  };

  const truncatePassName = (name) => {
    return name.length > 16 ? name.slice(0, 16) + "..." : name;
  };

  const truncateUsername = (name) => {
    if (category == "Banking") {
      if (name.length > 5) {
        const visiblePart = name.slice(0, 5);
        const hiddenPart = "•".repeat(name.length - 5);
        return visiblePart + hiddenPart;
      } else {
        return name;
      }
    } else {
      return name.length > 20 ? name.slice(0, 20) + "..." : name;
    }
  };

  const sameStringArray = (a, b) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  };

  const normalizeDomain = (s) =>
    s
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .split("?")[0];

  const isValidDomain = (d) =>
    /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d) &&
    !d.startsWith("-") &&
    !d.endsWith("-");

  const normalizePackageId = (s) => s.trim().toLowerCase();

  const isValidPackage = (p) => /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/.test(p);

  const addDomain = () => {
    const d = normalizeDomain(newDomain);
    if (!isValidDomain(d)) {
      triggerToast(
        "Invalid",
        "Enter a domain like instagram.com",
        "error",
        3000,
      );
      return;
    }
    if (linkedDomains.includes(d)) {
      setNewDomain("");
      return;
    }
    setLinkedDomains([...linkedDomains, d]);
    setNewDomain("");
  };

  const removeDomain = (d) => {
    setLinkedDomains(linkedDomains.filter((x) => x !== d));
  };

  const addPackage = () => {
    const p = normalizePackageId(newPackage);
    if (!isValidPackage(p)) {
      triggerToast(
        "Invalid",
        "Enter a package id like com.instagram.android",
        "error",
        3000,
      );
      return;
    }
    if (linkedPackages.includes(p)) {
      setNewPackage("");
      return;
    }
    setLinkedPackages([...linkedPackages, p]);
    setNewPackage("");
  };

  const addPackageFromPicker = (packageName) => {
    const p = normalizePackageId(packageName || "");
    if (!p || linkedPackages.includes(p)) return;
    setLinkedPackages([...linkedPackages, p]);
  };

  const removePackage = (p) => {
    setLinkedPackages(linkedPackages.filter((x) => x !== p));
  };

  const handleUpdate = async () => {
    const linksChanged =
      !sameStringArray(linkedDomains, initialLinkedDomains) ||
      !sameStringArray(linkedPackages, initialLinkedPackages);

    if (
      username == initialUsername &&
      passName == initialPassName &&
      password == initialPassword &&
      pin == initialPin &&
      !linksChanged
    ) {
      setNotUpdatedModalVisible(true);
    } else {
      setModalVisible(false);
      await updatePassword(index, {
        passName,
        username,
        password,
        category,
        pin,
        domains: linkedDomains,
        packageNames: linkedPackages,
      });
      navigation.goBack();
      triggerToast(
        "Updated",
        "Successfully updated the password",
        "success",
        4000,
      );
    }
  };

  const handleDelete = async () => {
    setDeletePassModalVisible(false);
    await deletePassword(index);
    navigation.goBack();
    triggerToast(
      "Deleted",
      "Successfully deleted the password",
      "success",
      4000,
    );
  };

  useEffect(() => {
    setTimeout(() => {
      if (showPass) {
        setShowPass(false);
      }
    }, 2000);
  }, [showPass]);

  useEffect(() => {
    setTimeout(() => {
      if (showPIN) {
        setShowPIN(false);
      }
    }, 2000);
  }, [showPIN]);

  useEffect(() => {
    if (qrBottomSheetVisible) {
      setCountdown(10);
      countdownInterval.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval.current);
            setQrBottomSheetVisible(false);
            setTimeout(() => {
              setCountdown(10);
            }, 500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, [qrBottomSheetVisible]);

  const handleCloseQrSheet = () => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
    setQrBottomSheetVisible(false);
    setTimeout(() => {
      setCountdown(10);
    }, 500);
  };

  const handleSharingPass = () => {
    setQrBottomSheetVisible(true);
  };

  const handleToggleEye = () => {
    setSecureEntry(false);
  };

  // const handleSharingPass = () => {
  //   refRBSheet.current.open();
  // };

  const checkFingerprintForDeletion = async () => {
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
      handleDelete();
    }
  };

  const checkFingerprintForTogglingEye = async () => {
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
      handleToggleEye();
    }
  };

  const checkFingerprintForSharingPass = async () => {
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
      handleSharingPass();
    }
  };

  const checkFingerprintForUpdation = async () => {
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
      handleUpdate();
    }
  };

  const checkFingerprint = async (item) => {
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
      if (item == "pin") {
        setShowPIN(true);
      } else {
        setShowPass(true);
      }
    }
  };

  const firstLetter = passName.charAt(0).toUpperCase();
  const catColors = getCategoryColors(category, isDark);

  if (!entry) return null;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: "center",
        paddingHorizontal: 20,
      }}
    >
      <AppPickerSheet
        visible={appPickerVisible}
        onClose={() => setAppPickerVisible(false)}
        onPick={addPackageFromPicker}
        existingPackages={linkedPackages}
      />
      <Modal
        animationType="fade"
        transparent
        visible={authNotAvailableModal}
        onRequestClose={() => setAuthNotAvailableModal(false)}
      >
        <BlurView blurType={colors.blurTint} blurAmount={10} style={styles.blurContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBackground, borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: 800 }}>
              Authentication Not Available
            </Text>
            <Text style={{ color: colors.text, fontSize: 16, marginTop: 10 }}>
              Your device does not have any authentication method set up. Please
              set up a PIN, password, or biometric authentication in your device
              settings.
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "100%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, dynamicButtons.whiteButton]}
                  onPress={() => setAuthNotAvailableModal(false)}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: colors.whiteButtonText }}
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
        visible={notUpdatedModalVisible}
        onRequestClose={() => setNotUpdatedModalVisible(false)}
      >
        <BlurView blurType={colors.blurTint} blurAmount={10} style={styles.blurContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBackground, borderColor: colors.border,paddingHorizontal:20}]}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: 800 }}>
              Couldn't Update
            </Text>
            <Text style={{ color: colors.text, fontSize: 16 }}>
              You didn't change anything to save!
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "100%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, dynamicButtons.cancelButton]}
                  onPress={() => {
                    setNotUpdatedModalVisible(false);
                  }}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: colors.cancelButtonText }}
                  >
                    Close
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
        visible={deletePassModalVisible}
        onRequestClose={() => setDeletePassModalVisible(false)}
      >
        <BlurView blurType={colors.blurTint} blurAmount={10} style={styles.blurContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBackground, borderColor: colors.border,paddingHorizontal:20 }]}>
            <Text style={{ color: colors.text, fontSize: 16 }}>
              Are you sure you want to delete this password?
            </Text>
            <Text style={{ color: colors.error, fontSize: 16, fontWeight: 800 }}>
              This action is irreversible!
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, dynamicButtons.cancelButton]}
                  onPress={() => setDeletePassModalVisible(false)}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: colors.cancelButtonText }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, dynamicButtons.redButton]}
                  onPress={checkFingerprintForDeletion}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: colors.redButtonText }}
                  >
                    Delete
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
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Toaster />
        <BlurView blurType={colors.blurTint} blurAmount={10} style={styles.blurContainer}>
          <View style={[styles.modalContent, { backgroundColor: isDark? colors.modalBackground:"#f3f3f3", borderColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => {
                if (secureEntry) {
                  checkFingerprintForTogglingEye();
                } else {
                  setSecureEntry(true);
                }
              }}
              style={{
                marginBottom: 20,
                backgroundColor: colors.inputBackground,
                borderRadius: 40,
                width: 90,
                paddingVertical: 7,
                margin: "auto",
                borderWidth: 1,
                borderColor: colors.inputBorder,
                elevation: 10,
                  shadowColor:isDark?"black":"#969696",
            borderWidth:isDark?1:0.5,
              }}
            >
              {secureEntry ? (
                <EyeOff
                  size={35}
                  style={{ margin: "auto" }}
                  color="#ff0000ff"
                  strokeWidth={2}
                />
              ) : (
                <Eye
                  size={35}
                  style={{ margin: "auto" }}
                  color="#00c76b"
                  strokeWidth={2}
                />
              )}
            </TouchableOpacity>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 350,paddingTop:15 }}
            >
              <TextInput
                placeholderTextColor={colors.inputPlaceholder}
                placeholder="Name/Label"
                value={passName}
                onChangeText={setPassName}
                style={[styles.input, {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText,
                   shadowColor:isDark?"black":"#969696",
            borderWidth:isDark?1:0.5,
                }]}
              />
              <TextInput
                placeholderTextColor={colors.inputPlaceholder}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                style={[styles.input, {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText,
                    shadowColor:isDark?"black":"#969696",
            borderWidth:isDark?1:0.5,
                }]}
              />
              <TextInput
                placeholderTextColor={colors.inputPlaceholder}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureEntry}
                style={[styles.input, {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText,
                    shadowColor:isDark?"black":"#969696",
            borderWidth:isDark?1:0.5,
                }]}
              />
              {category == "Banking" && (
                <TextInput
                  placeholderTextColor={colors.inputPlaceholder}
                  placeholder="PIN"
                  value={pin}
                  onChangeText={setPin}
                  secureTextEntry={secureEntry}
                  style={[styles.input, {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.inputText,
                      shadowColor:isDark?"black":"#969696",
            borderWidth:isDark?1:0.5,
                  }]}
                />
              )}

              <Text style={[styles.linkSectionLabel, { color: colors.textSecondary,marginLeft:20 }]}>LINKED APPS</Text>
              {linkedPackages.length === 0 ? (
                <Text style={[styles.linkEmptyHint, { color: colors.textTertiary,paddingHorizontal:20 }]}>
                  No apps linked yet. Add a package id to enable autofill for
                  that app (e.g. com.instagram.android).
                </Text>
              ) : (
                <View style={styles.chipWrap}>
                  {linkedPackages.map((p) => (
                    <View key={p} style={[styles.chip, {
                      backgroundColor: colors.surface,
                      borderColor: colors.border
                    }]}>
                      <Text style={[styles.chipText, { color: colors.text }]} numberOfLines={1}>
                        {p}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removePackage(p)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close" size={14} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <TouchableOpacity
                onPress={() => setAppPickerVisible(true)}
                style={[styles.linkAddFullBtn, {
                  backgroundColor: isDark ? "#001e10" : "#e6f7ed",
                  borderColor: isDark ? "#005c31" : "#80dea0"
                }]}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={20} color={colors.accentGreen} />
                <Text style={[styles.linkAddFullBtnText, { color: colors.accentGreen }]}>
                  Add from installed apps
                </Text>
              </TouchableOpacity>

              <Text style={[styles.linkSectionLabel, { marginTop: 18, color: colors.textSecondary,marginLeft:20 }]}>
                LINKED WEBSITES
              </Text>
              {linkedDomains.length === 0 ? (
                <Text style={[styles.linkEmptyHint, { color: colors.textTertiary,paddingHorizontal:20 }]}>
                  No websites linked yet. Add a domain to enable autofill on
                  that site (e.g. instagram.com).
                </Text>
              ) : (
                <View style={styles.chipWrap}>
                  {linkedDomains.map((d) => (
                    <View key={d} style={[styles.chip, {
                      backgroundColor: colors.surface,
                      borderColor: colors.border
                    }]}>
                      <Text style={[styles.chipText, { color: colors.text }]} numberOfLines={1}>
                        {d}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeDomain(d)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close" size={14} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.linkAddRow}>
                <TextInput
                  placeholderTextColor={colors.inputPlaceholder}
                  placeholder="example.com"
                  value={newDomain}
                  onChangeText={setNewDomain}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  style={[styles.linkAddInput, {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.inputText
                  }]}
                  onSubmitEditing={addDomain}
                />
                <TouchableOpacity
                  onPress={addDomain}
                  style={[styles.linkAddBtn, {
                    backgroundColor: colors.whiteButtonBg,
                    borderColor: colors.whiteButtonBorder
                  }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={20} color={colors.whiteButtonText} />
                </TouchableOpacity>
              </View>
              <View style={{ height: 50 }} />
            </ScrollView>

            {/* <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={category}
                onValueChange={(itemValue) => setCategory(itemValue)}
                style={styles.picker}
                dropdownIconColor="white"
              >
                <Picker.Item label="Select Category" value="" enabled={false} />
                <Picker.Item label="Banking" value="Banking" />
                <Picker.Item label="Mail or ID" value="Mail or ID" />
                <Picker.Item label="Developer" value="Developer" />
                <Picker.Item label="Social" value="Social" />
                <Picker.Item label="Wifi" value="Wifi" />
              </Picker>
            </View> */}
            <View style={styles.buttonRow}>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn,dynamicButtons.cancelButton, {  }]}
                  onPress={() => {
                    setModalVisible(false);
                    setBackToInitial(backToInitial + 1);
                    setSecureEntry(true);
                  }}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: colors.cancelButtonText }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  onPress={checkFingerprintForUpdation}
                  style={[styles.modalbtn, dynamicButtons.whiteButton]}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: colors.whiteButtonText }}
                  >
                    Update
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>
      <StatusBar />
      <View
        style={[styles.statusbar, { height: StatusBar.currentHeight,backgroundColor:colors.background }]}
      ></View>
      <View
        style={{
          width: "100%",
          paddingTop: 35,
          paddingBottom: 20,
          backgroundColor: colors.background,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => {
            setIsUsernameExpanded(false);
            setIsPassNameExpanded(false);
            navigation.navigate("homescreen", {
              category: passCategory == "All" ? "All" : category,
            });
          }}
        >
          <AntDesign
            name="arrowleft"
            size={24}
            color={colors.text}
            style={{
              backgroundColor: colors.surface,
              padding: 8,
              borderRadius: 50,
              elevation:10,
              shadowColor:isDark?"black":"#969696"
            }}
          />
        </TouchableOpacity>

        <Text
          style={{
            marginLeft: 20,
            fontSize: 25,
            color: colors.text,
            fontWeight: "800",
          }}
        >
          Password Details
        </Text>
      </View>

      {/* main below content */}
      <View style={[styles.passmain, {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth:isDark?1.5:0,
        shadowColor:isDark?"black":"#969696"
      }]}>
        <View
          style={[
            styles.passviewflex,
            {
              width: "95%",
              paddingBottom: 15,
              borderBottomWidth: 0.5,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.pic,
              {
                borderColor: catColors.iconBorder,
                borderWidth: 0.5,
                backgroundColor: catColors.iconBg,
                shadowColor:isDark?"black":"#969696"
              },
            ]}
          >
            <Text
              style={{
                fontSize: 25,
                fontWeight: 800,
                color: catColors.accent,
              }}
            >
              {firstLetter}
            </Text>
          </View>
          <View style={styles.name_and_user}>
            <Text style={[styles.texts, { color: colors.text }]}>Name/Label</Text>
            <TouchableOpacity
              onPress={() => setIsPassNameExpanded(!isPassNameExpanded)}
            >
              <Text style={[styles.texts, { color: colors.textSecondary }]}>
                {isPassNameExpanded ? passName : truncatePassName(passName)}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.categoryPill, {
            marginLeft: "auto",
            backgroundColor: colors.categoryPillBg,
            borderColor: colors.categoryPillBorder,
            shadowColor:isDark?"black":"#969696",
            borderWidth:isDark?1:0.5,
          }]}>
            {category === "Banking" ? (
              <Ionicons name="card-outline" size={22} color={catColors.accent} />
            ) : category === "Mail or ID" ? (
              <UserRound size={22} color={catColors.accent} strokeWidth={2.1} />
            ) : category === "Developer" ? (
              <FontAwesome6 name="code" size={20} color={catColors.accent} />
            ) : category === "Wifi" ? (
              <Wifi size={20} color={catColors.accent} strokeWidth={3} />
            ) : category === "Social" ? (
              <Globe size={22} color={catColors.accent} strokeWidth={2.2} />
            ) : (
              <KeyRound size={22} color={catColors.accent} strokeWidth={2.1} />
            )}
          </View>
          {/* <Ionicons
            onPress={() => copyToClipboard(username, "username")}
            style={{ marginLeft: "auto" }}
            name="copy"
            size={24}
            color="lightgrey"
          /> */}
        </View>
        <View
          style={[
            styles.passviewflex,
            {
              width: "95%",
              paddingTop: 20,
              paddingBottom: 20,
              gap: 20,
            },
          ]}
        >
          <View
            style={[
              styles.pic,
              {
                borderColor: catColors.iconBorder,
                borderWidth: 0.5,
                backgroundColor: catColors.iconBg,
                shadowColor:isDark?"black":"#969696"
              },
            ]}
          >
            <UserRound
              size={25}
              color={catColors.accent}
              strokeWidth={2.5}
            />
          </View>
          <View style={styles.name_and_user}>
            <Text style={[styles.texts, { color: colors.text }]}>
              {category == "Banking"
                ? "Username/Card No."
                : category == "Mail or ID"
                  ? category
                  : category == "Social"
                    ? "Username"
                    : category == "Developer"
                      ? "Username"
                      : category == "Wifi"
                        ? "Wifi Name"
                        : "Username/Card No./ID"}
            </Text>
            <TouchableOpacity
              onPress={() => setIsUsernameExpanded(!isUsernameExpanded)}
            >
              <Text style={[styles.texts, { color: colors.textSecondary }]}>
                {isUsernameExpanded ? username : truncateUsername(username)}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => copyToClipboard(username, "username")}
            style={[styles.categoryPill, {
              marginLeft: "auto",
              backgroundColor: colors.categoryPillBg,
              borderColor: colors.categoryPillBorder,
               shadowColor:isDark?"black":"#969696",
            borderWidth:isDark?1:0.5,
            }]}
            activeOpacity={0.7}
          >
            <Ionicons name="copy" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View
          style={[
            styles.passviewflex,
            {
              width: "95%",
              paddingBottom: 25,
              paddingTop: 5,
            },
          ]}
        >
          <View
            style={[
              styles.pic,
              {
                borderColor: catColors.iconBorder,
                borderWidth: 0.5,
                backgroundColor: catColors.iconBg,
                shadowColor:isDark?"black":"#969696"
              },
            ]}
          >
            <KeyRound
              size={24}
              color={catColors.accent}
              strokeWidth={2}
            />
          </View>
          <View style={[styles.name_and_user, { width: "65%" }]}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Text style={[styles.texts, { color: colors.text }]}>Password</Text>
              <TouchableOpacity
                onPress={checkFingerprintForSharingPass}
                style={[styles.categoryPill, {
                  backgroundColor: colors.categoryPillBg,
                  borderColor: colors.categoryPillBorder,
                   shadowColor:isDark?"black":"#969696",
            borderWidth:isDark?1:0.5,
                }]}
                activeOpacity={0.7}
              >
                <Ionicons name="share" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => {
                if (showPass) {
                  setShowPass(false);
                } else {
                  checkFingerprint("pass");
                }
              }}
              style={[
                styles.passTextView,
                {
                  paddingVertical: showPass ? 5 : 1,
                  paddingHorizontal: showPass ? 20 : 8,
                  backgroundColor: isDark ? "#391414" : "#ffe6e6",
                  borderColor: isDark ? "#930000" : "#ff9999",
                  shadowColor:isDark?"black":"#969696"
                },
              ]}
            >
              {showPass ? (
                <Text style={[styles.texts, { color: colors.error }]}>{password}</Text>
              ) : (
                <Text style={[styles.texts, { color: colors.error }]}>••••••••••</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.iconsShareAndCopy}>
            <TouchableOpacity
              onPress={() => copyToClipboard(password, "password")}
              style={[styles.categoryPill, {
                backgroundColor: colors.categoryPillBg,
                borderColor: colors.categoryPillBorder,
                 shadowColor:isDark?"black":"#969696",
            borderWidth:isDark?1:0.5,
              }]}
              activeOpacity={0.7}
            >
              <Ionicons name="copy" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {category == "Banking" && (
          <View
            style={[
              styles.passviewflex,
              {
                width: "95%",
                paddingBottom: 30,
                paddingTop: 5,
              },
            ]}
          >
            <View
              style={[
                styles.pic,
                {
                  borderColor: catColors.iconBorder,
                  borderWidth: 0.5,
                  backgroundColor: catColors.iconBg,
                   shadowColor:isDark?"black":"#969696",
                },
              ]}
            >
              <FontAwesome5
                name="keyboard"
                size={20}
                color={catColors.accent}
              />
            </View>
            <View style={[styles.name_and_user, { width: "65%" }]}>
              <Text style={[styles.texts, { color: colors.text }]}>PIN</Text>
              <TouchableOpacity
                onPress={() => {
                  if (showPIN) {
                    setShowPIN(false);
                  } else {
                    checkFingerprint("pin");
                  }
                }}
                style={[
                  styles.passTextView,
                  {
                    paddingVertical: showPIN ? 5 : 1,
                    paddingHorizontal: showPIN ? 20 : 8,
                    backgroundColor: isDark ? "#391414" : "#ffe6e6",
                    borderColor: isDark ? "#930000" : "#ff9999",
                    shadowColor:isDark?"black":"#969696"
                  },
                ]}
              >
                {showPIN ? (
                  <Text style={[styles.texts, { color: colors.error }]}>{pin}</Text>
                ) : (
                  <Text style={[styles.texts, { color: colors.error }]}>••••••</Text>
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => copyToClipboard(pin, "pin")}
              style={[styles.categoryPill, {
                marginLeft: "auto",
                backgroundColor: colors.categoryPillBg,
                borderColor: colors.categoryPillBorder,
                 shadowColor:isDark?"black":"#969696",
            borderWidth:isDark?1:0.5,
              }]}
              activeOpacity={0.7}
            >
              <Ionicons name="copy" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        <View
          style={[
            styles.passviewflex,
            { width: "95%", paddingBottom: 0, paddingTop: 0 },
          ]}
        >
          <View
            style={[
              styles.pic,
              {
                borderColor: catColors.iconBorder,
                borderWidth: 0.5,
                backgroundColor: catColors.iconBg,
                shadowColor:isDark?"black":"#969696"
              },
            ]}
          >
            <ClipboardList
              size={24}
              color={catColors.accent}
              strokeWidth={2}
            />
          </View>
          <View style={styles.name_and_user}>
            <Text style={[styles.texts, { color: colors.text }]}>Category</Text>
            <Text
              style={[
                styles.categoryText,
                {
                  color: catColors.accent,
                  borderWidth: 0.5,
                  borderColor: catColors.pillBorder,
                  backgroundColor: catColors.pillBg,
                  shadowColor:isDark?"black":"#969696"
                },
              ]}
            >
              {category}
            </Text>
          </View>
        </View>
      </View>
      <Modal
        animationType="fade"
        transparent
        visible={qrBottomSheetVisible}
        onRequestClose={handleCloseQrSheet}
      >
        <TouchableOpacity
          style={[styles.qrModalContainer, { backgroundColor: isDark?"black":"#eaeaea" }]}
          activeOpacity={1}
          onPress={handleCloseQrSheet}
        >
          <TouchableOpacity style={[styles.qrBottomSheet, {
            backgroundColor: isDark? colors.surface:"#d4d4d4",
            borderColor: colors.border
          }]} activeOpacity={1}>
            <TouchableOpacity
              style={[styles.closeButton, {
                backgroundColor: isDark? colors.surface:"#d4d4d4",
                borderColor: colors.border,
                elevation:10
              }]}
              onPress={handleCloseQrSheet}
            >
              <ChevronDown size={25} strokeWidth={2.5} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.qrContent}>
              <Text style={styles.qrWarningText}>
                This QR Code contains your password
              </Text>
              <Text style={styles.qrWarningText}>
                Share only to your trusted ones
              </Text>
              <Text style={[styles.qrTimerText,{color:isDark?"#dfdfdfff":"grey"}]}>Auto-close in {countdown}s</Text>
              <View style={styles.qrCodeContainer}>
                <QrCodeSvg
                  value={password}
                  frameSize={150}
                  contentCells={5}
                  dotColor="#000000ff"
                  backgroundColor="#e0e0e0"
                  contentStyle={styles.box}
                />
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <View style={styles.buttonsmain}>
        <TouchableOpacity
          onPress={() => setDeletePassModalVisible(true)}
          style={[styles.button,dynamicButtons.redButton]}
        >
          <Text style={[styles.texts, { color: colors.redButtonText }]}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={[styles.button,dynamicButtons.whiteButton]}
        >
          <Text style={[styles.texts, { color: colors.whiteButtonText }]}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
const screenwidth = Dimensions.get("window").width
const styles = StyleSheet.create({
  main: {
    width: "100%",
    margin: "auto",
    backgroundColor: "white",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 10,
    elevation: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    elevation: 10,
  },
  linkSectionLabel: {
    color: "#ebebf5",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 8,
  },
  linkEmptyHint: {
    color: "#7a7a7a",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
    marginLeft:20
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 50,
    maxWidth: "100%",
  },
  chipText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
    maxWidth: 200,
  },
  linkAddRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width:screenwidth - 80,
    margin:"auto"
  },
  linkAddInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 54,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  linkAddBtn: {
    borderWidth: 1,
    width: 40,
    height: 40,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  linkAddFullBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 54,
    paddingVertical: 12,
    paddingHorizontal: 14,
    width:screenwidth - 80,
    margin:"auto"
  },
  linkAddFullBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  blurContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    padding: 20,
  },
  pic: {
    width: 50,
    height: 50,
    borderRadius: 55,
    backgroundColor: "black",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation:10,
  },
  iconsShareAndCopy: {
    display: "flex",
    flexDirection: "comlumn",
    gap: 15,
    marginLeft: "auto",
        elevation:10,
  },
  iconsShareAndCopy: {
    display: "flex",
    flexDirection: "comlumn",
    gap: 15,
    marginLeft: "auto",
  },
  pickerWrapper: {
    borderRadius: 6,
    marginBottom: 20,
    overflow: "hidden",
  },

  picker: {
    color: "#ffffff", // for dark mode
    backgroundColor: "#282828",
    height: 65,
  },
  modalContent: {
    backgroundColor: "#202020ff",
    borderRadius: 40,
    paddingVertical: 20,
    elevation: 5,
    borderWidth: 0.5,
    borderColor: "#3d3d3d",
  },
  passTextView: {
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderRadius: 50,
    borderWidth: 0.5,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },
  name_and_user: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
  },
  passviewflex: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 20,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: 500,
    paddingHorizontal: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 50,
    elevation:10
  },
  texts: {
    fontSize: 17,
    fontWeight: 800,
  },
  input: {
    borderRadius: 50,
    borderWidth: 1,
    margin:"auto",
    marginBottom: 15,
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 10,
    width:screenwidth - 80
  },
  modalbtn: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 54,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: screenwidth - 80,
    margin:"auto",
    marginTop: 30,
  },
  passmain: {
    width: "100%",
    height: "auto",
    paddingHorizontal: 10,
    paddingRight: 15,
    paddingVertical: 25,
    borderWidth: 1.5,
    borderRadius: 40,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    elevation:10,
  },
  buttonsmain: {
    width: "98%",
    height: "auto",
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  button: {
    width: "45%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "red",
    paddingVertical: 18,
    borderRadius: 50,
    borderWidth: 0.5,
    borderColor: "#ff9999",
  },
  qrModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  qrBottomSheet: {
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    height: "60%",
    position: "relative",
    borderWidth: 1,
    elevation:10
  },
  closeButton: {
    position: "absolute",
    bottom: "102%",
    alignSelf: "center",
    zIndex: 10,
    padding: 10,
    paddingHorizontal: 60,
    borderRadius: 55,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  qrContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  qrWarningText: {
    marginBottom: 10,
    fontSize: 15,
    fontWeight: "700",
    color: "#eb0000ff",
  },
  qrTimerText: {
    marginBottom: 20,
    fontSize: 15,
    fontWeight: "800",
    color: "#dfdfdfff",
  },
  qrCodeContainer: {
    padding: 18, 
    backgroundColor: "#e0e0e0",
    borderRadius: 35, 
    elevation: 20,
    marginTop: 10,
    borderWidth: 3,
    outlineWidth:10,
    outlineColor:"#959595",
    borderColor: "#ffffff",
    
  },
  navbar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 35,
    backgroundColor: "black",
  },
  statusbar: {
    width: "100%",
    backgroundColor: "black",
  },
});

export default PasswordDetails;
