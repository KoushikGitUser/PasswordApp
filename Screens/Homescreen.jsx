import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Dimensions,
  StatusBar,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { BackHandler, Platform } from "react-native";
import PasswordCard from "../Components/PasswordCard";
import Entypo from "@expo/vector-icons/Entypo";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  clearPasswords,
  deletePasswordsByCategory,
  getPasswords,
  savePassword,
} from "../utils";
import { ScrollView } from "react-native-gesture-handler";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { triggerToast } from "../Services/toast";
import AntDesign from "@expo/vector-icons/AntDesign";
import * as LocalAuthentication from "expo-local-authentication";
import { saveAutoLockSetting } from "../autolockService";
import { ChevronDown, Eye, EyeOff, Search } from "lucide-react-native";
import { BlurView } from "@react-native-community/blur";
import { useTheme } from "../theme/ThemeContext";
import { getButtonStyles } from "../styles/buttonStyles";

const Homescreen = ({
  navigation,
  route,
  onDataAdded,
  setEnableAutoLock,
  autoLockDisabled,
  enableAutoLock,
}) => {
  const { colors, isDark } = useTheme();
  const dynamicButtons = getButtonStyles(colors);

  const categories = route?.params?.category;

  const [passwords, setPasswords] = useState([]);
  const [passwordsForIndex, setPasswordsForIndex] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [username, setUsername] = useState("");
  const [passName, setPassName] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [category, setCategory] = useState("");
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPasswords, setFilteredPasswords] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteAllModalVisible, setDeleteAllModalVisible] = useState(false);
  const [exitAppModalVisible, setExitAppModalVisible] = useState(false);
  const [missingFieldsModalVisible, setMissingFieldsModalVisible] =
    useState(false);
  const [firstPassAddAutoLockInfoModal, setFirstPassAddAutoLockInfoModal] =
    useState(false);
  const [secureEntry, setSecureEntry] = useState(true);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [authNotAvailableModal, setAuthNotAvailableModal] = useState(false);

  const categoryOptions = [
    { label: "Banking", value: "Banking" },
    { label: "Mail or ID", value: "Mail or ID" },
    { label: "Developer", value: "Developer" },
    { label: "Social", value: "Social" },
    { label: "Wifi", value: "Wifi" },
  ];

  const windowWidth = Dimensions.get("window").width;
  const windowHeight = Dimensions.get("window").height;

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
      handleClearAll();
    }
  };

  useEffect(() => {
    if (searchQuery == "") {
      setFilteredPasswords(passwords); // show all if empty
    } else {
      const filtered = passwords.filter((item) =>
        item.passName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPasswords(filtered);
    }
  }, [searchQuery, passwords]);

  useEffect(() => {
    const fetchData = async () => {
      // Delay fetching to allow navigation animation to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      const stored = await getPasswords();
      setPasswords(stored);
      setPasswordsForIndex(stored);
      if (categories !== "All") {
        setCategory(categories);
      }
    };
    const focusListener = navigation.addListener("focus", fetchData);
    return focusListener;
  }, [navigation]);

  const fetchPasswords = async () => {
    const stored = await getPasswords();
    setPasswords(stored);
    setPasswordsForIndex(stored);
    if (categories !== "All") {
      setCategory(categories);
    }
  };

  const categoryCounts = passwords.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  const handleClearAll = async () => {
    if (categories == "All") {
      await clearPasswords();
      await fetchPasswords(); // Reflect changes immediately
      setDeleteAllModalVisible(false);
      const stored = await getPasswords();
      if (stored?.length == 0) {
        setEnableAutoLock(false);
        saveAutoLockSetting(false);
      }
    } else {
      await deletePasswordsByCategory(categories);
      await fetchPasswords(); // Reflect changes immediately
      setDeleteAllModalVisible(false);
      const stored = await getPasswords();
      if (stored?.length == 0) {
        setEnableAutoLock(false);
        saveAutoLockSetting(false);
      }
    }

    triggerToast(
      "Deleted",
      categories == "All"
        ? "Successfully deleted all your passwords"
        : `Successfully deleted all ${categories} passwords`,
      "success",
      4000
    );
  };

  useEffect(() => {
    const handleDataFetch = async () => {
      const stored = await getPasswords();
      if (stored?.length == 0) {
        setEnableAutoLock(false);
      }
    };
    handleDataFetch();
  }, [passwords]);

  const returnSearchBarOrDeleteButton = () => {
    if (categories == "All") {
      if (passwords?.length === 0) {
        return false;
      } else {
        return true;
      }
    } else {
      if (categoryCounts[categories] !== undefined) {
        return true;
      } else {
        return false;
      }
    }
  };

  useEffect(() => {
    const backAction = () => {
      setExitAppModalVisible(true);
      return true; // prevent default behavior (exit)
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove(); // clean up
  }, [exitAppModalVisible]);

  const getPasswordIndex = (passName) => {
    const index = passwords.findIndex((item) => item.passName === passName);
    return index;
  };

  const handleAdd = async () => {
    if (
      !passName ||
      !username ||
      !password ||
      !category ||
      (category === "Banking" && !pin)
    ) {
      setMissingFieldsModalVisible(true);
      return;
    }

    await savePassword({ passName, username, password, category, pin });
    triggerToast("Added", "Password added successfully", "success", 4000);
    setPassName("");
    setUsername("");
    setPassword("");
    setCategory("");
    setPin("");
    setModalVisible(false);
    if (passwords?.length == 0 && !enableAutoLock) {
      setFirstPassAddAutoLockInfoModal(true);
    }
    fetchPasswords();
  };

  const handleToggleEye = () => {
    setSecureEntry(false);
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
              Your device does not have any authentication method set up. Please set up a PIN, password, or biometric authentication in your device settings.
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
        visible={firstPassAddAutoLockInfoModal}
        onRequestClose={() => setFirstPassAddAutoLockInfoModal(false)}
      >
        <BlurView blurType={colors.blurTint} blurAmount={10} style={styles.blurContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBackground, borderColor: colors.border }]}>
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: 800,
                paddingBottom: 20,
              }}
            >
              Auto Lock!
            </Text>
            <Text style={{ color: colors.text, fontSize: 16 }}>
              As you've added your first password in this app, now Autolock will
              be enabled immediately after closing this Popup which will
              automatically lock this app after 25 seconds (After every
              authentication). You can disable or re enable this
              from Homescreen.
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "100%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, dynamicButtons.whiteButton]}
                  onPress={() => {
                    setEnableAutoLock(true);
                    saveAutoLockSetting(true);
                    setFirstPassAddAutoLockInfoModal(false);
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: 800, color: colors.whiteButtonText }}>
                    Okay
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
        visible={missingFieldsModalVisible}
        onRequestClose={() => setMissingFieldsModalVisible(false)}
      >
        <BlurView blurType={colors.blurTint} blurAmount={10} style={styles.blurContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBackground, borderColor: colors.border }]}>
            <Text style={{ color: colors.error, fontSize: 18, fontWeight: 800 }}>
              Missing fields
            </Text>
            <Text style={{ color: colors.text, fontSize: 16 }}>
              All fields are required!
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "100%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn,dynamicButtons.cancelButton]}
                  onPress={() => {
                    setMissingFieldsModalVisible(false);
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
        visible={exitAppModalVisible}
        onRequestClose={() => setExitAppModalVisible(false)}
      >
        <BlurView blurType={colors.blurTint} blurAmount={10} style={styles.blurContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBackground, borderColor: colors.border }]}>
            <Text style={{ color:isDark? "white":"black", fontSize: 18, fontWeight: 800,marginLeft:8 }}>
              Exit App
            </Text>
            <Text style={{ color:isDark? "white":"black", fontSize: 16,marginLeft:8 }}>
              Are you sure you want to exit?
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, dynamicButtons.cancelButton]}
                  onPress={() => setExitAppModalVisible(false)}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color:isDark? "white":"black"}}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: "45%" }}>
                <TouchableOpacity   
                  style={[styles.modalbtn, dynamicButtons.redButton]}
                  onPress={() => {
                    BackHandler.exitApp();
                    setExitAppModalVisible(false);
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: 800, color: colors.redButtonText }}>
                    Exit
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
        visible={deleteAllModalVisible}
        onRequestClose={() => setDeleteAllModalVisible(false)}
      >
        <BlurView
          intensity={40}
          tint={isDark ? "dark" : "light"}
          overlayColor={isDark ? "#0000007f" : "#8d8d8d4d"}
          style={styles.blurContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.modalBackground, borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontSize: 16, marginLeft: 2 }}>
              Are you sure you want to delete all{" "}
              {categories == "All" ? "your" : categories} passwords?
            </Text>
            <Text style={{ color: colors.error, fontSize: 16, fontWeight: 800, marginLeft: 2 }}>
              This action is irreversible!
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn,dynamicButtons.cancelButton]}
                  onPress={() => setDeleteAllModalVisible(false)}
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
                  onPress={checkFingerprint}
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
        <BlurView blurType={colors.blurTint} blurAmount={10} style={styles.blurContainer}>
          <View style={[styles.modalContent, { backgroundColor:isDark? colors.modalBackground:"#f3f3f3", borderColor: colors.border }]}>
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
              placeholder={
                categories == "Banking"
                  ? "Username/Card No."
                  : categories == "Mail or ID"
                  ? categories
                  : categories == "Social"
                  ? "Username"
                  : categories == "Developer"
                  ? "Username"
                  : categories == "Wifi"
                  ? "Wifi Name"
                  : "Username / Card No. / ID / Wifi-Name"
              }
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
            {category == "Banking" ? (
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
            ) : null}
            {categories == "All" && (
              <TouchableOpacity
                style={[styles.categorySelector, {
                  backgroundColor: colors.inputBackground,
                  borderWidth: 1,
                  borderColor: colors.inputBorder,
                    shadowColor:isDark?"black":"#969696",
            borderWidth:isDark?1:0.5,
                }]}
                onPress={() => setCategoryPickerVisible(true)}
              >
                <Text
                  style={{
                    color: category ? colors.text : colors.textSecondary,
                    fontSize: 16,
                  }}
                >
                  {category || "Select Category"}
                </Text>
                <ChevronDown size={30} color={colors.textSecondary} strokeWidth={1.75} />
              </TouchableOpacity>
            )}

            <View style={styles.buttonRow}>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, dynamicButtons.cancelButton]}
                  onPress={() => {
                    setModalVisible(false);
                    setSecureEntry(true);
                    if (!autoLockDisabled) {
                      onDataAdded();
                    }
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
                  style={[styles.modalbtn, dynamicButtons.whiteButton]}
                  onPress={handleAdd}
                >
                  <Text style={{ fontSize: 15, fontWeight: 800, color: colors.whiteButtonText }}>
                    Save
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
        visible={categoryPickerVisible}
        onRequestClose={() => setCategoryPickerVisible(false)}
      >
        <BlurView blurType={colors.blurTint} blurAmount={10} style={styles.blurContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBackground, borderColor: colors.border }]}>
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: 800,
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              Select Category
            </Text>
            {categoryOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.categoryOption,
                  { backgroundColor: colors.surface, borderColor: colors.border, shadowColor:isDark?"black":"#969696",
            borderWidth:isDark?1:0.5,  },
                  category === option.value && [
                    styles.categoryOptionSelected,
                    {
                      backgroundColor: isDark ? "#353535" : "#e0e0e0",
                      borderColor: isDark ? "#505050" : "#b0b0b0",
                      shadowColor:isDark?"black":"#969696",
            borderWidth:isDark?1:0.5,
                    }
                  ],
                ]}
                onPress={() => {
                  setCategory(option.value);
                  setCategoryPickerVisible(false);
                }}
              >
                <Text
                  style={{
                    color: category === option.value ? colors.text : colors.textSecondary,
                    fontSize: 16,
                    fontWeight: category === option.value ? 700 : 400,
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.modalbtn,dynamicButtons.cancelButton, { marginTop: 20 }]}
              onPress={() => setCategoryPickerVisible(false)}
            >
              <Text style={{ fontSize: 15, fontWeight: 800, color: colors.cancelButtonText }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
      <Modal
        animationType="fade"
        transparent
        visible={infoModalVisible}
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <BlurView blurType={colors.blurTint} blurAmount={10} style={styles.blurContainer}>
          <View style={[styles.modalContent]}>
            <ScrollView style={{ maxHeight: 400 }}>
              <Text
                style={[styles.paragraph, { color: "white", fontWeight: 800 }]}
              >
                👋 Welcome to your Personal Password Vault!
              </Text>

              <Text style={[styles.sectionTitle, { color: colors.text }]}>🔐 Security First</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                Your passwords are stored securely using Android's native vault
                storage system with hardware-backed encryption. This means your passwords
                are encrypted at the device level and protected by your device's secure
                enclave. Nothing is stored online or synced — only you can access your
                saved passwords on this device. If you uninstall this app then you will
                lose all your saved passwords.
              </Text>

              <Text style={[styles.sectionTitle, { color: colors.text }]}>➕ How to Add Passwords</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                On the Home screen, tap the white floating Add Pass button. A
                modal will appear where you can enter Passname, Username,
                Password, and Category. Tap Save to store it securely.
              </Text>

              <Text style={[styles.sectionTitle, { color: colors.text }]}>📂 Categories & Colors</Text>
              <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                Use categories to organize your saved passwords. Each has a
                color and a dedicated icon for the same to recognise:
              </Text>
              <Text style={[styles.bullet, { color: colors.textSecondary }]}>
                🟠 Banking – Credit cards, banking logins
              </Text>
              <Text style={[styles.bullet, { color: colors.textSecondary }]}>
                🔴 Mail or ID – Gmail, Aadhaar, personal accounts
              </Text>
              <Text style={[styles.bullet, { color: colors.textSecondary }]}>
                🟢 Social – Facebook, Instagram, Snapchat
              </Text>
              <Text style={[styles.bullet, { color: colors.textSecondary }]}>
                🟣 Developer – GitHub, Firebase, etc.
              </Text>
              <Text style={[styles.bullet, { color: colors.textSecondary }]}>
                🔵 Wi-Fi – Home or office Wi-Fi credentials
              </Text>

              <Text style={[styles.tip, { color: colors.textSecondary }]}>
                💡 Tip: Tap any password card to view, edit, or delete it.
              </Text>

              <Text style={[styles.footer, { color: colors.text }]}>
                We hope this app makes your digital life safer and easier!
              </Text>
            </ScrollView>

            <View style={[styles.buttonRow, { justifyContent: "center" }]}>
              <View style={{ width: "100%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, dynamicButtons.cancelButton]}
                  onPress={() => setInfoModalVisible(false)}
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
      <StatusBar backgroundColor={colors.background} barStyle={isDark?"light-content":"dark-content"} />
      <View style={[styles.statusbar,{height:StatusBar.currentHeight,backgroundColor:colors.background}]}>
      </View>
      <View
        style={{
          width: "100%",
          height: "auto",
          paddingHorizontal: 20,
          backgroundColor: colors.background,
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={() => navigation.navigate("category")}>
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
            paddingHorizontal: 20,
            paddingTop: 25,
            paddingBottom: 30,
            fontSize: 30,
            color: colors.text,
            fontWeight: 800,
          }}
        >
          {categories}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "flex-start",
          flex:1,
          backgroundColor: colors.background,
        }}
      >
        {!returnSearchBarOrDeleteButton() ? (
          <View
            style={{
              height: windowHeight * 0.4,
              marginTop: 150,
              width: "100%",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "flex-start",
              backgroundColor: colors.background,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: 400, color: colors.textSecondary }}>
              No passwords added
            </Text>
          </View>
        ) : (
          <View
            style={{
              flex: 1,
              width: "100%",
              backgroundColor: colors.background,
              paddingHorizontal: 0
            }}
          >
            {returnSearchBarOrDeleteButton() && (
              <View style={[styles.searchmain, {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                shadowColor:isDark?"black":"#969696"
              }]}>
                <Search color={colors.textTertiary} style={{marginRight:10}} />
                <TextInput
                  placeholderTextColor={colors.inputPlaceholder}
                  placeholder="Search your password"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={[styles.searchpass, { color: colors.inputText }]}
                />
                {searchQuery !== "" && (
                  <AntDesign
                    name="closecircle"
                    onPress={() => setSearchQuery("")}
                    size={24}
                    color={colors.textSecondary}
                  />
                )}
              </View>
            )} 

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, width: "100%", paddingTop: 10, borderTopRightRadius: 35, borderTopLeftRadius: 35, backgroundColor: colors.background }}>
              {filteredPasswords?.map((item, index) => {
                return categories !== "All" ? (
                  item?.category == categories ? (
                    index === passwords?.length - 1 ? (
                      <>
                        <PasswordCard
                          key={index}
                          index={getPasswordIndex(item?.passName)}
                          headCategory={categories}
                          passName={item?.passName}
                          category={item?.category}
                          password={item?.password}
                          userName={item?.username}
                        />
                        <View style={{ height: 150 }}></View>
                      </>
                    ) : (
                      <PasswordCard
                        key={index}
                        index={getPasswordIndex(item?.passName)}
                        headCategory={categories}
                        passName={item?.passName}
                        category={item?.category}
                        password={item?.password}
                        userName={item?.username}
                      />
                    )
                  ) : null
                ) : index == passwords?.length - 1 ? (
                  <>
                    <PasswordCard
                      key={index}
                      index={getPasswordIndex(item?.passName)}
                      headCategory={categories}
                      passName={item?.passName}
                      category={item?.category}
                      password={item?.password}
                      userName={item?.username}
                    />
                    <View style={{ height: 150 }}></View>
                  </>
                ) : (
                  <PasswordCard
                    key={index}
                    index={getPasswordIndex(item?.passName)}
                    headCategory={categories}
                    passName={item?.passName}
                    category={item?.category}
                    password={item?.password}
                    userName={item?.username}
                  />
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
      {returnSearchBarOrDeleteButton() && (
        <TouchableOpacity
          style={[styles.fabFirst,dynamicButtons.redButton]}
          onPress={() => setDeleteAllModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.fabIcon, { color: "white" }]}>Delete All </Text>
          <MaterialIcons name="delete" size={21} color="white" />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.fab,dynamicButtons.whiteButton,{}]}
        onPress={() => {
          setModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <Text style={[styles.fabIcon,{color:isDark?"black":"white"}]}>Add New </Text>
        <Entypo name="plus" size={24} color="orange" />
        {/* OR using Ionicons: */}
        {/* <Ionicons name="add" size={28} color="white" /> */}
      </TouchableOpacity>
    </View>
  );
};
const screenwidth = Dimensions.get("window").width
const styles = StyleSheet.create({
  main: {
    width: "95%",
    margin: "auto",
    backgroundColor: "white",
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 10,
    elevation: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  categorySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 50,
    marginBottom: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 10
  },
  categoryOption: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 50,
    marginBottom: 8,
    backgroundColor: "#2a2a2a",
        borderWidth: 1,
    borderColor: "#3d3d3d",
    elevation:10
  },
  categoryOptionSelected: {
    borderWidth: 1,
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 10,
    color: "lightgrey",
  },
  scrollView: {
    height: "100%",
    width: "100%",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 5,
    color: "white",
  },
  searchpass: {
    width: "80%",
    color: "white",
    marginRight:"auto"
  },
  bullet: {
    fontSize: 16,
    marginLeft: 10,
    marginBottom: 5,
    color: "lightgrey",
  },
  tip: {
    fontSize: 16,
    marginTop: 15,
    fontStyle: "italic",
    color: "lightgrey",
  },
  searchmain: {
    width: screenwidth - 40,
    margin: "auto",
    marginBottom: 20,
    height: 50,
    backgroundColor: "#2a2a2a",
    borderRadius: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    borderWidth:0.5,
    borderColor:"#797979",
    elevation:10
  },
  footer: {
    fontSize: 16,
    marginTop: 20,
    fontWeight: "500",
    textAlign: "center",
    color: "white",
  },
  fab: {
    position: "absolute",
    bottom: 60,
    right: 20,
    backgroundColor: "#cfcfcf",
    borderWidth:1,
    borderColor:"#fff",
    elevation:10,
    shadowColor:"white",
    width: "auto",
    height: "auto",
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    flexDirection: "row",
  },
  fabFirst: {
    position: "absolute",
    bottom: 60,
    left: 20,
    width: "auto",
    height: "auto",
    paddingHorizontal: 25,
    elevation: 10,
    shadowColor: "red",
    paddingVertical: 15,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    flexDirection: "row",
    borderWidth: 0.5,
    borderColor: "#ff9999",
  },
  pickerMain: {},
  fabIcon: {
    fontSize: 17,
    color: "black",
    fontWeight: 800,
    lineHeight: 32,
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
  modalContent: {
    backgroundColor: "#202020ff",
    borderRadius: 40,
    paddingHorizontal: 20,
    paddingVertical: 20,
    elevation: 5,
    borderWidth: 0.5,
    borderColor: "#3d3d3d",
  },
  input: {
    backgroundColor: "#2a2a2a",
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#3d3d3d",
    marginBottom: 15,
    fontSize: 16,
    paddingVertical: 15,
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
    backgroundColor: "#343434ff",

  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 30,
  },
  statusbar:{
    width:"100%",
    backgroundColor:"red"
  },

});

export default Homescreen;
