import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { listInstalledApps } from "../Services/autofill";

const AppPickerSheet = ({ visible, onClose, onPick, existingPackages = [] }) => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!visible) return;
    setQuery("");
    let cancelled = false;
    (async () => {
      setLoading(true);
      const list = await listInstalledApps();
      if (cancelled) return;
      setApps(list);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter(
      (a) =>
        (a.label || "").toLowerCase().includes(q) ||
        (a.packageName || "").toLowerCase().includes(q)
    );
  }, [apps, query]);

  const renderItem = ({ item }) => {
    const alreadyAdded = existingPackages
      .map((p) => p.toLowerCase())
      .includes((item.packageName || "").toLowerCase());
    return (
      <TouchableOpacity
        style={[styles.row, alreadyAdded && { opacity: 0.45 }]}
        activeOpacity={0.7}
        disabled={alreadyAdded}
        onPress={() => {
          onPick(item.packageName);
          onClose();
        }}
      >
        {item.iconBase64 ? (
          <Image
            source={{ uri: `data:image/png;base64,${item.iconBase64}` }}
            style={styles.icon}
          />
        ) : (
          <View style={[styles.icon, styles.iconFallback]}>
            <Text style={styles.iconFallbackText}>
              {(item.label || "?").charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.label || item.packageName}
          </Text>
          <Text style={styles.rowPkg} numberOfLines={1}>
            {item.packageName}
          </Text>
        </View>
        {alreadyAdded ? (
          <Ionicons name="checkmark-circle" size={30} color="#00ff88" />
        ) : (
          <Ionicons name="add" size={28} color="lightgrey" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.dismissArea}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Link an app</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={22} color="lightgrey" />
            </TouchableOpacity>
          </View>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color="#7a7a7a" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search installed apps"
              placeholderTextColor="#7a7a7a"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator color="#00c787" />
              <Text style={styles.loaderText}>Loading installed apps…</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.packageName}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No matching apps.</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: "#171717",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    maxHeight: "80%",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#2c2c2c",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#555",
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  title: {
    color: "white",
    fontSize: 19,
    fontWeight: "800",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#2c2c2c",
    borderWidth: 1,
    borderColor: "#363636",
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: "white",
    fontSize: 14,
    padding: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#272727",
    borderWidth: 1,
    borderColor: "#242424",
    borderRadius: 52,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 50,
    backgroundColor: "#4f4f4f",
  },
  iconFallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  iconFallbackText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
  },
  rowTitle: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  rowPkg: {
    color: "#7a7a7a",
    fontSize: 11,
    marginTop: 2,
  },
  loader: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loaderText: {
    color: "lightgrey",
    fontSize: 13,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#7a7a7a",
    fontSize: 13,
  },
});

export default AppPickerSheet;
