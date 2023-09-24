import {
  CameraRoll,
  PhotoIdentifier,
} from '@react-native-camera-roll/camera-roll';
import React, {useCallback, useEffect, useState} from 'react';
import {
  Alert,
  FlatList,
  Image,
  Linking,
  Platform,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import Permissions, {PERMISSIONS} from 'react-native-permissions';
import {ShimmerView} from './src/components';

const App: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [photos, setPhotos] = useState<PhotoIdentifier[]>([]);

  const openSettingsAlert = useCallback(({title}: {title: string}) => {
    Alert.alert(title, '', [
      {
        isPreferred: true,
        style: 'default',
        text: 'Open Settings',
        onPress: () => Linking?.openSettings(),
      },
      {
        isPreferred: false,
        style: 'destructive',
        text: 'Cancel',
        onPress: () => {},
      },
    ]);
  }, []);

  const checkAndroidPermissions = useCallback(async () => {
    if (parseInt(Platform.Version as string, 10) >= 33) {
      const permissions = await Permissions.checkMultiple([
        PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
        PERMISSIONS.ANDROID.READ_MEDIA_VIDEO,
      ]);
      if (
        permissions[PERMISSIONS.ANDROID.READ_MEDIA_IMAGES] ===
          Permissions.RESULTS.GRANTED &&
        permissions[PERMISSIONS.ANDROID.READ_MEDIA_VIDEO] ===
          Permissions.RESULTS.GRANTED
      ) {
        setHasPermission(true);
        return;
      }
      const res = await Permissions.requestMultiple([
        PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
        PERMISSIONS.ANDROID.READ_MEDIA_VIDEO,
      ]);
      if (
        res[PERMISSIONS.ANDROID.READ_MEDIA_IMAGES] ===
          Permissions.RESULTS.GRANTED &&
        res[PERMISSIONS.ANDROID.READ_MEDIA_VIDEO] ===
          Permissions.RESULTS.GRANTED
      ) {
        setHasPermission(true);
      }
      if (
        res[PERMISSIONS.ANDROID.READ_MEDIA_IMAGES] ===
          Permissions.RESULTS.DENIED ||
        res[PERMISSIONS.ANDROID.READ_MEDIA_VIDEO] === Permissions.RESULTS.DENIED
      ) {
        checkAndroidPermissions();
      }
      if (
        res[PERMISSIONS.ANDROID.READ_MEDIA_IMAGES] ===
          Permissions.RESULTS.BLOCKED ||
        res[PERMISSIONS.ANDROID.READ_MEDIA_VIDEO] ===
          Permissions.RESULTS.BLOCKED
      ) {
        openSettingsAlert({
          title: 'Please allow access to your photos and videos from settings',
        });
      }
    } else {
      const permission = await Permissions.check(
        PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
      );
      if (permission === Permissions.RESULTS.GRANTED) {
        setHasPermission(true);
        return;
      }
      const res = await Permissions.request(
        PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
      );
      if (res === Permissions.RESULTS.GRANTED) {
        setHasPermission(true);
      }
      if (res === Permissions.RESULTS.DENIED) {
        checkAndroidPermissions();
      }
      if (res === Permissions.RESULTS.BLOCKED) {
        openSettingsAlert({
          title: 'Please allow access to the photo library from settings',
        });
      }
    }
  }, [openSettingsAlert]);

  const checkPermission = useCallback(async () => {
    if (Platform.OS === 'ios') {
      const permission = await Permissions.check(PERMISSIONS.IOS.PHOTO_LIBRARY);
      if (
        permission === Permissions.RESULTS.GRANTED ||
        permission === Permissions.RESULTS.LIMITED
      ) {
        setHasPermission(true);
        return;
      }
      const res = await Permissions.request(PERMISSIONS.IOS.PHOTO_LIBRARY);
      if (
        res === Permissions.RESULTS.GRANTED ||
        res === Permissions.RESULTS.LIMITED
      ) {
        setHasPermission(true);
      }
      if (res === Permissions.RESULTS.BLOCKED) {
        openSettingsAlert({
          title: 'Please allow access to the photo library from settings',
        });
      }
    } else if (Platform.OS === 'android') {
      checkAndroidPermissions();
    }
  }, [checkAndroidPermissions, openSettingsAlert]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  const fetchPhotos = useCallback(async () => {
    const res = await CameraRoll.getPhotos({
      first: 10,
      assetType: 'Photos',
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    setPhotos(res?.edges);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (hasPermission) {
      fetchPhotos();
    }
  }, [hasPermission, fetchPhotos]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const savePhoto = useCallback(() => {
    Alert.alert('Do you want to save this image?', '', [
      {
        isPreferred: true,
        text: 'Yes',
        onPress: async () => {
          const res = await CameraRoll.save(
            'https://fastly.picsum.photos/id/400/2440/1400.jpg?hmac=qSYbRbCQhkj1aMCy6AEHbsrcbXalaPHr6hPCPdxlO5o',
          );
          console.log(res);
          if (res) {
            Alert.alert('Image saved');
          }
        },
        style: 'default',
      },
      {
        isPreferred: false,
        text: 'No',
        onPress: () => {},
        style: 'destructive',
      },
    ]);
  }, []);

  return (
    <SafeAreaView>
      <FlatList
        numColumns={3}
        data={isLoading ? Array(15).fill('') : photos}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({item, index}) => {
          if (isLoading) {
            return (
              <ShimmerView key={index} delay={index * 100} width={'33%'} />
            );
          }
          return (
            <Image
              key={item?.node?.image?.uri}
              source={{uri: item?.node?.image?.uri}}
              height={140}
              style={styles.image}
            />
          );
        }}
        style={styles.list}
      />
      {/* <TouchableOpacity activeOpacity={0.8} onLongPress={savePhoto}>
        <Image
          source={{
            uri: 'https://fastly.picsum.photos/id/400/2440/1400.jpg?hmac=qSYbRbCQhkj1aMCy6AEHbsrcbXalaPHr6hPCPdxlO5o',
          }}
          style={styles.image}
        />
      </TouchableOpacity> */}
    </SafeAreaView>
  );
};

export default App;

const styles = StyleSheet.create({
  list: {padding: 16},
  image: {
    height: 120,
    width: '33%',
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
});
