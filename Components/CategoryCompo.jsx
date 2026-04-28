import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useNavigation } from '@react-navigation/native';
import { Globe, KeyRound, User, UserRound, Wifi } from 'lucide-react-native';

const CategoryCompo = ({category,quantity}) => {

     const navigation = useNavigation(); 

  return (
    <View style={{width:"47%",}}>
     <TouchableOpacity onPress={() => navigation.navigate("homescreen", { category: category })} style={[styles.categoryCompoMain,{borderColor: category === "Banking"
                  ? "#8a4300"
                  : category === "Mail or ID"
                  ? "#950000"
                  : category === "Developer"
                  ? "#800053"
                  : category === "Wifi"
                  ? "#00459a"
                  : category === "Social"? "#007c42":"#008575",borderWidth:0.5,backgroundColor:category === "Banking"
                  ? "#1f0f00ff"
                  : category === "Mail or ID"
                  ? "#230000ff"
                  : category === "Developer"
                  ? "#230016ff"
                  : category === "Wifi"
                  ? "#001229ff"
                  : category === "Social"?"#001e10":"#001f1c"}]}>
        <View style={[styles.catIconandNum,{width:"100%"}]}>
            <View style={[styles.iconPill,{
              backgroundColor: category === "Banking"
                  ? "#3a1c00"
                  : category === "Mail or ID"
                  ? "#430000"
                  : category === "Developer"
                  ? "#3d0027"
                  : category === "Wifi"
                  ? "#002248"
                  : category === "Social"?"#00351c":"#003d38",
              borderWidth: 0.5,
              borderColor: category === "Banking"
                  ? "#884200"
                  : category === "Mail or ID"
                  ? "#970000"
                  : category === "Developer"
                  ? "#830055"
                  : category === "Wifi"
                  ? "#00469b"
                  : category === "Social"? "#007a41":"#008475"
            }]}>
              {category === "Banking"? <Ionicons name="card-outline" size={28} color="orange" />
                : category === "Mail or ID"? <UserRound size={27} color="red" strokeWidth={2.1} />
                : category === "Developer"? <FontAwesome6 name="code" size={25} color="#e00092" />
                : category === "Wifi"? <Wifi size={27} color="#0098ff" strokeWidth={3} />
                : category === "Social"? <Globe size={27} color="#00c76b" strokeWidth={2.2} />
                : <KeyRound size={27} color="#00cfbb" strokeWidth={2.1} />}
            </View>
            <View  style={[styles.catIconandNum,{gap:5}]}>
                <Text style={{color: category === "Banking"
                  ? "orange"
                  : category === "Mail or ID"
                  ? "red"
                  : category === "Developer"
                  ? "#e00092"
                  : category === "Wifi"
                  ? "#0098ff"
                  : category === "Social"?"#00c76b":"#00cfbb",fontSize:16,fontWeight:800}}>{quantity}</Text>
                <MaterialIcons name="arrow-forward-ios" size={20} color={category === "Banking"
                  ? "orange"
                  : category === "Mail or ID"
                  ? "red"
                  : category === "Developer"
                  ? "#e00092"
                  : category === "Wifi"
                  ? "#0098ff"
                  : category === "Social"?"#00c76b":"#00cfbb"} />

            </View>

        </View>
        <View style={[styles.titlePill, {
          backgroundColor: category === "Banking"
                  ? "#3a1c00"
                  : category === "Mail or ID"
                  ? "#430000"
                  : category === "Developer"
                  ? "#3d0027"
                  : category === "Wifi"
                  ? "#002248"
                  : category === "Social"?"#00351c":"#003d38",
          borderWidth: 0.6,
          borderColor: category === "Banking"
                  ? "#833f00"
                  : category === "Mail or ID"
                  ? "#8f0000"
                  : category === "Developer"
                  ? "#78004e"
                  : category === "Wifi"
                  ? "#004394"
                  : category === "Social"? "#00733d":"#008071"
        }]}>
            <Text style={{color:  category === "Banking"
                  ? "orange"
                  : category === "Mail or ID"
                  ? "red"
                  : category === "Developer"
                  ? "#e00092"
                  : category === "Wifi"
                  ? "#0098ff"
                  : category === "Social"?"#00c76b":"#00cfbb",fontSize:17,fontWeight:800}}>
                {category}
            </Text>
        </View>
     </TouchableOpacity>
    </View>
  )
};

const styles = StyleSheet.create({
  pickerWrapper: {
    borderRadius: 6,
    marginBottom: 20,
    overflow: "hidden",
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
  catIconandNum:{
   flexDirection:"row",
   justifyContent:"space-between",
   alignItems:"center",
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
  categoryMain: {
    width:"100%",
    flexDirection:"row",
    justifyContent:"space-between",
    alignItems:"center",
    
  },
  pickerMain: {},
  fabIcon: {
    fontSize: 17,
    color: "black",
    fontWeight: 800,
    lineHeight: 32,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.89)",
    padding: 20,
  },
  categoryCompoMain:{
    width:"100%",
    height:"auto",
    paddingHorizontal:12,
    paddingVertical:12,
    backgroundColor:"#272727",
    borderRadius:30,
    flexDirection:"column",
    gap:20
  },
  titlePill:{
    width:"100%",
    flexDirection:"row",
    justifyContent:"flex-start",
    alignItems:"center",
    paddingVertical:10,
    paddingHorizontal:18,
    borderRadius:50,
     elevation:10
  },
  iconPill:{
    paddingHorizontal:22,
    paddingVertical:5,
    borderRadius:50,
    justifyContent:"center",
    alignItems:"center",
    elevation:10
  },
  modalContent: {
    backgroundColor: "#202020ff",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 30,
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
    borderRadius: 14,
    backgroundColor: "#383838",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 30,
  },
});

export default CategoryCompo