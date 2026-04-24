import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Image,
  Dimensions,
  StatusBar,
} from "react-native";
import React, { useEffect, useState } from "react";
import AntDesign from "@expo/vector-icons/AntDesign";
import CertificateCompo from "../Components/CertificateCompo";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Entypo from "@expo/vector-icons/Entypo";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getPasswords, setSkipLock } from "../utils";
import {
  deleteAllCertificates,
  fetchCertificates,
  saveCertificate,
} from "../utilsForCertificate";
import { FlatList, ScrollView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import * as LocalAuthentication from "expo-local-authentication";
import { saveAutoLockSetting } from "../autolockService";
import { ChevronDown, Eye, EyeOff } from "lucide-react-native";
import { BlurView } from "@react-native-community/blur";

const CertificatesImages = ({
  navigation,
  onDataAdded,
  setEnableAutoLock,
  autoLockDisabled,
  enableAutoLock,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [passName, setPassName] = useState("");
  const [number, setNumber] = useState("");
  const [pickedImage, setPickedImage] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [category, setCategory] = useState("");
  const [passwords, setPasswords] = useState([]);
  const [secureEntry, setSecureEntry] = useState(true);
  const [missingFieldsModalVisible, setMissingFieldsModalVisible] =
    useState(false);
  const [firstPassAddAutoLockInfoModal, setFirstPassAddAutoLockInfoModal] =
    useState(false);
  const [deleteAllModalVisible, setDeleteAllModalVisible] = useState(false);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [authNotAvailableModal, setAuthNotAvailableModal] = useState(false);

  const categoryOptions = [
    { label: "Portrait", value: "Portrait" },
    { label: "Landscape", value: "Landscape" },
    { label: "File", value: "File" },
  ];

  const fetchPasswords = async () => {
    const stored = await getPasswords();
    setPasswords(stored);
  };

  useEffect(() => {
    handleFetchCertificates();
    fetchPasswords();
    const focusListener = navigation.addListener(
      "focus",
      handleFetchCertificates
    );
    return focusListener;
  }, [navigation]);

  const handleFetchCertificates = async () => {
    const certs = await fetchCertificates();
    setCertificates(certs);
  };

  const pickImage = async () => {
    try {
      setSkipLock(true);
      let result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: false,
        mediaTypes: ["images"],
        quality: 1,
      });

      if (result.canceled) return null;

      const localUri = result.assets[0].uri;
      const fileName = localUri.split("/").pop();
      const newPath = FileSystem.documentDirectory + fileName;

      await FileSystem.copyAsync({ from: localUri, to: newPath });

      return newPath; // Return the image path (store in local state)
    } catch (error) {
      console.error("Error picking image:", error);
      return null;
    } finally {
      setSkipLock(false);
    }
  };

  const checkFingerprintForDeleteAll = async () => {
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
      handleDeleteAll();
    }
  };

  const windowWidth = Dimensions.get("window").width;
  const windowHeight = Dimensions.get("window").height;

  const handleDeleteAll = async () => {
    const success = await deleteAllCertificates();
    handleFetchCertificates();
    setDeleteAllModalVisible(false);
    const stored = await getPasswords();
    const certs = await fetchCertificates();
    if (certs?.length + stored?.length == 0) {
      setEnableAutoLock(false);
      saveAutoLockSetting(false);
    }
    if (success) {
      Toast.show({
        type: "success",
        text1: "Deleted",
        text1Style: {
          fontSize: 15,
          fontWeight: 800,
        },
        text2: "Successfully deleted all your IDs/Certificates",
        text2Style: {
          fontSize: 13,
        },
      });
    }
  };

  const handlePickImage = async () => {
    const imagePath = await pickImage();
    if (imagePath) setPickedImage(imagePath);
  };

  const handleSave = async () => {
    if (pickedImage && passName && number && category) {
      const info = {
        name: passName,
        pinNum: number,
        category: category,
      };
      await saveCertificate(info, pickedImage);
      setModalVisible(false);
      handleFetchCertificates();
      setPassName("");
      setNumber("");
      setPickedImage("");
      setCategory("");
      if (certificates?.length + passwords?.length == 0 && !enableAutoLock) {
        setFirstPassAddAutoLockInfoModal(true);
      }
      fetchPasswords();
      handleFetchCertificates();
      // Optionally reset form
    } else {
      setMissingFieldsModalVisible(true);
    }
  };

  useEffect(() => {
    const handleDataFetch = async () => {
      const certs = await fetchCertificates();
      const stored = await getPasswords();
      if (certs?.length + stored?.length == 0) {
        setEnableAutoLock(false);
      }
    };
    handleDataFetch();
  }, [certificates, passwords]);

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
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
                  style={[styles.modalbtn, { backgroundColor: "#cfcfcf", borderWidth: 1, borderColor: "#fff" }]}
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
        visible={firstPassAddAutoLockInfoModal}
        onRequestClose={() => setFirstPassAddAutoLockInfoModal(false)}
      >
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <Text
              style={{
                color: "white",
                fontSize: 18,
                fontWeight: 800,
                paddingBottom: 20,
              }}
            >
              Auto Lock!
            </Text>
            <Text style={{ color: "white", fontSize: 16 }}>
              As you've added your first Certificate/ID in this app, now
              Autolock will be enabled immediately after closing this Popup
              which will automatically lock this app after 25 seconds (After
              every authentication). You can disable or re enable this from
              Homescreen.
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "100%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, { backgroundColor: "#383838" }]}
                  onPress={() => {
                    setEnableAutoLock(true);
                    saveAutoLockSetting(true);
                    setFirstPassAddAutoLockInfoModal(false);
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: 800, color: "red" }}>
                    Okay
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
        visible={deleteAllModalVisible}
        onRequestClose={() => setDeleteAllModalVisible(false)}
      >
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <Text style={{ color: "white", fontSize: 16 }}>
              Are you sure you want to delete all IDs/Certificates?
            </Text>
            <Text style={{ color: "red", fontSize: 16, fontWeight: 800 }}>
              This action is irreversible!
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, { backgroundColor: "#343434ff", borderWidth: 0.5, borderColor: "#525252" }]}
                  onPress={() => setDeleteAllModalVisible(false)}
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
                  style={[styles.modalbtn, { backgroundColor: "red", borderWidth: 0.5, borderColor: "#ff9999" }]}
                  onPress={checkFingerprintForDeleteAll}
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
        visible={missingFieldsModalVisible}
        onRequestClose={() => setMissingFieldsModalVisible(false)}
      >
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <Text style={{ color: "red", fontSize: 18, fontWeight: 800 }}>
              Missing fields
            </Text>
            <Text style={{ color: "white", fontSize: 16 }}>
              All fields are required!
            </Text>

            <View style={styles.buttonRow}>
              <View style={{ width: "100%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, { backgroundColor: "#383838" }]}
                  onPress={() => {
                    setMissingFieldsModalVisible(false);
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
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              onPress={() => setSecureEntry(!secureEntry)}
                 style={{
                marginBottom: 20,
                backgroundColor: "#2a2a2a",
                borderRadius: 40,
                width: 90,
                paddingVertical: 7,
                margin: "auto",
                borderWidth: 1,
                borderColor: "#3a3a3a",
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
              placeholderTextColor="#5d5d5d"
              placeholder="Name/Label"
              value={passName}
              onChangeText={setPassName}
              style={styles.input}
            />
            <TextInput
              placeholderTextColor="#5d5d5d"
              placeholder="Number"
              value={number}
              secureTextEntry={secureEntry}
              onChangeText={setNumber}
              style={styles.input}
            />
            <TouchableOpacity
              style={styles.categorySelector}
              onPress={() => setCategoryPickerVisible(true)}
            >
              <Text
                style={{
                  color: category ? "white" : "lightgrey",
                  fontSize: 16,
                }}
              >
                {category || "Select Category"}
              </Text>
              <ChevronDown size={30} color="lightgrey" strokeWidth={1.75} />
            </TouchableOpacity>

            <View style={{ width: "100%" }}>
              <TouchableOpacity
                style={[
                  styles.modalbtn,
                  { paddingVertical: 15, backgroundColor: "grey" },
                ]}
                onPress={() => handlePickImage()}
              >
                <Text style={{ fontSize: 15, fontWeight: 800, color: "white" }}>
                  Add Image
                </Text>
              </TouchableOpacity>
            </View>
            {pickedImage !== null && pickedImage !== "" ? (
              <View style={styles.imageViewMain}>
                <Image
                  source={{ uri: pickedImage }}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 35,
                    borderWidth: 3,
                    borderColor: "grey",
                  }}
                />
              </View>
            ) : null}

            <View style={styles.buttonRow}>
              <View style={{ width: "45%" }}>
                <TouchableOpacity
                  style={[styles.modalbtn, { backgroundColor: "#343434ff", borderWidth: 0.5, borderColor: "#525252" }]}
                  onPress={() => {
                    setModalVisible(false);
                    if (!autoLockDisabled) {
                      onDataAdded();
                    }
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
                  style={[styles.modalbtn, { backgroundColor: "#cfcfcf", borderWidth: 1, borderColor: "#fff" }]}
                  onPress={handleSave}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: 800, color: "black" }}
                  >
                    Save
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
        visible={categoryPickerVisible}
        onRequestClose={() => setCategoryPickerVisible(false)}
      >
        <BlurView blurType="dark" blurAmount={10} style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <Text
              style={{
                color: "white",
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
                  category === option.value && styles.categoryOptionSelected,
                ]}
                onPress={() => {
                  setCategory(option.value);
                  setCategoryPickerVisible(false);
                }}
              >
                <Text
                  style={{
                    color: category === option.value ? "white" : "lightgrey",
                    fontSize: 16,
                    fontWeight: category === option.value ? 700 : 400,
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.modalbtn,
                { marginTop: 20, backgroundColor: "#343434ff" },
              ]}
              onPress={() => setCategoryPickerVisible(false)}
            >
              <Text style={{ fontSize: 15, fontWeight: 800, color: "white" }}>
                Cancel
              </Text>
            </TouchableOpacity>
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
          height: "auto",
          paddingHorizontal: 20,
          backgroundColor: "black",
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={() => navigation.navigate("category")}>
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
            paddingHorizontal: 20,
            paddingTop: 25,
            paddingBottom: 30,
            fontSize: 30,
            color: "white",
            fontWeight: 800,
          }}
        >
          IDs/Certificates
        </Text>
      </View>

      <View style={[styles.mainHolder, { height: windowHeight * 0.85 }]}>
        {certificates?.length > 0 ? (
          <ScrollView
            style={{ height: windowHeight * 0.85, paddingHorizontal: 20 }}
          >
            {certificates?.map((item, index) => {
              return index === certificates?.length - 1 ? (
                <>
                  <CertificateCompo
                    key={index}
                    imagePath={item?.imageUri}
                    index={index}
                    categories={item?.category}
                    title={item?.name}
                  />
                  <View style={{ height: 100 }}></View>
                </>
              ) : (
                <>
                  <CertificateCompo
                    imagePath={item?.imageUri}
                    index={index}
                    categories={item?.category}
                    title={item?.name}
                    key={index}
                  />
                </>
              );
            })}
          </ScrollView>
        ) : (
          <View
            style={{
              height: windowHeight * 0.4,
              marginTop: 150,
              width: "100%",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "flex-start",
              backgroundColor: "black",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: 400, color: "lightgrey" }}>
              No IDs/Certificates added
            </Text>
          </View>
        )}
      </View>

      {certificates?.length > 0 && (
        <TouchableOpacity
          style={styles.fabFirst}
          onPress={() => setDeleteAllModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.fabIcon, { color: "white" }]}>Delete All </Text>
          <MaterialIcons name="delete" size={24} color="white" />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <Text style={[styles.fabIcon, { color: "black" }]}>Add New </Text>
        <Entypo name="plus" size={24} color="orange" />
        {/* OR using Ionicons: */}
        {/* <Ionicons name="add" size={28} color="white" /> */}
      </TouchableOpacity>
      <View style={styles.navbar}></View>
    </View>
  );
};

const styles = StyleSheet.create({
  categorySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#3d3d3d",
    marginBottom: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  categoryOption: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 50,
    marginBottom: 8,
    backgroundColor: "#2a2a2a",
    borderWidth:0.5,
    borderColor:"#434343"
  },
  categoryOptionSelected: {
    backgroundColor: "#353535ff",
    borderWidth: 1,
    borderColor: "#505050ff",
  },
  catIconandNum: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 10,
    color: "lightgrey",
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
  imageViewMain: {
    width: "100%",
    height: 200,
    marginTop: 20,
    borderRadius: 15,
  },
  footer: {
    fontSize: 16,
    marginTop: 20,
    fontWeight: "500",
    textAlign: "center",
    color: "white",
  },
  longCard: {
    width: "100%",
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 20,
    margin: "auto",
    backgroundColor: "#272727",
    gap: 30,
  },
  categoryMain: {
    width: "95%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
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
  },
  modalbtn: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 54,
    backgroundColor: "#cfcfcf",
    borderWidth: 1,
    borderColor: "#fff",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 30,
  },
  fabFirst: {
    position: "absolute",
    bottom: 50,
    left: 20,
    backgroundColor: "red",
    width: "auto",
    height: "auto",
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 53,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    flexDirection: "row",
    gap: 5,
    borderWidth: 0.5,
    borderColor: "#ff9999",
  },
  fab: {
    position: "absolute",
    bottom: 50,
    right: 20,
    backgroundColor: "#cfcfcf",
    borderWidth: 1,
    borderColor: "#fff",
    width: "auto",
    height: "auto",
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 53,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    flexDirection: "row",
  },

  mainHolder: {
    width: "100%",
    flexDirection: "column",
    justifyContent: "center",
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

export default CertificatesImages;
