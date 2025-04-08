import React, { useEffect, useState } from "react";
import SpotifyPlayer from "./SpotifyPlayer";
import { getAuthUrl } from "./utils/spotifyAuth";
import axios from "axios";

function App() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check if the token exists in localStorage
    const storedToken = localStorage.getItem("access_token");

    if (storedToken) {
      setToken(storedToken); // If token is found, use it directly
      return; // No need to continue the auth flow
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (!code) {
      // If no code in URL, redirect to auth page
      getAuthUrl().then((url) => {
        window.location.href = url;
      });
    } else {
      const codeVerifier = localStorage.getItem("code_verifier");

      axios
        .post(
          "https://accounts.spotify.com/api/token",
          new URLSearchParams({
            client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
            grant_type: "authorization_code",
            code,
            redirect_uri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI,
            code_verifier: codeVerifier,
          }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        )
        .then((res) => {
          const accessToken = res.data.access_token;
          setToken(accessToken);
          localStorage.setItem("access_token", accessToken); // Save the token to localStorage
        });
    }
  }, []);

  if (!token) return <div>Authenticating with Spotify...</div>;

  return (
    <div>
      <h1>Spotify Player</h1>
      <SpotifyPlayer accessToken={token} />
    </div>
  );
}

export default App;
