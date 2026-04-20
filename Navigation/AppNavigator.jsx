import React, { useEffect, useRef, useState } from "react";
import {
  createStackNavigator,
  TransitionPresets,
} from "@react-navigation/stack";
import Lockscreen from "../Screens/Lockscreen";
import Homescreen from "../Screens/Homescreen";
import PasswordDetails from "../Screens/PasswordDetails";
import { AppState } from "react-native";
import CategoryScreen from "../Screens/CategoryScreen";
import CertificatesImages from "../Screens/CertificatesImages";
import CertificateDetails from "../Screens/CertificateDetails";
import * as SecureStore from 'expo-secure-store';
import { skipLock, STORAGE_KEY } from "../utils";
import { CERT_INFO_KEY } from "../utilsForCertificate";
import Settings from "../Screens/Settings";
import { loadAutoLockSetting } from "../autolockService";



const AppNavigator = () => {
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [timeoutForLock,setTimeoutForLock] = useState(1*1000);
  const [enableAutoLock, setEnableAutoLock] = useState(false);
  const [autoLockDisabled,setautoLockDisabled] = useState(false);

  const TIMEOUT = 1 * 1000; // 1 second
  const lockTimeOut = 25 * 1000;
  const lockTimerRef = useRef(null);

  const checkUserData = async () => {
    try {
      const passwords = await SecureStore.getItemAsync(STORAGE_KEY);
      const certificates = await SecureStore.getItemAsync(CERT_INFO_KEY);
      const passwordArray = passwords ? JSON.parse(passwords) : [];
      const certificateArray = certificates ? JSON.parse(certificates) : [];

      if (passwordArray.length === 0 && certificateArray.length === 0) {
        setEnableAutoLock(false);
      } else {
        setEnableAutoLock(true);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const startLockTimer = () => {
    if (!enableAutoLock) return;
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    lockTimerRef.current = setTimeout(() => {
      setIsAuthenticated(false);
    }, lockTimeOut);
  };

 useEffect(() => {
  const checkAutoLock = async () => {
    const isEnabled = await loadAutoLockSetting();
    setEnableAutoLock(isEnabled);
  };

  checkAutoLock();
}, [enableAutoLock]);

  useEffect(() => {
    if (isAuthenticated && enableAutoLock) {
      startLockTimer();
    } else {
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    }
  }, [isAuthenticated, enableAutoLock]);

  const onDataAdded = () => {
    setEnableAutoLock(true); // Enable auto lock immediately after first data
  };



  useEffect(() => {
    checkUserData();
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (skipLock) {
        appState.current = nextState; // Still update current state
        return;
      }
  
      if (appState.current === 'active' && nextState === 'background') {
        backgroundTime.current = Date.now();
      }
  
      if (
        appState.current.match(/background|inactive/) &&
        nextState === 'active'
      ) {
        const now = Date.now();
        if (backgroundTime.current && now - backgroundTime.current > timeoutForLock) {
          setIsAuthenticated(false); // Lock again
        }
      }
  
      appState.current = nextState;
    });
  
    return () => subscription.remove();
  }, []);

  const Stack = createStackNavigator();
  return (
    <Stack.Navigator
      screenOptions={{
        animation:"fade"
      }}
      initialRouteName="lockscreen"
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen
            name="category"
            options={{ headerShown: false, animation: "fade" }}
          >
            {(props) => (
              <CategoryScreen
                {...props}
                setIsAuthenticated={setIsAuthenticated} // pass it here
                setEnableAutoLock={setEnableAutoLock}
                enableAutoLock={enableAutoLock}
                setautoLockDisabled={setautoLockDisabled}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="homescreen" options={{ headerShown: false }}>
            {(props) => (
              <Homescreen
                {...props}
                onDataAdded={onDataAdded}
                setEnableAutoLock={setEnableAutoLock}
                autoLockDisabled={autoLockDisabled}
                 enableAutoLock={enableAutoLock}
              />
            )}
          </Stack.Screen>
           <Stack.Screen name="settings" options={{ headerShown: false }}>
            {(props) => (
              <Settings
                {...props}
                onDataAdded={onDataAdded}
                setEnableAutoLock={setEnableAutoLock}
                autoLockDisabled={autoLockDisabled}
                setautoLockDisabled={setautoLockDisabled}
                enableAutoLock={enableAutoLock}
              />
            )}
          </Stack.Screen>
           <Stack.Screen name="certificate"
            options={{ headerShown: false, animation: "fade" }}>
               {(props) => (
              <CertificatesImages
                {...props}
                onDataAdded={onDataAdded}
                setEnableAutoLock={setEnableAutoLock}
                autoLockDisabled={autoLockDisabled}
                enableAutoLock={enableAutoLock}
              />
            )}
           </Stack.Screen>
           <Stack.Screen
            name="certificatedet"
            component={CertificateDetails}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="passdetails"
            component={PasswordDetails}
            options={{
              headerShown: false,
            }}
          />
        </>
      ) : (
        <Stack.Screen
          options={{
            headerShown: false,
          }}
          name="lockscreen"
        >
          {(props) => (
            <Lockscreen
              {...props}
              onAuthenticated={() => setIsAuthenticated(true)}
            />
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
