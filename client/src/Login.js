import React from "react";

import { Container } from 'react-bootstrap';

const scope = 'user-read-private%20user-read-email%20user-read-currently-playing%20playlist-read-private%20playlist-read-collaborative';

const AUTH_URL = "https://accounts.spotify.com/authorize?client_id=6c133b2eb3c743f8a0d5e893eea3d20f&response_type=code&redirect_uri=http://localhost:3000&scope=" + scope;

export default function Login() {
    return (
        <Container className="d-flex justify-center-center align-items-center" style={{minHeight: "100vh"}}>
            <a className="btn btn-success btn-lg" href={AUTH_URL}>Login With Spotify</a>
        </Container>
    )
}