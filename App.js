// App.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons, MaterialIcons } from '@expo/vector-icons'; // ✅ icônes

export default function App() {
  const [url, setUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);

  const handleOpenSite = () => {
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    setCurrentUrl(formattedUrl);
    setError(false);
    setLoading(true);
  };

  // --- Écran WebView ---
  if (currentUrl) {
    return (
      <View style={{ flex: 1 }}>
        {/* Barre de navigation */}
        <View style={styles.navBar}>
          {/* Bouton Retour */}
          <TouchableOpacity
            onPress={() => { if (canGoBack) webViewRef.current.goBack(); }}
            style={[styles.navButton, !canGoBack && { opacity: 0.4 }]}
            disabled={!canGoBack}
          >
            <Ionicons name="arrow-back-circle" size={30} color="#fff" />
          </TouchableOpacity>

          {/* Bouton Recharger */}
          <TouchableOpacity
            onPress={() => webViewRef.current.reload()}
            style={styles.navButton}
          >
            <MaterialIcons name="refresh" size={30} color="#fff" />
          </TouchableOpacity>

          {/* Bouton Fermer */}
          <TouchableOpacity
            onPress={() => setCurrentUrl(null)}
            style={styles.navButton}
          >
            <Ionicons name="close-circle" size={30} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Loader */}
        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#0a84ff" />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        )}

        {/* Erreur */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Impossible de charger le site</Text>
            <TouchableOpacity onPress={() => setCurrentUrl(null)} style={styles.retryButton}>
              <Text style={styles.retryText}>↩️ Retour</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* WebView */}
        {!error && (
          <WebView
            ref={webViewRef}
            source={{ uri: currentUrl }}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setError(true);
              setLoading(false);
            }}
            onNavigationStateChange={(navState) => {
              setCanGoBack(navState.canGoBack);
            }}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
          />
        )}
      </View>
    );
  }

  // --- Écran d'accueil ---
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌐 Transforme ton site en application</Text>
      <TextInput
        style={styles.input}
        placeholder="Entre ton lien (ex: monsite.com)"
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        keyboardType="url"
      />
      <TouchableOpacity
        style={[styles.button, { backgroundColor: url ? '#0a84ff' : '#ccc' }]}
        disabled={!url}
        onPress={handleOpenSite}
      >
        <Text style={styles.buttonText}>OUVRIR LE SITE</Text>
      </TouchableOpacity>
      <Text style={styles.info}>
        Saisis l’adresse de ton site pour le transformer en app instantanément.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 25,
    color: '#0a84ff',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  info: {
    textAlign: 'center',
    color: '#666',
    marginTop: 25,
    fontSize: 13,
    lineHeight: 18,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#0a84ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#0a84ff',
    paddingVertical: 10,
  },
  navButton: {
    paddingHorizontal: 10,
  },
  navButtonText: {
    fontSize: 20,
    color: '#fff',
  },
});