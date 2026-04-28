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
import { buttonStyles } from "../styles/buttonStyles";

const PasswordDetails = ({ route, navigation }) => {
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

  if (!entry) return null;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "black",
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
              Your device does not have any authentication method set up. Please
              set up a PIN, password, or biometric authentication in your device
              settings.
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
        animationType="slide"
        transparent
        visible={notUpdatedModalVisible}
        onRequestClose={() => setNotUpdatedModalVisible(false)}
      >
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <Text style={{ color: "white", fontSize: 18, fontWeight: 800 }}>
              Couldn't Update
            </Text>
            <Text style={{ color: "white", fontSize: 16 }}>
              You didn't change anything to save!
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "100%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, buttonStyles.cancelButton]}
                  onPress={() => {
                    setNotUpdatedModalVisible(false);
                  }}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: "white" }}
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
        animationType="slide"
        transparent
        visible={deletePassModalVisible}
        onRequestClose={() => setDeletePassModalVisible(false)}
      >
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <Text style={{ color: "white", fontSize: 16 }}>
              Are you sure you want to delete this password?
            </Text>
            <Text style={{ color: "red", fontSize: 16, fontWeight: 800 }}>
              This action is irreversible!
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, buttonStyles.cancelButton]}
                  onPress={() => setDeletePassModalVisible(false)}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: "white" }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, buttonStyles.redButton]}
                  onPress={checkFingerprintForDeletion}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: "white" }}
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
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Toaster />
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
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
                backgroundColor: "#2a2a2a",
                borderRadius: 40,
                width: 90,
                paddingVertical: 7,
                margin: "auto",
                borderWidth: 1,
                borderColor: "#3a3a3a",
                elevation:10
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
              style={{ maxHeight: 350 }}
            >
              <TextInput
                placeholderTextColor="lightgrey"
                placeholder="Name/Label"
                value={passName}
                onChangeText={setPassName}
                style={styles.input}
              />
              <TextInput
                placeholderTextColor="lightgrey"
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                style={styles.input}
              />
              <TextInput
                placeholderTextColor="lightgrey"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureEntry}
                style={styles.input}
              />
              {category == "Banking" && (
                <TextInput
                  placeholderTextColor="lightgrey"
                  placeholder="PIN"
                  value={pin}
                  onChangeText={setPin}
                  secureTextEntry={secureEntry}
                  style={styles.input}
                />
              )}

              <Text style={styles.linkSectionLabel}>LINKED APPS</Text>
              {linkedPackages.length === 0 ? (
                <Text style={styles.linkEmptyHint}>
                  No apps linked yet. Add a package id to enable autofill for
                  that app (e.g. com.instagram.android).
                </Text>
              ) : (
                <View style={styles.chipWrap}>
                  {linkedPackages.map((p) => (
                    <View key={p} style={styles.chip}>
                      <Text style={styles.chipText} numberOfLines={1}>
                        {p}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removePackage(p)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close" size={14} color="lightgrey" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <TouchableOpacity
                onPress={() => setAppPickerVisible(true)}
                style={styles.linkAddFullBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={20} color="#00c76b" />
                <Text style={styles.linkAddFullBtnText}>
                  Add from installed apps
                </Text>
              </TouchableOpacity>

              <Text style={[styles.linkSectionLabel, { marginTop: 18 }]}>
                LINKED WEBSITES
              </Text>
              {linkedDomains.length === 0 ? (
                <Text style={styles.linkEmptyHint}>
                  No websites linked yet. Add a domain to enable autofill on
                  that site (e.g. instagram.com).
                </Text>
              ) : (
                <View style={styles.chipWrap}>
                  {linkedDomains.map((d) => (
                    <View key={d} style={styles.chip}>
                      <Text style={styles.chipText} numberOfLines={1}>
                        {d}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeDomain(d)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close" size={14} color="lightgrey" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.linkAddRow}>
                <TextInput
                  placeholderTextColor="#7a7a7a"
                  placeholder="example.com"
                  value={newDomain}
                  onChangeText={setNewDomain}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  style={styles.linkAddInput}
                  onSubmitEditing={addDomain}
                />
                <TouchableOpacity
                  onPress={addDomain}
                  style={styles.linkAddBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={20} color="black" />
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
                  style={[styles.modalbtn,buttonStyles.cancelButton, {  }]}
                  onPress={() => {
                    setModalVisible(false);
                    setBackToInitial(backToInitial + 1);
                    setSecureEntry(true);
                  }}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: "white" }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  onPress={checkFingerprintForUpdation}
                  style={[styles.modalbtn, buttonStyles.whiteButton]}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: "black" }}
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
        style={[styles.statusbar, { height: StatusBar.currentHeight }]}
      ></View>
      <View
        style={{
          width: "100%",
          paddingTop: 35,
          paddingBottom: 20,
          backgroundColor: "black",
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
            color="white"
            style={{
              backgroundColor: "#2a2a2a",
              padding: 8,
              borderRadius: 50,
            }}
          />
        </TouchableOpacity>

        <Text
          style={{
            marginLeft: 20,
            fontSize: 25,
            color: "white",
            fontWeight: "800",
          }}
        >
          Password Details
        </Text>
      </View>

      {/* main below content */}
      <View style={styles.passmain}>
        <View
          style={[
            styles.passviewflex,
            {
              width: "95%",
              paddingBottom: 15,
              borderBottomWidth: 0.5,
              borderBottomColor: "#5d5d5dff",
            },
          ]}
        >
          <View
            style={[
              styles.pic,
              {
                borderColor:
                  category === "Banking"
                    ? "#643100"
                    : category === "Mail or ID"
                      ? "#780000"
                      : category === "Developer"
                        ? "#62003f"
                        : category === "Wifi"
                          ? "#003a80"
                          : category === "Social"
                            ? "#005c31"
                            : "#006d60",
                borderWidth: 0.5,
                backgroundColor:
                  category === "Banking"
                    ? "#1c0e00"
                    : category === "Mail or ID"
                      ? "#200000"
                      : category === "Developer"
                        ? "#1e0013"
                        : category === "Wifi"
                          ? "#000e1f"
                          : category === "Social"
                            ? "#001e10"
                            : "#001f1c",
              },
            ]}
          >
            <Text
              style={{
                fontSize: 25,
                fontWeight: 800,
                color:
                  category === "Banking"
                    ? "orange"
                    : category === "Mail or ID"
                      ? "red"
                      : category === "Developer"
                        ? "#e00092"
                        : category === "Wifi"
                          ? "#0098ff"
                          : category === "Social"
                            ? "#00c76b"
                            : "#00cfbb",
              }}
            >
              {firstLetter}
            </Text>
          </View>
          <View style={styles.name_and_user}>
            <Text style={styles.texts}>Name/Label</Text>
            <TouchableOpacity
              onPress={() => setIsPassNameExpanded(!isPassNameExpanded)}
            >
              <Text style={[styles.texts, { color: "lightgrey" }]}>
                {isPassNameExpanded ? passName : truncatePassName(passName)}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.categoryPill, { marginLeft: "auto" }]}>
            {category === "Banking" ? (
              <Ionicons name="card-outline" size={22} color="orange" />
            ) : category === "Mail or ID" ? (
              <UserRound size={22} color="red" strokeWidth={2.1} />
            ) : category === "Developer" ? (
              <FontAwesome6 name="code" size={20} color="#e00092" />
            ) : category === "Wifi" ? (
              <Wifi size={20} color="#0098ff" strokeWidth={3} />
            ) : category === "Social" ? (
              <Globe size={22} color="#00c76b" strokeWidth={2.2} />
            ) : (
              <KeyRound size={22} color="#00cfbb" strokeWidth={2.1} />
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
                borderColor:
                  category === "Banking"
                    ? "#643100"
                    : category === "Mail or ID"
                      ? "#780000"
                      : category === "Developer"
                        ? "#62003f"
                        : category === "Wifi"
                          ? "#003a80"
                          : category === "Social"
                            ? "#005c31"
                            : "#006d60",
                borderWidth: 0.5,
                backgroundColor:
                  category === "Banking"
                    ? "#1c0e00"
                    : category === "Mail or ID"
                      ? "#200000"
                      : category === "Developer"
                        ? "#1e0013"
                        : category === "Wifi"
                          ? "#000e1f"
                          : category === "Social"
                            ? "#001e10"
                            : "#001f1c",
              },
            ]}
          >
            <UserRound
              size={25}
              color={
                category === "Banking"
                  ? "orange"
                  : category === "Mail or ID"
                    ? "red"
                    : category === "Developer"
                      ? "#e00092"
                      : category === "Wifi"
                        ? "#0098ff"
                        : category === "Social"
                          ? "#00c76b"
                          : "#00cfbb"
              }
              strokeWidth={2.5}
            />
          </View>
          <View style={styles.name_and_user}>
            <Text style={styles.texts}>
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
              <Text style={[styles.texts, { color: "lightgrey" }]}>
                {isUsernameExpanded ? username : truncateUsername(username)}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => copyToClipboard(username, "username")}
            style={[styles.categoryPill, { marginLeft: "auto" }]}
            activeOpacity={0.7}
          >
            <Ionicons name="copy" size={20} color="lightgrey" />
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
                borderColor:
                  category === "Banking"
                    ? "#643100"
                    : category === "Mail or ID"
                      ? "#780000"
                      : category === "Developer"
                        ? "#62003f"
                        : category === "Wifi"
                          ? "#003a80"
                          : category === "Social"
                            ? "#005c31"
                            : "#006d60",
                borderWidth: 0.5,
                backgroundColor:
                  category === "Banking"
                    ? "#1c0e00"
                    : category === "Mail or ID"
                      ? "#200000"
                      : category === "Developer"
                        ? "#1e0013"
                        : category === "Wifi"
                          ? "#000e1f"
                          : category === "Social"
                            ? "#001e10"
                            : "#001f1c",
              },
            ]}
          >
            <KeyRound
              size={24}
              color={
                category === "Banking"
                  ? "orange"
                  : category === "Mail or ID"
                    ? "red"
                    : category === "Developer"
                      ? "#e00092"
                      : category === "Wifi"
                        ? "#0098ff"
                        : category === "Social"
                          ? "#00c76b"
                          : "#00cfbb"
              }
              strokeWidth={2}
            />
          </View>
          <View style={[styles.name_and_user, { width: "65%" }]}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Text style={styles.texts}>Password</Text>
              <TouchableOpacity
                onPress={checkFingerprintForSharingPass}
                style={styles.categoryPill}
                activeOpacity={0.7}
              >
                <Ionicons name="share" size={20} color="lightgrey" />
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
                },
              ]}
            >
              {showPass ? (
                <Text style={[styles.texts, { color: "red" }]}>{password}</Text>
              ) : (
                <Text style={[styles.texts, { color: "red" }]}>••••••••••</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.iconsShareAndCopy}>
            <TouchableOpacity
              onPress={() => copyToClipboard(password, "password")}
              style={styles.categoryPill}
              activeOpacity={0.7}
            >
              <Ionicons name="copy" size={20} color="lightgrey" />
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
                  borderColor:
                    category === "Banking"
                      ? "#643100"
                      : category === "Mail or ID"
                        ? "#780000"
                        : category === "Developer"
                          ? "#62003f"
                          : category === "Wifi"
                            ? "#003a80"
                            : category === "Social"
                              ? "#005c31"
                              : "#006d60",
                  borderWidth: 0.5,
                  backgroundColor:
                    category === "Banking"
                      ? "#1c0e00"
                      : category === "Mail or ID"
                        ? "#200000"
                        : category === "Developer"
                          ? "#1e0013"
                          : category === "Wifi"
                            ? "#000e1f"
                            : category === "Social"
                              ? "#001e10"
                              : "#001f1c",
                },
              ]}
            >
              <FontAwesome5
                name="keyboard"
                size={20}
                color={
                  category === "Banking"
                    ? "orange"
                    : category === "Mail or ID"
                      ? "red"
                      : category === "Developer"
                        ? "#e00092"
                        : category === "Wifi"
                          ? "#0098ff"
                          : category === "Social"
                            ? "#00c76b"
                            : "#00cfbb"
                }
              />
            </View>
            <View style={[styles.name_and_user, { width: "65%" }]}>
              <Text style={styles.texts}>PIN</Text>
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
                  },
                ]}
              >
                {showPIN ? (
                  <Text style={[styles.texts, { color: "red" }]}>{pin}</Text>
                ) : (
                  <Text style={[styles.texts, { color: "red" }]}>••••••</Text>
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => copyToClipboard(pin, "pin")}
              style={[styles.categoryPill, { marginLeft: "auto" }]}
              activeOpacity={0.7}
            >
              <Ionicons name="copy" size={20} color="lightgrey" />
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
                borderColor:
                  category === "Banking"
                    ? "#643100"
                    : category === "Mail or ID"
                      ? "#780000"
                      : category === "Developer"
                        ? "#62003f"
                        : category === "Wifi"
                          ? "#003a80"
                          : category === "Social"
                            ? "#005c31"
                            : "#006d60",
                borderWidth: 0.5,
                backgroundColor:
                  category === "Banking"
                    ? "#1c0e00"
                    : category === "Mail or ID"
                      ? "#200000"
                      : category === "Developer"
                        ? "#1e0013"
                        : category === "Wifi"
                          ? "#000e1f"
                          : category === "Social"
                            ? "#001e10"
                            : "#001f1c",
              },
            ]}
          >
            <ClipboardList
              size={24}
              color={
                category === "Banking"
                  ? "orange"
                  : category === "Mail or ID"
                    ? "red"
                    : category === "Developer"
                      ? "#e00092"
                      : category === "Wifi"
                        ? "#0098ff"
                        : category === "Social"
                          ? "#00c76b"
                          : "#00cfbb"
              }
              strokeWidth={2}
            />
          </View>
          <View style={styles.name_and_user}>
            <Text style={styles.texts}>Category</Text>
            <Text
              style={[
                styles.categoryText,
                {
                  color:
                    category === "Banking"
                      ? "orange"
                      : category === "Mail or ID"
                        ? "red"
                        : category === "Developer"
                          ? "#a8006e"
                          : category === "Wifi"
                            ? "#0072ff"
                            : "#00c76b",
                  borderWidth: 0.5,
                  borderColor:
                    category === "Banking"
                      ? "#ba5a00"
                      : category === "Mail or ID"
                        ? "#930000"
                        : category === "Developer"
                          ? "#7e0052"
                          : category === "Wifi"
                            ? "#0051b2"
                            : "#00713c",
                  backgroundColor:
                    category === "Banking"
                      ? "#2d1600"
                      : category === "Mail or ID"
                        ? "#391414"
                        : category === "Developer"
                          ? "#29001a"
                          : category === "Wifi"
                            ? "#00152e"
                            : "#002d18",
                },
              ]}
            >
              {category}
            </Text>
          </View>
        </View>
      </View>
      <Modal
        animationType="slide"
        transparent
        visible={qrBottomSheetVisible}
        onRequestClose={handleCloseQrSheet}
      >
        <TouchableOpacity
          style={styles.qrModalContainer}
          activeOpacity={1}
          onPress={handleCloseQrSheet}
        >
          <TouchableOpacity style={styles.qrBottomSheet} activeOpacity={1}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseQrSheet}
            >
              <ChevronDown size={25} strokeWidth={2.5} color="white" />
            </TouchableOpacity>
            <View style={styles.qrContent}>
              <Text style={styles.qrWarningText}>
                This QR Code contains your password
              </Text>
              <Text style={styles.qrWarningText}>
                Share only to your trusted ones
              </Text>
              <Text style={styles.qrTimerText}>Auto-close in {countdown}s</Text>
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
          style={[styles.button,buttonStyles.redButton]}
        >
          <Text style={styles.texts}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={[styles.button,buttonStyles.whiteButton]}
        >
          <Text style={[styles.texts, { color: "black" }]}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
    backgroundColor: "#2c2c2c",
    borderWidth: 1,
    borderColor: "#363636",
        elevation:10,
  },
  linkSectionLabel: {
    color: "lightgrey",
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
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2c2c2c",
    borderWidth: 1,
    borderColor: "#363636",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 50,
    maxWidth: "100%",
  },
  chipText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
    maxWidth: 200,
  },
  linkAddRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  linkAddInput: {
    flex: 1,
    backgroundColor: "#202020",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 54,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "white",
    fontSize: 14,
  },
  linkAddBtn: {
    backgroundColor: "#cfcfcf",
    borderWidth: 1,
    borderColor: "#fff",
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
    backgroundColor: "#001e10",
    borderWidth: 1,
    borderColor: "#005c31",
    borderRadius: 54,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  linkAddFullBtnText: {
    color: "#00c76b",
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
    color: "white", // for dark mode
    backgroundColor: "#282828",
    height: 65,
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
  passTextView: {
    backgroundColor: "#391414",
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderRadius: 50,
    borderWidth: 0.5,
    borderColor: "#930000",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
        elevation:10,
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
    color: "white",
    fontSize: 17,
    fontWeight: 800,
  },
  input: {
    backgroundColor: "#2a2a2a",
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#3d3d3d",
    marginBottom: 15,
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    color: "white",
    elevation:10
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
  passmain: {
    width: "100%",
    height: "auto",
    paddingHorizontal: 10,
    paddingRight: 15,
    paddingVertical: 25,
    backgroundColor: "#1c1c1c",
    borderWidth: 1.5,
    borderColor: "#282828ff",
    borderRadius: 40,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
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
    backgroundColor: "#000000ff",
  },
  qrBottomSheet: {
    backgroundColor: "#1a1a1aff",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    height: "60%",
    position: "relative",
    borderWidth: 1,
    borderColor: "#292929ff",
  },
  closeButton: {
    position: "absolute",
    bottom: "102%",
    alignSelf: "center", // Centers horizontally
    zIndex: 10,
    padding: 10,
    paddingHorizontal: 60,
    backgroundColor: "#1a1a1aff",
    borderRadius: 55,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#292929ff",
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
    elevation: 10,
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
