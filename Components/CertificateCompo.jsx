import { View, Text, StyleSheet, TouchableOpacity, Image, Vibration } from "react-native";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useNavigation } from "@react-navigation/native";
import Feather from "@expo/vector-icons/Feather";

const CertificateCompo = ({ categories, title, index, imagePath }) => {
  const navigation = useNavigation();
  const truncateUsername = (name) => {
    return name.length > 16 ? name.slice(0, 16) + "..." : name;
  };

  return (
    <View style={styles.categoryMain}>
      <TouchableOpacity
        onLongPress={() => {
          Vibration.vibrate(20);
          navigation.navigate("certificatedet", {
            index: index,
            categories: categories,
          });
        }}
        onPress={() =>
          navigation.navigate("certificatedet", {
            index: index,
            categories: categories,
          })
        }
        style={styles.longCard}
      >
        <Image source={{ uri: imagePath }} style={styles.image} />
        <View
          style={{
            width: "75%",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <View
            style={[styles.catIconandNum, { justifyContent: "flex-start" }]}
          >
            <Text style={{ color: "white", fontSize: 18, fontWeight: 800 }}>
              {truncateUsername(title)}
            </Text>
          </View>
          <View style={[styles.catIconandNum]}>
            <View style={styles.categoryPill}>
              {categories == "Landscape" ? (
                <FontAwesome6 name="vcard" size={20} color="#6ac3dcff" />
              ) : categories == "Portrait" ? (
                <Ionicons name="id-card-outline" size={22} color="#6bc499ff" />
              ) : (
                <Feather name="file-text" size={22} color="#b59769ff" />
              )}
            </View>

            <View style={[styles.catIconandNum, { gap: 10 }]}>
              <MaterialIcons name="arrow-forward-ios" size={20} color="white" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  pickerWrapper: {
    borderRadius: 6,
    marginBottom: 20,
    overflow: "hidden",
  },
  catIconandNum: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  image: {
    height: 60,
    width: 60,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#c3c3c3ff",
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

  footer: {
    fontSize: 16,
    marginTop: 20,
    fontWeight: "500",
    textAlign: "center",
    color: "white",
  },
  picker: {
    color: "lightgrey", // for dark mode
    backgroundColor: "#282828",
    height: 65,
  },
  longCard: {
    width: "100%",
    borderRadius: 55,
    paddingHorizontal: 15,
    paddingVertical: 15,
    margin: "auto",
    backgroundColor: "#1c1c1c",
    gap: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#242424ff",
  },
  categoryPill: {
    paddingHorizontal: 25,
    paddingVertical: 8,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2c2c2c",
    borderWidth: 1,
    borderColor: "#363636",
  },
  categoryMain: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 13,
    alignSelf: "center",
  },
  pickerMain: {},
  fabIcon: {
    fontSize: 17,
    color: "white",
    fontWeight: 800,
    lineHeight: 32,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.89)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#202020ff",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 30,
    elevation: 5,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: "#505050",
    marginBottom: 15,
    fontSize: 16,
    paddingVertical: 8,
    color: "white",
  },
  modalbtn: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: "white",
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
    left: 10,
    backgroundColor: "#383838",
    width: "auto",
    height: "auto",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    flexDirection: "row",
    gap: 10,
  },
  fab: {
    position: "absolute",
    bottom: 50,
    right: 10,
    backgroundColor: "#383838",
    width: "auto",
    height: "auto",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    flexDirection: "row",
  },
  fabIcon: {
    fontSize: 20,
    color: "black",
    fontWeight: 800,
    lineHeight: 32,
  },
});

export default CertificateCompo;
