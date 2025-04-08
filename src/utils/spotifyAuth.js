// Generates a random string for PKCE
function generateRandomString(length) {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
  
  // SHA256 encode
  async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return crypto.subtle.digest("SHA-256", data);
  }
  
  // Base64 URL Encode
  function base64urlencode(a) {
    return btoa(String.fromCharCode(...new Uint8Array(a)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  
  // Generate code challenge
  async function generateCodeChallenge(codeVerifier) {
    const hashed = await sha256(codeVerifier);
    return base64urlencode(hashed);
  }
  
  // Get auth URL
  export async function getAuthUrl() {
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
  
    localStorage.setItem("code_verifier", codeVerifier);
  
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
      response_type: "code",
      redirect_uri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI,
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
      scope: "streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state",
    });
  
    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }
  