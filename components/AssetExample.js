// AssetExample.js
import React from 'react';
import { Text, View, StyleSheet, Image } from 'react-native';

export default function AssetExample() {
  return (
    <View style={styles.container}>
      <Image
        style={styles.logo}
        source={require('../assets/snack-icon.png')}
        resizeMode="contain"
      />
      <Text style={styles.paragraph}>
        📦 Les fichiers et images locaux peuvent être importés facilement
        en les déposant dans le dossier <Text style={styles.highlight}>assets/</Text>.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  logo: {
    height: 120,
    width: 120,
    marginBottom: 20,
  },
  paragraph: {
    fontSize: 15,
    textAlign: 'center',
    color: '#333',
