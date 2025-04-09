import React, { useEffect, useState } from "react";
import SpotifyPlayer from "./SpotifyPlayer";
import { getAuthUrl, getStoredToken, logout } from "./utils/spotifyAuth";
import axios from "axios";

function App() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (storedToken) {
      setToken(storedToken);
      return;
    }
  
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
  
    if (!code) {
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
          localStorage.setItem("access_token", accessToken);
  
          // ✅ Remove the code from the URL so it doesn’t re-trigger useEffect
          window.history.replaceState({}, document.title, "/");
        })
        .catch((err) => {
          console.error("❌ Token exchange failed:", err.response?.data || err.message);
  
          // Clean up and restart flow
          localStorage.removeItem("access_token");
          localStorage.removeItem("code_verifier");
          window.location.href = "/";
        });
    }
  }, []);    

  if (!token) return <div>Authenticating with Spotify...</div>;

  return (
    <div className="flex justify-center">
      <SpotifyPlayer accessToken={token} />
    </div>
  );
}

export default App;
