import React, { useEffect, useState } from "react";
import { Container, Form } from "react-bootstrap";
import useAuth from "./useAuth";
import SpotifyWebApi from 'spotify-web-api-node'
import Track from "./Track";
import PlaylistResult from "./PlaylistResult";

const spotifyApi = new SpotifyWebApi({
    clientId: '6c133b2eb3c743f8a0d5e893eea3d20f'
})

const relevantPlaylists = [
    'All-Time Favourites', 'Headbangers', 'Trippy', 'Upbeat', 'All That Jazz', 'Cowboys, Bards and Pirates', 'Melancholy Hill', 'Chillax Music', 'Focus Instrumental Music', 'Classical/Symphonic'
]

export default function Dashboard({ code }) {
    const accessToken = useAuth(code)
    const [currentSong, setCurrentSong] = useState()
    const [playlists, setPlaylists] = useState([])
    const [playlistsData, setPlaylistsData] = useState([])

    useEffect(() => {
        if (!accessToken) return
        spotifyApi.setAccessToken(accessToken)
    }, [accessToken])


    useEffect(() => {
        if (!accessToken) return

        const callback = () => {
            console.log("fetching currently playing song")

            spotifyApi.getMyCurrentPlayingTrack()
                .then(res => {
                    console.log(res.body)
                    if (res.body) {
                        const smallestAlbumImage = res.body.item.album.images.reduce((smallest, image) => {
                            if (image.height < smallest.height) return image
                            return smallest
                        }, res.body.item.album.images[0])
                        setCurrentSong({
                            title: res.body.item.name,
                            artist: res.body.item.artists[0].name,
                            uri: res.body.item.uri,
                            albumUrl: smallestAlbumImage.url
                        })
                    }
                })
                .catch((err) => {
                    console.log(err)
                })
        }
        callback()
        const interval = setInterval(callback, 10 * 1000)

        return () => clearInterval(interval)
    }, [accessToken])

    const playlistsFetchBucketSize = 20
    useEffect(() => {
        if (!accessToken) return

        spotifyApi.getUserPlaylists({
            limit: playlistsFetchBucketSize
        })
            .then(res => {
                console.log(res.body)
                const numOfBuckets = Math.ceil(res.body.total / res.body.limit)
                console.log(numOfBuckets)
                const buckets = [...Array(numOfBuckets).keys()]

                Promise.all(buckets.map(bucketId => {
                    console.log("sending request with offset " + bucketId * playlistsFetchBucketSize)
                    return spotifyApi.getUserPlaylists({
                        limit: playlistsFetchBucketSize,
                        offset: bucketId * playlistsFetchBucketSize
                    }).then(res => {
                        return res.body.items.filter(playlist => relevantPlaylists.includes(playlist.name)).map(playlist => {
                            return {
                                name: playlist.name,
                                uri: playlist.uri,
                                playlistId: playlist.uri.split(":").at(-1)
                            }
                        })
                    })
                })).then((values) => {
                    const fetchedPlaylists = values.flatMap(x => x)
                    console.log(fetchedPlaylists)
                    setPlaylists(fetchedPlaylists)
                })
                    .catch((err) => {
                        console.log(err)
                    })
            }) }, [accessToken])

    useEffect(() => {
        if(!accessToken) return
        if(!playlists) return setPlaylistsData([])

        Promise.all(playlists.map(playlist => {
            console.log("sending request to fetch tracks for playlist " + playlist.name)
            return spotifyApi.getPlaylistTracks(playlist.playlistId)
            .then(res => {
                return {
                    name: playlist.name,
                    uri: playlist.uri,
                    playlistId: playlist.playlistId,
                    tracks: res.body.items.map(item => item.track)
                }
            })
        })).then((values) => {
            const fetchedPlaylistsData = values.flatMap(x => x)
            console.log(fetchedPlaylistsData)
            setPlaylistsData(fetchedPlaylistsData)
        })
        .catch((err) => {
            console.log(err)
        })
    }, [accessToken, playlists])

    if (currentSong) {
        const filteredPlaylists = playlistsData.filter(playlist => {
            return playlist.tracks.map(track => track.name).includes(currentSong.title)
        })
        return (
            <Container className="d-flex flex-column py-2" style={{ height: "100vh" }}>
                <div className="flex-grow-1 my-2">
                    Currently Playing
                    <Track track={currentSong} />
                </div>
                <div className="flex-grow-1 my-2" style={{ overflowY: "auto" }}>
                    {playlistsData.map(playlist => (
                        <PlaylistResult 
                        playlist = {playlist} 
                        isTrackIncluded = {playlist.tracks.map(track => track.name).includes(currentSong.title)}
                        key = {playlist.uri} />
                    ))}
                </div>
            </Container>
        )
    } else {
        return (<Container>Playback Stopped</Container>)
    }

}