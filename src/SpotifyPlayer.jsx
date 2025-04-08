import { useState, useEffect } from "react";

export default function SpotifyPlayer({ accessToken: propAccessToken }) {
  const [deviceId, setDeviceId] = useState(null);
  const [trackInfo, setTrackInfo] = useState(null); // Track info state
  const [showInfo, setShowInfo] = useState(true);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [accessToken, setAccessToken] = useState(propAccessToken);

  useEffect(() => {
    // If the prop accessToken changes, update the state
    setAccessToken(propAccessToken);
  }, [propAccessToken]);

  useEffect(() => {
    if (!accessToken) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: "My React Web Player",
        getOAuthToken: (cb) => cb(accessToken),
        volume: 0.5,
      });

      player.addListener("ready", ({ device_id }) => {
        setDeviceId(device_id);
        console.log("Player Ready with Device ID:", device_id);
        player.connect();
      });

      player.connect().then((success) => {
        if (success) {
          console.log("Spotify Web Playback SDK connected!");
        } else {
          console.error("Failed to connect to Spotify Web Playback SDK.");
        }
      });
    };
  }, [accessToken]);

  const fetchTrackInfo = async () => {
    try {
      const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.log("No track is playing or something went wrong:", response.status);
        return;
      }

      const currentTrack = await response.json();
      if (currentTrack?.item) {
        const { id, name: songName, artists, album } = currentTrack.item;
        const artistNames = artists.map((artist) => artist.name).join(", ");
        const year = album.release_date ? album.release_date.split("-")[0] : "Unknown Year";
        console.log("Fetched track info:", `${id} ${year} - ${artistNames} - ${songName}`);
        setTrackInfo(`${year} - ${artistNames} - ${songName}`);
      } else {
        console.log("No track is currently playing");
      }
    } catch (error) {
      console.error("Error fetching track info:", error);
    }
  };

  const togglePlayPause = async () => {
    const playbackState = await fetch("https://api.spotify.com/v1/me/player", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).then((res) => res.json());

    const isPlaying = playbackState?.is_playing;

    await fetch(
      `https://api.spotify.com/v1/me/player/${isPlaying ? "pause" : "play"}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Fetch track info after toggling play/pause
    fetchTrackInfo();
  };

  const nextTrack = async () => {
    await fetch("https://api.spotify.com/v1/me/player/next", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Fetch track info after skipping to the next track
    setTimeout(function() {
      fetchTrackInfo();
    }, 500);
    
  };

  const prevTrack = async () => {
    await fetch("https://api.spotify.com/v1/me/player/previous", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Fetch track info after going back to the previous track
    fetchTrackInfo();
  };

  const toggleShuffle = async () => {
    const playbackState = await fetch("https://api.spotify.com/v1/me/player", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).then((res) => res.json());

    const shuffleState = playbackState?.shuffle_state;

    await fetch(
      `https://api.spotify.com/v1/me/player/shuffle?state=${!shuffleState}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  };

  const playPlaylist = async () => {
    const match = playlistUrl.match(/playlist\/([a-zA-Z0-9]+)/);
    if (!match || !match[1]) {
      alert("Invalid playlist URL");
      return;
    }
  
    const playlistId = match[1];
    const body = {
      context_uri: `spotify:playlist:${playlistId}`,
    };
  
    try {
      await fetch("https://api.spotify.com/v1/me/player/play", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
  
      // Fetch track info after starting playlist
      setTimeout(fetchTrackInfo, 500);
    } catch (error) {
      console.error("Error playing playlist:", error);
    }
  };

  return (
    <div className="mt-4">
      <div className="mt-4">
        <label className="block text-white mb-2">Enter Spotify Playlist URL: </label>
        <input
          type="text"
          className="w-full p-2 rounded bg-zinc-700 text-white"
          placeholder="https://open.spotify.com/playlist/..."
          value={playlistUrl}
          onChange={(e) => setPlaylistUrl(e.target.value)}
        />
      </div>

      <div className="mt-4">
        <button
          className="mt-2 px-4 py-2 bg-green-600 rounded text-white"
          onClick={playPlaylist}
        >
          Play Playlist
        </button>

        <button
          className="px-4 py-2 bg-blue-600 rounded text-white"
          onClick={togglePlayPause}
        >
          Play / Pause
        </button>

        <button
          className="px-4 py-2 bg-purple-600 rounded text-white"
          onClick={prevTrack}
        >
          Previous
        </button>

        <button
          className="px-4 py-2 bg-purple-600 rounded text-white"
          onClick={nextTrack}
        >
          Next
        </button>

        <button
          className="px-4 py-2 bg-yellow-600 rounded text-white"
          onClick={toggleShuffle}
        >
          Shuffle
        </button>
      </div>

      <div className="mt-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showInfo}
            onChange={() => setShowInfo((prev) => !prev)}
          />
          Show Song & Artist Info
        </label>
      </div>

      {showInfo && trackInfo && (
        <div className="mt-4 p-4 bg-zinc-800 rounded-lg">
          <p>{trackInfo}</p>
        </div>
      )}
    </div>
  );
}
