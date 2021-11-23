import React from "react";

export default function Track({ track }) {
    return <div className="d-flex m-2 align-items-center">
        <img src={track.albumUrl} style={{ height: "64px", width: "64px" }}></img>
        <div className="m1-3">
            <div>{track.title}</div>
            <div className="text-muted">{track.artist}</div>
        </div>
    </div>
}