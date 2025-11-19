// App.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

// ⚠️ Mets ton vrai token ici :
const GITHUB_TOKEN = "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";

export default function App() {
  const [url, setUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);

  // --- Section Build GitHub ---
  const [repoUrl, setRepoUrl] = useState("");
  const [buildType, setBuildType] = useState("apk");

  // --- Ouvrir un site ---
  const handleOpenSite = () => {
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    setCurrentUrl(formattedUrl);
    setError(false);
    setLoading(true);
  };

  // --- Fonction build GitHub ---
  const triggerWorkflow = async () => {
    if (!repoUrl) return Alert.alert("Erreur", "Coller l'URL du dépôt GitHub !");

    const parts = repoUrl
      .replace("https://github.com/", "")
      .replace(".git", "")
      .replace(/\/$/, "")
      .split("/");

    if (parts.length !== 2) return Alert.alert("Erreur", "URL invalide !");
    const [owner, repo] = parts;

    try {
      const dispatchResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/actions/workflows/build.yml/dispatches`,
        {
          method: "POST",
          headers: {
            "Accept": "application/vnd.github+json",
            "Authorization": `Bearer ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ref: "main",
            inputs: { build_type: buildType.toLowerCase() }
          }),
        }
      );

      if (!dispatchResponse.ok) {
        const text = await dispatchResponse.text();
        return Alert.alert("Erreur déclenchement", text);
      }

      Alert.alert("Build lancé !", "L'application récupérera l'artifact automatiquement.");

      setTimeout(async () => {
        try {
          const runsResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/actions/runs?branch=main&event=workflow_dispatch`,
            { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } }
          );

          const runsData = await runsResponse.json();
          if (!runsData.workflow_runs || runsData.workflow_runs.length === 0)
            return Alert.alert("Erreur", "Aucun workflow trouvé.");

          const latestRunId = runsData.workflow_runs[0].id;

          let artifact = null;

          for (let i = 0; i < 10; i++) {
            const artifactsResponse = await fetch(
              `https://api.github.com/repos/${owner}/${repo}/actions/runs/${latestRunId}/artifacts`,
              { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } }
            );

            const artifactsData = await artifactsResponse.json();

            artifact = artifactsData.artifacts?.find(a =>
              a.name.toLowerCase() === `android-${buildType}`
            );

            if (artifact) break;

            await new Promise(res => setTimeout(res, 5000));
          }

          if (!artifact)
            return Alert.alert("Erreur", `Artifact ${buildType} non trouvé.`);

          Linking.openURL(artifact.archive_download_url);

        } catch (err) {
          Alert.alert("Erreur", err.message);
        }
      }, 5000);

    } catch (err) {
      Alert.alert("Erreur", err.message);
    }
  };

  // --- WebView ---
  if (currentUrl) {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={() => { if (canGoBack) webViewRef.current.goBack(); }}
            style={[styles.navButton, !canGoBack && { opacity: 0.4 }]}
            disabled={!canGoBack}
          >
            <Ionicons name="arrow-back-circle" size={30} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => webViewRef.current.reload()}
            style={styles.navButton}
          >
            <MaterialIcons name="refresh" size={30} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setCurrentUrl(null)}
            style={styles.navButton}
          >
            <Ionicons name="close-circle" size={30} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#0a84ff" />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        )}

        {!error && (
          <WebView
            ref={webViewRef}
            source={{ uri: currentUrl }}
            onLoadEnd={() => setLoading(false)}
            onError={() => { setError(true); setLoading(false); }}
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

      {/* Input pour un site web */}
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

      {/* Partie dépôt GitHub */}
      <Text style={[styles.title, { marginTop: 40 }]}>📦 Build GitHub → APK/AAB</Text>

      <TextInput
        style={styles.input}
        placeholder="https://github.com/USER/REPO"
        value={repoUrl}
        onChangeText={setRepoUrl}
        autoCapitalize="none"
      />

      <View style={styles.buildTypeRow}>
        <TouchableOpacity
          style={[styles.buildTypeButton, buildType === "apk" && styles.activeButton]}
          onPress={() => setBuildType("apk")}
        >
          <Text style={styles.buttonText}>APK</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buildTypeButton, buildType === "aab" && styles.activeButton]}
          onPress={() => setBuildType("aab")}
        >
          <Text style={styles.buttonText}>AAB</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#0a84ff', marginTop: 10 }]}
        onPress={triggerWorkflow}
      >
        <Text style={styles.buttonText}>🚀 LANCER LE BUILD</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
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
  buildTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%'
  },
  buildTypeButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    backgroundColor: "#ccc",
  },
  activeButton: {
    backgroundColor: "#0a84ff",
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#0a84ff',
    paddingVertical: 10,
  },
  navButton: {
    paddingHorizontal: 10,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
  },
});
