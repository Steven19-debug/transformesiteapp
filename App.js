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
    // Déclenchement du workflow
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

    // Vérifier dynamiquement l'artifact
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

        let artifact;
        for (let i = 0; i < 10; i++) { // retry 10 fois
          const artifactsResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/actions/runs/${latestRunId}/artifacts`,
            { headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } }
          );
          const artifactsData = await artifactsResponse.json();
          artifact = artifactsData.artifacts?.find(a =>
            a.name.toLowerCase().includes(buildType.toLowerCase())
          );
          if (artifact) break;
          await new Promise(res => setTimeout(res, 5000)); // attendre 5s
        }

        if (!artifact) return Alert.alert("Erreur", `Artifact ${buildType} non trouvé.`);

        const downloadUrl = `${artifact.archive_download_url}`;
        Linking.openURL(downloadUrl);
      } catch (err) {
        Alert.alert("Erreur récupération artifact", err.message);
      }
    }, 5000); // petite attente pour que le workflow démarre
  } catch (err) {
    Alert.alert("Erreur", err.message);
  }
};
