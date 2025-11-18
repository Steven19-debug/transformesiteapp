import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";

export default function App() {
  const [repoUrl, setRepoUrl] = useState("");
  const [buildType, setBuildType] = useState("APK");

  const GITHUB_TOKEN = " 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";

  // Lancer le workflow
  const triggerWorkflow = async () => {
    if (!repoUrl) return Alert.alert("Erreur", "Coller l'URL du dépôt GitHub !");

    const parts = repoUrl.replace("https://github.com/", "").replace(".git", "").split("/");
    if (parts.length !== 2) return Alert.alert("Erreur", "URL invalide !");
    const [owner, repo] = parts;

    try {
      // 1️⃣ Déclencher le workflow
      const dispatchResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/actions/workflows/build.yml/dispatches`,
        {
          method: "POST",
          headers: {
            "Accept": "application/vnd.github+json",
            "Authorization": `Bearer ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ref: "main", inputs: { build_type: buildType } }),
        }
      );

      if (!dispatchResponse.ok) {
        const text = await dispatchResponse.text();
        return Alert.alert("Erreur déclenchement", text);
      }

      Alert.alert("Build lancé !", "L'application récupérera automatiquement le fichier.");

      // 2️⃣ Surveiller le workflow et récupérer l'artifact
      setTimeout(async () => {
        try {
          const runsResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/actions/runs?branch=main&event=workflow_dispatch`,
            {
              headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
            }
          );
          const runsData = await runsResponse.json();
          if (!runsData.workflow_runs || runsData.workflow_runs.length === 0) {
            return Alert.alert("Erreur", "Aucun workflow trouvé.");
          }
          const latestRunId = runsData.workflow_runs[0].id;

          const artifactsResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/actions/runs/${latestRunId}/artifacts`,
            { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } }
          );
          const artifactsData = await artifactsResponse.json();
          if (!artifactsData.artifacts || artifactsData.artifacts.length === 0) {
            return Alert.alert("Erreur", "Aucun artifact trouvé.");
          }

          const artifact = artifactsData.artifacts.find(a =>
            a.name.toLowerCase().includes(buildType.toLowerCase())
          );
          if (!artifact) return Alert.alert("Erreur", `Artifact ${buildType} non trouvé.`);

          const downloadUrl = `${artifact.archive_download_url}`;
          Linking.openURL(downloadUrl); // ouvre le fichier dans le navigateur pour téléchargement
        } catch (err) {
          Alert.alert("Erreur récupération artifact", err.message);
        }
      }, 10000); // attente 10s pour que le workflow commence
    } catch (err) {
      Alert.alert("Erreur", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌐 Transforme ton dépôt GitHub en App</Text>

      <TextInput
        style={styles.input}
        placeholder="Coller l'URL du dépôt GitHub"
        value={repoUrl}
        onChangeText={setRepoUrl}
        autoCapitalize="none"
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.buildButton, buildType === "APK" && styles.activeButton]}
          onPress={() => setBuildType("APK")}
        >
          <Text style={styles.buttonText}>APK</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buildButton, buildType === "AAB" && styles.activeButton]}
          onPress={() => setBuildType("AAB")}
        >
          <Text style={styles.buttonText}>AAB</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.launchButton} onPress={triggerWorkflow}>
        <Text style={styles.launchButtonText}>Lancer le build</Text>
      </TouchableOpacity>

      <Text style={styles.info}>
        Colle l'URL du dépôt GitHub et choisis APK ou AAB. L'application récupérera automatiquement le build.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  input: {
    borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12,
    fontSize: 16, marginBottom: 15
  },
  buttonRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 20 },
  buildButton: { paddingVertical: 12, paddingHorizontal: 25, borderRadius: 10, backgroundColor: "#ccc" },
  activeButton: { backgroundColor: "#0a84ff" },
  buttonText: { color: "#fff", fontWeight: "700" },
  launchButton: { backgroundColor: "#0a84ff", paddingVertical: 15, borderRadius: 10, alignItems: "center" },
  launchButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  info: { textAlign: "center", color: "#666", marginTop: 25 },
});
