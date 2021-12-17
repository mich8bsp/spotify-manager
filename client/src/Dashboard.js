import React, { useEffect, useState } from "react";
import { Container, Form } from "react-bootstrap";
import useAuth from "./useAuth";
import SpotifyWebApi from 'spotify-web-api-node'
import Track from "./Track";
import PlaylistResult from "./PlaylistResult";

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.REACT_APP_CLIENT_ID
})

const relevantPlaylistIds = [
'2gZPR6s6CqPCFS8PkFJVB1',
'6zaQ2LljTzjOkjAB1NAi0O',
'1ndbTHDRgWhSbcFLSQa7VX',
'1DjCxp3lJIWrrtd2dikH2q',
'6BQSo4vzjq0HK7udpEraXb',
'3sAJHMqx7bq7g7o4zu59Z8',
'3XG74ITJmLYKnh9ziwaC3r',
'5Z7F5os7xl24wk9Ud8QYNf',
'2J9p3qUkoN8Wbb38F6diVX',
'3GEG8hce8Ip3NAZmcEaMbl'
]

export default function Dashboard({ code }) {
    const accessToken = useAuth(code)
    const [currentSong, setCurrentSong] = useState()
    const [playlists, setPlaylists] = useState([])
    const [playlistsData, setPlaylistsData] = useState([])

    const playlistsFetchBucketSize = 50
    const currentPlayingFetchIntervalSec = 10

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
        const interval = setInterval(callback, currentPlayingFetchIntervalSec * 1000)

        return () => clearInterval(interval)
    }, [accessToken])

  
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
                        return res.body.items.filter(playlist =>
                            relevantPlaylistIds.includes(playlist.uri.split(":").at(-1))
                        ).map(playlist => {
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
            return spotifyApi.getPlaylistTracks(playlist.playlistId, {limit: 50})
            .then(res => {
                const numOfBuckets = Math.ceil(res.body.total / res.body.limit)
                console.log(numOfBuckets)
                const buckets = [...Array(numOfBuckets).keys()]

                return Promise.all(buckets.map(bucketId => {
                    console.log("sending request with offset " + bucketId * playlistsFetchBucketSize)
                    return spotifyApi.getPlaylistTracks(playlist.playlistId, {
                        limit: playlistsFetchBucketSize,
                        offset: bucketId * playlistsFetchBucketSize
                    }).then(res => {
                        return res.body.items.map(item => item.track)
                    })
                })).then((values) => {
                    const fetchedTracks = values.flatMap(x => x)
                    return {
                        name: playlist.name,
                        uri: playlist.uri,
                        playlistId: playlist.playlistId,
                        tracks: fetchedTracks
                    }
                })
            })
        })).then((values) => {
            const fetchedPlaylistsData = values.flatMap(x => x)
            setPlaylistsData(fetchedPlaylistsData)
        })
        .catch((err) => {
            console.log(err)
        })
    }, [accessToken, playlists])

    if (currentSong) {
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