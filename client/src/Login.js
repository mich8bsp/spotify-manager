import React from "react";

import { Container } from 'react-bootstrap';

const SCOPE = ['user-read-private', 'user-read-email', 'user-read-currently-playing', 'playlist-read-private', 'playlist-read-collaborative'].join("%20")
const CLIENT_ID = process.env.REACT_APP_CLIENT_ID
const REDIRECT_URI= process.env.REACT_APP_REDIRECT_URI

const AUTH_URL = "https://accounts.spotify.com/authorize?" + ["client_id=" + CLIENT_ID, "response_type=code", "redirect_uri=" + REDIRECT_URI, "scope=" + SCOPE].join("&")

export default function Login() {
    return (
        <Container className="d-flex justify-center-center align-items-center" style={{minHeight: "100vh"}}>
            <a className="btn btn-success btn-lg" href={AUTH_URL}>Login With Spotify</a>
        </Container>
    )
}